"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isMotionPaused, onMotionPausedChange } from "@/lib/motionPause";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * "Ledger Orrery": an original hero piece: a polished brass armillary sphere
 * that encircles the headline.
 *
 *  · A graduated equatorial band (the "ledger") with engraved tick marks
 *  · Gimbal rings turning on independent axes around a polar axis rod
 *  · Glossy beads travelling the rings: records moving through a system
 *  · Orange light pulses running along the band: transactions being posted
 *  · A fine, slowly drifting dust field for depth
 *
 * The sphere is sized and centred on the element with id `anchorId`, and a CSS
 * mask dims it behind the headline so the text always stays crisp.
 * Pauses off-screen / in hidden tabs; reduced motion gets a single still frame.
 */

const R = 1; // equatorial band radius (world units)
const MER = 1.04; // vertical meridian ring
const ECL = 1.2; // tilted ecliptic ring
const OUTER = 1.52; // wide horizon ring: used for sizing
const AXIS = 1.14; // half-length of the polar axis rod
/** Highest point of the structure above the centre (axis + finial), for vertical fitting. */
const TOP = AXIS + 0.03;

type Theme = { metal: string; engrave: string; dust: string; dustOpacity: number; env: number; exposure: number };
const THEMES: Record<"light" | "dark", Theme> = {
  light: { metal: "#a67a3e", engrave: "#5b4426", dust: "#a8834f", dustOpacity: 0.45, env: 0.85, exposure: 1.0 },
  dark: { metal: "#d8b077", engrave: "#6e5432", dust: "#ead9bd", dustOpacity: 0.55, env: 1.05, exposure: 1.08 },
};
const ACCENT = "#fe4f02";
const PEARL = "#f4efe6";

export default function LedgerOrrery({ anchorId = "hero-heading" }: { anchorId?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const anchor = document.getElementById(anchorId);
    if (!mount || !anchor) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const isDark = () => document.documentElement.classList.contains("dark");

    // Renderer / scene / camera
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.035).texture;
    pmrem.dispose();
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

    const key = new THREE.DirectionalLight("#fff1dc", 2.4);
    key.position.set(-3, 4, 5);
    const rim = new THREE.DirectionalLight("#c9d6ff", 1.3);
    rim.position.set(4, -1, -4);
    const core = new THREE.PointLight(ACCENT, 1.6, 3.2, 2); // warm glow on the inner faces
    scene.add(key, rim, core);

    // Materials
    const metal = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.26, clearcoat: 0.35, clearcoatRoughness: 0.18 });
    const engraved = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: 0.5 });
    const accentBead = new THREE.MeshPhysicalMaterial({ color: ACCENT, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
    const pearl = new THREE.MeshPhysicalMaterial({ color: PEARL, roughness: 0.32, sheen: 1, sheenColor: new THREE.Color("#ffffff"), clearcoat: 0.6 });

    // Pulse: an orange arc whose alpha fades along its length (comet tail).
    const tailCanvas = document.createElement("canvas");
    tailCanvas.width = 128;
    tailCanvas.height = 1;
    const tc = tailCanvas.getContext("2d")!;
    const tg = tc.createLinearGradient(0, 0, 128, 0);
    tg.addColorStop(0, "rgba(255,255,255,0)");
    tg.addColorStop(0.85, "rgba(255,255,255,1)");
    tg.addColorStop(1, "rgba(255,255,255,1)");
    tc.fillStyle = tg;
    tc.fillRect(0, 0, 128, 1);
    const tailTex = new THREE.CanvasTexture(tailCanvas);
    const pulseMat = new THREE.MeshBasicMaterial({ color: "#ff7a2e", alphaMap: tailTex, transparent: true, depthWrite: false, toneMapped: false });

    // The orrery
    const root = new THREE.Group(); // pointer / scroll tilt
    const orrery = new THREE.Group(); // base tilt + float
    root.add(orrery);
    scene.add(root);
    orrery.rotation.x = 0.36;

    const disposables: { dispose(): void }[] = [metal, engraved, accentBead, pearl, pulseMat, tailTex, envTex];
    const geo = <T extends THREE.BufferGeometry>(g: T) => (disposables.push(g), g);

    // Equatorial ledger band: open cylinder + rolled lips + engraved ticks.
    const band = new THREE.Group();
    orrery.add(band);
    const bandMesh = new THREE.Mesh(geo(new THREE.CylinderGeometry(R, R, 0.075, 256, 1, true)), metal);
    (bandMesh.material as THREE.Material).side = THREE.DoubleSide;
    band.add(bandMesh);
    for (const y of [-0.0375, 0.0375]) {
      const lip = new THREE.Mesh(geo(new THREE.TorusGeometry(R, 0.007, 12, 256)), metal);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = y;
      band.add(lip);
    }
    const TICKS = 120;
    const tickGeo = geo(new THREE.BoxGeometry(0.0045, 1, 0.004));
    const ticks = new THREE.InstancedMesh(tickGeo, engraved, TICKS);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const p = new THREE.Vector3();
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2;
      const major = i % 10 === 0;
      const len = major ? 0.05 : i % 5 === 0 ? 0.034 : 0.022;
      p.set(Math.cos(a) * (R + 0.0025), 0.0375 - len / 2 - 0.006, Math.sin(a) * (R + 0.0025));
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      s.set(major ? 1.6 : 1, len, 1);
      ticks.setMatrixAt(i, m.compose(p, q, s));
    }
    band.add(ticks);

    // Gimbal rings
    const ring = (radius: number, tube: number) => new THREE.Mesh(geo(new THREE.TorusGeometry(radius, tube, 14, 320)), metal);

    const meridianPivot = new THREE.Group(); // spins around the polar axis
    orrery.add(meridianPivot);
    const meridian = ring(MER, 0.011);
    meridianPivot.add(meridian); // vertical great circle (xy plane)

    const eclipticPivot = new THREE.Group();
    eclipticPivot.rotation.z = 0.41; // 23.4°: the orrery nod
    orrery.add(eclipticPivot);
    const ecliptic = ring(ECL, 0.0085);
    ecliptic.rotation.x = Math.PI / 2;
    eclipticPivot.add(ecliptic);

    const outerPivot = new THREE.Group();
    outerPivot.rotation.x = 0.22;
    outerPivot.rotation.z = -0.18;
    orrery.add(outerPivot);
    const outer = ring(OUTER, 0.0065);
    outer.rotation.x = Math.PI / 2;
    outerPivot.add(outer);
    // studs on the outer ring
    const studGeo = geo(new THREE.SphereGeometry(0.016, 20, 14));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const stud = new THREE.Mesh(studGeo, metal);
      stud.position.set(Math.cos(a) * OUTER, 0, Math.sin(a) * OUTER);
      outerPivot.add(stud);
    }

    // Polar axis rod with finials
    const axis = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.0055, 0.0055, AXIS * 2, 16)), metal);
    orrery.add(axis);
    const finialGeo = geo(new THREE.SphereGeometry(0.026, 24, 16));
    for (const y of [-AXIS, AXIS]) {
      const f = new THREE.Mesh(finialGeo, metal);
      f.position.y = y;
      orrery.add(f);
    }

    // Beads travelling the rings (local ring plane = xz for horizontal rings, xy for the meridian)
    type Bead = { mesh: THREE.Mesh; radius: number; speed: number; phase: number; plane: "xz" | "xy" };
    const beadSmall = geo(new THREE.SphereGeometry(0.026, 28, 20));
    const beadBig = geo(new THREE.SphereGeometry(0.036, 32, 24));
    const beads: Bead[] = [];
    const addBead = (parent: THREE.Object3D, radius: number, plane: "xz" | "xy", speed: number, phase: number, accent: boolean, big = false) => {
      const mesh = new THREE.Mesh(big ? beadBig : beadSmall, accent ? accentBead : pearl);
      parent.add(mesh);
      beads.push({ mesh, radius, speed, phase, plane });
    };
    addBead(eclipticPivot, ECL, "xz", 0.26, 0.4, true, true);
    addBead(eclipticPivot, ECL, "xz", 0.26, 3.3, false);
    addBead(meridianPivot, MER, "xy", -0.24, 1.2, false, true);
    addBead(meridianPivot, MER, "xy", -0.24, 4.4, true);
    addBead(outerPivot, OUTER, "xz", 0.16, 2.0, false);
    if (!mobile) addBead(outerPivot, OUTER, "xz", 0.16, 5.1, true);

    // Transaction pulses on the ledger band and the ecliptic
    type Pulse = { pivot: THREE.Group; speed: number; phase: number; mat: THREE.MeshBasicMaterial };
    const pulses: Pulse[] = [];
    const addPulse = (parent: THREE.Object3D, radius: number, tube: number, speed: number, phase: number, y = 0) => {
      const pivot = new THREE.Group();
      pivot.position.y = y;
      parent.add(pivot);
      const mat = pulseMat.clone();
      disposables.push(mat);
      const arc = new THREE.Mesh(geo(new THREE.TorusGeometry(radius, tube, 8, 64, 0.9)), mat);
      arc.rotation.x = Math.PI / 2; // horizontal; the bright head (end of the arc) leads
      pivot.add(arc);
      pulses.push({ pivot, speed, phase, mat });
    };
    addPulse(band, R + 0.004, 0.009, 0.55, 0, 0.0375);
    addPulse(band, R + 0.004, 0.009, 0.55, Math.PI, -0.0375);
    addPulse(eclipticPivot, ECL, 0.011, 0.6, 1.6);

    // Dust field
    const DUST = mobile ? 220 : 520;
    const dustPos = new Float32Array(DUST * 3);
    for (let i = 0; i < DUST; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.7 + Math.pow(Math.random(), 0.7) * 1.1;
      dustPos[i * 3] = Math.cos(a) * r;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 0.55 * (1.6 - r * 0.4);
      dustPos[i * 3 + 2] = Math.sin(a) * r;
    }
    const dustGeo = geo(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const spriteCanvas = document.createElement("canvas");
    spriteCanvas.width = spriteCanvas.height = 32;
    const sc = spriteCanvas.getContext("2d")!;
    const sg = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
    sg.addColorStop(0, "rgba(255,255,255,1)");
    sg.addColorStop(0.4, "rgba(255,255,255,0.6)");
    sg.addColorStop(1, "rgba(255,255,255,0)");
    sc.fillStyle = sg;
    sc.fillRect(0, 0, 32, 32);
    const spriteTex = new THREE.CanvasTexture(spriteCanvas);
    const dustMat = new THREE.PointsMaterial({ size: 0.022, map: spriteTex, transparent: true, depthWrite: false, sizeAttenuation: true });
    disposables.push(spriteTex, dustMat);
    const dust = new THREE.Points(dustGeo, dustMat);
    orrery.add(dust);

    // Theme
    const applyTheme = () => {
      const t = THEMES[isDark() ? "dark" : "light"];
      metal.color.set(t.metal);
      engraved.color.set(t.engrave);
      dustMat.color.set(t.dust);
      dustMat.userData.base = t.dustOpacity;
      scene.environmentIntensity = t.env;
      renderer.toneMappingExposure = t.exposure;
    };
    applyTheme();

    // Layout: size + centre the sphere on the headline
    let W = 1;
    let H = 1;
    const layout = () => {
      const mr = mount.getBoundingClientRect();
      const ar = anchor.getBoundingClientRect();
      W = Math.max(mr.width, 1);
      H = Math.max(mr.height, 1);
      const cx = ar.left - mr.left + ar.width / 2;
      const cy = ar.top - mr.top + ar.height / 2;

      // Ring diameter: wider than the headline so the rings sweep around the copy,
      // while the vertical meridian still fits above/below it.
      const byWidth = (ar.width * (mobile ? 1.1 : 1.3)) / (OUTER * 2);
      const navClear = 92; // keep clear of the fixed nav
      const byHeight = Math.min(cy - navClear, H - cy - 16) / TOP;
      const ppu = Math.max(Math.min(byWidth, byHeight), 60); // pixels per world unit
      const fov = THREE.MathUtils.degToRad(camera.fov);
      const dist = H / ppu / (2 * Math.tan(fov / 2));

      renderer.setSize(W, H, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = W / H;
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
      camera.updateProjectionMatrix();

      // Dim the sphere behind the headline + tagline (CSS mask follows the copy).
      const tag = anchor.nextElementSibling?.getBoundingClientRect();
      const top = ar.top - mr.top;
      const bottom = (tag ? tag.bottom : ar.bottom) - mr.top;
      const width = Math.max(ar.width, tag?.width ?? 0);
      mount.style.setProperty("--mx", `${cx}px`);
      mount.style.setProperty("--my", `${(top + bottom) / 2}px`);
      mount.style.setProperty("--mw", `${width * 0.64}px`);
      mount.style.setProperty("--mh", `${(bottom - top) * 0.78}px`);
    };

    // Motion
    const pointer = new THREE.Vector2();
    const tilt = new THREE.Vector2();
    let scrollP = 0;
    const onPointer = (e: PointerEvent) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    const hero = mount.parentElement;
    const onScroll = () => {
      const h = hero?.offsetHeight ?? window.innerHeight;
      scrollP = Math.min(Math.max(window.scrollY / (h * 0.9), 0), 1);
    };

    // Intro: rings swing into place one after another.
    const intro = { k: reduce ? 1 : 0 };
    const parts = [band, eclipticPivot, meridianPivot, outerPivot];
    const introState = parts.map(() => ({ v: reduce ? 1 : 0 }));
    let tl: gsap.core.Timeline | null = null;
    if (!reduce) {
      tl = gsap.timeline();
      introState.forEach((st, i) => tl!.to(st, { v: 1, duration: 1.8, ease: "expo.out" }, 0.12 * i));
      tl.to(intro, { k: 1, duration: 1.4, ease: "power2.out" }, 0.5);
    }

    const clock = new THREE.Clock();
    const spinBase = { band: 0, meridian: 0.9, ecliptic: 0, outer: 0 };

    const pose = (t: number, dt: number) => {
      // Gimbal motion
      band.rotation.y = spinBase.band + t * 0.06;
      meridianPivot.rotation.y = spinBase.meridian + t * 0.11;
      ecliptic.rotation.z = t * -0.05;
      outerPivot.rotation.y = spinBase.outer - t * 0.035;

      // Intro: each ring scales up while swinging in from an offset angle
      parts.forEach((part, i) => {
        const v = introState[i].v;
        part.scale.setScalar(0.55 + 0.45 * v);
        part.rotation.x = (i === 1 ? 0 : i === 3 ? 0.22 : 0) + (1 - v) * (i % 2 ? -1.1 : 1.1);
        part.visible = v > 0.001;
      });
      const k = intro.k;

      // Beads & pulses
      for (const b of beads) {
        const a = b.phase + t * b.speed;
        if (b.plane === "xz") b.mesh.position.set(Math.cos(a) * b.radius, 0, Math.sin(a) * b.radius);
        else b.mesh.position.set(Math.cos(a) * b.radius, Math.sin(a) * b.radius, 0);
        b.mesh.scale.setScalar(k);
      }
      for (const pl of pulses) {
        pl.pivot.rotation.y = -(pl.phase + t * pl.speed);
        pl.mat.opacity = k * (0.55 + 0.45 * Math.sin(t * 1.3 + pl.phase) ** 2);
      }
      dust.rotation.y = t * 0.018;
      dustMat.opacity = k * (dustMat.userData.base as number);
      core.intensity = 1.2 + Math.sin(t * 0.9) * 0.4;

      // Float, pointer tilt and scroll
      tilt.x = THREE.MathUtils.damp(tilt.x, pointer.x, 3, dt);
      tilt.y = THREE.MathUtils.damp(tilt.y, pointer.y, 3, dt);
      orrery.position.y = Math.sin(t * 0.6) * 0.025;
      root.rotation.set(tilt.y * 0.12 + scrollP * 0.35, tilt.x * 0.22 + scrollP * 0.9, 0);
      root.scale.setScalar(1 - scrollP * 0.12);
    };

    let frame = 0;
    let visible = true;
    let firstFrame = true;
    const render = () => {
      renderer.render(scene, camera);
      if (firstFrame) {
        firstFrame = false;
        mount.style.opacity = "1";
      }
    };
    // The visitor can pause the motion (the scene holds its last frame).
    let paused = isMotionPaused();
    const offPause = onMotionPausedChange((p) => (paused = p));
    let animT = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      if (paused) return;
      animT += dt;
      pose(animT, dt);
      render();
    };
    const still = () => {
      pose(6, 1);
      render();
    };

    layout();
    if (reduce) still();
    else loop();

    const ro = new ResizeObserver(() => {
      layout();
      if (reduce) still();
    });
    ro.observe(mount);
    ro.observe(anchor);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) clock.getDelta(); // avoid a jump after resuming
    });
    io.observe(mount);
    const mo = new MutationObserver(() => {
      applyTheme();
      if (reduce) still();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    if (!reduce) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    return () => {
      cancelAnimationFrame(frame);
      offPause();
      tl?.kill();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [anchorId]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-1000"
      style={{
        // Dim (not hide) the sphere right behind the headline so the text stays crisp.
        maskImage:
          "radial-gradient(var(--mw, 30%) var(--mh, 12%) at var(--mx, 50%) var(--my, 40%), rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.2) 62%, #000 100%)",
        WebkitMaskImage:
          "radial-gradient(var(--mw, 30%) var(--mh, 12%) at var(--mx, 50%) var(--my, 40%), rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.2) 62%, #000 100%)",
      }}
    />
  );
}
