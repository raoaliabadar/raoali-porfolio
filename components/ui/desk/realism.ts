/**
 * Realism kit for the 3D desk: photographed materials, procedural surface detail and fur.
 *
 * - Photographed PBR maps (CC0, Poly Haven: wood_table_001, painted_plaster_wall,
 *   poly_wool_herringbone) and a studio HDRI (brown_photostudio_02) live in /public/textures.
 *   They are fetched and decoded once per page (off the main thread, as ImageBitmaps) and shared
 *   by every desk scene, so a second scene never downloads or decodes them again.
 * - Small procedural maps (paper fibre, plastic grain, scratches, fur strands) are generated
 *   once per page on canvases and shared the same way.
 * - Fur: shell rendering. Each furry mesh gets one InstancedMesh of N shells pushed out along
 *   the normals; a strand texture cuts each shell into hairs (alpha-to-coverage keeps edges soft).
 *   One extra draw call per furry part, no extra geometry.
 */
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

export const TEXTURES = {
  woodColor: "/textures/desk-wood-color.webp",
  woodNormal: "/textures/desk-wood-normal.webp",
  woodRough: "/textures/desk-wood-rough.webp",
  plasterNormal: "/textures/plaster-normal.webp",
  fabricNormal: "/textures/fabric-normal.webp",
  hdri: "/textures/studio.hdr",
} as const;

/* ---------- Shared, once-per-page loading ---------- */

const bitmapCache = new Map<string, Promise<ImageBitmap | null>>();

/** Fetch + decode an image once per page (decoding happens off the main thread). */
export function loadBitmap(url: string): Promise<ImageBitmap | null> {
  let p = bitmapCache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`${r.status}`))))
      .then((b) => createImageBitmap(b, { imageOrientation: "flipY" }))
      .catch(() => {
        bitmapCache.delete(url); // allow a retry on the next scene build
        return null;
      });
    bitmapCache.set(url, p);
  }
  return p;
}

type HdrData = { data: THREE.TypedArray; width: number; height: number };
let hdrPromise: Promise<HdrData | null> | null = null;

/** The studio HDRI, parsed once per page (half-float pixels). */
export function loadHdr(): Promise<HdrData | null> {
  if (!hdrPromise) {
    hdrPromise = fetch(TEXTURES.hdri)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${r.status}`))))
      .then((buf) => {
        const loader = new RGBELoader();
        loader.setDataType(THREE.HalfFloatType);
        const t = loader.parse(buf);
        return { data: t.data, width: t.width, height: t.height };
      })
      .catch(() => {
        hdrPromise = null;
        return null;
      });
  }
  return hdrPromise;
}

/** Start the downloads early (e.g. while the visitor is still on the first slide's intro). */
export function prefetchDeskAssets() {
  if (typeof window === "undefined") return;
  void loadHdr();
  for (const u of [TEXTURES.woodColor, TEXTURES.woodNormal, TEXTURES.woodRough, TEXTURES.plasterNormal, TEXTURES.fabricNormal]) void loadBitmap(u);
}

/** A texture for one scene from a shared bitmap. */
export function bitmapTexture(bmp: ImageBitmap, opts: { color?: boolean; repeat?: [number, number]; rotation?: number; aniso?: number } = {}) {
  const t = new THREE.Texture(bmp);
  t.flipY = false; // already flipped while decoding
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opts.color) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) t.repeat.set(...opts.repeat);
  if (opts.rotation) t.rotation = opts.rotation;
  t.anisotropy = opts.aniso ?? 8;
  t.needsUpdate = true;
  return t;
}

/** Equirect HDR → prefiltered environment map for this renderer. */
export function hdrEnvironment(renderer: THREE.WebGLRenderer, hdr: HdrData) {
  const tex = new THREE.DataTexture(hdr.data as unknown as BufferSource, hdr.width, hdr.height, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.flipY = true;
  tex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  pmrem.dispose();
  tex.dispose();
  return env;
}

/* ---------- Procedural detail maps (generated once per page) ---------- */

/** Tileable value noise with octaves (fbm), 0..1, on an n×n grid. */
function fbm(n: number, octaves: number, base: number, seed: number) {
  const out = new Float32Array(n * n);
  let rnd = seed >>> 0;
  const rand = () => ((rnd = (rnd * 1664525 + 1013904223) >>> 0) / 4294967296);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const cells = base << o;
    const grid = new Float32Array(cells * cells).map(rand);
    const step = n / cells;
    for (let y = 0; y < n; y++) {
      const gy = y / step;
      const y0 = Math.floor(gy) % cells;
      const y1 = (y0 + 1) % cells;
      let fy = gy - Math.floor(gy);
      fy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < n; x++) {
        const gx = x / step;
        const x0 = Math.floor(gx) % cells;
        const x1 = (x0 + 1) % cells;
        let fx = gx - Math.floor(gx);
        fx = fx * fx * (3 - 2 * fx);
        const a = grid[y0 * cells + x0] + (grid[y0 * cells + x1] - grid[y0 * cells + x0]) * fx;
        const b = grid[y1 * cells + x0] + (grid[y1 * cells + x1] - grid[y1 * cells + x0]) * fx;
        out[y * n + x] += (a + (b - a) * fy) * amp;
      }
    }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

/** Height field → tangent-space normal map canvas. */
function heightToNormal(h: Float32Array, n: number, strength: number) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const c = cv.getContext("2d")!;
  const img = c.createImageData(n, n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const l = h[y * n + ((x + n - 1) % n)];
      const r = h[y * n + ((x + 1) % n)];
      const u = h[((y + n - 1) % n) * n + x];
      const d = h[((y + 1) % n) * n + x];
      let nx = (l - r) * strength;
      let ny = (d - u) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * n + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  c.putImageData(img, 0, 0);
  return cv;
}

function grayCanvas(v: Float32Array, n: number, lo: number, hi: number) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const c = cv.getContext("2d")!;
  const img = c.createImageData(n, n);
  for (let i = 0; i < v.length; i++) {
    const g = (lo + (hi - lo) * v[i]) * 255;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = g;
    img.data[i * 4 + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

const canvasCache = new Map<string, HTMLCanvasElement>();
const cached = (key: string, make: () => HTMLCanvasElement) => {
  let cv = canvasCache.get(key);
  if (!cv) {
    cv = make();
    canvasCache.set(key, cv);
  }
  return cv;
};

/** Paper: fine fibres + slight cockling. */
const paperNormalCanvas = () =>
  cached("paperN", () => {
    const n = 256;
    const fib = fbm(n, 4, 32, 7);
    const cockle = fbm(n, 2, 2, 11);
    const h = fib.map((v, i) => v * 0.6 + cockle[i] * 1.6);
    return heightToNormal(h, n, 2.2);
  });
/** Moulded plastic / powder coat: a soft, even grain. */
const grainNormalCanvas = () =>
  cached("grainN", () => {
    const n = 256;
    return heightToNormal(fbm(n, 3, 64, 3), n, 1.6);
  });
/** Matte roughness variation (fingerprints, wear) for plastics and metals. */
const smudgeRoughCanvas = () =>
  cached("smudgeR", () => {
    const n = 256;
    return grayCanvas(fbm(n, 4, 4, 5), n, 0.25, 1);
  });
/** Lacquer wear: fine scratches + soft smudges, used as the clear coat's roughness. */
const scratchCanvas = () =>
  cached("scratch", () => {
    const n = 1024;
    const cv = grayCanvas(fbm(n, 3, 4, 21), n, 0.12, 0.32);
    const c = cv.getContext("2d")!;
    let s = 99;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 420; k++) {
      const x = r() * n;
      const y = r() * n;
      const len = 8 + r() * 70;
      const a = r() * Math.PI;
      c.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.22})`;
      c.lineWidth = 0.5 + r() * 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + r() * 4, y + Math.sin(a) * len * 0.5 + r() * 4, x + Math.cos(a) * len, y + Math.sin(a) * len);
      c.stroke();
    }
    return cv;
  });
/** Brushed aluminium: long horizontal streaks (roughness). */
const brushedCanvas = () =>
  cached("brushed", () => {
    const n = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = n;
    const c = cv.getContext("2d")!;
    c.fillStyle = "rgb(105,105,105)";
    c.fillRect(0, 0, n, n);
    let s = 5;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 900; k++) {
      const v = 80 + r() * 60;
      c.fillStyle = `rgba(${v},${v},${v},0.5)`;
      c.fillRect(r() * n - n / 2, r() * n, n * (0.3 + r()), 1);
    }
    return cv;
  });
/** Fur strands: one random value per texel, so each texel becomes one hair across the shells. */
const strandCanvas = () =>
  cached("strands", () => {
    const n = 128;
    const cv = document.createElement("canvas");
    cv.width = cv.height = n;
    const c = cv.getContext("2d")!;
    const img = c.createImageData(n, n);
    let s = 1234;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n * n; i++) {
      // Most texels are hairs of varied length; a few gaps let the under-coat show.
      const v = r() < 0.12 ? 0 : 0.35 + 0.65 * Math.pow(r(), 0.6);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v * 255;
      img.data[i * 4 + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    return cv;
  });

const canvasTexture = (cv: HTMLCanvasElement, repeat: number, color = false) => {
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/**
 * Per-scene set of detail textures. They share the cached canvases, so creating a set is cheap;
 * `dispose()` frees this scene's GPU copies.
 */
export function makeDetailMaps() {
  const list: THREE.Texture[] = [];
  const keep = <T extends THREE.Texture>(t: T) => (list.push(t), t);
  return {
    paperNormal: (repeat = 1) => keep(canvasTexture(paperNormalCanvas(), repeat)),
    grainNormal: (repeat = 4) => keep(canvasTexture(grainNormalCanvas(), repeat)),
    smudgeRough: (repeat = 1) => keep(canvasTexture(smudgeRoughCanvas(), repeat)),
    scratches: (repeat = 1) => keep(canvasTexture(scratchCanvas(), repeat)),
    brushed: (repeat = 2) => keep(canvasTexture(brushedCanvas(), repeat)),
    strands: () => {
      const t = keep(canvasTexture(strandCanvas(), 1));
      t.magFilter = THREE.NearestFilter; // crisp individual hairs up close
      return t;
    },
    dispose: () => list.forEach((t) => t.dispose()),
  };
}

/* ---------- Fur (shell rendering) ---------- */

export type FurOptions = {
  /** Hair length in metres. */
  length: number;
  /** Number of shells (quality vs. cost). */
  shells: number;
  /** Distance between neighbouring hairs on the skin, in metres. */
  spacing: number;
  /** Shared strand texture (from makeDetailMaps().strands()). */
  strands: THREE.Texture;
  /** Shared soft noise (from makeDetailMaps().smudgeRough()) that groups hairs into clumps. */
  clump: THREE.Texture;
  /** Downward droop of the tips (gravity), as a fraction of the length. */
  droop?: number;
};

const STRAND_TEXELS = 128;
const furMaterials = new WeakMap<THREE.Material, Map<string, THREE.MeshStandardMaterial>>();

/** The shell material for a base material + settings (shared by meshes with the same values). */
function shellMaterial(base: THREE.MeshStandardMaterial, o: FurOptions, density: [number, number]) {
  const key = `${o.length}|${o.shells}|${density}|${o.droop ?? 0.35}`;
  let byKey = furMaterials.get(base);
  if (!byKey) furMaterials.set(base, (byKey = new Map()));
  const hit = byKey.get(key);
  if (hit) return hit;
  const m = new THREE.MeshStandardMaterial({
    color: base.color.clone(),
    map: base.map,
    roughness: 1,
    envMapIntensity: 0.3,
    metalness: 0,
    alphaTest: 0.5,
    // No alpha-to-coverage: its dithered coverage turned every hair edge into a sparkling dot.
  });
  m.userData.isFur = true;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.furLen = { value: o.length };
    sh.uniforms.furShells = { value: o.shells };
    sh.uniforms.furDensity = { value: new THREE.Vector2(...density) };
    sh.uniforms.furDroop = { value: o.droop ?? 0.35 };
    sh.uniforms.furTex = { value: o.strands };
    sh.uniforms.furClump = { value: o.clump };
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float furLen;\nuniform float furShells;\nuniform float furDroop;\nvarying float vShell;\nvarying vec2 vFurUv;",
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "vShell = float(gl_InstanceID + 1) / furShells;",
          "vFurUv = uv;",
          "transformed += normalize(objectNormal) * furLen * vShell;",
          "transformed.y -= furLen * furDroop * vShell * vShell;",
        ].join("\n"),
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec2 furDensity;\nuniform sampler2D furTex;\nuniform sampler2D furClump;\nvarying float vShell;\nvarying vec2 vFurUv;",
      )
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          // Clumps: neighbouring hairs share a length and lean the same way.
          "float clump = texture2D(furClump, vFurUv * furDensity * 0.9).r;",
          "vec2 lean = (vec2(clump, texture2D(furClump, vFurUv * furDensity * 0.9 + 0.37).r) - 0.5) * 2.4;",
          `vec2 suv = vFurUv * furDensity * ${STRAND_TEXELS}.0 + lean * vShell;`,
          "vec2 cell = floor(suv);",
          `float hairLen = texture2D(furTex, (cell + 0.5) / ${STRAND_TEXELS}.0).r * mix(0.55, 1.0, clump);`,
          // Round hairs that taper to a point at their own length.
          "float radius = 0.62 * (1.0 - vShell / max(hairLen, 0.001));",
          "float d = length(fract(suv) - 0.5);",
          "diffuseColor.a = 0.5 + (radius - d) * 3.0;",
          // Self-shadowing: a slightly darker under-coat near the skin, lighter tips.
          "diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 1.0, vShell));",
        ].join("\n"),
      );
  };
  m.customProgramCacheKey = () => "desk-fur-2";
  byKey.set(key, m);
  return m;
}

/** Grow fur on a mesh (adds an InstancedMesh of shells as its child). Returns the shells. */
export function addFur(mesh: THREE.Mesh, o: FurOptions) {
  const base = mesh.material as THREE.MeshStandardMaterial;
  // Hair density from the mesh's real size, so hairs are the same thickness on the head and paws.
  mesh.geometry.computeBoundingSphere();
  const ws = mesh.getWorldScale(new THREE.Vector3());
  const r = (mesh.geometry.boundingSphere?.radius ?? 0.1) * (ws.x + ws.y + ws.z) / 3;
  const around = Math.max(1, Math.round((2 * Math.PI * r) / (STRAND_TEXELS * o.spacing)));
  const shells = new THREE.InstancedMesh(mesh.geometry, shellMaterial(base, o, [around, Math.max(1, Math.round(around / 2))]), o.shells);
  // Identity matrices: every shell sits on the base mesh; the shader pushes each one out.
  shells.castShadow = false;
  shells.receiveShadow = true;
  shells.frustumCulled = false; // shells reach a little past the base mesh's bounds
  shells.userData.noPick = true;
  shells.raycast = () => {};
  mesh.add(shells);
  return shells;
}
