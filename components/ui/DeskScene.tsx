"use client";

import { ArrowLeft, Check, Eraser, Save, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { goToSection } from "@/lib/slides";
import { isMotionPaused, onMotionPausedChange } from "@/lib/motionPause";
import { MotionPauseButton } from "./MotionPauseButton";
import { site } from "@/lib/content";
import { WALL_CHANNEL, WALL_LAYOUT, type WallManifest } from "@/lib/wall/types";
import { Calculator, keyFromKeyboard, type CalcKey } from "./desk/calculator";
import { quadToMatrix3d, type Pt } from "./desk/homography";
import { LaptopOS } from "./desk/LaptopOS";
import { NOTE_FONT, NOTE_LINE, NOTE_PAD_TOP, NOTE_PAD_X, PAPER_H, PAPER_W, PaperNote } from "./desk/PaperNote";
import { isMuted, onMutedChange, playSound, setMuted } from "./desk/sound";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TEXTURES, addFur, bitmapTexture, hdrEnvironment, loadBitmap, loadHdr, makeDetailMaps } from "./desk/realism";
import {
  PANDA_EVENT,
  PANDA_MOOD_EVENT,
  PANDA_TASKS,
  getPandaMood,
  pandaReact,
  setPandaMood,
  type PandaEvent,
  type PandaMood,
  type PandaMoodEvent,
  type PandaReaction,
  type PandaTask,
} from "@/lib/panda";

/**
 * Original 3D panda working at a desk (three.js): soft sheen fur, painted face, glossy eyes.
 *
 * Work: the `task` prop picks what it is doing: typing invoices, tapping a calculator,
 * a client phone call, reading CRM records chin-in-paw, or a coffee break: and it
 * blends smoothly between them. It also breathes, blinks, glances up and waves now and then.
 * Interactive: head + pupils follow the mouse, it looks at you and smiles on hover,
 * waves when clicked, and plays reactions (cheer / nod / think / surprised / wave)
 * sent from elsewhere on the page via `pandaReact()`.
 * Rendering pauses off-screen; reduced-motion users get a still frame.
 */

const C = {
  // Giant panda: a creamy off-white coat (never paper white) and a brown-black.
  fur: "#e9e2d4",
  black: "#191614",
  // Forest & beige palette: forest #14271F, sage #78917C, beige #F4F1E9, cream #E9E4D8, bronze #B18A55
  scarf: "#2f5a47",
  chair: "#24302a",
  chairMetal: "#9aa0a0",
  desk: "#8a6142", // walnut top (a grain texture is laid over it)
  deskSide: "#e9e4d8",
  laptop: "#c9ccd0",
  mug: "#f4f1e9",
  pot: "#b9845a",
  leaf: "#5b8a64",
  paper: "#fbf9f4",
  accent: "#b18a55",
};

const mat = (color: string, rough = 0.62, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

const REACTION_LENGTH: Record<PandaReaction, number> = {
  cheer: 1.9,
  nod: 1.2,
  think: 1.8,
  surprised: 1.3,
  wave: 2.4,
  confused: 2.2,
  dizzy: 3.2,
  dance: 4.4,
  spin: 1.8,
};

/* Click easter eggs: shared by every panda on the page so they stay in sync. */
const CLICK_LINES: [PandaReaction, string][] = [
  ["wave", "Hi there!"],
  ["cheer", "Yay, a visitor!"],
  ["nod", "Ask me anything about Rao Ali."],
  ["spin", "Wheee!"],
  ["surprised", "Oh! You found me."],
  ["wave", "Need help? The chat is in the corner."],
];
let clickTimes: number[] = [];
let lastClickLine = -1;

function onPandaClicked() {
  // A click always wakes a sleeping panda.
  if (getPandaMood() === "sleeping") {
    setPandaMood("idle");
    pandaReact("surprised", "Oh! I'm awake.");
    return;
  }
  const now = performance.now();
  clickTimes = clickTimes.filter((t) => now - t < 2200).concat(now);
  // Five quick clicks → the panda gets dizzy.
  if (clickTimes.length >= 5) {
    clickTimes = [];
    pandaReact("dizzy", "Okay, okay, I'm dizzy!");
    return;
  }
  if (clickTimes.length === 3) {
    pandaReact("surprised", "Easy there!");
    return;
  }
  if (clickTimes.length > 1) return;
  // A cute (non-repeating) reaction for a normal click.
  let i = Math.floor(Math.random() * CLICK_LINES.length);
  if (i === lastClickLine) i = (i + 1) % CLICK_LINES.length;
  lastClickLine = i;
  pandaReact(...CLICK_LINES[i]);
}

type Variant = "desk" | "compact" | "avatar";

/** Desk objects a visitor can focus on (camera flies in, the object becomes usable). */
export type DeskFocus = "laptop" | "calc" | "paper" | "drawer0" | "drawer1" | "drawer2" | `frame${number}`;

const HOVER_LABEL: Record<string, string> = {
  laptop: "Click to explore",
  calc: "Use calculator",
  paper: "Click to write",
  drawer: "Click to open",
  drawerOpen: "Click to close",
  card: "Copy Rao Ali's email",
  pen: "Write a note",
  bamboo: "Feed the panda",
  folder: "Open case studies",
  lamp: "Switch the lamp",
  car: "Take it for a drive",
  frame: "View certificate",
};

const NOTE_KEY = "desk-note";

export function DeskScene({
  className = "",
  variant = "desk",
  task = "invoice",
  showChip = true,
  interactive = variant === "desk",
  scrollTurn = false,
  scrollTrack,
  turn: fixedTurn,
  active = true,
  onFocusChange,
  onFacingChange,
}: {
  /** Rear view without a scroll track: hold the chair at this angle (0 = back to you, 1 = facing you). */
  turn?: number;
  /** False while the scene is off screen (e.g. another slide): it stops rendering. Turning true replays the camera move-in. */
  active?: boolean;
  /**
   * Desk variant only: the scene starts behind the panda while it works, and scrolling
   * through `scrollTrack` turns its chair round (0° → 180°) until it faces the visitor.
   */
  scrollTurn?: boolean;
  /** The tall element whose scroll range drives the turn (GSAP ScrollTrigger, scrubbed). */
  scrollTrack?: RefObject<HTMLElement | null>;
  /** Called when the scroll turn crosses halfway (true = the panda now faces the visitor). */
  onFacingChange?: (facing: boolean) => void;
  className?: string;
  /** "desk" shows the whole scene; "compact" frames the panda's upper body. */
  variant?: Variant;
  /** What the panda is working on. */
  task?: PandaTask;
  /** Show the floating status / message chip above the panda. */
  showChip?: boolean;
  /** Laptop, calculator, papers and drawers can be used (desk variant only by default). */
  interactive?: boolean;
  onFocusChange?: (focus: DeskFocus | null) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [chipText, setChipText] = useState("");
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskRef = useRef<PandaTask>(task);
  const redrawRef = useRef<(() => void) | null>(null);

  /* Interactive desk state (React side) */
  const [focus, setFocus] = useState<DeskFocus | null>(null);
  const [laptopSize, setLaptopSize] = useState({ w: 900, h: 567 });
  const [fullscreen, setFullscreen] = useState(false);
  const [note, setNote] = useState("");
  const [muted, setMutedState] = useState(false);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  /** Certificates hanging on the wall (for the keyboard shortcuts). */
  const [wallFrames, setWallFrames] = useState<{ id: DeskFocus; title: string }[]>([]);
  const hoverLabelRef = useRef<HTMLDivElement>(null);
  const laptopLayerRef = useRef<HTMLDivElement>(null);
  const paperLayerRef = useRef<HTMLDivElement>(null);
  const paperInputRef = useRef<HTMLTextAreaElement>(null);
  const exitRef = useRef<(silent?: boolean) => void>(() => {});
  const enterRef = useRef<(f: DeskFocus) => void>(() => {});
  const drawNoteRef = useRef<(text: string, animate: boolean) => void>(() => {});
  const laptopScaleRef = useRef(1);
  const noteRef = useRef(note);
  noteRef.current = note;
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;
  const onFacingChangeRef = useRef(onFacingChange);
  onFacingChangeRef.current = onFacingChange;
  const activeRef = useRef(active);
  const onActivateRef = useRef<() => void>(() => {});
  useEffect(() => {
    const was = activeRef.current;
    activeRef.current = active;
    if (active && !was) onActivateRef.current();
    // Leaving the slide while something on the desk is open (header menu, dots, keyboard):
    // close it quietly, so its scroll / keyboard lock can never outlive the visit.
    if (!active && was) exitRef.current(true);
  }, [active]);
  const prevFocus = useRef<DeskFocus | null>(null);
  /** Bumped to rebuild the 3D scene from scratch (lost GPU context, repeated render errors). */
  const [gen, setGen] = useState(0);
  // Unmounting never leaves the deck locked.
  useEffect(() => () => onFocusChangeRef.current?.(null), []);

  useEffect(() => {
    setMutedState(isMuted());
    try {
      setNote(sessionStorage.getItem(NOTE_KEY) ?? "");
    } catch {
      /* ignore */
    }
    return onMutedChange(setMutedState);
  }, []);

  // Focus changes: tell the parent, lock page scroll on phones, write the note onto the paper when done.
  useEffect(() => {
    onFocusChangeRef.current?.(focus);
    const small = typeof window !== "undefined" && window.innerWidth < 640;
    setFullscreen(!!focus && small);
    if (focus && small) {
      document.documentElement.style.overflow = "hidden";
      window.__lenis?.stop();
    }
    if (prevFocus.current === "paper" && focus !== "paper") {
      saveNote(noteRef.current, false);
      drawNoteRef.current(noteRef.current, true);
    }
    prevFocus.current = focus;
    return () => {
      if (focus && small) {
        document.documentElement.style.overflow = "";
        window.__lenis?.start();
      }
    };
  }, [focus]);

  // Esc leaves whatever is focused.
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        exitRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const saveNote = (text: string, announce = true) => {
    try {
      sessionStorage.setItem(NOTE_KEY, text);
    } catch {
      /* ignore */
    }
    if (announce) {
      playSound("pop");
      flashChip("Note saved ✓", 1800);
    }
  };

  const flashChip = (text: string, ms = 2400) => {
    setChip(text);
    setChipText(text);
    if (chipTimer.current) clearTimeout(chipTimer.current);
    chipTimer.current = setTimeout(() => setChip(null), ms);
  };

  // New task → the scene blends to it, and the status chip says what it's doing.
  useEffect(() => {
    taskRef.current = task;
    redrawRef.current?.();
    const status = PANDA_TASKS.find((x) => x.id === task)?.status;
    if (status) flashChip(status, 3400);
  }, [task]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Renderer / camera
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      // No WebGL right now (GPU busy / blocked): try again shortly instead of staying blank.
      const retry = window.setTimeout(() => setGen((g) => g + 1), 2500);
      return () => window.clearTimeout(retry);
    }
    // Phones / tablets: a lighter render (lower pixel ratio, smaller shadow map, fewer fur shells).
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;
    /*
     * Adaptive resolution: start at a sensible pixel ratio and let the frame timer below move it
     * between `minDpr` and `maxDpr`, so slower machines stay smooth instead of stuttering.
     */
    const maxDpr = Math.min(window.devicePixelRatio, small ? 1.5 : 2);
    const minDpr = Math.min(1, maxDpr);
    let dpr = Math.min(maxDpr, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Khronos PBR Neutral: photographic colour (no ACES hue shift / over-saturation).
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Shadows are re-rendered by the loop (every frame while things move, every other frame otherwise).
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    const detail = makeDetailMaps();
    const furShells: THREE.InstancedMesh[] = [];

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    const compact = variant !== "desk";
    // Scroll turn: the camera sits behind the panda (on its side of the desk) and the
    // panda's chair turns round towards it as the page scrolls.
    const rear = scrollTurn && variant === "desk";
    const DZ = rear ? -1 : 1; // which side of the desk faces the camera
    const camBase =
      variant === "avatar"
        ? new THREE.Vector3(0.62, 1.5, 0.75) // close-up on the head (chat header)
        : compact
          ? new THREE.Vector3(1.7, 1.9, 2.8)
          : rear
            ? new THREE.Vector3(1.45, 2.3, -4.4)
            : new THREE.Vector3(2.3, 1.85, 3.3);
    const lookAt =
      variant === "avatar"
        ? new THREE.Vector3(0, 1.22, -0.6)
        : compact
          ? new THREE.Vector3(0, 1.08, -0.45)
          : rear
            ? new THREE.Vector3(-0.32, 0.98, -0.35)
            : new THREE.Vector3(0, 0.66, -0.2);

    /*
     * Lights. Image-based light from a photographed studio (HDRI) gives every surface real
     * reflections and soft, directional ambient light; one warm "window" key casts the shadows.
     * Until the HDRI arrives (it is shared and cached), a generated room environment stands in.
     */
    let envTex: THREE.Texture;
    {
      const pmrem = new THREE.PMREMGenerator(renderer);
      envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }
    scene.environment = envTex;
    scene.environmentIntensity = 0.5;
    scene.environmentRotation.set(0, rear ? 2.2 : -0.9, 0);
    const hemi = new THREE.HemisphereLight("#fff4e8", "#5a4a3c", 0.55);
    scene.add(hemi);
    const rim = new THREE.DirectionalLight("#ffe9d6", 1.1);
    // Lights mirror with the camera so the lighting looks the same from either side.
    rim.position.set(-1.5, 2.6, -3.5 * DZ);
    scene.add(rim);
    const key = new THREE.DirectionalLight("#fff0de", 3.0);
    key.position.set(2.5, 5, 3 * DZ);
    key.castShadow = true;
    key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 1, far: 12 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.012;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#dfe8ff", 0.35);
    fill.position.set(-3, 2, 1 * DZ);
    scene.add(fill);

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Floor shadow catcher + soft contact glow
    // Rear view: a real office floor (low-pile wool carpet) that fades into the page at its edges.
    // Other views keep a pure shadow catcher.
    const floorFade = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 128;
      const fc0 = cv.getContext("2d")!;
      const gr = fc0.createRadialGradient(64, 64, 18, 64, 64, 64);
      gr.addColorStop(0, "#fff");
      gr.addColorStop(0.55, "#bbb");
      gr.addColorStop(1, "#000");
      fc0.fillStyle = gr;
      fc0.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(cv);
    })();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      rear
        ? new THREE.MeshStandardMaterial({
            color: "#4a4640",
            roughness: 1,
            normalScale: new THREE.Vector2(0.6, 0.6),
            alphaMap: floorFade,
            transparent: true,
            depthWrite: false,
          })
        : new THREE.ShadowMaterial({ opacity: 0.13 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.renderOrder = -1;
    scene.add(floor);
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 128;
    const g = glowCanvas.getContext("2d")!;
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(120,90,60,0.22)");
    grad.addColorStop(1, "rgba(120,90,60,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 3),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-0.3, 0.002, -0.45);
    scene.add(glow);

    /*
     * Desk: an L-shaped workstation. The top is one extruded, bevelled slab (real thickness and
     * rounded edges); the main run sits in front of the panda and the return wing runs back
     * along its right-hand side. Square metal legs, side rails, a modesty panel and the
     * drawer pedestal hold it up.
     */
    const desk = new THREE.Group();
    scene.add(desk);
    const TOP = 0.75; // desk surface height
    /** Wood materials that get the photographed walnut maps once they have loaded. */
    const deskWood: THREE.MeshPhysicalMaterial[] = [];
    /** Upholstery / cloth materials that get the photographed weave normal map. */
    const fabricMats: THREE.MeshStandardMaterial[] = [];
    /** Plaster wall materials that get the photographed plaster normal map. */
    const plasterMats: THREE.MeshStandardMaterial[] = [];
    /** Satin white laminate (pedestal, drawer fronts, modesty panel): faint grain, soft sheen. */
    const laminate = (rough = 0.5) =>
      new THREE.MeshPhysicalMaterial({
        color: "#e4ddd1",
        roughness: rough,
        roughnessMap: detail.smudgeRough(1),
        normalMap: detail.grainNormal(6),
        normalScale: new THREE.Vector2(0.12, 0.12),
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
      });
    {
      // Outline in (x, z), inset by the bevel; corners are rounded.
      const pts: [number, number][] = [
        [-1.438, 0.388],
        [0.838, 0.388],
        [0.838, -0.388],
        [-0.862, -0.388],
        [-0.862, -1.238],
        [-1.438, -1.238],
      ];
      const P = pts.map(([x, z]) => new THREE.Vector2(x, -z));
      const shape = new THREE.Shape();
      P.forEach((cur, i) => {
        const prev = P[(i + P.length - 1) % P.length];
        const next = P[(i + 1) % P.length];
        const a = cur.clone().add(prev.clone().sub(cur).setLength(0.04));
        const b = cur.clone().add(next.clone().sub(cur).setLength(0.04));
        if (i === 0) shape.moveTo(a.x, a.y);
        else shape.lineTo(a.x, a.y);
        shape.quadraticCurveTo(cur.x, cur.y, b.x, b.y);
      });
      shape.closePath();
      const topGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.026,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 4,
        curveSegments: 8,
      });
      // Walnut: a grain drawn on a canvas (1 texture = 1 m, grain runs along the desk).
      const wood = canvasTex(512, 512, (c) => {
        c.fillStyle = "#8a6142";
        c.fillRect(0, 0, 512, 512);
        for (let k = 0; k < 140; k++) {
          const y = Math.random() * 512;
          const a = 0.04 + Math.random() * 0.08;
          c.strokeStyle = Math.random() < 0.5 ? `rgba(60,36,20,${a})` : `rgba(200,160,120,${a * 0.7})`;
          c.lineWidth = 0.6 + Math.random() * 2.4;
          c.beginPath();
          c.moveTo(0, y);
          for (let x = 0; x <= 512; x += 32) c.lineTo(x, y + Math.sin(x * 0.012 + k) * 3 + Math.sin(x * 0.05 + k * 2) * 1.2);
          c.stroke();
        }
      });
      wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
      /*
       * Lacquered walnut: the photographed grain (swapped in when it has loaded) under a satin
       * clear coat whose roughness carries fine scratches and smudges, like a desk in daily use.
       */
      const topMat = new THREE.MeshPhysicalMaterial({
        map: wood,
        roughness: 0.55,
        metalness: 0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.22,
        clearcoatRoughnessMap: detail.scratches(1.4),
        specularIntensity: 0.6,
      });
      const edgeMat = new THREE.MeshPhysicalMaterial({ map: wood, color: "#b9a690", roughness: 0.6, clearcoat: 0.4, clearcoatRoughness: 0.3 });
      deskWood.push(topMat, edgeMat);
      const top = add(desk, topGeo, [topMat, edgeMat], 0, TOP - 0.038, 0);
      top.rotation.x = -Math.PI / 2;

      // Powder-coated steel: soft sheen, fine orange-peel grain.
      const legMat = new THREE.MeshStandardMaterial({
        color: "#2c2e33",
        roughness: 0.48,
        metalness: 0.55,
        normalMap: detail.grainNormal(3),
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughnessMap: detail.smudgeRough(1),
      });
      const legs: [number, number][] = [
        [-1.39, 0.34],
        [-1.39, -1.19],
        [-0.91, -1.19],
        [-0.91, -0.45],
      ];
      for (const [x, z] of legs) {
        add(desk, new RoundedBoxGeometry(0.05, 0.7, 0.05, 2, 0.01), legMat, x, 0.35, z);
        add(desk, new THREE.CylinderGeometry(0.024, 0.028, 0.012, 20), legMat, x, 0.006, z);
      }
      // Rails under the top tie the legs together.
      add(desk, new RoundedBoxGeometry(0.03, 0.05, 1.5, 2, 0.008), legMat, -1.39, 0.66, -0.425);
      add(desk, new RoundedBoxGeometry(0.45, 0.05, 0.03, 2, 0.008), legMat, -1.15, 0.66, -1.19);
      add(desk, new RoundedBoxGeometry(0.03, 0.05, 0.7, 2, 0.008), legMat, -0.91, 0.66, -0.82);
      // Modesty panel along the visitor's side of the main run.
      add(desk, new RoundedBoxGeometry(1.74, 0.3, 0.018, 2, 0.006), laminate(0.6), -0.5, 0.54, 0.35);
    }
    add(desk, new RoundedBoxGeometry(0.42, 0.62, 0.7, 3, 0.012), laminate(), 0.6, 0.33, 0.0);

    /*
     * Drawers: the pedestal's three handles now belong to real drawers that slide out.
     * Closed, they look exactly like the original pedestal; each has its own contents.
     * Index 0 = top drawer. In the scroll-turn view they face the panda's side (where the camera is).
     */
    const handleMat = new THREE.MeshStandardMaterial({ color: "#c9c6c0", roughness: 0.32, metalness: 0.95, roughnessMap: detail.brushed(1) });
    const drawerInner = mat("#e9e2d9", 0.8);
    const cavityMat = mat("#4a423b", 0.9);
    const DRAWER_Y = [0.525, 0.335, 0.145];
    const drawers = DRAWER_Y.map((y, i) => {
      const cavity = add(desk, new THREE.PlaneGeometry(0.4, 0.18), cavityMat, 0.6, y, 0.3505 * DZ); // dark opening behind it
      cavity.castShadow = false;
      if (rear) cavity.rotation.y = Math.PI;
      const g = new THREE.Group();
      g.position.set(0.6, y, 0);
      if (rear) g.rotation.y = Math.PI;
      desk.add(g);
      add(g, new RoundedBoxGeometry(0.4, 0.18, 0.014, 2, 0.003), laminate(), 0, 0, 0.357);
      add(g, new RoundedBoxGeometry(0.16, 0.02, 0.02, 2, 0.008), handleMat, 0, 0.035, 0.374);
      add(g, new THREE.BoxGeometry(0.38, 0.008, 0.3), drawerInner, 0, -0.075, 0.2);
      for (const sx of [-1, 1]) add(g, new THREE.BoxGeometry(0.008, 0.12, 0.3), drawerInner, sx * 0.186, -0.015, 0.2);
      add(g, new THREE.BoxGeometry(0.38, 0.12, 0.008), drawerInner, 0, -0.015, 0.054);
      return { group: g, id: `drawer${i}` as DeskFocus, open: false, t: 0, items: [] as THREE.Object3D[] };
    });
    // (a hoisted function: the desk top uses it before this point)
    function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      draw(cv.getContext("2d")!);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    }
    const drawerItem = (i: number, name: string) => {
      const item = new THREE.Group();
      item.name = name;
      drawers[i].group.add(item);
      drawers[i].items.push(item);
      return item;
    };
    // Top drawer: business card + pen
    {
      const card = drawerItem(0, "card");
      card.position.set(-0.06, -0.068, 0.2);
      card.rotation.y = 0.15;
      add(card, new THREE.BoxGeometry(0.15, 0.004, 0.09), mat("#ffffff", 0.6));
      const face = add(
        card,
        new THREE.PlaneGeometry(0.15, 0.09),
        new THREE.MeshStandardMaterial({
          roughness: 0.7,
          map: canvasTex(600, 360, (c) => {
            c.fillStyle = "#fffdf9";
            c.fillRect(0, 0, 600, 360);
            c.fillStyle = C.accent;
            c.fillRect(0, 0, 18, 360);
            c.fillStyle = "#1b1a18";
            c.font = "600 54px system-ui, sans-serif";
            c.fillText(site.name, 54, 120);
            c.fillStyle = "#7a6b5f";
            c.font = "32px system-ui, sans-serif";
            c.fillText(site.title, 54, 172);
            c.fillStyle = C.accent;
            c.font = "500 34px system-ui, sans-serif";
            c.fillText(site.email, 54, 290);
          }),
        }),
        0,
        0.0021,
        0,
      );
      face.rotation.x = -Math.PI / 2;
      face.castShadow = false;
      const pen = drawerItem(0, "pen");
      pen.position.set(0.11, -0.062, 0.2);
      pen.rotation.set(0, 0.5, Math.PI / 2);
      add(pen, new THREE.CylinderGeometry(0.006, 0.006, 0.14, 12), mat(C.accent, 0.4));
      add(pen, new THREE.ConeGeometry(0.006, 0.02, 12), mat("#2f3340", 0.4), 0, -0.08, 0).rotation.z = Math.PI;
    }
    // Middle drawer: a bamboo snack for the panda
    {
      const bamboo = drawerItem(1, "bamboo");
      bamboo.position.set(0, -0.058, 0.2);
      const stem = mat("#6aa84f", 0.5);
      const node = mat("#4f8a3b", 0.5);
      [-0.035, 0, 0.035].forEach((x, k) => {
        const s = new THREE.Group();
        s.position.set(x, k === 1 ? 0.012 : 0, 0);
        s.rotation.set(Math.PI / 2, 0, 0.25 * (k - 1));
        bamboo.add(s);
        add(s, new THREE.CylinderGeometry(0.012, 0.012, 0.24, 14), stem);
        for (const ny of [-0.07, 0.02, 0.1]) add(s, new THREE.CylinderGeometry(0.0135, 0.0135, 0.008, 14), node, 0, ny, 0);
      });
      const leaf = add(bamboo, new THREE.SphereGeometry(0.03, 12, 8), mat(C.leaf, 0.5), 0.05, 0.01, -0.1);
      leaf.scale.set(1.6, 0.25, 0.6);
    }
    // Bottom drawer: the case-studies folder
    {
      const folder = drawerItem(2, "folder");
      folder.position.set(0, -0.066, 0.2);
      add(folder, new RoundedBoxGeometry(0.28, 0.01, 0.2, 2, 0.004), mat("#ffa800", 0.6));
      const label = add(
        folder,
        new THREE.PlaneGeometry(0.16, 0.05),
        new THREE.MeshBasicMaterial({
          map: canvasTex(512, 160, (c) => {
            c.fillStyle = "#fffdf9";
            c.fillRect(0, 0, 512, 160);
            c.fillStyle = "#1b1a18";
            c.font = "600 64px system-ui, sans-serif";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText("Case studies", 256, 84);
          }),
        }),
        0,
        0.0055,
        0.02,
      );
      label.rotation.x = -Math.PI / 2;
      label.castShadow = false;
    }

    // Laptop (screen faces the panda)
    // While a visitor uses it, it turns to face them. In the rear view the far side of the desk
    // is the wall, so it turns sideways (towards the drawers) instead of all the way round.
    const LAPTOP_TURN = rear ? -Math.PI / 2 : Math.PI;
    const laptop = new THREE.Group();
    laptop.position.set(-0.05, 0.75, -0.12);
    desk.add(laptop);
    // Anodised, bead-blasted aluminium (one shared material: hover lights the whole laptop).
    const alu = new THREE.MeshPhysicalMaterial({
      color: "#babdc2",
      metalness: 1,
      roughness: 0.36,
      roughnessMap: detail.smudgeRough(1),
      anisotropy: 0.35,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
    });
    add(laptop, new RoundedBoxGeometry(0.5, 0.016, 0.34, 4, 0.006), alu, 0, 0.008, 0);
    // Keyboard + trackpad on the deck (the panda types on these).
    {
      // The keyboard well (dark, a hair below the deck) …
      const KB_W = 0.44;
      const KB_H = 0.16;
      const kbGroup = new THREE.Group();
      kbGroup.position.set(0, 0.0162, 0.045);
      kbGroup.rotation.set(-Math.PI / 2, 0, Math.PI);
      laptop.add(kbGroup);
      const well = add(kbGroup, new THREE.PlaneGeometry(KB_W, KB_H), new THREE.MeshStandardMaterial({ color: "#121316", roughness: 0.8 }), 0, 0, 0);
      well.castShadow = false;
      // … and real keycaps standing in it: one instanced mesh, same layout as a 14-column board.
      const caps: [number, number, number, number][] = []; // x, y, w, h in layout pixels (550 × 200)
      for (let r = 0; r < 5; r++) {
        const n = 14 - (r === 0 ? 0 : 1);
        const kw = (530 - (n - 1) * 5) / n;
        for (let k = 0; k < n; k++) caps.push([10 + k * (kw + 5), 8 + r * 32, kw, r === 0 ? 20 : 27]);
      }
      for (let k = 0; k < 4; k++) caps.push([10 + k * 45, 168, 40, 26]);
      caps.push([190, 168, 210, 26]); // space bar
      for (let k = 0; k < 3; k++) caps.push([405 + k * 45, 168, 40, 26]);
      const capMat = new THREE.MeshStandardMaterial({ color: "#1b1c20", roughness: 0.62, roughnessMap: detail.smudgeRough(2) });
      const capMesh = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.18), capMat, caps.length);
      const m4 = new THREE.Matrix4();
      const PX = KB_W / 550;
      caps.forEach(([x, y, w, h], i) => {
        m4.makeScale(w * PX * 0.94, h * PX * 0.94, 0.0042);
        m4.setPosition((x + w / 2) * PX - KB_W / 2, KB_H / 2 - (y + h / 2) * PX, 0.0018);
        capMesh.setMatrixAt(i, m4);
      });
      capMesh.castShadow = false;
      capMesh.receiveShadow = true;
      kbGroup.add(capMesh);
      // Glass trackpad, flush with the deck.
      const pad = add(
        laptop,
        new THREE.PlaneGeometry(0.14, 0.075),
        new THREE.MeshPhysicalMaterial({ color: "#a7abb2", roughness: 0.22, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12 }),
        0,
        0.0163,
        -0.11,
      );
      pad.rotation.x = -Math.PI / 2;
      pad.castShadow = false;
    }
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.016, 0.165);
    lidPivot.rotation.x = 0.28;
    laptop.add(lidPivot);
    add(lidPivot, new RoundedBoxGeometry(0.5, 0.33, 0.012, 4, 0.005), alu, 0, 0.165, 0);
    // Mirror-polished logo on the lid.
    const logo = add(lidPivot, new THREE.CircleGeometry(0.022, 40), new THREE.MeshPhysicalMaterial({ color: "#e4e5e8", metalness: 1, roughness: 0.08 }), 0, 0.17, 0.0062);
    logo.castShadow = false;
    // Black glass bezel around the display.
    const bezel = add(lidPivot, new THREE.PlaneGeometry(0.49, 0.322), new THREE.MeshStandardMaterial({ color: "#07080a", roughness: 0.2 }), 0, 0.165, -0.0062);
    bezel.rotation.y = Math.PI;
    bezel.castShadow = false;
    // The display on the inside of the lid (faces the panda until the laptop is turned around).
    const SCREEN_W = 0.46;
    const SCREEN_H = 0.29;
    const screen = add(
      lidPivot,
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      new THREE.MeshBasicMaterial({
        // An accounting spreadsheet (fictional figures).
        map: canvasTex(512, 323, (c) => {
          c.fillStyle = "#fbf9f4";
          c.fillRect(0, 0, 512, 323);
          c.fillStyle = "#14271f";
          c.fillRect(0, 0, 512, 30);
          c.fillStyle = "#e9e4d8";
          c.font = "600 15px system-ui, sans-serif";
          c.fillText("Ledger · November (sample)", 12, 20);
          c.fillStyle = "#e9e4d8";
          c.fillRect(0, 30, 512, 24);
          c.fillStyle = "#56655a";
          c.font = "600 12px system-ui, sans-serif";
          ["Date", "Description", "Debit", "Credit", "Balance"].forEach((h, k) => c.fillText(h, [10, 70, 290, 360, 432][k], 47));
          const rows = [
            ["01 Nov", "Client A retainer", "", "4,200", "16,700"],
            ["03 Nov", "Office rent", "1,800", "", "14,900"],
            ["06 Nov", "Client B invoice", "", "2,650", "17,550"],
            ["09 Nov", "Software", "420", "", "17,130"],
            ["14 Nov", "Contractor", "1,350", "", "15,780"],
            ["18 Nov", "Client C milestone", "", "3,100", "18,880"],
            ["22 Nov", "Utilities", "260", "", "18,620"],
            ["28 Nov", "Bank charges", "35", "", "18,585"],
          ];
          c.font = "12px system-ui, sans-serif";
          rows.forEach((r, i) => {
            const y = 54 + i * 28;
            if (i % 2) {
              c.fillStyle = "#f4f1e9";
              c.fillRect(0, y, 512, 28);
            }
            r.forEach((v, k) => {
              c.fillStyle = k === 2 && v ? "#9a3d22" : k === 3 && v ? "#2f5a47" : "#252a26";
              c.fillText(v, [10, 70, 290, 360, 432][k], y + 18);
            });
          });
          c.strokeStyle = "#ddd6c6";
          for (const x of [62, 282, 352, 424]) (c.beginPath(), c.moveTo(x, 30), c.lineTo(x, 278), c.stroke());
          c.fillStyle = "#14271f";
          c.fillRect(0, 282, 512, 41);
          c.fillStyle = "#b18a55";
          c.font = "700 13px system-ui, sans-serif";
          c.fillText("Closing balance", 70, 307);
          c.fillText("18,585", 432, 307);
        }),
      }),
      0,
      0.165,
      -0.0066,
    );
    screen.rotation.y = Math.PI;
    screen.castShadow = false;
    // Cover glass: faint real reflections of the room over the picture.
    const screenGlass = add(
      lidPivot,
      new THREE.PlaneGeometry(0.49, 0.322),
      new THREE.MeshPhysicalMaterial({ color: "#000000", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.18, envMapIntensity: 1.4, depthWrite: false }),
      0,
      0.165,
      -0.007,
    );
    screenGlass.rotation.y = Math.PI;
    screenGlass.castShadow = false;
    screenGlass.receiveShadow = false;
    const screenLight = new THREE.PointLight("#9fc4ff", 0.6, 1.2);
    screenLight.position.set(0, 0.2, -0.15);
    lidPivot.add(screenLight);

    // Props
    // Mug sits within reach of the right paw, handle turned towards it (picked up on coffee breaks).
    const mug = new THREE.Group();
    const mugRest = new THREE.Vector3(-0.55, 0.75, -0.2);
    mug.position.copy(mugRest);
    mug.rotation.y = Math.PI;
    desk.add(mug);
    {
      // Glazed stoneware: a lathe profile with a real wall thickness, rolled lip and foot ring.
      const glaze = new THREE.MeshPhysicalMaterial({ color: "#efe9df", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, normalMap: detail.grainNormal(2), normalScale: new THREE.Vector2(0.05, 0.05) });
      const prof = [
        [0.0, 0.0], [0.04, 0.0], [0.042, 0.004], [0.044, 0.006], [0.0475, 0.06], [0.048, 0.105], [0.047, 0.11], [0.0445, 0.109], [0.0435, 0.06], [0.04, 0.012], [0.0, 0.012],
      ].map(([x, y]) => new THREE.Vector2(x, y));
      add(mug, new THREE.LatheGeometry(prof, 48), glaze, 0, 0, 0);
      const coffee = add(mug, new THREE.CircleGeometry(0.0438, 40), new THREE.MeshPhysicalMaterial({ color: "#2a1709", roughness: 0.05, clearcoat: 1 }), 0, 0.094, 0);
      coffee.rotation.x = -Math.PI / 2;
      coffee.castShadow = false;
      const handle = add(mug, new THREE.TorusGeometry(0.03, 0.0085, 14, 28, Math.PI), glaze, 0.047, 0.056, 0);
      handle.rotation.z = -Math.PI / 2;
      handle.scale.set(1, 0.9, 1);
      // Brand band in the accent colour (part of the glaze).
      const band2 = add(mug, new THREE.CylinderGeometry(0.0482, 0.0479, 0.016, 48, 1, true), new THREE.MeshPhysicalMaterial({ color: "#b18a55", roughness: 0.25, clearcoat: 1 }), 0, 0.075, 0);
      band2.castShadow = false;
    }
    // Steam: soft wisps (blurred sprites), not solid balls.
    const steamTex = (() => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 64;
      const sc = cv.getContext("2d")!;
      const gr = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,0.55)");
      gr.addColorStop(0.5, "rgba(255,255,255,0.18)");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      sc.fillStyle = gr;
      sc.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(cv);
    })();
    const steam: THREE.Sprite[] = [0, 1, 2, 3].map((i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0.3, depthWrite: false }));
      s.position.set(0, 0.14 + i * 0.05, 0);
      s.scale.setScalar(0.05);
      mug.add(s);
      return s;
    });

    const papers = new THREE.Group();
    papers.position.set(0.56, 0.75, -0.02); // invoices, to the right of the laptop
    desk.add(papers);
    /*
     * A loose stack of A4-ish sheets: real paper thickness (≈0.1 mm, drawn a little thicker so the
     * edges catch light), each sheet slightly skewed, the corners lifting a few millimetres.
     */
    const paperNormal = detail.paperNormal(1);
    const paperMat = () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f3f0e8",
        roughness: 0.93,
        normalMap: paperNormal,
        normalScale: new THREE.Vector2(0.35, 0.35),
        sheen: 0.3,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#ffffff"),
      });
    /** A sheet that curls up a little towards two corners (bent plane, origin at its centre). */
    const sheetGeo = (w: number, h: number, curl: number, seed: number) => {
      const g = new THREE.PlaneGeometry(w, h, 12, 16);
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) / (w / 2);
        const y = pos.getY(i) / (h / 2);
        const corner = Math.max(0, x * Math.cos(seed) + y * Math.sin(seed)) ** 3;
        pos.setZ(i, curl * corner + 0.0004 * Math.sin(x * 3 + seed) * Math.cos(y * 2));
      }
      g.computeVertexNormals();
      return g;
    };
    const sheetEdge = new THREE.MeshStandardMaterial({ color: "#e9e5dc", roughness: 0.95 });
    for (let i = 0; i < 7; i++) {
      // The block of sheets underneath (thin box, so its edges show as paper edges).
      const p = add(papers, new THREE.BoxGeometry(0.218, 0.0011, 0.288), [sheetEdge, sheetEdge, paperMat(), sheetEdge, sheetEdge, sheetEdge], 0, 0.0006 + i * 0.0012, 0);
      p.rotation.y = Math.sin(i * 2.7) * 0.035;
      p.position.x = Math.sin(i * 1.9) * 0.004;
      p.position.z = Math.cos(i * 1.3) * 0.004;
    }
    // Invoice: drawn at print resolution (≈ 300 dpi at this size), fictional figures.
    const invCanvas = document.createElement("canvas");
    invCanvas.width = 768;
    invCanvas.height = 1012;
    {
      const ic = invCanvas.getContext("2d")!;
      const W0 = 768;
      ic.fillStyle = "#f7f4ec";
      ic.fillRect(0, 0, W0, 1012);
      ic.fillStyle = "#14271f";
      ic.font = "700 44px Georgia, serif";
      ic.fillText("INVOICE", 56, 96);
      ic.fillStyle = "#6f6458";
      ic.font = "22px system-ui, sans-serif";
      ic.fillText("No. 2024-118  ·  Date 14 Nov", 56, 136);
      ic.fillText("Bill to: Client B (sample)", 56, 170);
      ic.textAlign = "right";
      ic.fillStyle = "#b18a55";
      ic.font = "600 22px system-ui, sans-serif";
      ic.fillText(site.name, W0 - 56, 96);
      ic.textAlign = "left";
      ic.fillStyle = "#14271f";
      ic.fillRect(56, 220, W0 - 112, 3);
      ic.font = "600 21px system-ui, sans-serif";
      ic.fillText("Description", 56, 258);
      ic.textAlign = "right";
      ic.fillText("Amount", W0 - 56, 258);
      const lines: [string, string][] = [
        ["Monthly bookkeeping", "1,200.00"],
        ["Bank reconciliation", "450.00"],
        ["CRM data clean-up", "640.00"],
        ["Payroll support", "360.00"],
      ];
      ic.font = "21px system-ui, sans-serif";
      lines.forEach(([d, a], k) => {
        const y = 310 + k * 52;
        ic.fillStyle = "#2a2c2a";
        ic.textAlign = "left";
        ic.fillText(d, 56, y);
        ic.textAlign = "right";
        ic.fillText(a, W0 - 56, y);
        ic.fillStyle = "rgba(20,39,31,0.12)";
        ic.fillRect(56, y + 18, W0 - 112, 1.5);
      });
      ic.fillStyle = "#14271f";
      ic.font = "700 26px system-ui, sans-serif";
      ic.textAlign = "left";
      ic.fillText("Total due", 380, 560);
      ic.textAlign = "right";
      ic.fillText("2,650.00", W0 - 56, 560);
      ic.textAlign = "left";
      ic.font = "19px system-ui, sans-serif";
      ic.fillStyle = "#7a6b5f";
      ic.fillText("Payment within 14 days. Thank you.", 56, 900);
      // A faint coffee ring, because it's a real desk.
      ic.strokeStyle = "rgba(120,80,40,0.10)";
      ic.lineWidth = 7;
      ic.beginPath();
      ic.arc(600, 760, 62, 0.3, Math.PI * 1.7);
      ic.stroke();
    }
    const invoiceTexture = new THREE.CanvasTexture(invCanvas);
    invoiceTexture.colorSpace = THREE.SRGBColorSpace;
    invoiceTexture.anisotropy = 8;
    const invoice = new THREE.Mesh(
      sheetGeo(0.22, 0.29, 0.004, 0.6),
      new THREE.MeshPhysicalMaterial({
        map: invoiceTexture,
        roughness: 0.92,
        normalMap: paperNormal,
        normalScale: new THREE.Vector2(0.35, 0.35),
        sheen: 0.3,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#ffffff"),
      }),
    );
    invoice.rotation.x = -Math.PI / 2;
    invoice.rotation.z = 0.12;
    invoice.position.set(0, 0.0095, 0);
    invoice.receiveShadow = true;
    invoice.castShadow = true;
    papers.add(invoice);
    const invoiceMat = invoice.material as THREE.MeshPhysicalMaterial;
    const invoiceTex = invoiceMat.map!;

    // The visitor's note: lined paper drawn at 2× the editor size, text revealed like handwriting.
    const NOTE_SCALE = 2;
    const noteCanvas = document.createElement("canvas");
    noteCanvas.width = PAPER_W * NOTE_SCALE;
    noteCanvas.height = PAPER_H * NOTE_SCALE;
    const nctx = noteCanvas.getContext("2d")!;
    const noteTex = new THREE.CanvasTexture(noteCanvas);
    noteTex.colorSpace = THREE.SRGBColorSpace;
    noteTex.anisotropy = 4;
    const wrapNote = (text: string) => {
      nctx.font = `bold ${22 * NOTE_SCALE}px ${NOTE_FONT}`;
      const maxW = (PAPER_W - NOTE_PAD_X * 2) * NOTE_SCALE;
      const lines: string[] = [];
      for (const para of text.split("\n")) {
        let line = "";
        for (const word of para.split(/(\s+)/)) {
          const tryLine = line + word;
          if (nctx.measureText(tryLine).width > maxW && line.trim()) {
            lines.push(line.trimEnd());
            line = word.trimStart();
          } else line = tryLine;
        }
        lines.push(line);
      }
      return lines;
    };
    const paintNote = (text: string, chars: number) => {
      const s = NOTE_SCALE;
      nctx.fillStyle = "#fbfaf7";
      nctx.fillRect(0, 0, noteCanvas.width, noteCanvas.height);
      nctx.strokeStyle = "rgba(120,150,200,0.35)";
      nctx.lineWidth = 2;
      for (let y = NOTE_PAD_TOP + 6; y < PAPER_H - 12; y += NOTE_LINE) {
        nctx.beginPath();
        nctx.moveTo(14 * s, y * s);
        nctx.lineTo((PAPER_W - 14) * s, y * s);
        nctx.stroke();
      }
      nctx.strokeStyle = "rgba(254,79,2,0.35)";
      nctx.beginPath();
      nctx.moveTo((NOTE_PAD_X - 10) * s, 10 * s);
      nctx.lineTo((NOTE_PAD_X - 10) * s, (PAPER_H - 10) * s);
      nctx.stroke();
      if (text) {
        nctx.fillStyle = "#14307a";
        nctx.textBaseline = "alphabetic";
        let left = chars;
        wrapNote(text).forEach((line, i) => {
          if (left <= 0) return;
          const part = line.slice(0, left);
          left -= line.length + 1;
          nctx.fillText(part, NOTE_PAD_X * s, (NOTE_PAD_TOP + i * NOTE_LINE) * s);
        });
      }
      noteTex.needsUpdate = true;
    };
    let noteReveal: { text: string; t0: number; shown: number } | null = null;
    const showNote = (text: string, animate: boolean) => {
      if (!text.trim()) {
        noteReveal = null;
        invoiceMat.map = invoiceTex; // blank note → the original invoice comes back
        invoiceMat.needsUpdate = true;
        return;
      }
      invoiceMat.map = noteTex;
      invoiceMat.needsUpdate = true;
      if (animate && !reduce) {
        noteReveal = { text, t0: clock.getElapsedTime(), shown: -1 };
        paintNote(text, 0);
      } else {
        noteReveal = null;
        paintNote(text, text.length);
      }
    };
    drawNoteRef.current = showNote;

    // Phone: lies by the left paw, lifted to the ear for client calls.
    const phone = new THREE.Group();
    const phoneRest = new THREE.Vector3(0.27, 0.756, -0.34);
    const phoneRestQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -0.3, 0));
    phone.position.copy(phoneRest);
    phone.quaternion.copy(phoneRestQ);
    desk.add(phone);
    add(phone, new RoundedBoxGeometry(0.056, 0.008, 0.112, 4, 0.0035), new THREE.MeshPhysicalMaterial({ color: "#2a2b30", metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }));
    const phoneScreenMat = new THREE.MeshPhysicalMaterial({ color: "#050608", emissive: "#6fb2ff", emissiveIntensity: 0, roughness: 0.05, clearcoat: 1 });
    const phoneScreen = add(phone, new THREE.PlaneGeometry(0.052, 0.107), phoneScreenMat, 0, 0.0041, 0);
    phoneScreen.rotation.x = -Math.PI / 2;
    phoneScreen.castShadow = false;
    // phone long axis (z) follows the forearm when held
    const phoneHoldOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

    // Calculator: the left paw taps it while reconciling; its display really counts.
    const calc = new THREE.Group();
    calc.position.set(0.42, 0.75, -0.27);
    calc.rotation.y = -0.2;
    desk.add(calc);
    // Moulded ABS body with a fine texture; a recessed, darker display bezel and a solar cell.
    const calcBody = new THREE.MeshStandardMaterial({ color: "#2b2d33", roughness: 0.6, normalMap: detail.grainNormal(5), normalScale: new THREE.Vector2(0.35, 0.35), roughnessMap: detail.smudgeRough(1) });
    add(calc, new RoundedBoxGeometry(0.13, 0.02, 0.17, 4, 0.006), calcBody, 0, 0.01, 0);
    {
      const bez = add(calc, new RoundedBoxGeometry(0.114, 0.002, 0.042, 2, 0.0008), new THREE.MeshStandardMaterial({ color: "#16171b", roughness: 0.35 }), 0, 0.0198, 0.052);
      bez.castShadow = false;
      const solar = add(
        calc,
        new THREE.PlaneGeometry(0.05, 0.011),
        new THREE.MeshPhysicalMaterial({
          roughness: 0.15,
          clearcoat: 1,
          map: canvasTex(200, 44, (c) => {
            c.fillStyle = "#3a2a22";
            c.fillRect(0, 0, 200, 44);
            c.strokeStyle = "rgba(160,120,90,0.5)";
            for (let x = 0; x < 200; x += 50) (c.beginPath(), c.moveTo(x, 0), c.lineTo(x, 44), c.stroke());
          }),
        }),
        0.03,
        0.0202,
        0.0805,
      );
      solar.rotation.set(-Math.PI / 2, 0, Math.PI);
      solar.castShadow = false;
    }
    /*
     * 20 real keys (5 rows × 4), each its own mesh with a printed label.
     * Labels/display read "up" towards the calculator's display end (+z), which is how the
     * close-up camera looks at it. Visual column 0 sits at +x (camera's left in that view).
     */
    const KEY_ROWS: [CalcKey, string][][] = [
      [["C", "C"], ["DEL", "⌫"], ["NEG", "±"], ["/", "÷"]],
      [["7", "7"], ["8", "8"], ["9", "9"], ["*", "×"]],
      [["4", "4"], ["5", "5"], ["6", "6"], ["-", "−"]],
      [["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"]],
      [["0", "0"], ["00", "00"], [".", "."], ["=", "="]],
    ];
    const keyGeo = new RoundedBoxGeometry(0.022, 0.007, 0.018, 2, 0.0025);
    const keyLabelGeo = new THREE.PlaneGeometry(0.019, 0.0155);
    type KeyMesh = { key: CalcKey; mesh: THREE.Mesh; pressedAt: number };
    const keys: KeyMesh[] = [];
    KEY_ROWS.forEach((row, r) =>
      row.forEach(([k, label], v) => {
        const op = v === 3 || k === "=";
        const fn = k === "C" || k === "DEL" || k === "NEG";
        const bg = op ? C.accent : fn ? "#b9bec8" : "#e9e5df";
        const mesh = add(calc, keyGeo, new THREE.MeshPhysicalMaterial({ color: bg, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.3 }), 0.042 - v * 0.028, 0.0225, 0.022 - r * 0.0235);
        const lbl = add(
          mesh,
          keyLabelGeo,
          new THREE.MeshBasicMaterial({
            transparent: true,
            map: canvasTex(96, 80, (c) => {
              c.fillStyle = op ? "#1b1a18" : "#2a2a30"; // dark on orange: white would be only 3.3:1
              c.font = `600 ${label.length > 1 ? 44 : 54}px system-ui, sans-serif`;
              c.textAlign = "center";
              c.textBaseline = "middle";
              c.fillText(label, 48, 44);
            }),
          }),
          0,
          0.0036,
          0,
        );
        lbl.rotation.set(-Math.PI / 2, 0, Math.PI);
        lbl.castShadow = false;
        mesh.name = `key:${k}`;
        keys.push({ key: k, mesh, pressedAt: -9 });
      }),
    );
    const calcCanvas = document.createElement("canvas");
    calcCanvas.width = 512;
    calcCanvas.height = 160;
    const cc = calcCanvas.getContext("2d")!;
    const calcTex = new THREE.CanvasTexture(calcCanvas);
    calcTex.colorSpace = THREE.SRGBColorSpace;
    calcTex.anisotropy = 4;
    const MONO = "ui-monospace, Menlo, Consolas, monospace";
    const fitText = (text: string, size: number, maxW: number, weight = "bold") => {
      let s = size;
      cc.font = `${weight} ${s}px ${MONO}`;
      while (cc.measureText(text).width > maxW && s > 18) {
        s -= 2;
        cc.font = `${weight} ${s}px ${MONO}`;
      }
    };
    const drawCalc = (text: string, expr = "") => {
      cc.fillStyle = "#c9dcc0";
      cc.fillRect(0, 0, 512, 160);
      cc.fillStyle = "rgba(31,43,28,0.07)";
      cc.fillRect(0, 0, 512, 6);
      cc.textAlign = "right";
      cc.textBaseline = "middle";
      cc.fillStyle = "#3d4d39";
      fitText(expr, 32, 470, "500");
      cc.fillText(expr, 490, 38);
      cc.fillStyle = "#1f2b1c";
      fitText(text, 74, 480);
      cc.fillText(text, 490, 108);
      calcTex.needsUpdate = true;
    };
    const CALC_SEQ = ["1,250.00", "+ 860.00", "+ 2,100.00", "+ 540.00", "= 4,750.00", "✓ 4,750.00", "0."];
    let calcStep = 0;
    let calcBeat = -1;
    const calculator = new Calculator();
    let calcUsed = false; // once a visitor uses it, the panda stops "typing" on the display
    drawCalc("0.");
    // LCD: lit by the room (not glowing), under a glossy window.
    const calcScreen = add(calc, new THREE.PlaneGeometry(0.104, 0.033), new THREE.MeshPhysicalMaterial({ map: calcTex, roughness: 0.6, clearcoat: 1, clearcoatRoughness: 0.05 }), 0, 0.0211, 0.052);
    calcScreen.rotation.set(-Math.PI / 2, 0, Math.PI);
    calcScreen.castShadow = false;
    const pressKey = (k: CalcKey) => {
      const km = keys.find((x) => x.key === k);
      if (km) km.pressedAt = clock.getElapsedTime();
      calcUsed = true;
      calculator.press(k);
      playSound(calculator.error ? "error" : "key");
      drawCalc(calculator.display, calculator.expression);
    };

    const plant = new THREE.Group();
    plant.position.set(-0.68, 0.75, 0.16);
    desk.add(plant);
    // Unglazed terracotta pot with a rim, dark soil, and a snake plant: tall, waxy, banded blades.
    const terracotta = new THREE.MeshStandardMaterial({ color: "#b0704a", roughness: 0.95, normalMap: detail.grainNormal(3), normalScale: new THREE.Vector2(0.5, 0.5) });
    add(plant, new THREE.CylinderGeometry(0.07, 0.056, 0.12, 32), terracotta, 0, 0.06, 0);
    add(plant, new THREE.CylinderGeometry(0.077, 0.077, 0.022, 32), terracotta, 0, 0.12, 0);
    add(plant, new THREE.CircleGeometry(0.068, 24), new THREE.MeshStandardMaterial({ color: "#2e2219", roughness: 1 }), 0, 0.128, 0).rotation.x = -Math.PI / 2;
    const bladeTex = canvasTex(64, 256, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, 256);
      gr.addColorStop(0, "#5e7d45");
      gr.addColorStop(1, "#2f4a2a");
      c.fillStyle = gr;
      c.fillRect(0, 0, 64, 256);
      for (let y = 6; y < 256; y += 9 + Math.random() * 8) {
        c.fillStyle = `rgba(170,190,120,${0.18 + Math.random() * 0.2})`;
        c.beginPath();
        c.ellipse(32, y, 34, 2.2, Math.random() * 0.2 - 0.1, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = "rgba(210,190,90,0.7)"; // yellow margins
      c.fillRect(0, 0, 3, 256);
      c.fillRect(61, 0, 3, 256);
    });
    const leafMat = new THREE.MeshPhysicalMaterial({ map: bladeTex, roughness: 0.35, clearcoat: 0.4, clearcoatRoughness: 0.3, side: THREE.DoubleSide });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + i * 0.4;
      const hgt = 0.2 + ((i * 37) % 10) * 0.012;
      // A blade: a narrow plane, cupped and tapering to a point.
      const g = new THREE.PlaneGeometry(0.036, hgt, 4, 10);
      const p = g.attributes.position;
      for (let k = 0; k < p.count; k++) {
        const y = p.getY(k) / hgt + 0.5; // 0 bottom → 1 tip
        const x = p.getX(k);
        const taper = y < 0.75 ? 1 - y * 0.25 : (1 - y) * 3.25;
        p.setX(k, x * taper);
        p.setZ(k, -Math.abs(x) * 0.6 * taper + y * y * 0.025);
        p.setY(k, y * hgt);
      }
      g.computeVertexNormals();
      const leaf = add(plant, g, leafMat, Math.cos(a) * 0.022, 0.125, Math.sin(a) * 0.022);
      leaf.rotation.set(0, -a, 0);
      leaf.rotateX(-0.12 - (i % 3) * 0.06);
    }

    /* ---------- Desk dressing ---------- */
    const V = THREE.Vector3;
    const brass = new THREE.MeshStandardMaterial({ color: "#b08d57", roughness: 0.32, metalness: 0.85 });
    const slate = mat("#2f3340", 0.5);
    /** A cylinder from a to b (lamp arms, pens). */
    const rod = (parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material) => {
      const d = b.clone().sub(a);
      const mesh = add(parent, new THREE.CylinderGeometry(r, r, d.length(), 12), m);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.quaternion.setFromUnitVectors(new V(0, 1, 0), d.normalize());
      return mesh;
    };
    /** A closed book lying flat: boards, spine (at -x) and a cream page block. Origin at the bottom centre. */
    // Page block: the edges of hundreds of pages (fine lines), slightly yellowed.
    const pageTex = canvasTex(64, 256, (c) => {
      c.fillStyle = "#efe7d6";
      c.fillRect(0, 0, 64, 256);
      for (let y = 0; y < 256; y += 2) {
        c.fillStyle = `rgba(120,100,70,${0.05 + Math.random() * 0.12})`;
        c.fillRect(0, y, 64, 1);
      }
    });
    const pageMat = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.95 });
    const book = (w: number, t: number, d: number, color: string) => {
      const g = new THREE.Group();
      // Bookcloth over board: woven texture, soft sheen, worn edges.
      const cover = new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, sheen: 0.4, sheenRoughness: 0.7, sheenColor: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.35), normalScale: new THREE.Vector2(0.45, 0.45) });
      fabricMats.push(cover);
      add(g, new THREE.BoxGeometry(w, 0.004, d), cover, 0, 0.002, 0);
      add(g, new THREE.BoxGeometry(w, 0.004, d), cover, 0, t - 0.002, 0);
      add(g, new RoundedBoxGeometry(0.008, t, d, 2, 0.003), cover, -w / 2 + 0.004, t / 2, 0);
      add(g, new THREE.BoxGeometry(w - 0.01, t - 0.008, d - 0.008), pageMat, 0.001, t / 2, 0);
      return g;
    };
    // Soft contact shadows (baked ambient occlusion) where things meet the desk.
    const aoCanvas = document.createElement("canvas");
    aoCanvas.width = aoCanvas.height = 64;
    {
      const ac = aoCanvas.getContext("2d")!;
      const gr = ac.createRadialGradient(32, 32, 4, 32, 32, 32);
      gr.addColorStop(0, "rgba(60,45,30,0.55)");
      gr.addColorStop(0.55, "rgba(60,45,30,0.22)");
      gr.addColorStop(1, "rgba(60,45,30,0)");
      ac.fillStyle = gr;
      ac.fillRect(0, 0, 64, 64);
    }
    const aoTex = new THREE.CanvasTexture(aoCanvas);
    const contact = (x: number, z: number, w: number, d: number, opacity = 0.6, ry = 0) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      );
      m.rotation.set(-Math.PI / 2, 0, ry);
      m.position.set(x, TOP + 0.001, z);
      desk.add(m);
    };
    contact(-0.05, -0.12, 0.66, 0.5, 0.7);
    contact(-0.55, -0.2, 0.2, 0.2);
    contact(0.42, -0.27, 0.22, 0.26, 0.6, -0.2);
    contact(0.27, -0.34, 0.1, 0.16, 0.5, -0.3);
    contact(0.56, -0.02, 0.3, 0.38, 0.45);
    contact(-0.68, 0.16, 0.24, 0.24);

    // Coaster under the mug.
    add(desk, new THREE.CylinderGeometry(0.058, 0.058, 0.004, 32), mat("#c8a27a", 0.85), -0.55, TOP + 0.002, -0.2);

    // Desk lamp (brass, articulated), on the corner, lighting the work area. Click to switch it.
    const lamp = new THREE.Group();
    lamp.position.set(-1.22, TOP, 0.2);
    lamp.rotation.y = 0.37;
    desk.add(lamp);
    add(lamp, new THREE.CylinderGeometry(0.075, 0.085, 0.022, 32), slate, 0, 0.011, 0);
    const j0 = new V(0, 0.03, 0);
    const j1 = new V(0.07, 0.37, 0);
    const j2 = new V(0.3, 0.41, 0);
    rod(lamp, j0, j1, 0.009, brass);
    rod(lamp, j1, j2, 0.008, brass);
    for (const j of [j0, j1, j2]) add(lamp, new THREE.SphereGeometry(0.016, 16, 12), brass, j.x, j.y, j.z);
    const shade = new THREE.Group();
    shade.position.copy(j2);
    shade.quaternion.setFromUnitVectors(new V(0, 1, 0), new V(-0.5, 1, 0).normalize());
    lamp.add(shade);
    add(
      shade,
      new THREE.CylinderGeometry(0.022, 0.066, 0.1, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: "#2f3340", roughness: 0.45, side: THREE.DoubleSide }),
      0,
      -0.05,
      0,
    );
    const bulbMat = new THREE.MeshStandardMaterial({ color: "#fff6e0", emissive: "#ffd59a", emissiveIntensity: 1.4 });
    const bulb = add(shade, new THREE.SphereGeometry(0.024, 20, 14), bulbMat, 0, -0.072, 0);
    bulb.castShadow = false;
    const lampLight = new THREE.PointLight("#ffc98a", 0.5, 1.8, 2);
    lampLight.position.set(0, -0.13, 0);
    shade.add(lampLight);
    contact(-1.22, 0.2, 0.22, 0.22, 0.7);
    let lampOn = true;
    let lampW = 1;

    // Miniature car on the return wing. Click it and it rolls forward and back.
    const car = new THREE.Group();
    const carHome = new V(-1.12, TOP, -0.78);
    const carYaw = 0.6;
    car.position.copy(carHome);
    car.rotation.y = carYaw;
    desk.add(car);
    const paint = new THREE.MeshPhysicalMaterial({ color: "#c93a00", roughness: 0.28, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.08 });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#1d2330", roughness: 0.08, metalness: 0.2, clearcoat: 1 });
    const chrome = mat("#d6d9de", 0.2, 0.9);
    add(car, new RoundedBoxGeometry(0.17, 0.036, 0.074, 3, 0.013), paint, 0, 0.033, 0);
    add(car, new RoundedBoxGeometry(0.088, 0.034, 0.064, 3, 0.012), glass, -0.01, 0.063, 0);
    add(car, new RoundedBoxGeometry(0.076, 0.008, 0.062, 2, 0.003), paint, -0.012, 0.081, 0);
    const wheels: THREE.Mesh[] = [];
    for (const sx of [-0.054, 0.054])
      for (const sz of [-0.038, 0.038]) {
        const w = add(car, new THREE.CylinderGeometry(0.019, 0.019, 0.014, 20), mat("#1b1b1f", 0.8), sx, 0.019, sz);
        w.rotation.x = Math.PI / 2;
        add(w, new THREE.CylinderGeometry(0.009, 0.009, 0.0155, 12), chrome);
        wheels.push(w);
      }
    for (const sz of [-0.024, 0.024]) {
      add(car, new THREE.SphereGeometry(0.0075, 10, 8), new THREE.MeshStandardMaterial({ color: "#fff8e6", emissive: "#fff1c9", emissiveIntensity: 0.5 }), 0.084, 0.037, sz).castShadow = false;
      add(car, new THREE.SphereGeometry(0.006, 10, 8), new THREE.MeshStandardMaterial({ color: "#8a1c10", emissive: "#d23a1a", emissiveIntensity: 0.3 }), -0.085, 0.037, sz).castShadow = false;
    }
    contact(-1.12, -0.78, 0.24, 0.14, 0.55, carYaw);
    let carT0 = -9;

    // Books: a row standing between brass bookends at the back of the wing, and a stack beside them.
    {
      const colors = ["#14271f", "#6b2e2a", "#78917c", "#2f3a45", "#e9e4d8", "#4a3a2c"];
      const heights = [0.21, 0.19, 0.23, 0.2, 0.18, 0.215];
      const thick = [0.034, 0.028, 0.04, 0.03, 0.026, 0.036];
      let z = -1.18;
      const bookend = () => {
        add(desk, new THREE.BoxGeometry(0.12, 0.14, 0.006), brass, -1.33, TOP + 0.07, z);
        add(desk, new THREE.BoxGeometry(0.12, 0.004, 0.07), brass, -1.33, TOP + 0.002, z + 0.035);
      };
      bookend();
      z += 0.006;
      colors.forEach((c, i) => {
        const b = book(0.15, thick[i], heights[i], c);
        b.rotation.set(-Math.PI / 2, Math.PI, 0, "YXZ");
        b.position.set(-1.33, TOP + heights[i] / 2, z);
        desk.add(b);
        z += thick[i] + 0.002;
      });
      bookend();
      contact(-1.33, -1.03, 0.22, 0.4, 0.5);

      // A stack of bound ledgers: cloth covers, bronze corners and a "LEDGER" label on top.
      let y = TOP;
      const ledgerLabel = canvasTex(256, 96, (c) => {
        c.fillStyle = "#b18a55";
        c.fillRect(0, 0, 256, 96);
        c.strokeStyle = "#14271f";
        c.lineWidth = 4;
        c.strokeRect(8, 8, 240, 80);
        c.fillStyle = "#14271f";
        c.font = "700 40px Georgia, serif";
        c.textAlign = "center";
        c.fillText("LEDGER", 128, 62);
      });
      (
        [
          [0.24, 0.034, 0.17, "#14271f", 0.12],
          [0.22, 0.03, 0.16, "#6b2e2a", -0.1],
          [0.21, 0.036, 0.155, "#1f3a2e", 0.05],
        ] as const
      ).forEach(([w, t, d, c, ry], i, all) => {
        const b = book(w, t, d, c);
        b.position.set(-1.06, y, -1.1);
        b.rotation.y = ry;
        desk.add(b);
        for (const sx of [1, -1]) {
          const corner = add(b, new THREE.BoxGeometry(0.03, t + 0.002, 0.03), brass, sx > 0 ? w / 2 - 0.014 : -w / 2 + 0.022, t / 2, sx * (d / 2 - 0.014));
          corner.castShadow = false;
        }
        if (i === all.length - 1) {
          const lbl = add(b, new THREE.PlaneGeometry(0.09, 0.034), new THREE.MeshStandardMaterial({ map: ledgerLabel, roughness: 0.5 }), 0.01, t + 0.0012, 0);
          lbl.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
          lbl.castShadow = false;
        }
        y += t;
      });
      contact(-1.06, -1.1, 0.3, 0.24, 0.55);
    }

    // Notebook (amber, elastic band) with a pen on it.
    {
      const nb = book(0.15, 0.014, 0.21, "#ffa800");
      nb.position.set(-1.12, TOP, -0.5);
      nb.rotation.y = 0.25;
      desk.add(nb);
      add(nb, new THREE.BoxGeometry(0.006, 0.016, 0.212), slate, 0.05, 0.007, 0);
      const pen = new THREE.Group();
      pen.position.set(-0.005, 0.016, 0);
      pen.rotation.set(0, 0.4, Math.PI / 2);
      nb.add(pen);
      add(pen, new THREE.CylinderGeometry(0.005, 0.005, 0.14, 12), mat("#1d1c22", 0.35));
      add(pen, new THREE.CylinderGeometry(0.0055, 0.0055, 0.035, 12), brass, 0, 0.045, 0);
      contact(-1.12, -0.5, 0.22, 0.28, 0.45, 0.25);
    }

    // Pen holder with pens and a pencil.
    {
      const ph = new THREE.Group();
      ph.position.set(0.74, TOP, -0.04);
      desk.add(ph);
      add(ph, new THREE.CylinderGeometry(0.036, 0.034, 0.095, 32, 1, true), new THREE.MeshStandardMaterial({ color: "#2f3340", roughness: 0.5, side: THREE.DoubleSide }), 0, 0.0475, 0);
      add(ph, new THREE.CylinderGeometry(0.034, 0.034, 0.006, 32), slate, 0, 0.003, 0);
      const rim = add(ph, new THREE.TorusGeometry(0.0355, 0.0025, 8, 40), brass, 0, 0.095, 0);
      rim.rotation.x = Math.PI / 2;
      const pens: [number, number, number, string][] = [
        [0.012, 0.008, 0.16, C.accent],
        [-0.014, 0.006, 0.15, "#1d1c22"],
        [0.004, -0.015, 0.155, "#2a4d8f"],
        [-0.01, -0.01, 0.17, "#e9b949"],
        [0.016, -0.006, 0.145, "#b08d57"],
      ];
      pens.forEach(([x, z, len, color], i) => {
        const top = new V(x * 3.2, len, z * 3.2);
        const base = new V(x, 0.008, z);
        rod(ph, base, top, 0.0045, mat(color, 0.4, i === 4 ? 0.8 : 0));
        if (color === "#e9b949") {
          // the pencil gets a sharpened tip
          const tip = add(ph, new THREE.ConeGeometry(0.0045, 0.014, 12), mat("#e8cfa6", 0.8), top.x, top.y + 0.007, top.z);
          tip.quaternion.setFromUnitVectors(new V(0, 1, 0), top.clone().sub(base).normalize());
        } else {
          add(ph, new THREE.SphereGeometry(0.005, 10, 8), mat("#1d1c22", 0.4), top.x, top.y, top.z);
        }
      });
      contact(0.74, -0.04, 0.13, 0.13, 0.7);
    }

    // External monitor with a financial dashboard (fictional figures), angled towards the chair.
    {
      const mon = new THREE.Group();
      mon.position.set(0.34, TOP, 0.24);
      mon.rotation.y = Math.PI + 0.35; // local +z = the screen side
      desk.add(mon);
      const dark = new THREE.MeshStandardMaterial({ color: "#1e2124", roughness: 0.4, metalness: 0.5, roughnessMap: detail.smudgeRough(1) });
      add(mon, new RoundedBoxGeometry(0.22, 0.012, 0.14, 2, 0.005), dark, 0, 0.006, -0.02);
      add(mon, new RoundedBoxGeometry(0.045, 0.25, 0.02, 2, 0.006), dark, 0, 0.13, -0.045);
      add(mon, new RoundedBoxGeometry(0.62, 0.37, 0.026, 3, 0.008), dark, 0, 0.37, -0.02);
      const dash = add(
        mon,
        new THREE.PlaneGeometry(0.59, 0.34),
        new THREE.MeshBasicMaterial({
          toneMapped: false,
          map: canvasTex(640, 368, (c) => {
            c.fillStyle = "#14271f";
            c.fillRect(0, 0, 640, 368);
            c.fillStyle = "#e9e4d8";
            c.font = "600 17px system-ui, sans-serif";
            c.fillText("Financial dashboard · sample data", 20, 30);
            const kpis: [string, string][] = [["Revenue", "206,850"], ["Expenses", "135,050"], ["Net profit", "71,800"]];
            kpis.forEach(([k, v], i) => {
              const x = 20 + i * 205;
              c.fillStyle = "#1f3a2e";
              c.fillRect(x, 46, 190, 66);
              c.fillStyle = "#9fb4a2";
              c.font = "12px system-ui, sans-serif";
              c.fillText(k, x + 12, 68);
              c.fillStyle = i === 2 ? "#d6b37f" : "#f4f1e9";
              c.font = "700 22px system-ui, sans-serif";
              c.fillText(v, x + 12, 98);
            });
            const inc = [14.2, 13.8, 15.6, 16.1, 15.2, 17.4, 18.1, 17.6, 18.9, 19.4, 19.25, 21.3];
            const exp = [9.8, 9.6, 10.4, 10.9, 10.3, 11.2, 11.8, 11.5, 12.1, 12.3, 12.05, 13.1];
            const base = 345;
            const sc = 9;
            inc.forEach((v, i) => {
              const x = 30 + i * 50;
              c.fillStyle = "#78917c";
              c.fillRect(x, base - v * sc, 16, v * sc);
              c.fillStyle = "#b18a55";
              c.fillRect(x + 18, base - exp[i] * sc, 16, exp[i] * sc);
            });
            c.strokeStyle = "#f4f1e9";
            c.lineWidth = 3;
            c.beginPath();
            inc.forEach((v, i) => c.lineTo(47 + i * 50, base - (v - exp[i]) * sc * 2.2 - 40));
            c.stroke();
          }),
        }),
        0,
        0.37,
        -0.0065,
      );
      dash.castShadow = false;
      const monGlass = add(
        mon,
        new THREE.PlaneGeometry(0.6, 0.352),
        new THREE.MeshPhysicalMaterial({ color: "#000000", roughness: 0.06, transparent: true, opacity: 0.16, envMapIntensity: 1.3, depthWrite: false }),
        0,
        0.37,
        -0.006,
      );
      monGlass.castShadow = false;
      contact(0.34, 0.22, 0.3, 0.2, 0.55);
    }

    // Receipts beside the laptop.
    {
      const receipt = (seed: number) =>
        canvasTex(96, 220, (c) => {
          c.fillStyle = "#fbf9f4";
          c.fillRect(0, 0, 96, 220);
          c.fillStyle = "#56655a";
          c.font = "700 11px ui-monospace, monospace";
          c.fillText("RECEIPT", 24, 20);
          c.fillStyle = "#9aa39b";
          for (let k = 0; k < 8; k++) c.fillRect(10, 36 + k * 16, 40 + ((k * 37 + seed) % 30), 5);
          for (let k = 0; k < 8; k++) c.fillRect(70, 36 + k * 16, 16, 5);
          c.fillStyle = "#252a26";
          c.fillRect(10, 176, 76, 2);
          c.font = "700 11px ui-monospace, monospace";
          c.fillText("TOTAL", 10, 196);
        });
      [
        [-0.37, 0.25, 0.4, 7],
        [-0.3, 0.29, -0.25, 19],
      ].forEach(([x, z, r, s], i) => {
        const m = add(desk, new THREE.PlaneGeometry(0.07, 0.16), new THREE.MeshStandardMaterial({ map: receipt(s), roughness: 0.9 }), x, TOP + 0.0015 + i * 0.0008, z);
        m.rotation.set(-Math.PI / 2, 0, r);
        m.castShadow = false;
      });
    }

    // Small plants: a succulent on the corner, a cactus by the papers.
    {
      const pot = new THREE.Group();
      pot.position.set(-1.28, TOP, -0.22);
      desk.add(pot);
      add(pot, new THREE.CylinderGeometry(0.048, 0.04, 0.055, 28), mat("#f3efe8", 0.45), 0, 0.0275, 0);
      add(pot, new THREE.CylinderGeometry(0.043, 0.043, 0.004, 28), mat("#5a4433", 0.95), 0, 0.053, 0);
      const succ = mat("#7fae8c", 0.55);
      for (let ring = 0; ring < 2; ring++)
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + ring * 0.4;
          const r = ring ? 0.016 : 0.03;
          const l = add(pot, new THREE.SphereGeometry(0.022, 14, 10), succ, Math.cos(a) * r, 0.065 + ring * 0.012, Math.sin(a) * r);
          l.scale.set(1.2, 0.45, 0.6);
          l.rotation.set(0, -a, ring ? 0.7 : 0.35);
        }
      contact(-1.28, -0.22, 0.15, 0.15, 0.6);

      const cactus = new THREE.Group();
      cactus.position.set(0.77, TOP, 0.28);
      desk.add(cactus);
      add(cactus, new THREE.CylinderGeometry(0.032, 0.026, 0.045, 24), mat(C.pot, 0.7), 0, 0.0225, 0);
      const cMat = mat("#4f8a5b", 0.6);
      add(cactus, new THREE.CapsuleGeometry(0.019, 0.05, 6, 14), cMat, 0, 0.09, 0);
      const arm = add(cactus, new THREE.CapsuleGeometry(0.01, 0.022, 6, 12), cMat, 0.022, 0.095, 0);
      arm.rotation.z = -0.5;
      add(cactus, new THREE.SphereGeometry(0.008, 10, 8), mat("#f28fa0", 0.6), 0, 0.128, 0);
      contact(0.77, 0.28, 0.1, 0.1, 0.6);
    }

    /*
     * ---------- Achievement wall (rear view only) ----------
     * A plaster wall right behind the desk (the visitor's side of the main run), with the
     * owner's framed degrees and certificates (from /api/wall, edited at /wall-editor),
     * a brass picture light, and an oak slat panel with a floating shelf. Its far edges fade
     * into the page so the room never ends in a hard line.
     */
    const WALL_Z = 0.47;
    const wallGroup = new THREE.Group();
    const framesGroup = new THREE.Group();
    type FrameInfo = { id: DeskFocus; group: THREE.Group; art: THREE.Mesh; w: number; h: number; title: string };
    let frames: FrameInfo[] = [];
    let wallDisposed = false;
    if (rear) {
      scene.add(wallGroup);
      wallGroup.add(framesGroup);
      // Plaster: deep forest green, faintly mottled.
      const plaster = canvasTex(256, 256, (c) => {
        c.fillStyle = "#2a4a3b";
        c.fillRect(0, 0, 256, 256);
        for (let k = 0; k < 2600; k++) {
          c.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)";
          c.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }
      });
      plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping;
      plaster.repeat.set(5, 3);
      // Alpha: solid in the middle, fading out at the sides and the top.
      const fadeCanvas = document.createElement("canvas");
      fadeCanvas.width = 256;
      fadeCanvas.height = 128;
      {
        const fc2 = fadeCanvas.getContext("2d")!;
        const img = fc2.createImageData(256, 128);
        const sm = (e0: number, e1: number, x: number) => {
          const u = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
          return u * u * (3 - 2 * u);
        };
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 256; x++) {
            const u = x / 255;
            const vTop = y / 127; // 0 = top of the wall
            const a = sm(0, 0.16, u) * sm(0, 0.16, 1 - u) * sm(0, 0.22, vTop);
            const i = (y * 256 + x) * 4;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(a * 255);
            img.data[i + 3] = 255;
          }
        fc2.putImageData(img, 0, 0);
      }
      const fadeTex = new THREE.CanvasTexture(fadeCanvas);
      const wallMesh = add(
        wallGroup,
        new THREE.PlaneGeometry(6.6, 3.4),
        new THREE.MeshStandardMaterial({ map: plaster, alphaMap: fadeTex, transparent: true, roughness: 0.93, normalScale: new THREE.Vector2(0.8, 0.8) }),
        -0.3,
        1.7,
        WALL_Z,
      );
      wallMesh.rotation.y = Math.PI; // faces the camera / the panda
      wallMesh.castShadow = false;
      wallMesh.receiveShadow = true;
      plasterMats.push(wallMesh.material as THREE.MeshStandardMaterial);
      // Skirting board.
      add(wallGroup, new RoundedBoxGeometry(4.6, 0.09, 0.018, 2, 0.005), mat("#e9e4d8", 0.6), -0.3, 0.045, WALL_Z - 0.009).castShadow = false;

      // Oak slat panel with a floating shelf (to the left of the desk, from this side).
      const oak = new THREE.MeshPhysicalMaterial({ color: "#f2c690", roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5 });
      deskWood.push(oak);
      add(wallGroup, new THREE.BoxGeometry(0.78, 2.24, 0.01), mat("#3b3430", 0.9), 1.24, 1.22, WALL_Z - 0.005).castShadow = false;
      for (let k = 0; k < 12; k++) add(wallGroup, new RoundedBoxGeometry(0.04, 2.2, 0.022, 2, 0.006), oak, 0.9 + k * 0.062, 1.22, WALL_Z - 0.021);
      add(wallGroup, new RoundedBoxGeometry(0.66, 0.032, 0.2, 2, 0.008), oak, 1.24, 1.5, WALL_Z - 0.13);
      // LED strip under the shelf.
      add(wallGroup, new THREE.BoxGeometry(0.6, 0.006, 0.012), new THREE.MeshBasicMaterial({ color: "#ffe2b8" }), 1.24, 1.481, WALL_Z - 0.2).castShadow = false;
      const shelfLight = new THREE.PointLight("#ffcf96", 0.35, 1.3, 2);
      shelfLight.position.set(1.24, 1.42, WALL_Z - 0.16);
      wallGroup.add(shelfLight);
      // Shelf things: a brass trophy, two books and a little vase.
      {
        const sy = 1.516;
        const cupProfile = [
          [0.0, 0.0], [0.04, 0.0], [0.04, 0.01], [0.012, 0.018], [0.01, 0.06], [0.03, 0.08], [0.045, 0.13], [0.042, 0.135], [0.0, 0.1],
        ].map(([x, y]) => new THREE.Vector2(x, y));
        add(wallGroup, new THREE.LatheGeometry(cupProfile, 32), brass, 1.04, sy, WALL_Z - 0.13);
        add(wallGroup, new THREE.BoxGeometry(0.07, 0.03, 0.05), slate, 1.04, sy + 0.015, WALL_Z - 0.13);
        const b1 = book(0.14, 0.03, 0.19, "#2f3340");
        b1.rotation.set(-Math.PI / 2, Math.PI, 0, "YXZ");
        b1.position.set(1.28, sy + 0.095, WALL_Z - 0.2);
        wallGroup.add(b1);
        const b2 = book(0.14, 0.026, 0.17, "#d9774b");
        b2.rotation.set(-Math.PI / 2, Math.PI, 0.12, "YXZ");
        b2.position.set(1.32, sy + 0.085, WALL_Z - 0.2);
        wallGroup.add(b2);
        add(wallGroup, new THREE.CylinderGeometry(0.03, 0.022, 0.09, 24), mat("#f3efe8", 0.4), 1.48, sy + 0.045, WALL_Z - 0.13);
        for (let k = 0; k < 3; k++) {
          const stem = rod(wallGroup, new V(1.48, sy + 0.08, WALL_Z - 0.13), new V(1.48 + (k - 1) * 0.04, sy + 0.2 + k * 0.02, WALL_Z - 0.13 - (k - 1) * 0.02), 0.003, mat("#6b8f5a", 0.6));
          stem.castShadow = false;
          add(wallGroup, new THREE.SphereGeometry(0.018, 10, 8), mat("#e9c46a", 0.7), 1.48 + (k - 1) * 0.04, sy + 0.2 + k * 0.02, WALL_Z - 0.13 - (k - 1) * 0.02);
        }
      }

      // Brass picture light over the big centre frame.
      {
        const c0 = WALL_LAYOUT[0];
        const ly = c0.y + c0.h / 2 + 0.1;
        rod(wallGroup, new V(c0.x, ly, WALL_Z - 0.01), new V(c0.x, ly + 0.01, WALL_Z - 0.11), 0.006, brass);
        const bar = add(wallGroup, new THREE.CylinderGeometry(0.018, 0.018, 0.4, 20), brass, c0.x, ly + 0.01, WALL_Z - 0.12);
        bar.rotation.z = Math.PI / 2;
        add(wallGroup, new THREE.BoxGeometry(0.36, 0.004, 0.012), new THREE.MeshBasicMaterial({ color: "#fff0d6" }), c0.x, ly - 0.008, WALL_Z - 0.12).castShadow = false;
        const spot = new THREE.SpotLight("#ffd29a", 0.8, 1.6, 0.85, 0.9, 2);
        spot.position.set(c0.x, ly - 0.01, WALL_Z - 0.14);
        spot.target.position.set(c0.x, c0.y - 0.1, WALL_Z);
        wallGroup.add(spot, spot.target);
      }
    }

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const texLoader = new THREE.TextureLoader();
    /** Decorative print for a frame with no certificate yet (ledger and brass motifs, no fake documents). */
    const printTex = (slot: number, aspect: number) => {
      const W = 512;
      const H = Math.round(W / aspect);
      return canvasTex(W, H, (c) => {
        c.fillStyle = "#fbf8f1";
        c.fillRect(0, 0, W, H);
        c.lineWidth = 2;
        if (slot % 3 === 0) {
          // ledger paper with a rising line
          c.strokeStyle = "rgba(122,107,95,0.18)";
          for (let x = 0; x < W; x += 24) (c.beginPath(), c.moveTo(x, 0), c.lineTo(x, H), c.stroke());
          for (let y = 0; y < H; y += 24) (c.beginPath(), c.moveTo(0, y), c.lineTo(W, y), c.stroke());
          c.strokeStyle = C.accent;
          c.lineWidth = 6;
          c.beginPath();
          [0.85, 0.7, 0.74, 0.52, 0.56, 0.34, 0.22].forEach((v, k, a) => c.lineTo(40 + (k / (a.length - 1)) * (W - 80), v * H));
          c.stroke();
        } else if (slot % 3 === 1) {
          // brass orbits
          c.strokeStyle = "#b08d57";
          for (let r = 1; r <= 4; r++) {
            c.lineWidth = 3;
            c.beginPath();
            c.ellipse(W / 2, H / 2, r * W * 0.1, r * H * 0.08, -0.4, 0, Math.PI * 2);
            c.stroke();
          }
          c.fillStyle = C.accent;
          c.beginPath();
          c.arc(W / 2, H / 2, W * 0.035, 0, Math.PI * 2);
          c.fill();
        } else {
          // bamboo, for the panda
          c.fillStyle = "#e9efe4";
          c.fillRect(0, H * 0.72, W, H);
          c.fillStyle = "#4f9d69";
          for (const [x, w] of [[0.22, 0.04], [0.36, 0.03], [0.7, 0.045]] as const) {
            c.fillRect(x * W, H * 0.08, w * W, H);
            for (let y = H * 0.2; y < H; y += H * 0.16) c.fillRect(x * W - 3, y, w * W + 6, 5);
          }
        }
      });
    };
    const PRINT_ASPECT = WALL_LAYOUT.map((s) => s.w / s.h);
    const disposeTree = (root: THREE.Object3D) =>
      root.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        const ms = (Array.isArray(o.material) ? o.material : [o.material]) as (THREE.Material & { map?: THREE.Texture | null })[];
        ms.forEach((m) => {
          m.userData.gone = true; // a texture still loading for this frame will be dropped
          if (m.map && m.map !== aoTex) m.map.dispose();
          m.dispose();
        });
      });

    /** (Re)hang the frames: a certificate where one is assigned, an art print otherwise. */
    const hangFrames = (m: WallManifest | null) => {
      if (!rear || wallDisposed) return;
      for (const ch of framesGroup.children.slice()) {
        framesGroup.remove(ch);
        disposeTree(ch);
      }
      frames = [];
      const walnut = mat("#5a3d2b", 0.48);
      const gilt = new THREE.MeshStandardMaterial({ color: "#b08d57", roughness: 0.3, metalness: 0.85 });
      WALL_LAYOUT.forEach((slot, i) => {
        const itemId = m?.slots[i];
        const item = itemId ? m?.items.find((x) => x.id === itemId) : undefined;
        const aspect = item ? item.width / item.height : PRINT_ASPECT[i];
        const bar = 0.024;
        const matW = Math.min(slot.w, slot.h) * (item ? 0.07 : 0.1);
        const maxW = slot.w - 2 * (bar + matW);
        const maxH = slot.h - 2 * (bar + matW);
        let w = maxW;
        let h = w / aspect;
        if (h > maxH) {
          h = maxH;
          w = h * aspect;
        }
        const W = w + 2 * (bar + matW);
        const H = h + 2 * (bar + matW);
        const g = new THREE.Group();
        g.position.set(slot.x, slot.y, WALL_Z - 0.001);
        g.rotation.y = Math.PI; // local +z faces into the room
        framesGroup.add(g);
        // Soft shadow on the wall (ambient occlusion around the frame).
        const ao = new THREE.Mesh(
          new THREE.PlaneGeometry(W * 1.22, H * 1.28),
          new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, opacity: 0.5, depthWrite: false }),
        );
        ao.position.set(-0.012, -0.028, 0.0015);
        g.add(ao);
        add(g, new THREE.BoxGeometry(W - 0.01, H - 0.01, 0.014), mat("#2b2520", 0.8), 0, 0, 0.008);
        add(g, new THREE.PlaneGeometry(w + 2 * matW, h + 2 * matW), mat("#fbf8f1", 0.85), 0, 0, 0.0155).castShadow = false;
        add(g, new THREE.PlaneGeometry(w + 0.006, h + 0.006), mat("#dcd3c3", 0.85), 0, 0, 0.0158).castShadow = false;
        // Unlit, so a certificate reads the same under the picture light as in the scan (no washed-out text).
        const artMat = new THREE.MeshBasicMaterial({ map: item ? null : printTex(i, aspect), color: item ? "#e9e3d8" : "#ece6dc", toneMapped: false });
        const art = add(g, new THREE.PlaneGeometry(w, h), artMat, 0, 0, 0.016);
        art.castShadow = false;
        const fm = i === 0 ? gilt : walnut;
        // Moulding: each frame gets its own material copy so hover can light one frame up.
        const fmi = fm.clone();
        for (const [bw, bh, bx, by] of [
          [W, bar, 0, H / 2 - bar / 2],
          [W, bar, 0, -H / 2 + bar / 2],
          [bar, H - 2 * bar + 0.002, W / 2 - bar / 2, 0],
          [bar, H - 2 * bar + 0.002, -W / 2 + bar / 2, 0],
        ])
          add(g, new RoundedBoxGeometry(bw, bh, 0.032, 2, 0.007), fmi, bx, by, 0.016).userData.bar = true;
        // Glass: a faint reflective sheet over the mat and certificate.
        add(
          g,
          new THREE.PlaneGeometry(w + 2 * matW, h + 2 * matW),
          new THREE.MeshPhysicalMaterial({ color: "#ffffff", transparent: true, opacity: 0.06, roughness: 0.05, metalness: 0, clearcoat: 1, envMapIntensity: 0.6, depthWrite: false }),
          0,
          0,
          0.027,
        ).castShadow = false;
        if (item) {
          texLoader.load(
            item.url,
            (tex) => {
              if (wallDisposed || artMat.userData.gone) return tex.dispose();
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.anisotropy = maxAniso;
              artMat.map = tex;
              artMat.color.set("#ece6dc"); // paper under warm room light, not screen-white
              artMat.needsUpdate = true;
              if (reduce) renderOnce();
            },
            undefined,
            () => {
              /* unreachable image: the frame keeps its plain mat */
            },
          );
          const id = `frame${i}` as DeskFocus;
          if (interactive) tag(g, id);
          frames.push({ id, group: g, art, w, h, title: item.title || "Certificate" });
        }
      });
      refreshSolids();
      setWallFrames(frames.map((f) => ({ id: f.id, title: f.title })));
      if (reduce) renderOnce();
    };

    /*
     * Chair + panda sit in one "seat" group, so the scroll turn swivels them as a single unit
     * around the chair's gas lift.
     */
    const SEAT_Z = -0.68;
    const seat = new THREE.Group();
    seat.position.set(0, 0, SEAT_Z);
    scene.add(seat);

    // Chair
    const chair = new THREE.Group();
    seat.add(chair);
    // Woven upholstery (photographed weave as a normal map, fabric sheen) and polished aluminium.
    const chairMat = new THREE.MeshPhysicalMaterial({
      color: "#26302b",
      roughness: 0.92,
      sheen: 0.6,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#6f8577"),
      normalScale: new THREE.Vector2(0.7, 0.7),
    });
    fabricMats.push(chairMat);
    const metal = new THREE.MeshStandardMaterial({ color: "#c8ccd0", roughness: 0.22, metalness: 1, roughnessMap: detail.brushed(1) });
    add(chair, new RoundedBoxGeometry(0.52, 0.08, 0.5, 4, 0.035), chairMat, 0, 0.46, 0);
    const back = add(chair, new RoundedBoxGeometry(0.5, 0.58, 0.08, 4, 0.035), chairMat, 0, 0.82, -0.25);
    back.rotation.x = -0.1;
    add(chair, new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), metal, 0, 0.27, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = add(chair, new RoundedBoxGeometry(0.3, 0.03, 0.04, 2, 0.012), metal, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15);
      leg.rotation.y = -a;
      // Twin-wheel castors.
      const castor = add(chair, new THREE.CylinderGeometry(0.026, 0.026, 0.03, 20), new THREE.MeshStandardMaterial({ color: "#151618", roughness: 0.45 }), Math.cos(a) * 0.29, 0.026, Math.sin(a) * 0.29);
      castor.rotation.set(Math.PI / 2, 0, -a);
    }

    // Panda (faces +z, sits on the chair)
    const panda = new THREE.Group();
    panda.position.set(0, 0, 0.02);
    seat.add(panda);

    // Soft fur: a tiny noise texture used as a bump map + velvet-like sheen.
    const noiseCanvas = document.createElement("canvas");
    noiseCanvas.width = noiseCanvas.height = 128;
    const nc = noiseCanvas.getContext("2d")!;
    const nImg = nc.createImageData(128, 128);
    for (let i = 0; i < nImg.data.length; i += 4) {
      const v = 112 + Math.random() * 32;
      nImg.data[i] = nImg.data[i + 1] = nImg.data[i + 2] = v;
      nImg.data[i + 3] = 255;
    }
    nc.putImageData(nImg, 0, 0);
    const furNoise = new THREE.CanvasTexture(noiseCanvas);
    furNoise.wrapS = furNoise.wrapT = THREE.RepeatWrapping;
    furNoise.repeat.set(5, 5);

    const furMat = (color: string, sheenColor: string, map?: THREE.Texture, sheen = 1) =>
      new THREE.MeshPhysicalMaterial({
        color: map ? "#ffffff" : color,
        ...(map ? { map, sheenColorMap: map } : {}),
        roughness: 1,
        sheen,
        sheenRoughness: 0.75,
        sheenColor: new THREE.Color(sheenColor),
        bumpMap: furNoise,
        bumpScale: 0.35,
      });
    const fur = furMat(C.fur, "#ffffff");
    const black = furMat(C.black, "#3b3942", undefined, 0.8);

    // Face painted on the head (equirectangular canvas → sphere UVs):
    // tilted teardrop eye patches + soft blush. Front of the sphere is u = 0.25.
    const faceCanvas = document.createElement("canvas");
    faceCanvas.width = 1024;
    faceCanvas.height = 512;
    const fc = faceCanvas.getContext("2d")!;
    fc.fillStyle = C.fur;
    fc.fillRect(0, 0, 1024, 512);
    const PX = 1024 / (Math.PI * 2); // pixels per radian (same both axes)
    const fx = (az: number) => 256 + az * PX; // az: radians, + = panda's left (viewer's right)
    const fy = (lat: number) => 256 - lat * PX; // lat: radians, + = up
    // Real giant-panda markings: tilted teardrop eye patches whose edges break up into hairs,
    // and a faint warm cast on the muzzle (no cartoon blush).
    for (const sx of [-1, 1]) {
      fc.save();
      fc.translate(fx(sx * 0.4), fy(-0.02));
      fc.rotate(-sx * 0.5);
      fc.fillStyle = C.black;
      if ("filter" in fc) fc.filter = "blur(2px)";
      fc.beginPath();
      fc.ellipse(0, 0, 0.21 * PX, 0.31 * PX, 0, 0, Math.PI * 2);
      fc.fill();
      if ("filter" in fc) fc.filter = "none";
      // hairy edge: short strokes radiating out of the patch
      fc.strokeStyle = C.black;
      fc.lineWidth = 1.4;
      for (let k = 0; k < 420; k++) {
        const a = Math.random() * Math.PI * 2;
        const ex = Math.cos(a) * 0.205 * PX;
        const ey = Math.sin(a) * 0.305 * PX;
        const len = (0.02 + Math.random() * 0.05) * PX;
        fc.globalAlpha = 0.25 + Math.random() * 0.5;
        fc.beginPath();
        fc.moveTo(ex * 0.92, ey * 0.92);
        fc.lineTo(ex + Math.cos(a + (Math.random() - 0.5) * 0.6) * len, ey + Math.sin(a + (Math.random() - 0.5) * 0.6) * len);
        fc.stroke();
      }
      fc.globalAlpha = 1;
      fc.restore();
    }
    // Coat variation: real fur is never one flat colour.
    for (let k = 0; k < 2600; k++) {
      fc.fillStyle = Math.random() < 0.5 ? "rgba(255,250,240,0.05)" : "rgba(120,100,80,0.05)";
      fc.fillRect(Math.random() * 1024, Math.random() * 512, 2 + Math.random() * 8, 1 + Math.random() * 3);
    }
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 4;
    const faceMat = furMat(C.fur, "#ffffff", faceTex);

    // legs: black fur, rounded paws with pink pads
    // Real panda pads: dark, leathery skin (not cartoon pink).
    const padMat = new THREE.MeshPhysicalMaterial({ color: "#3b302d", roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.5 });
    for (const sx of [-0.11, 0.11]) {
      const thigh = add(panda, new THREE.CapsuleGeometry(0.095, 0.24, 8, 20), black, sx, 0.56, 0.12);
      thigh.rotation.x = Math.PI / 2;
      const shin = add(panda, new THREE.CapsuleGeometry(0.082, 0.32, 8, 20), black, sx, 0.33, 0.3);
      shin.rotation.x = 0.08;
      add(panda, new THREE.SphereGeometry(0.095, 24, 18), black, sx, 0.075, 0.37).scale.set(1, 0.78, 1.3);
    }
    // hips: white, rounded
    add(panda, new THREE.SphereGeometry(0.24, 32, 24), fur, 0, 0.6, -0.04).scale.set(1.05, 0.62, 0.95);

    // torso (pivot at the hips): smooth pear-shaped belly
    const torso = new THREE.Group();
    torso.position.set(0, 0.6, -0.04);
    panda.add(torso);
    const bodyProfile = new THREE.SplineCurve(
      [
        [0.001, -0.02],
        [0.2, 0.0],
        [0.255, 0.1],
        [0.26, 0.2],
        [0.235, 0.31],
        [0.18, 0.41],
        [0.11, 0.48],
        [0.001, 0.51],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    ).getPoints(40);
    add(torso, new THREE.LatheGeometry(bodyProfile, 48), fur, 0, 0, 0).scale.set(1, 1, 0.9);
    // black shoulder band (real pandas have one) – sits behind the white chest
    const band = add(torso, new THREE.CapsuleGeometry(0.115, 0.3, 10, 24), black, 0, 0.385, -0.045);
    band.rotation.z = Math.PI / 2;
    band.scale.set(1, 1, 0.9);
    // orange scarf
    const scarfMat = furMat(C.scarf, "#3d6553", undefined, 0.5);
    fabricMats.push(scarfMat);
    const scarf = add(torso, new THREE.TorusGeometry(0.13, 0.045, 16, 40), scarfMat, 0, 0.47, 0);
    scarf.rotation.x = Math.PI / 2;
    const scarfTail = add(torso, new RoundedBoxGeometry(0.075, 0.17, 0.03, 3, 0.014), scarfMat, 0.08, 0.37, 0.19);
    scarfTail.rotation.z = 0.25;
    scarfTail.rotation.x = -0.25;

    // head
    const neck = new THREE.Group();
    neck.position.set(0, 0.5, 0.01);
    torso.add(neck);
    const head = new THREE.Group();
    head.position.set(0, 0.05, 0);
    neck.add(head);
    const HR = 0.235;
    const HC = 0.19; // head centre (y) inside the head group
    const skull = add(head, new THREE.SphereGeometry(HR, 64, 48), faceMat, 0, HC, 0);
    skull.scale.set(1.1, 0.97, 1);
    // ears: black, slightly flattened, angled outwards
    for (const sx of [-1, 1]) {
      const ear = add(head, new THREE.SphereGeometry(0.078, 28, 20), black, sx * 0.175, HC + 0.19, -0.04);
      ear.scale.set(1, 0.95, 0.6);
      ear.rotation.z = -sx * 0.35;
    }
    // eyes sit inside the painted patches: white + pupil + highlight (pupils follow the mouse)
    // A panda's eyes are small and dark (deep brown iris, black pupil) with a wet cornea.
    const eyeWhite = new THREE.MeshPhysicalMaterial({ color: "#2a1a10", roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.02 });
    const pupilMat = new THREE.MeshPhysicalMaterial({ color: "#050404", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.02 });
    type Eye = { group: THREE.Group; pupil: THREE.Mesh };
    const eyes: Eye[] = [-1, 1].map((sx) => {
      const group = new THREE.Group();
      const az = 0.38;
      group.position.set(sx * Math.sin(az) * HR * 1.1, HC + 0.012, Math.cos(az) * HR - 0.008);
      group.rotation.y = sx * az * 0.8;
      head.add(group);
      const w = add(group, new THREE.SphereGeometry(0.02, 24, 18), eyeWhite, 0, 0, 0);
      w.scale.set(1, 0.9, 0.75);
      w.castShadow = false;
      const pupil = add(group, new THREE.SphereGeometry(0.0115, 20, 14), pupilMat, 0, 0, 0.008);
      pupil.castShadow = false;
      // catch-light: a small, soft reflection of the window, not a cartoon dot
      const hl = add(pupil, new THREE.SphereGeometry(0.0022, 10, 8), new THREE.MeshBasicMaterial({ color: "#f4efe6", transparent: true, opacity: 0.85 }), 0.004, 0.005, 0.0105);
      hl.castShadow = false;
      return { group, pupil };
    });
    // muzzle, nose, mouth
    add(head, new THREE.SphereGeometry(0.088, 36, 24), fur, 0, HC - 0.07, 0.165).scale.set(1.3, 0.82, 0.85);
    const nose = add(
      head,
      new THREE.SphereGeometry(0.026, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: "#141214", roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.25, normalMap: detail.grainNormal(2), normalScale: new THREE.Vector2(0.8, 0.8) }),
      0,
      HC - 0.045,
      0.238,
    );
    nose.scale.set(1.45, 0.9, 0.9);
    const smile = add(head, new THREE.TorusGeometry(0.022, 0.0035, 10, 24, Math.PI), mat("#2a2024", 0.7), 0, HC - 0.083, 0.232);
    smile.rotation.z = Math.PI;
    smile.castShadow = false;

    // arms: black, shoulder → upper arm → elbow → forearm → paw
    type Arm = { shoulder: THREE.Group; elbow: THREE.Group };
    const makeArm = (side: 1 | -1): Arm => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.4, 0);
      torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.095, 24, 18), black, 0, 0, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.078, 0.15, 8, 20), black, 0, -0.12, 0);
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.24, 0);
      shoulder.add(elbow);
      add(elbow, new THREE.CapsuleGeometry(0.07, 0.15, 8, 20), black, 0, -0.11, 0);
      add(elbow, new THREE.SphereGeometry(0.074, 24, 18), black, 0, -0.235, 0).scale.set(1, 0.85, 1.1);
      const pad = add(elbow, new THREE.SphereGeometry(0.03, 16, 12), padMat, 0, -0.29, 0.02);
      pad.scale.set(1, 0.6, 1);
      pad.castShadow = false;
      return { shoulder, elbow };
    };
    const armL = makeArm(1); // panda's left (+x, nearer the camera)
    const armR = makeArm(-1);

    // Proportions: a real panda's head is big, but not cartoon big.
    head.scale.setScalar(0.88);

    /*
     * Fur. Every furred part (white coat, black limbs / ears / shoulder band, the face) grows
     * shells of hair; the knitted scarf gets a short fuzz. Shorter on the face and paws.
     */
    {
      const strands = detail.strands();
      const clump = detail.smudgeRough(1);
      const shellCount = small ? 12 : 20;
      panda.updateMatrixWorld(true);
      panda.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || m instanceof THREE.InstancedMesh) return;
        const mt = m.material as THREE.Material;
        let len = 0;
        let spacing = 0.0032;
        if (mt === fur || mt === black) len = 0.026;
        else if (mt === faceMat) len = 0.014;
        if (!len) return;
        furShells.push(addFur(m, { length: len, shells: shellCount, spacing, strands, clump, droop: 0.45 }));
      });
    }

    // Interaction state
    const pointer = new THREE.Vector2(0, 0);
    const pointerSmooth = new THREE.Vector2(0, 0);
    let hovered = false;
    let attention = 0; // smoothed 0..1
    let reaction: { type: PandaReaction; t0: number } | null = null;
    let mood: PandaMood = getPandaMood();
    const clock = new THREE.Clock();

    /*
     * Scroll turn (rear view only), driven by GSAP ScrollTrigger with `scrub` (set up below).
     * `scrollT.p` runs 0 → 1 across the section's scroll track, strictly with the scroll position:
     * a little scroll = a little turn, stop and it stays put, scroll back and it turns back.
     * `turn` is the part of that track where the chair rotates (short holds at both ends).
     * 0 = working with its back to the visitor, 1 = facing the visitor.
     */
    const scrollT = { p: 0 };
    // No scroll track: the chair is simply held at the given angle.
    if (fixedTurn !== undefined) scrollT.p = 0.08 + 0.84 * Math.min(1, Math.max(0, fixedTurn));
    let introT0 = 0; // camera move-in starts when the scene is (re)activated
    let turn = 0;
    let lastP = -1;
    let facing = false;
    const turnOf = (p: number) => THREE.MathUtils.clamp((p - 0.08) / 0.84, 0, 1);

    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      // Clamped so a cursor far from the scene can't swing the camera to odd angles.
      pointer.set(
        THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.6, 1.6),
        THREE.MathUtils.clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1.6, 1.6),
      );
    };
    const react = (type: PandaReaction) => (reaction = { type, t0: clock.getElapsedTime() });

    // Interactive desk: raycast picking, hover, focus camera
    type Pose = { pos: THREE.Vector3; target: THREE.Vector3; up: THREE.Vector3 };
    const V3 = THREE.Vector3;
    const camHome = camBase.clone();
    const camTarget = lookAt.clone();
    let focusId: DeskFocus | null = null;
    let camFrom: Pose | null = null;
    let camTo: (() => Pose) | null = null;
    let camT0 = 0;
    let camProgress = 0;
    const CAM_DUR = 0.95;
    let laptopSpin = 0;
    let focusW = 0;
    let lapW = 900;
    let lapH = 567;

    // Tag every mesh with the object it belongs to (children inherit, later tags win).
    const tag = (root: THREE.Object3D, id: string) =>
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.userData.hit = id;
      });
    tag(panda, "panda");
    if (rear) tag(chair, "chair");
    if (interactive) {
      tag(lamp, "lamp");
      tag(car, "car");
      tag(laptop, "laptop");
      tag(calc, "calc");
      keys.forEach((k) => tag(k.mesh, `key:${k.key}`));
      tag(papers, "paper");
      drawers.forEach((d) => {
        tag(d.group, d.id);
        d.items.forEach((it) => tag(it, `item:${it.name}`));
      });
    }
    // Everything solid can block a click, so you can't open something hidden behind another object.
    const solids: THREE.Object3D[] = [];
    const refreshSolids = () => {
      solids.length = 0;
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh || o === floor || o === glow) return;
        if ((m.material as THREE.Material).transparent && !o.userData.hit) return;
        solids.push(o);
      });
    };
    refreshSolids();
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pick = (clientX: number, clientY: number) => {
      const r = mount.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(solids, false).find((h) => h.object.visible);
      return (hit?.object.userData.hit as string | undefined) ?? null;
    };

    const itemsOf = (f: DeskFocus | null) => drawers.find((d) => d.id === f)?.items ?? [];
    /** What a hit means right now (null = nothing to do here). */
    const targetOf = (id: string | null): string | null => {
      if (!id) return null;
      if (!focusId) {
        if (id === "panda") return "panda";
        if (id === "chair") return "panda"; // in the rear view the chair back covers most of the panda
        if (id === "lamp" || id === "car") return interactive ? id : null;
        if (id === "calc" || id.startsWith("key:")) return interactive ? "calc" : null;
        if (id === "laptop" || id === "paper" || id.startsWith("drawer") || id.startsWith("frame")) return id;
        return null;
      }
      if (focusId === "calc") return id.startsWith("key:") ? id : null;
      if (focusId.startsWith("drawer")) {
        if (id === focusId) return id;
        if (id.startsWith("item:") && itemsOf(focusId).some((it) => it.name === id.slice(5))) return id;
      }
      return null;
    };
    const meshesOf = (target: string): THREE.Mesh[] => {
      let root: THREE.Object3D | undefined;
      if (target === "calc") root = calc;
      else if (target === "lamp") root = lamp;
      else if (target === "car") root = car;
      else if (target === "laptop") root = laptop;
      else if (target === "paper") root = papers;
      else if (target.startsWith("key:")) root = keys.find((k) => `key:${k.key}` === target)?.mesh;
      else if (target.startsWith("drawer")) root = drawers.find((d) => d.id === target)?.group;
      else if (target.startsWith("item:")) root = drawers.flatMap((d) => d.items).find((i) => i.name === target.slice(5));
      else if (target.startsWith("frame")) root = frames.find((f) => f.id === target)?.group;
      const out: THREE.Mesh[] = [];
      root?.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        if (target.startsWith("drawer") && String(o.userData.hit).startsWith("item:")) return;
        if (target.startsWith("frame") && !o.userData.bar) return; // light up the moulding, not the certificate
        out.push(o as THREE.Mesh);
      });
      return out;
    };
    const HILITE = new THREE.Color("#ff7a3d");
    const setHighlight = (meshes: THREE.Mesh[], on: boolean) =>
      meshes.forEach((m) => {
        const mt = m.material as THREE.MeshStandardMaterial;
        if (!mt.isMeshStandardMaterial) return;
        if (on) {
          if (!mt.userData.em0) {
            mt.userData.em0 = mt.emissive.clone();
            mt.userData.ei0 = mt.emissiveIntensity;
          }
          mt.emissive.copy(HILITE);
          mt.emissiveIntensity = 0.2;
        } else if (mt.userData.em0) {
          mt.emissive.copy(mt.userData.em0);
          mt.emissiveIntensity = mt.userData.ei0;
        }
      });
    const labelOf = (target: string) => {
      if (target === "panda" || target.startsWith("key:")) return null;
      if (target.startsWith("item:")) return HOVER_LABEL[target.slice(5)] ?? null;
      if (target.startsWith("frame")) return HOVER_LABEL.frame;
      if (target.startsWith("drawer")) return HOVER_LABEL[focusId === target ? "drawerOpen" : "drawer"];
      return HOVER_LABEL[target] ?? null;
    };
    let hoverId: string | null = null;
    let hoverMeshes: THREE.Mesh[] = [];
    const setHover = (target: string | null) => {
      if (target === hoverId) return;
      setHighlight(hoverMeshes, false);
      hoverId = target;
      hoverMeshes = target && target !== "panda" ? meshesOf(target) : [];
      setHighlight(hoverMeshes, true);
      mount.style.cursor = target ? "pointer" : "";
      setHoverLabel(target ? labelOf(target) : null);
    };

    /* Camera poses */
    const freePose = (): Pose => {
      if (!rear)
        return {
          pos: camHome.clone().add(new V3(pointerSmooth.x * 0.2, -pointerSmooth.y * 0.12, 0)),
          target: lookAt.clone(),
          up: new V3(0, 1, 0),
        };
      // Rear view: starts close over the panda's shoulder and eases back as it turns round.
      const off = camHome.clone().sub(lookAt);
      const right = new V3(0, 1, 0).cross(off).normalize(); // camera's screen-right
      off.multiplyScalar(lerp(0.84, 1, smooth(clamp(turn, 0, 1))));
      // Arrival: the camera glides in towards the desk (≈2.4 s, eased).
      const ia = reduce ? 1 : clamp((clock.getElapsedTime() - introT0) / 2.4, 0, 1);
      off.multiplyScalar(lerp(1.32, 1, 1 - Math.pow(1 - ia, 3)));
      return {
        pos: lookAt.clone().add(off).addScaledVector(right, pointerSmooth.x * 0.2).add(new V3(0, -pointerSmooth.y * 0.12, 0)),
        target: lookAt.clone(),
        up: new V3(0, 1, 0),
      };
    };
    const fitDist = (w: number, h: number, fill: number) => {
      const tn = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(h / (fill * 2 * tn), w / (fill * 2 * tn * camera.aspect));
    };
    const planePose = (mesh: THREE.Object3D, w: number, h: number, fill: number): Pose => {
      mesh.updateWorldMatrix(true, false);
      const q = mesh.getWorldQuaternion(new THREE.Quaternion());
      const c = mesh.getWorldPosition(new V3());
      const n = new V3(0, 0, 1).applyQuaternion(q);
      return { pos: c.clone().addScaledVector(n, fitDist(w, h, fill)), target: c, up: new V3(0, 1, 0).applyQuaternion(q) };
    };
    const focusPose = (f: DeskFocus): Pose => {
      if (f === "laptop") {
        // Where the screen ends up once the laptop has turned round.
        const ry = laptop.rotation.y;
        laptop.rotation.y = LAPTOP_TURN;
        const p = planePose(screen, SCREEN_W, SCREEN_H, 0.84);
        laptop.rotation.y = ry;
        laptop.updateWorldMatrix(false, true);
        return p;
      }
      if (f.startsWith("frame")) {
        // Fly up to the certificate, square on, so it can be read.
        const fr = frames.find((x) => x.id === f);
        if (fr) return planePose(fr.art, fr.w + 0.08, fr.h + 0.08, 0.74);
      }
      if (f === "paper") return planePose(invoice, 0.22, 0.29, 0.8);
      if (f === "calc") {
        const c = calc.localToWorld(new V3(0, 0.02, -0.004));
        const up = new V3(0, 0, 1).applyQuaternion(calc.getWorldQuaternion(new THREE.Quaternion()));
        return { pos: c.clone().add(new V3(0, fitDist(0.13, 0.17, 0.7), 0)), target: c, up };
      }
      const i = Number(f.slice(6));
      const c = new V3(0.6, DRAWER_Y[i] - 0.04, 0.5 * DZ);
      const dir = new V3(0, 0.92, 0.4 * DZ).normalize(); // steep enough to see over the drawer front
      return { pos: c.clone().addScaledVector(dir, fitDist(0.44, 0.34, 0.8)), target: c, up: new V3(0, 1, 0) };
    };
    const startCam = (to: () => Pose) => {
      camFrom = { pos: camera.position.clone(), target: camTarget.clone(), up: camera.up.clone() };
      camTo = to;
      camT0 = clock.getElapsedTime();
    };

    /* Focus in / out */
    const enterFocus = (f: DeskFocus) => {
      if (!interactive || focusId === f) return;
      drawers.forEach((d) => (d.open = d.id === f));
      focusId = f;
      setHover(null);
      if (f.startsWith("drawer")) playSound("drawer");
      else playSound(f === "paper" ? "paper" : "open");
      if (f === "calc") drawCalc(calculator.display, calculator.expression);
      if (f.startsWith("frame")) {
        const fr = frames.find((x) => x.id === f);
        if (fr) flashChip(fr.title, 4000);
      }
      if (f === "laptop") {
        lapW = mount.clientWidth < 640 ? 440 : 900;
        lapH = Math.round((lapW * SCREEN_H) / SCREEN_W);
        setLaptopSize({ w: lapW, h: lapH });
      }
      if (f === "paper") {
        invoiceMat.map = noteTex; // blank lined paper while the visitor writes on it
        invoiceMat.needsUpdate = true;
        noteReveal = null;
        paintNote("", 0);
      }
      startCam(() => focusPose(f));
      setFocus(f);
      if (reduce) renderOnce();
    };
    /** Leave the close-up. `silent`: the slide is being left, so no sound and no fly-out (snap home). */
    const exitFocus = (silent = false) => {
      if (!focusId) return;
      if (!silent) playSound(focusId.startsWith("drawer") ? "drawer" : "close");
      drawers.forEach((d) => (d.open = false));
      focusId = null;
      setHover(null);
      if (silent) {
        camFrom = null;
        camTo = null;
      } else startCam(freePose);
      setFocus(null);
      if (reduce) renderOnce();
    };
    exitRef.current = exitFocus;
    enterRef.current = enterFocus;

    const useItem = (name: string) => {
      if (name === "card") {
        navigator.clipboard
          ?.writeText(site.email)
          .then(() => {
            playSound("pop");
            flashChip(`Email copied: ${site.email}`, 2600);
          })
          .catch(() => flashChip(site.email, 3000));
      } else if (name === "pen") {
        enterFocus("paper");
        flashChip("Leave a note on the paper.", 2400);
      } else if (name === "bamboo") {
        playSound("pop");
        pandaReact("cheer", "Bamboo! Nom nom nom.");
      } else if (name === "folder") {
        exitFocus();
        flashChip("Opening the case studies…", 2000);
        setTimeout(() => goToSection("work"), 700);
      }
    };
    const activate = (target: string) => {
      if (target === "panda") return onPandaClicked();
      if (target === "lamp") {
        lampOn = !lampOn;
        playSound("key");
        if (reduce) renderOnce();
        return;
      }
      if (target === "car") {
        if (clock.getElapsedTime() - carT0 > 2.2) carT0 = clock.getElapsedTime();
        playSound("pop");
        return;
      }
      if (target.startsWith("key:")) return pressKey(target.slice(4) as CalcKey);
      if (target.startsWith("item:")) return useItem(target.slice(5));
      if (target.startsWith("drawer") && focusId === target) return exitFocus();
      enterFocus(target as DeskFocus);
    };

    /* Pointer handling */
    let ptr = { x: 0, y: 0, inside: false, dirty: false, touch: false };
    let downAt: { x: number; y: number } | null = null;
    const onEnter = (e: PointerEvent) => {
      hovered = true;
      ptr.inside = true;
      ptr.touch = e.pointerType === "touch";
    };
    const onLeave = () => {
      hovered = false;
      ptr.inside = false;
      setHover(null);
    };
    const onMountMove = (e: PointerEvent) => {
      ptr = { ...ptr, x: e.clientX, y: e.clientY, inside: true, dirty: true, touch: e.pointerType === "touch" };
      const el = hoverLabelRef.current;
      if (el) {
        const r = mount.getBoundingClientRect();
        el.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 18}px)`;
      }
      if (reduce) renderOnce();
    };
    const onDown = (e: PointerEvent) => (downAt = { x: e.clientX, y: e.clientY });
    const onClick = (e: MouseEvent) => {
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 8) return; // a drag, not a click
      if (!interactive) return onPandaClicked();
      if (camTo && camProgress < 1 && focusId) return; // still flying in
      const target = targetOf(pick(e.clientX, e.clientY));
      if (target) activate(target);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (focusId !== "calc" || e.metaKey || e.ctrlKey || e.altKey) return;
      // Typing in a text field (e.g. the chat) must not also press calculator keys.
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const k = keyFromKeyboard(e);
      if (!k) return;
      e.preventDefault();
      pressKey(k);
    };
    mount.addEventListener("pointermove", onMountMove);
    mount.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKeyDown);
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent<PandaEvent>).detail;
      if (!d) return;
      react(d.type);
      if (d.message) flashChip(d.message);
      if (reduce) renderOnce();
    };
    const onMood = (e: Event) => {
      const d = (e as CustomEvent<PandaMoodEvent>).detail;
      if (!d) return;
      mood = d.mood;
      if (reduce) renderOnce();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    mount.addEventListener("pointerenter", onEnter);
    mount.addEventListener("pointerleave", onLeave);
    mount.addEventListener("click", onClick);
    window.addEventListener(PANDA_EVENT, onEvent);
    window.addEventListener(PANDA_MOOD_EVENT, onMood);

    // Sizing
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      const pull = !compact && w / h < 1.2 ? 1.35 : 1;
      camHome.copy(camBase).multiplyScalar(pull);
      if (!camTo && !focusId) camera.position.copy(camHome);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) renderOnce();
    });
    ro.observe(mount);
    resize();

    // Animation
    const smooth = (x: number) => x * x * (3 - 2 * x);
    const pulse = (t: number, start: number, len: number) => {
      if (t < start || t > start + len) return 0;
      const u = (t - start) / len;
      return smooth(Math.min(1, u * 4)) * smooth(Math.min(1, (1 - u) * 4));
    };
    const lerp = THREE.MathUtils.lerp;
    const clamp = THREE.MathUtils.clamp;

    /* Per-task poses. Arm = [shoulder x, y, z, elbow x, z]; values solved so the paws land on the props. */
    type Arm5 = [number, number, number, number, number];
    type TaskPose = { R: Arm5; L: Arm5; hx: number; hy: number; hz: number; lean: number; talk: number; closed: number; happy: number; sip: number };
    const mix5 = (a: Arm5, b: Arm5, k: number): Arm5 => a.map((v, i) => lerp(v, b[i], k)) as Arm5;
    const TASK_POSES: Record<PandaTask, (t: number) => TaskPose> = {
      invoice: (t) => ({
        R: [-0.62, 0, -0.12, -0.95 + Math.sin(t * 17 + Math.PI) * 0.07, 0.1],
        L: [-0.62, 0, 0.12, -0.95 + Math.sin(t * 17) * 0.07, -0.1],
        hx: 0.32, hy: 0, hz: 0, lean: 0, talk: 0, closed: 0, happy: 0, sip: 0,
      }),
      reconcile: (t) => {
        const press = Math.max(0, Math.sin(t * 7)) ** 3;
        return {
          R: [-0.62, 0, -0.12, -0.95 + Math.sin(t * 2) * 0.03, 0.1],
          L: mix5([-1.14, 0.2, 0.3, -0.83, 0.19], [-1.08, 0.2, 0.3, -0.66, 0.18], press),
          hx: 0.4, hy: 0.35, hz: 0.05, lean: 0.04, talk: 0, closed: 0, happy: 0, sip: 0,
        };
      },
      // Phone in the left paw (camera side) so it stays visible; right paw gestures while talking.
      call: (t) => ({
        R: [-0.72 + Math.sin(t * 1.7) * 0.08, 0, -0.18, -1.15 + Math.sin(t * 2.3) * 0.18, 0.1],
        L: [-1.6, -0.26, 0.5, -1.49, 0.1],
        hx: 0.05 + Math.sin(t * 1.1) * 0.05, hy: 0.1, hz: -0.14, lean: -0.04,
        talk: Math.max(0, Math.sin(t * 0.9)), closed: 0, happy: 0.35, sip: 0,
      }),
      crm: (t) => ({
        R: [-0.62, 0, -0.12, -0.95 + Math.sin(t * 2.5) * 0.04, 0.1],
        L: [-1.8, -0.36, -0.24, -1.6, -0.23],
        hx: 0.2 + ((t * 0.3) % 1) * 0.12, hy: -0.12 + Math.sin(t * 1.4) * 0.1, hz: -0.1, lean: 0.1,
        talk: 0, closed: 0, happy: 0, sip: 0,
      }),
      coffee: (t) => {
        const sip = pulse(t % 5, 1, 3);
        return {
          R: mix5([-1.37, 0.24, 0.3, -1.2, 0.02], [-1.66, -0.07, 0.58, -1.06, -0.15], sip),
          L: [-0.58, 0, 0.14, -0.95, -0.1],
          hx: lerp(0.12, -0.12, sip), hy: 0.25 * (1 - sip), hz: 0, lean: -0.06,
          talk: 0, closed: smooth(clamp((sip - 0.5) * 2, 0, 1)), happy: 0.6, sip,
        };
      },
    };

    /*
     * Assistant moods: they override the task pose while active.
     * `look` = how much the panda turns to face the visitor.
     */
    type MoodPose = TaskPose & { look: number; eyes: number; breath: number };
    const ACTIVE_MOODS = ["listening", "thinking", "talking", "sleeping"] as const;
    type ActiveMood = (typeof ACTIVE_MOODS)[number];
    const MOOD_POSES: Record<ActiveMood, (t: number) => MoodPose> = {
      // Paw cupped behind the ear, head tilted, eyes a little wider.
      listening: (t) => ({
        R: [-0.6, 0, -0.14, -1.0, 0.1],
        L: [-1.6, -0.26, 0.5, -1.49, 0.1],
        hx: -0.02, hy: 0, hz: -0.2 + Math.sin(t * 1.3) * 0.04, lean: -0.05,
        talk: 0, closed: 0, happy: 0.3, sip: 0, look: 1, eyes: 1.12, breath: 1,
      }),
      // Chin-scratch, eyes drifting up and to the side.
      thinking: (t) => ({
        R: [-1.3, 0, -0.12, -1.9 + Math.sin(t * 5) * 0.06, 0.1],
        L: [-0.6, 0, 0.14, -1.0, -0.1],
        hx: -0.2, hy: 0.3 + Math.sin(t * 0.8) * 0.06, hz: 0.14, lean: -0.03,
        talk: 0, closed: 0, happy: 0, sip: 0, look: 0, eyes: 1, breath: 1,
      }),
      // Facing the visitor, mouth moving, one paw gesturing.
      talking: (t) => ({
        R: [-0.8 + Math.sin(t * 1.9) * 0.12, 0, -0.22, -1.25 + Math.sin(t * 2.7) * 0.25, 0.1],
        L: [-0.6, 0, 0.14, -1.0, -0.1],
        hx: Math.sin(t * 2.2) * 0.04, hy: 0, hz: Math.sin(t * 0.9) * 0.05, lean: -0.03,
        talk: 1, closed: 0, happy: 0.5, sip: 0, look: 1, eyes: 1, breath: 1,
      }),
      // Arms folded on the desk, head drooping, slow deep breaths.
      sleeping: (t) => ({
        R: [-0.8, 0, -0.3, -1.35, 0.25],
        L: [-0.8, 0, 0.3, -1.35, -0.25],
        hx: 0.62 + Math.sin(t * 0.9) * 0.03, hy: 0.05, hz: 0.2, lean: 0.16,
        talk: 0, closed: 1, happy: 0, sip: 0, look: 0, eyes: 1, breath: 2.2,
      }),
    };
    // Turned round on the chair, facing the visitor: paws resting on the knees, sitting back, smiling.
    const TURNED_POSE: TaskPose = {
      R: [-0.45, 0, 0.1, -0.9, 0],
      L: [-0.45, 0, -0.1, -0.9, 0],
      hx: -0.02, hy: 0, hz: 0.04, lean: -0.05, talk: 0, closed: 0, happy: 0.5, sip: 0,
    };
    const moodW: Record<ActiveMood, number> = { listening: 0, thinking: 0, talking: 0, sleeping: 0 };
    if (mood !== "idle") moodW[mood] = 1;

    // Floating "Z"s while asleep.
    const zCanvas = document.createElement("canvas");
    zCanvas.width = zCanvas.height = 64;
    const zc = zCanvas.getContext("2d")!;
    zc.fillStyle = "#6b5f78";
    zc.font = "bold 52px ui-rounded, system-ui, sans-serif";
    zc.textAlign = "center";
    zc.textBaseline = "middle";
    zc.fillText("z", 32, 34);
    const zTex = new THREE.CanvasTexture(zCanvas);
    const zSprites = [0, 1, 2].map(() => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false, opacity: 0 }));
      scene.add(s);
      return s;
    });
    const headTop = new THREE.Vector3();

    const TASK_IDS = Object.keys(TASK_POSES) as PandaTask[];
    // Blend weights, eased towards the active task each frame.
    const weights = Object.fromEntries(TASK_IDS.map((k) => [k, k === taskRef.current ? 1 : 0])) as Record<PandaTask, number>;
    const pawPos = new THREE.Vector3();
    const heldPos = new THREE.Vector3();
    const tmpQ = new THREE.Quaternion();
    const screenBlue = new THREE.Color("#9fc4ff");
    const screenCrm = new THREE.Color("#8ff0cf");

    // Frame-rate independent easing: `perSecond` ≈ how many "e-folds" per second.
    let lastPoseT = -1;
    let dt = 1 / 60;
    const ease = (perSecond: number) => 1 - Math.exp(-perSecond * dt);

    const pose = (t: number) => {
      dt = lastPoseT < 0 ? 1 / 60 : clamp(t - lastPoseT, 0, 0.1);
      lastPoseT = t;
      // Ease task + mood weights (snap for reduced motion).
      let total = 0;
      for (const k of TASK_IDS) {
        const target = k === taskRef.current ? 1 : 0;
        weights[k] = reduce ? target : weights[k] + (target - weights[k]) * ease(2.8);
        total += weights[k];
      }
      let moodTotal = 0;
      for (const m of ACTIVE_MOODS) {
        const target = m === mood ? 1 : 0;
        const rate = m === "sleeping" && target ? 1.3 : 4.2; // drift off slowly, wake fast
        moodW[m] = reduce ? target : moodW[m] + (target - moodW[m]) * ease(rate);
        moodTotal += moodW[m];
      }
      const moodAmt = Math.min(1, moodTotal);

      /*
       * Scroll turn. The chair's angle is exactly proportional to scroll progress (0° → 180°);
       * the rest is choreographed from the same value so it can never run ahead of the scroll:
       *  - aware (0 → 0.15): it hears you; the head glances back over the shoulder
       *  - offDesk (0 → 0.12): paws come off the keyboard, props go back down
       *  - rollBack (0 → 0.25): the chair rolls back from the desk to make room to turn
       */
      if (rear) {
        lastP = scrollT.p;
        const tt = turnOf(scrollT.p);
        turn = reduce ? (tt >= 0.5 ? 1 : 0) : tt;
        const nowFacing = turn > 0.5;
        if (nowFacing !== facing) {
          facing = nowFacing;
          onFacingChangeRef.current?.(nowFacing);
        }
      }
      const aware = rear ? smooth(clamp(turn / 0.15, 0, 1)) : 1;
      const offDesk = rear ? smooth(clamp(turn / 0.12, 0, 1)) : 0;
      const turnYaw = rear ? Math.PI * turn : 0;
      const camYaw = Math.atan2(camHome.x, camHome.z - SEAT_Z);
      const rollBack = rear ? smooth(clamp(turn / 0.25, 0, 1)) * 0.16 : 0;
      const facingAmt = rear ? turn : 1;

      const base: MoodPose = {
        R: [0, 0, 0, 0, 0], L: [0, 0, 0, 0, 0], hx: 0, hy: 0, hz: 0, lean: 0, talk: 0, closed: 0, happy: 0, sip: 0,
        look: 0, eyes: 1, breath: 1,
      };
      const addPose = (p: TaskPose, w: number) => {
        for (let i = 0; i < 5; i++) {
          base.R[i] += p.R[i] * w;
          base.L[i] += p.L[i] * w;
        }
        base.hx += p.hx * w;
        base.hy += p.hy * w;
        base.hz += p.hz * w;
        base.lean += p.lean * w;
        base.talk += p.talk * w;
        base.closed += p.closed * w;
        base.happy += p.happy * w;
        base.sip += p.sip * w;
      };
      // Task pose, scaled down by however much a mood is taking over.
      for (const k of TASK_IDS) {
        const w = (weights[k] / total) * (1 - moodAmt) * (1 - offDesk);
        if (w > 0.001) addPose(TASK_POSES[k](t), w);
      }
      if (offDesk > 0.001) addPose(TURNED_POSE, (1 - moodAmt) * offDesk);
      base.look = 0;
      base.eyes = 1 - moodAmt;
      base.breath = 1 - moodAmt;
      for (const m of ACTIVE_MOODS) {
        const w = moodW[m] / Math.max(1, moodTotal);
        if (w < 0.001) continue;
        const p = MOOD_POSES[m](t);
        addPose(p, w);
        base.look += p.look * w;
        base.eyes += p.eyes * w;
        base.breath += p.breath * w;
      }
      const asleep = moodW.sleeping;

      // A visitor is using the desk: the panda sits back, arms folded on the desk, and watches.
      focusW = reduce ? (focusId ? 1 : 0) : focusW + ((focusId ? 1 : 0) - focusW) * ease(4);
      if (focusW > 0.001) {
        base.R = mix5(base.R, [-0.8, 0, -0.3, -1.35, 0.25], focusW);
        base.L = mix5(base.L, [-0.8, 0, 0.3, -1.35, -0.25], focusW);
        base.hx = lerp(base.hx, -0.04, focusW);
        base.hy = lerp(base.hy, 0, focusW);
        base.hz = lerp(base.hz, 0.08, focusW);
        base.look = Math.max(base.look, focusW * 0.85);
        base.closed *= 1 - focusW;
        base.talk *= 1 - focusW;
        base.sip *= 1 - focusW;
      }

      // Reaction weights
      const rt = reaction ? t - reaction.t0 : 99;
      const rw = (type: PandaReaction) => (reaction?.type === type ? pulse(rt, 0, REACTION_LENGTH[type]) : 0);
      const cheer = rw("cheer");
      const nod = rw("nod");
      const think = rw("think");
      const surprised = rw("surprised");
      const clickWave = rw("wave");
      const confused = rw("confused");
      const dizzy = rw("dizzy");
      const dance = rw("dance");
      // Full turns in the chair: progress 0→1 over the reaction.
      const spinTurn = (type: PandaReaction, turns: number) =>
        reaction?.type === type ? smooth(clamp(rt / REACTION_LENGTH[type], 0, 1)) * Math.PI * 2 * turns : 0;
      const spin = spinTurn("spin", 1) + spinTurn("dizzy", 2);
      if (reaction && rt > REACTION_LENGTH[reaction.type]) reaction = null;

      const breathe = Math.sin(t * (1.6 / Math.max(1, base.breath * 0.9)));
      torso.scale.set(1 + breathe * 0.008 * base.breath, 1 + breathe * 0.012 * base.breath, 1);
      torso.rotation.x = 0.12 + base.lean + breathe * 0.01 * base.breath - surprised * 0.12;
      torso.rotation.z = Math.sin(t * 7) * 0.08 * dance;

      // Scheduled idle wave every 12 s (suppressed while hovered/reacting, on a call, or in a mood).
      const quiet = hovered || reaction || moodAmt > 0.1;
      // No idle waves or glances with its back to you (in the rear view it's busy until it turns).
      const idleWave = quiet ? 0 : pulse(t % 12, 7.2, 2.8) * (1 - weights.call) * facingAmt;
      const wave = Math.max(idleWave, clickWave);
      const glanceIdle = quiet ? 0 : pulse(t % 12, 1.4, 1.2) * 0.5 * facingAmt;

      // Attention: looking at the visitor (hover, waves, reactions, listening/talking, hearing you scroll up).
      const targetAttention = Math.max(
        (hovered ? 1 : 0) * (1 - asleep) * aware,
        wave, cheer, surprised, glanceIdle, base.look, confused, dance,
        rear ? aware : 0,
      );
      attention = lerp(attention, targetAttention, ease(5));

      // Where the visitor is: towards the camera, nudged by the mouse.
      // Rear view: the camera can be behind the panda, so the head turns as far as a neck can
      // (over the shoulder) and mouse left/right flips with the side we see it from.
      const rel = Math.atan2(Math.sin(camYaw - turnYaw), Math.cos(camYaw - turnYaw));
      const side = rear ? Math.cos(rel) : 1;
      const px = clamp(pointerSmooth.x, -1.6, 1.6);
      const py = clamp(pointerSmooth.y, -1.6, 1.6);
      const lookYaw = rear ? clamp(rel * 0.8, -1.0, 1.0) + px * 0.35 * side : 0.42 + px * 0.35;
      const lookPitch = -0.08 + py * 0.22;
      // Even while working, the head drifts a little towards the mouse.
      const follow = 1 - asleep;
      const workYaw = base.hy + px * 0.12 * follow * side;
      const workPitch = base.hx + py * 0.05 * follow;
      // Reading the screen: small, slow head movements while it works.
      const reading = (1 - attention) * (1 - asleep) * (1 - moodAmt);

      head.rotation.x =
        lerp(workPitch, lookPitch, attention) + Math.sin(t * 0.7) * 0.02 + Math.sin(t * 1.7 + 1) * 0.014 * reading +
        Math.sin(rt * 14) * 0.18 * nod - think * 0.15 + Math.sin(t * 10) * 0.08 * dance;
      head.rotation.y =
        lerp(workYaw, lookYaw, attention) + Math.sin(t * 0.8) * 0.05 * reading - think * 0.25 + Math.sin(t * 9) * 0.25 * dizzy;
      head.rotation.z =
        lerp(base.hz, base.hz * 0.6, attention) + think * 0.25 + Math.sin(t * 0.5) * 0.02 + Math.sin(rt * 3.2) * 0.3 * confused +
        Math.sin(t * 6) * 0.2 * dizzy;

      // Pupils follow the mouse (swirl when dizzy, roll up when thinking).
      const eyeX = clamp(px, -1, 1) * 0.006 * follow * side +Math.cos(t * 14) * 0.007 * dizzy;
      const eyeY = -clamp(py, -1, 1) * 0.005 * follow + think * 0.006 + moodW.thinking * 0.006 + Math.sin(t * 14) * 0.007 * dizzy;
      eyes.forEach(({ pupil }) => pupil.position.set(eyeX, eyeY, 0.012));

      // Expressions: smile, talking, eyes closed while sipping / sleeping.
      const happy = Math.max(attention * 0.6 * (1 - confused), cheer, wave, base.happy, dance);
      const talking = base.talk * Math.abs(Math.sin(t * 11)) * Math.abs(Math.sin(t * 2.3) + 0.35);
      smile.scale.set(
        1 + happy * 0.4 - surprised * 0.3 - talking * 0.2 - confused * 0.4,
        1 + happy * 0.7 + surprised * 0.6 + talking * 1.1 - confused * 0.5 - asleep * 0.4,
        1,
      );
      const eyeOpen = (1 + surprised * 0.35) * base.eyes;

      // Blink every ~3.4 s.
      const b = t % 3.4;
      const blink = b > 3.25 && !surprised ? Math.sin(((b - 3.25) / 0.15) * Math.PI) : 0;
      const shut = Math.max(blink * 0.9, base.closed * 0.88 * (1 - attention * (1 - asleep)));
      eyes.forEach(({ group }) => group.scale.set(eyeOpen, eyeOpen * (1 - shut), eyeOpen));

      // Arms: task/mood pose, blended to wave / cheer / chin-scratch / shrug / dance reactions.
      const busy = Math.max(wave, cheer, dance);
      const R = base.R;
      const L = base.L;
      const danceL = Math.sin(t * 7) > 0 ? 1 : 0.4;
      const danceR = Math.sin(t * 7) > 0 ? 0.4 : 1;
      armR.shoulder.rotation.set(
        lerp(lerp(lerp(lerp(R[0], -1.3, think), -0.35, cheer), -0.6, confused), -0.35, dance * danceR),
        lerp(lerp(R[1], 0, think), 0.3, cheer),
        lerp(lerp(lerp(lerp(R[2], -0.12, think), -2.5, cheer), -0.7, confused), -2.3, dance * danceR),
      );
      armR.elbow.rotation.set(
        lerp(lerp(lerp(R[3], -1.9, think), -0.2, cheer), -1.3, confused),
        0,
        lerp(lerp(lerp(R[4], 0.1, think), -0.45 - Math.sin(t * 12) * 0.2, cheer), 0.5, confused),
      );
      const danceAmt = dance * danceL;
      armL.shoulder.rotation.set(
        lerp(lerp(lerp(L[0], -0.35, Math.max(wave, cheer)), -0.6, confused), -0.35, danceAmt),
        lerp(L[1], -0.3, Math.max(wave, cheer)),
        lerp(lerp(lerp(L[2], 2.5, Math.max(wave, cheer)), 0.7, confused), 2.3, danceAmt),
      );
      armL.elbow.rotation.set(
        lerp(lerp(lerp(L[3], -0.2, Math.max(wave, cheer)), -1.3, confused), -0.3, danceAmt),
        0,
        lerp(lerp(L[4], 0.45 + Math.sin(t * 11) * 0.38 * Math.max(wave, cheer * 0.6), Math.max(wave, cheer)), -0.5, confused),
      );

      // Chair sway (+ spins), typing bob, cheer / dance bounce.
      const sway = Math.sin(t * 0.45) * 0.05 * (1 - asleep * 0.7);
      // Scroll turn: the chair rolls back from the desk a little and swivels round with the panda.
      // Chair and panda turn as one unit (the seat group).
      seat.rotation.y = (rear ? sway * (1 - aware * 0.7) : sway) + spin + turnYaw;
      seat.position.z = SEAT_Z - rollBack;
      panda.position.y =
        Math.abs(Math.sin(t * 8.5)) * 0.002 * weights.invoice * (1 - busy) * (1 - moodAmt) * (1 - offDesk) +
        Math.abs(Math.sin(rt * 9)) * 0.05 * cheer +
        Math.abs(Math.sin(t * 7)) * 0.035 * dance;

      // Props follow the paws while held (phone in the left on calls, mug in the right on coffee breaks).
      seat.updateMatrixWorld(true);
      // Put props down for moods and chair spins.
      const propFree = (1 - moodAmt) * (spin ? 0 : 1) * (1 - focusW) * (1 - offDesk);
      armL.elbow.localToWorld(pawPos.set(0, -0.25, 0.02));
      const holdPhone = smooth(clamp(weights.call * 1.15, 0, 1)) * (1 - busy) * (1 - confused) * propFree;
      phone.position.lerpVectors(phoneRest, heldPos.copy(pawPos).add(new THREE.Vector3(-0.03, 0.01, 0.01)), holdPhone);
      armL.elbow.getWorldQuaternion(tmpQ).multiply(phoneHoldOffset);
      phone.quaternion.slerpQuaternions(phoneRestQ, tmpQ, holdPhone);
      phoneScreenMat.emissiveIntensity = holdPhone * (0.5 + Math.sin(t * 3) * 0.15);

      armR.elbow.localToWorld(pawPos.set(0, -0.25, 0.02));
      const holdMug = smooth(clamp(weights.coffee * 1.15, 0, 1)) * (1 - Math.max(think, cheer, confused, dance)) * propFree;
      mug.position.lerpVectors(mugRest, heldPos.copy(pawPos).add(new THREE.Vector3(0.065, -0.07, 0.02)), holdMug);
      mug.rotation.set(-0.75 * base.sip * holdMug, Math.PI, 0);

      // Calculator display advances on each key press while reconciling.
      const beat = Math.floor((t * 7 - Math.PI / 2) / (Math.PI * 2));
      if (beat !== calcBeat) {
        calcBeat = beat;
        if (!calcUsed && weights.reconcile > 0.6 && moodAmt < 0.3 && focusW < 0.1 && !reduce) drawCalc(CALC_SEQ[calcStep++ % CALC_SEQ.length]);
      }

      // Sleepy Zs drift up from the head.
      head.localToWorld(headTop.set(0.12, HC + 0.32, 0.05));
      zSprites.forEach((s, i) => {
        const u = (t * 0.28 + i / 3) % 1;
        s.position.set(headTop.x + u * 0.22 + Math.sin(u * 6 + i) * 0.03, headTop.y + u * 0.36, headTop.z + u * 0.05);
        s.scale.setScalar(0.09 + u * 0.13);
        s.material.opacity = asleep * Math.min(1, u * 6) * (1 - u) * 0.95;
        s.visible = asleep > 0.02;
      });

      steam.forEach((s, i) => {
        const u = (t * 0.35 + i / 3) % 1;
        s.position.set(Math.sin(u * 5 + i * 1.7) * 0.012 + u * 0.01, 0.11 + u * 0.2, Math.cos(u * 4 + i) * 0.008);
        s.scale.set(0.035 + u * 0.06, 0.05 + u * 0.09, 1);
        s.material.rotation = i + u * 1.5;
        s.material.opacity = 0.22 * (1 - u) * Math.min(1, u * 4) * (1 - base.sip);
      });

      screenLight.color.copy(screenBlue).lerp(screenCrm, weights.crm * (1 - moodAmt));
      screenLight.intensity = (0.55 + Math.sin(t * 3) * 0.05 + weights.crm * 0.35) * (1 - asleep * 0.6);

      /* Desk objects */
      const toward = (cur: number, target: number, rate: number) => (reduce ? target : cur + (target - cur) * ease(rate));
      // The laptop turns round to face the visitor while it's in use.
      laptopSpin = toward(laptopSpin, focusId === "laptop" ? 1 : 0, 3.4);
      laptop.rotation.y = smooth(clamp(laptopSpin, 0, 1)) * LAPTOP_TURN;
      // Drawers slide on their runners.
      drawers.forEach((d) => {
        d.t = toward(d.t, d.open ? 1 : 0, 5);
        d.group.position.z = 0.3 * DZ * smooth(clamp(d.t, 0, 1));
      });
      // Desk lamp fades on / off.
      lampW = toward(lampW, lampOn ? 1 : 0, 6);
      bulbMat.emissiveIntensity = 0.15 + lampW * 1.25;
      lampLight.intensity = 0.5 * lampW;
      // Toy car: rolls forward and back, wheels turning with the distance.
      const cu = (t - carT0) / 2.2;
      const drive = cu >= 0 && cu <= 1 ? Math.sin(cu * Math.PI) * 0.13 : 0;
      car.position.set(carHome.x + Math.cos(carYaw) * drive, carHome.y, carHome.z - Math.sin(carYaw) * drive);
      wheels.forEach((w) => (w.rotation.y = -drive / 0.019));
      // Calculator keys dip when pressed.
      keys.forEach((k) => {
        const age = t - k.pressedAt;
        k.mesh.position.y = 0.0225 - (age >= 0 && age < 0.15 ? Math.sin((age / 0.15) * Math.PI) * 0.0035 : 0);
      });
      // The note is "handwritten" onto the paper a few letters at a time.
      if (noteReveal) {
        const n = Math.min(noteReveal.text.length, Math.floor((t - noteReveal.t0) * 45));
        if (n !== noteReveal.shown) {
          noteReveal.shown = n;
          paintNote(noteReveal.text, n);
        }
        if (n >= noteReveal.text.length) noteReveal = null;
      }
    };

    let frame = 0;
    let visible = true;
    /* HTML glued onto 3D surfaces (laptop screen, paper) via a perspective matrix. */
    const project = (v: THREE.Vector3, w: number, h: number): Pt => {
      const p = v.project(camera);
      return [((p.x + 1) / 2) * w, ((1 - p.y) / 2) * h];
    };
    const placeLayer = (el: HTMLDivElement | null, mesh: THREE.Object3D, hw: number, hh: number, W: number, H: number, alpha: number) => {
      if (!el) return 0;
      if (alpha <= 0) {
        if (el.style.opacity !== "0") {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
        return 0;
      }
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      const [tl, tr, bl, br] = (
        [
          [-hw, hh],
          [hw, hh],
          [-hw, -hh],
          [hw, -hh],
        ] as const
      ).map(([x, y]) => project(mesh.localToWorld(new V3(x, y, 0)), w, h));
      const m = quadToMatrix3d(W, H, tl, tr, bl, br);
      if (m) el.style.transform = m;
      el.style.opacity = String(alpha);
      el.style.pointerEvents = alpha > 0.9 ? "auto" : "none";
      return Math.hypot(tr[0] - tl[0], tr[1] - tl[1]) / W;
    };
    const updateLayers = () => {
      if (!interactive) return;
      const a = (f: DeskFocus) => (focusId === f ? clamp((camProgress - 0.7) / 0.3, 0, 1) : 0);
      const s = placeLayer(laptopLayerRef.current, screen, SCREEN_W / 2, SCREEN_H / 2, lapW, lapH, a("laptop"));
      if (s) laptopScaleRef.current = s;
      placeLayer(paperLayerRef.current, invoice, 0.11, 0.145, PAPER_W, PAPER_H, a("paper"));
    };

    const draw = () => {
      const t = clock.getElapsedTime();
      let p: Pose;
      if (camTo && camFrom) {
        const k = reduce ? 1 : smooth(clamp((t - camT0) / CAM_DUR, 0, 1));
        const to = camTo();
        p = {
          pos: camFrom.pos.clone().lerp(to.pos, k),
          target: camFrom.target.clone().lerp(to.target, k),
          up: camFrom.up.clone().lerp(to.up, k).normalize(),
        };
        // Rear view: arc up over the panda and the desk instead of flying through them.
        if (rear) p.pos.y += Math.sin(Math.PI * k) * 0.45;
        camProgress = k;
        if (k >= 1 && !focusId) camTo = null;
      } else {
        p = freePose();
        camProgress = 0;
      }
      camera.position.copy(p.pos);
      camera.up.copy(p.up);
      camera.lookAt(p.target);
      camTarget.copy(p.target);
      camera.updateMatrixWorld();
      // Hover picking (only after the pointer moved; never on touch).
      if (ptr.dirty) {
        ptr.dirty = false;
        if (interactive && ptr.inside && !ptr.touch && (!camTo || camProgress >= 1)) setHover(targetOf(pick(ptr.x, ptr.y)));
      }
      renderer.render(scene, camera);
      updateLayers();
    };
    const renderOnce = () => {
      pose(reaction ? clock.getElapsedTime() : 0);
      draw();
    };
    // "Pause animation": the panda holds still, but the desk keeps responding while a visitor uses it.
    let motionPaused = isMotionPaused();
    const offPause = onMotionPausedChange((p) => (motionPaused = p));
    const settled = () =>
      !focusId &&
      !camTo &&
      !reaction &&
      !noteReveal &&
      scrollT.p === lastP && // the scroll turn keeps responding even while "Pause animation" is on
      Math.abs(lampW - (lampOn ? 1 : 0)) < 0.001 &&
      clock.getElapsedTime() - carT0 > 2.3 &&
      laptopSpin < 0.001 &&
      drawers.every((d) => d.t < 0.001) &&
      keys.every((k) => clock.getElapsedTime() - k.pressedAt > 0.2);
    /*
     * The render loop runs only while it can be seen: its slide is active, the canvas is on screen,
     * the tab is visible and the GPU context is alive. Otherwise it stops completely (no idle rAF),
     * and `wake()` restarts it from any of those signals. Exactly one loop can exist (`frame`).
     */
    let lost = false;
    let disposed = false;
    // `ready`: shaders compiled (in parallel, off the main thread) before the first frame.
    let ready = false;
    const canRun = () => ready && !disposed && !lost && visible && !document.hidden && activeRef.current;
    let frameNo = 0;
    let errors = 0;
    // Adaptive resolution: an average of recent frame times nudges the pixel ratio.
    let lastFrameAt = 0;
    let avgMs = 16.7;
    let dprCooldown = 0;
    const adaptResolution = (now: number) => {
      const ms = lastFrameAt ? now - lastFrameAt : 16.7;
      lastFrameAt = now;
      if (ms > 250) return; // first frame after a pause: not a real frame time
      avgMs += (ms - avgMs) * 0.05;
      if (--dprCooldown > 0) return;
      let next = dpr;
      if (avgMs > 24 && dpr > minDpr) next = Math.max(minDpr, dpr - 0.25);
      else if (avgMs < 14 && dpr < maxDpr) next = Math.min(maxDpr, dpr + 0.25);
      if (next !== dpr) {
        dpr = next;
        renderer.setPixelRatio(dpr);
        resize();
        dprCooldown = 90; // let it settle (≈1.5 s) before judging again
      }
    };
    const loop = (now: number) => {
      frame = 0;
      if (!canRun()) {
        lastFrameAt = 0;
        return; // stopped; wake() starts it again
      }
      frame = requestAnimationFrame(loop);
      if (motionPaused && settled() && !ptr.dirty) {
        lastFrameAt = 0;
        return;
      }
      try {
        adaptResolution(now);
        pointerSmooth.lerp(pointer, 0.06);
        pose(clock.getElapsedTime());
        // Shadows: every frame while something big moves, otherwise every other frame (the panda's
        // breathing can't show a one-frame lag, and the shadow pass is the most expensive one).
        frameNo++;
        renderer.shadowMap.needsUpdate = frameNo % 2 === 0 || !!camTo || !!reaction || !!focusId || scrollT.p !== lastP;
        draw();
        errors = 0;
      } catch (err) {
        // A frame failed (driver hiccup, a resource lost mid-frame). Keep going; if it keeps
        // failing, rebuild the scene from scratch instead of leaving a frozen panda.
        if (++errors === 1) console.warn("Desk scene: frame failed, retrying.", err);
        if (errors > 30) rebuild("render errors");
      }
    };
    const wake = () => {
      if (!frame && !reduce && canRun()) frame = requestAnimationFrame(loop);
      else if (reduce && canRun()) renderOnce();
    };
    let rebuilt = false;
    const rebuild = (why: string) => {
      if (rebuilt || disposed) return;
      rebuilt = true;
      console.warn(`Desk scene: rebuilding (${why}).`);
      exitFocus(true);
      setGen((g) => g + 1);
    };

    // GPU context loss (driver reset, too many contexts, the GPU process restarting).
    const canvasEl = renderer.domElement;
    let lostTimer = 0;
    const onContextLost = (e: Event) => {
      e.preventDefault(); // ask the browser to give the context back
      lost = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      // Not back soon? Build a fresh scene on a fresh context.
      lostTimer = window.setTimeout(() => rebuild("context not restored"), 1500);
    };
    const onContextRestored = () => {
      window.clearTimeout(lostTimer);
      // three.js re-uploads geometry and textures, but render targets (the environment map) and
      // canvas-drawn screens are gone: a clean rebuild is the reliable way back.
      rebuild("context restored");
    };
    canvasEl.addEventListener("webglcontextlost", onContextLost);
    canvasEl.addEventListener("webglcontextrestored", onContextRestored);
    const onVisibility = () => wake();
    document.addEventListener("visibilitychange", onVisibility);

    // A note written earlier this session is still on the paper.
    if (interactive) {
      try {
        showNote(sessionStorage.getItem(NOTE_KEY) ?? "", false);
      } catch {
        /* ignore */
      }
    }

    // Reduced motion: no loop, so redraw the still frame whenever the task changes.
    redrawRef.current = reduce ? renderOnce : null;
    /*
     * Placeholders: every material that will receive a photographed map gets a 1×1 stand-in now,
     * so swapping in the real texture later never changes the shader (no second compile, no hitch).
     */
    const px = (fill: string) => {
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1;
      const c = cv.getContext("2d")!;
      c.fillStyle = fill;
      c.fillRect(0, 0, 1, 1);
      return new THREE.CanvasTexture(cv);
    };
    const flatNormal = px("rgb(128,128,255)");
    const white = px("#ffffff");
    white.colorSpace = THREE.SRGBColorSpace;
    deskWood.forEach((m) => {
      m.map ??= white;
      m.normalMap ??= flatNormal;
      m.roughnessMap ??= white;
    });
    [...fabricMats, ...plasterMats].forEach((m) => (m.normalMap ??= flatNormal));
    if (rear) (floor.material as THREE.MeshStandardMaterial).normalMap ??= flatNormal;

    // Compile every shader up front without blocking the page (KHR_parallel_shader_compile),
    // then start drawing. Falls back to drawing straight away if that isn't available.
    const start = () => {
      if (disposed) return;
      ready = true;
      if (reduce) renderOnce();
      else wake();
    };
    renderer.compileAsync(scene, camera).then(start, start);

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        wake();
      },
      { threshold: 0 },
    );
    io.observe(mount);

    /*
     * GSAP ScrollTrigger: scrub the turn across the section's scroll track.
     * start "top top" → the scene is already fully on screen (sticky) before anything moves;
     * end "bottom bottom" → the whole track (well over a screen of scrolling) for one half-turn.
     * scrub: 2 → the value glides after the scroll position and stops where it stops.
     * Reduced motion: no turning; the still frame switches from back to front halfway.
     */
    onActivateRef.current = () => {
      introT0 = clock.getElapsedTime();
      wake();
    };

    let scrollTween: gsap.core.Tween | null = null;
    const track = scrollTrack?.current;
    if (rear && track) {
      gsap.registerPlugin(ScrollTrigger);
      scrollTween = gsap.to(scrollT, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          scrub: reduce ? true : 2,
          onUpdate: reduce
            ? () => {
                if ((turnOf(scrollT.p) >= 0.5 ? 1 : 0) !== turn) renderOnce();
              }
            : undefined,
        },
      });
      // Arriving mid-track (reload, anchor link): start from the right angle instead of scrubbing in.
      const st = scrollTween.scrollTrigger;
      if (st) scrollTween.progress(st.progress);
      if (reduce) renderOnce();
    }
    // Achievement wall: hang the art prints now, then the owner's certificates once they load.
    // A save in /wall-editor (another tab) re-hangs them straight away.
    let wallChannel: BroadcastChannel | null = null;
    if (rear) {
      hangFrames(null);
      const loadWall = (fresh = false) =>
        fetch(fresh ? `/api/wall?t=${Date.now()}` : "/api/wall", fresh ? { cache: "no-store" } : undefined)
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { manifest?: WallManifest } | null) => {
            if (d?.manifest && !wallDisposed) hangFrames(d.manifest);
          })
          .catch(() => {
            /* offline or not deployed yet: the prints stay up */
          });
      void loadWall();
      try {
        wallChannel = new BroadcastChannel(WALL_CHANNEL);
        wallChannel.onmessage = () => void loadWall(true);
      } catch {
        /* ignore */
      }
    }

    /*
     * Photographed materials and studio light. The downloads are shared by every scene on the page
     * (and cached by the browser), so this is instant after the first time. Until they arrive the
     * procedural stand-ins are shown; nothing waits on them.
     */
    const loadedTex: THREE.Texture[] = [];
    void Promise.all([
      loadHdr(),
      loadBitmap(TEXTURES.woodColor),
      loadBitmap(TEXTURES.woodNormal),
      loadBitmap(TEXTURES.woodRough),
      loadBitmap(TEXTURES.plasterNormal),
      loadBitmap(TEXTURES.fabricNormal),
    ]).then(([hdr, woodC, woodN, woodR, plasterN, fabricN]) => {
      if (disposed || lost) return;
      const tex = (bmp: ImageBitmap, o: Parameters<typeof bitmapTexture>[1]) => {
        const t = bitmapTexture(bmp, { aniso: maxAniso, ...o });
        t.center.set(0.5, 0.5);
        loadedTex.push(t);
        return t;
      };
      if (hdr) {
        const old = envTex;
        envTex = hdrEnvironment(renderer, hdr);
        scene.environment = envTex;
        scene.environmentIntensity = 0.7;
        hemi.intensity = 0.12;
        old.dispose();
      }
      if (woodC && woodN && woodR) {
        // Desk: grain along the run of the desk; 1 tile ≈ 1.25 m. Slats: grain running up the wall.
        const along = { repeat: [0.8, 0.8] as [number, number], rotation: Math.PI / 2 };
        const up = { repeat: [0.06, 1.6] as [number, number] };
        deskWood.forEach((m) => {
          const vertical = m.color.getHex() === 0xf2c690;
          const o = vertical ? up : along;
          m.map = tex(woodC, { ...o, color: true });
          m.normalMap = tex(woodN, o);
          m.normalScale.set(0.6, 0.6);
          m.roughnessMap = tex(woodR, o);
          if (!vertical && m.color.getHex() === 0xffffff) m.color.set("#f4ece4");
          m.needsUpdate = true;
        });
      }
      if (plasterN) plasterMats.forEach((m) => ((m.normalMap = tex(plasterN, { repeat: [5, 3] })), (m.needsUpdate = true)));
      if (fabricN) {
        fabricMats.forEach((m) => ((m.normalMap = tex(fabricN, { repeat: [4, 4] })), (m.needsUpdate = true)));
        if (rear) {
          const fm = floor.material as THREE.MeshStandardMaterial;
          fm.normalMap = tex(fabricN, { repeat: [28, 28] });
          fm.needsUpdate = true;
        }
      }
      renderer.shadowMap.needsUpdate = true;
      if (reduce) renderOnce();
    });

    return () => {
      disposed = true;
      wallDisposed = true;
      wallChannel?.close();
      window.clearTimeout(lostTimer);
      canvasEl.removeEventListener("webglcontextlost", onContextLost);
      canvasEl.removeEventListener("webglcontextrestored", onContextRestored);
      document.removeEventListener("visibilitychange", onVisibility);
      scrollTween?.scrollTrigger?.kill();
      scrollTween?.kill();
      redrawRef.current = null;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      offPause();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(PANDA_EVENT, onEvent);
      window.removeEventListener(PANDA_MOOD_EVENT, onMood);
      mount.removeEventListener("pointerenter", onEnter);
      mount.removeEventListener("pointerleave", onLeave);
      mount.removeEventListener("click", onClick);
      mount.removeEventListener("pointermove", onMountMove);
      mount.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKeyDown);
      exitRef.current = () => {};
      enterRef.current = () => {};
      drawNoteRef.current = () => {};
      noteTex.dispose();
      invoiceTex.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = (Array.isArray(o.material) ? o.material : [o.material]) as (THREE.Material & { map?: THREE.Texture })[];
          ms.forEach((m) => {
            m.map?.dispose();
            m.dispose();
          });
        }
      });
      zSprites.forEach((s) => s.material.dispose());
      zTex.dispose();
      steam.forEach((s) => s.material.dispose());
      steamTex.dispose();
      floorFade.dispose();
      flatNormal.dispose();
      white.dispose();
      furShells.forEach((s) => s.dispose());
      loadedTex.forEach((t) => t.dispose());
      detail.dispose();
      envTex.dispose();
      furNoise.dispose();
      aoTex.dispose();
      renderer.dispose();
      // Hand the WebGL context back now, not whenever the garbage collector runs: browsers cap
      // live contexts (~16) and silently kill the oldest, which is what froze the panda before.
      if (!lost) renderer.forceContextLoss();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, interactive, scrollTurn, scrollTrack, gen]);

  const glassBtn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg shadow-[0_8px_20px_-12px_rgb(80_60_40/0.45)] transition-colors hover:border-fg/30 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div
      className={`relative overflow-hidden ${className} ${fullscreen ? "!fixed !inset-0 z-[80] !m-0 !aspect-auto !h-[100svh] !w-screen !max-w-none !rounded-none bg-ink" : ""}`}
    >
      <div
        ref={mountRef}
        className={`absolute inset-0 ${interactive ? "" : "cursor-pointer"}`}
        title={interactive ? undefined : "Say hi to the panda"}
      />

      {interactive && (
        <>
          {/* Laptop screen: HTML desktop glued onto the 3D screen */}
          <div
            ref={laptopLayerRef}
            className="absolute left-0 top-0 overflow-hidden rounded-[3px] opacity-0 [backface-visibility:hidden]"
            style={{ width: laptopSize.w, height: laptopSize.h, transformOrigin: "0 0", pointerEvents: "none" }}
          >
            {focus === "laptop" && (
              <LaptopOS
                width={laptopSize.w}
                height={laptopSize.h}
                getScale={() => laptopScaleRef.current}
                onOpenSection={(id) => {
                  exitRef.current();
                  setTimeout(() => goToSection(id), 700);
                }}
              />
            )}
          </div>

          {/* Writing paper: the textarea sits on the 3D sheet */}
          <div
            ref={paperLayerRef}
            className="absolute left-0 top-0 opacity-0"
            style={{ width: PAPER_W, height: PAPER_H, transformOrigin: "0 0", pointerEvents: "none" }}
          >
            {focus === "paper" && <PaperNote ref={paperInputRef} value={note} onChange={setNote} />}
          </div>

          {/* Hover label that follows the cursor */}
          <div
            ref={hoverLabelRef}
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-full bg-fg px-3 py-1.5 text-xs font-semibold text-ink shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)] transition-opacity duration-200 ${hoverLabel ? "opacity-100" : "opacity-0"}`}
          >
            {hoverLabel}
          </div>

          {/* Focus controls */}
          {focus && (
            <button type="button" onClick={() => exitRef.current()} className={`${glassBtn} absolute left-3 top-3 z-20`}>
              <ArrowLeft aria-hidden className="size-4" /> Back to desk
            </button>
          )}
          {focus === "calc" && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted">
              Click the keys, or type on your keyboard
            </p>
          )}
          {focus?.startsWith("drawer") && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted">
              Click what&apos;s inside, or the drawer to close it
            </p>
          )}
          {focus === "paper" && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNote("");
                  playSound("paper");
                  paperInputRef.current?.focus();
                }}
                className={glassBtn}
              >
                <Eraser aria-hidden className="size-4" /> Clear
              </button>
              <button type="button" onClick={() => saveNote(note)} className={glassBtn}>
                <Save aria-hidden className="size-4" /> Save
              </button>
              <button type="button" onClick={() => exitRef.current()} className={`${glassBtn} !border-accent-strong !bg-accent-strong !text-white hover:!bg-accent-strong-hover`}>
                <Check aria-hidden className="size-4" /> Done
              </button>
            </div>
          )}

          {/* Sound on/off */}
          <button
            type="button"
            onClick={() => {
              setMuted(!muted);
              if (muted) playSound("pop");
            }}
            aria-label={muted ? "Turn desk sounds on" : "Mute desk sounds"}
            title={muted ? "Turn desk sounds on" : "Mute desk sounds"}
            className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-fg/30 hover:text-fg active:scale-95"
          >
            {muted ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}
          </button>
          {/* The panda moves continuously, so it gets a pause control (shared with the hero) */}
          <MotionPauseButton className="absolute right-16 top-3 z-20" />

          {/* Keyboard access to the desk objects */}
          {!focus && (
            <div className="sr-only flex gap-2 focus-within:not-sr-only focus-within:absolute focus-within:bottom-3 focus-within:left-3 focus-within:z-20 focus-within:flex-wrap">
              {(
                [
                  ["laptop", "Use the laptop"],
                  ["calc", "Use the calculator"],
                  ["paper", "Write on the paper"],
                  ["drawer0", "Open top drawer"],
                  ["drawer1", "Open middle drawer"],
                  ["drawer2", "Open bottom drawer"],
                  ...wallFrames.map((w) => [w.id, `View certificate: ${w.title}`]),
                ] as [DeskFocus, string][]
              ).map(([f, label]) => (
                <button key={f} type="button" onClick={() => enterRef.current(f)} className={glassBtn}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div
        aria-hidden
        className={`${showChip ? "" : "hidden "}pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-[0_10px_30px_-12px_rgb(80_60_40/0.35)] transition-all duration-500 sm:top-[3%] ${
          chip ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        {chipText || " "}
      </div>
      <p className="sr-only">
        Animated illustration of a panda in an orange scarf at a desk, currently:{" "}
        {PANDA_TASKS.find((x) => x.id === task)?.label.toLowerCase()}.
      </p>
    </div>
  );
}
