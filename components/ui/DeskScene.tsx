"use client";

import { ArrowLeft, Check, Eraser, Save, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { scrollToSection } from "@/lib/assistant/navigate";
import { isMotionPaused, onMotionPausedChange } from "@/lib/motionPause";
import { MotionPauseButton } from "./MotionPauseButton";
import { site } from "@/lib/content";
import { Calculator, keyFromKeyboard, type CalcKey } from "./desk/calculator";
import { quadToMatrix3d, type Pt } from "./desk/homography";
import { LaptopOS } from "./desk/LaptopOS";
import { NOTE_FONT, NOTE_LINE, NOTE_PAD_TOP, NOTE_PAD_X, PAPER_H, PAPER_W, PaperNote } from "./desk/PaperNote";
import { isMuted, onMutedChange, playSound, setMuted } from "./desk/sound";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
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
  fur: "#f7f5f1",
  black: "#1d1c22",
  scarf: "#ea7a2c",
  chair: "#2f3340",
  chairMetal: "#9aa0ab",
  desk: "#f6f3ef",
  deskSide: "#ddd5cc",
  laptop: "#c9ccd3",
  mug: "#ffffff",
  pot: "#d9774b",
  leaf: "#4f9d69",
  paper: "#fbfaf7",
  accent: "#fe4f02",
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
export type DeskFocus = "laptop" | "calc" | "paper" | "drawer0" | "drawer1" | "drawer2";

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
};

const NOTE_KEY = "desk-note";

export function DeskScene({
  className = "",
  variant = "desk",
  task = "invoice",
  showChip = true,
  interactive = variant === "desk",
  onFocusChange,
}: {
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
  const hoverLabelRef = useRef<HTMLDivElement>(null);
  const laptopLayerRef = useRef<HTMLDivElement>(null);
  const paperLayerRef = useRef<HTMLDivElement>(null);
  const paperInputRef = useRef<HTMLTextAreaElement>(null);
  const exitRef = useRef<() => void>(() => {});
  const enterRef = useRef<(f: DeskFocus) => void>(() => {});
  const drawNoteRef = useRef<(text: string, animate: boolean) => void>(() => {});
  const laptopScaleRef = useRef(1);
  const noteRef = useRef(note);
  noteRef.current = note;
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;
  const prevFocus = useRef<DeskFocus | null>(null);

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
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    const compact = variant !== "desk";
    const camBase =
      variant === "avatar"
        ? new THREE.Vector3(0.62, 1.5, 0.75) // close-up on the head (chat header)
        : compact
          ? new THREE.Vector3(1.7, 1.9, 2.8)
          : new THREE.Vector3(2.3, 1.85, 3.3);
    const lookAt =
      variant === "avatar"
        ? new THREE.Vector3(0, 1.22, -0.6)
        : compact
          ? new THREE.Vector3(0, 1.08, -0.45)
          : new THREE.Vector3(0, 0.66, -0.2);

    // Lights
    // Soft studio reflections so the fur sheen and glossy eyes/nose read well.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight("#fff6ee", "#d6ccc2", 0.85));
    const rim = new THREE.DirectionalLight("#ffe6d2", 1.4);
    rim.position.set(-1.5, 2.6, -3.5);
    scene.add(rim);
    const key = new THREE.DirectionalLight("#fff1e2", 1.9);
    key.position.set(2.5, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5 });
    key.shadow.radius = 6;
    key.shadow.bias = -0.0005;
    scene.add(key);
    const fill = new THREE.DirectionalLight("#dfe8ff", 0.6);
    fill.position.set(-3, 2, 1);
    scene.add(fill);

    const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    // Floor shadow catcher + soft contact glow
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.13 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
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
      new THREE.PlaneGeometry(3.4, 2.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, 0.002, -0.2);
    scene.add(glow);

    // Desk
    const desk = new THREE.Group();
    scene.add(desk);
    add(desk, new RoundedBoxGeometry(1.7, 0.06, 0.8, 4, 0.025), mat(C.desk, 0.5), 0, 0.72, 0);
    add(desk, new RoundedBoxGeometry(0.06, 0.69, 0.72, 3, 0.02), mat(C.deskSide), -0.78, 0.345, 0);
    add(desk, new RoundedBoxGeometry(0.42, 0.62, 0.7, 3, 0.03), mat(C.deskSide), 0.6, 0.33, 0.0);

    /*
     * Drawers: the pedestal's three handles now belong to real drawers that slide out.
     * Closed, they look exactly like the original pedestal; each has its own contents.
     * Index 0 = top drawer.
     */
    const handleMat = mat("#b9b0a6");
    const drawerInner = mat("#e9e2d9", 0.8);
    const cavityMat = mat("#4a423b", 0.9);
    const DRAWER_Y = [0.525, 0.335, 0.145];
    const drawers = DRAWER_Y.map((y, i) => {
      add(desk, new THREE.PlaneGeometry(0.4, 0.18), cavityMat, 0.6, y, 0.3505).castShadow = false; // dark opening behind it
      const g = new THREE.Group();
      g.position.set(0.6, y, 0);
      desk.add(g);
      add(g, new RoundedBoxGeometry(0.4, 0.18, 0.014, 2, 0.006), mat(C.deskSide), 0, 0, 0.357);
      add(g, new RoundedBoxGeometry(0.16, 0.02, 0.02, 2, 0.008), handleMat, 0, 0.035, 0.374);
      add(g, new THREE.BoxGeometry(0.38, 0.008, 0.3), drawerInner, 0, -0.075, 0.2);
      for (const sx of [-1, 1]) add(g, new THREE.BoxGeometry(0.008, 0.12, 0.3), drawerInner, sx * 0.186, -0.015, 0.2);
      add(g, new THREE.BoxGeometry(0.38, 0.12, 0.008), drawerInner, 0, -0.015, 0.054);
      return { group: g, id: `drawer${i}` as DeskFocus, open: false, t: 0, items: [] as THREE.Object3D[] };
    });
    const canvasTex = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      draw(cv.getContext("2d")!);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      return t;
    };
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
    const laptop = new THREE.Group();
    laptop.position.set(-0.05, 0.75, -0.12);
    desk.add(laptop);
    add(laptop, new RoundedBoxGeometry(0.5, 0.025, 0.34, 3, 0.01), mat(C.laptop, 0.35, 0.4), 0, 0.012, 0);
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.025, 0.16);
    lidPivot.rotation.x = 0.28;
    laptop.add(lidPivot);
    add(lidPivot, new RoundedBoxGeometry(0.5, 0.33, 0.018, 3, 0.01), mat(C.laptop, 0.35, 0.4), 0, 0.165, 0);
    const logo = add(lidPivot, new THREE.CircleGeometry(0.03, 32), new THREE.MeshBasicMaterial({ color: C.accent }), 0, 0.17, 0.0101);
    logo.castShadow = false;
    // The display on the inside of the lid (faces the panda until the laptop is turned around).
    const SCREEN_W = 0.46;
    const SCREEN_H = 0.29;
    const screen = add(
      lidPivot,
      new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      new THREE.MeshBasicMaterial({
        map: canvasTex(512, 323, (c) => {
          const gr = c.createRadialGradient(410, 30, 10, 300, 120, 520);
          gr.addColorStop(0, "#ffd2c0");
          gr.addColorStop(0.35, "#ff9a6b");
          gr.addColorStop(0.7, "#fe4f02");
          gr.addColorStop(1, "#b83400");
          c.fillStyle = gr;
          c.fillRect(0, 0, 512, 323);
          c.fillStyle = "rgba(255,255,255,0.55)";
          c.fillRect(0, 297, 512, 26);
          c.fillStyle = "rgba(255,255,255,0.85)";
          for (let k = 0; k < 5; k++) c.fillRect(14, 14 + k * 46, 30, 30);
        }),
      }),
      0,
      0.165,
      -0.0095,
    );
    screen.rotation.y = Math.PI;
    screen.castShadow = false;
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
    add(mug, new THREE.CylinderGeometry(0.048, 0.044, 0.11, 24), mat(C.mug, 0.4), 0, 0.055, 0);
    add(mug, new THREE.CylinderGeometry(0.041, 0.041, 0.005, 24), mat("#5a3a26", 0.3), 0, 0.108, 0);
    const handle = add(mug, new THREE.TorusGeometry(0.03, 0.009, 10, 20, Math.PI), mat(C.mug, 0.4), 0.05, 0.055, 0);
    handle.rotation.z = -Math.PI / 2;
    add(mug, new THREE.CylinderGeometry(0.049, 0.049, 0.02, 24), mat(C.accent, 0.5), 0, 0.07, 0);
    const steamMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.35, depthWrite: false });
    const steam = [0, 1, 2].map((i) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), steamMat.clone());
      s.position.set(0, 0.14 + i * 0.07, 0);
      mug.add(s);
      return s;
    });

    const papers = new THREE.Group();
    papers.position.set(0.5, 0.75, 0.22);
    desk.add(papers);
    for (let i = 0; i < 5; i++) {
      const p = add(papers, new THREE.BoxGeometry(0.22, 0.008, 0.29), mat(C.paper, 0.9), 0, 0.004 + i * 0.009, 0);
      p.rotation.y = (i % 2 ? 1 : -1) * 0.03;
    }
    const invCanvas = document.createElement("canvas");
    invCanvas.width = 128;
    invCanvas.height = 168;
    const ic = invCanvas.getContext("2d")!;
    ic.fillStyle = "#fbfaf7";
    ic.fillRect(0, 0, 128, 168);
    ic.fillStyle = C.accent;
    ic.fillRect(12, 14, 46, 10);
    ic.fillStyle = "#c9c3bb";
    for (let r = 0; r < 6; r++) ic.fillRect(12, 40 + r * 16, r % 2 ? 80 : 104, 5);
    ic.fillStyle = "#2f3340";
    ic.fillRect(70, 140, 46, 9);
    const invoice = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.29),
      new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(invCanvas), roughness: 0.9 }),
    );
    invoice.rotation.x = -Math.PI / 2;
    invoice.rotation.z = 0.12;
    invoice.position.set(0, 0.05, 0);
    invoice.receiveShadow = true;
    papers.add(invoice);
    const invoiceMat = invoice.material as THREE.MeshStandardMaterial;
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
    add(phone, new RoundedBoxGeometry(0.056, 0.012, 0.112, 3, 0.005), mat("#22232a", 0.3, 0.3));
    const phoneScreenMat = new THREE.MeshStandardMaterial({ color: "#1a2233", emissive: "#6fb2ff", emissiveIntensity: 0, roughness: 0.2 });
    const phoneScreen = add(phone, new THREE.PlaneGeometry(0.046, 0.098), phoneScreenMat, 0, 0.0065, 0);
    phoneScreen.rotation.x = -Math.PI / 2;
    phoneScreen.castShadow = false;
    // phone long axis (z) follows the forearm when held
    const phoneHoldOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

    // Calculator: the left paw taps it while reconciling; its display really counts.
    const calc = new THREE.Group();
    calc.position.set(0.42, 0.75, -0.27);
    calc.rotation.y = -0.2;
    desk.add(calc);
    add(calc, new RoundedBoxGeometry(0.13, 0.02, 0.17, 3, 0.008), mat("#3a3d48", 0.5), 0, 0.01, 0);
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
        const mesh = add(calc, keyGeo, mat(bg, 0.55), 0.042 - v * 0.028, 0.0225, 0.022 - r * 0.0235);
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
    const calcScreen = add(calc, new THREE.PlaneGeometry(0.104, 0.033), new THREE.MeshBasicMaterial({ map: calcTex }), 0, 0.0205, 0.052);
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
    add(plant, new THREE.CylinderGeometry(0.075, 0.06, 0.13, 24), mat(C.pot, 0.7), 0, 0.065, 0);
    const leafMat = mat(C.leaf, 0.55);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const leaf = add(plant, new THREE.SphereGeometry(0.06, 16, 12), leafMat, Math.cos(a) * 0.05, 0.16 + (i % 3) * 0.04, Math.sin(a) * 0.05);
      leaf.scale.set(0.6, 1.4, 0.35);
      leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    }

    // Chair
    const chair = new THREE.Group();
    chair.position.set(0, 0, -0.68);
    scene.add(chair);
    const chairMat = mat(C.chair, 0.55);
    const metal = mat(C.chairMetal, 0.3, 0.7);
    add(chair, new RoundedBoxGeometry(0.52, 0.08, 0.5, 4, 0.035), chairMat, 0, 0.46, 0);
    const back = add(chair, new RoundedBoxGeometry(0.5, 0.58, 0.08, 4, 0.035), chairMat, 0, 0.82, -0.25);
    back.rotation.x = -0.1;
    add(chair, new THREE.CylinderGeometry(0.025, 0.025, 0.32, 12), metal, 0, 0.27, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const leg = add(chair, new RoundedBoxGeometry(0.3, 0.03, 0.04, 2, 0.012), metal, Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15);
      leg.rotation.y = -a;
      add(chair, new THREE.SphereGeometry(0.03, 12, 12), chairMat, Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29);
    }

    // Panda (faces +z, sits on the chair)
    const panda = new THREE.Group();
    panda.position.set(0, 0, -0.66);
    scene.add(panda);

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
        // only pass texture maps when there is one (three.js warns about `undefined` parameters)
        ...(map ? { map, sheenColorMap: map } : {}),
        roughness: 0.92,
        sheen,
        sheenRoughness: 0.55,
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
    for (const sx of [-1, 1]) {
      fc.save();
      fc.translate(fx(sx * 0.4), fy(-0.02));
      fc.rotate(-sx * 0.5);
      fc.fillStyle = C.black;
      if ("filter" in fc) fc.filter = "blur(1.5px)";
      fc.beginPath();
      fc.ellipse(0, 0, 0.23 * PX, 0.33 * PX, 0, 0, Math.PI * 2);
      fc.fill();
      fc.restore();
      // blush
      const bx = fx(sx * 0.68);
      const by = fy(-0.22);
      const blush = fc.createRadialGradient(bx, by, 0, bx, by, 0.12 * PX);
      blush.addColorStop(0, "rgba(242,150,140,0.55)");
      blush.addColorStop(1, "rgba(242,150,140,0)");
      fc.fillStyle = blush;
      fc.fillRect(bx - 0.12 * PX, by - 0.12 * PX, 0.24 * PX, 0.24 * PX);
    }
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 4;
    const faceMat = furMat(C.fur, "#ffffff", faceTex);

    // legs: black fur, rounded paws with pink pads
    const padMat = mat("#e9a3a0", 0.7);
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
    const scarfMat = furMat(C.scarf, "#ffd2b0");
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
    const eyeWhite = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1 });
    const pupilMat = new THREE.MeshPhysicalMaterial({ color: "#0d0c10", roughness: 0.1, clearcoat: 1 });
    type Eye = { group: THREE.Group; pupil: THREE.Mesh };
    const eyes: Eye[] = [-1, 1].map((sx) => {
      const group = new THREE.Group();
      const az = 0.38;
      group.position.set(sx * Math.sin(az) * HR * 1.1, HC + 0.012, Math.cos(az) * HR - 0.008);
      group.rotation.y = sx * az * 0.8;
      head.add(group);
      const w = add(group, new THREE.SphereGeometry(0.027, 24, 18), eyeWhite, 0, 0, 0);
      w.scale.set(1, 1.08, 0.75);
      w.castShadow = false;
      const pupil = add(group, new THREE.SphereGeometry(0.0175, 20, 14), pupilMat, 0, 0, 0.011);
      pupil.castShadow = false;
      const hl = add(pupil, new THREE.SphereGeometry(0.0048, 10, 8), new THREE.MeshBasicMaterial({ color: "#ffffff" }), 0.005, 0.006, 0.014);
      hl.castShadow = false;
      return { group, pupil };
    });
    // muzzle, nose, mouth
    add(head, new THREE.SphereGeometry(0.088, 36, 24), fur, 0, HC - 0.07, 0.165).scale.set(1.3, 0.82, 0.85);
    const nose = add(
      head,
      new THREE.SphereGeometry(0.026, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: "#16151a", roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.2 }),
      0,
      HC - 0.045,
      0.238,
    );
    nose.scale.set(1.45, 0.9, 0.9);
    const smile = add(head, new THREE.TorusGeometry(0.024, 0.0055, 10, 24, Math.PI), mat("#2a2228", 0.5), 0, HC - 0.083, 0.236);
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

    // Interaction state
    const pointer = new THREE.Vector2(0, 0);
    const pointerSmooth = new THREE.Vector2(0, 0);
    let hovered = false;
    let attention = 0; // smoothed 0..1
    let reaction: { type: PandaReaction; t0: number } | null = null;
    let mood: PandaMood = getPandaMood();
    const clock = new THREE.Clock();

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
    if (interactive) {
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
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || o === floor || o === glow) return;
      if ((m.material as THREE.Material).transparent && !o.userData.hit) return;
      solids.push(o);
    });
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
        if (id === "calc" || id.startsWith("key:")) return interactive ? "calc" : null;
        if (id === "laptop" || id === "paper" || id.startsWith("drawer")) return id;
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
      else if (target === "laptop") root = laptop;
      else if (target === "paper") root = papers;
      else if (target.startsWith("key:")) root = keys.find((k) => `key:${k.key}` === target)?.mesh;
      else if (target.startsWith("drawer")) root = drawers.find((d) => d.id === target)?.group;
      else if (target.startsWith("item:")) root = drawers.flatMap((d) => d.items).find((i) => i.name === target.slice(5));
      const out: THREE.Mesh[] = [];
      root?.traverse((o) => {
        if (!(o as THREE.Mesh).isMesh) return;
        if (target.startsWith("drawer") && String(o.userData.hit).startsWith("item:")) return;
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
    const freePose = (): Pose => ({
      pos: camHome.clone().add(new V3(pointerSmooth.x * 0.2, -pointerSmooth.y * 0.12, 0)),
      target: lookAt.clone(),
      up: new V3(0, 1, 0),
    });
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
        laptop.rotation.y = Math.PI;
        const p = planePose(screen, SCREEN_W, SCREEN_H, 0.84);
        laptop.rotation.y = ry;
        laptop.updateWorldMatrix(false, true);
        return p;
      }
      if (f === "paper") return planePose(invoice, 0.22, 0.29, 0.8);
      if (f === "calc") {
        const c = calc.localToWorld(new V3(0, 0.02, -0.004));
        const up = new V3(0, 0, 1).applyQuaternion(calc.getWorldQuaternion(new THREE.Quaternion()));
        return { pos: c.clone().add(new V3(0, fitDist(0.13, 0.17, 0.7), 0)), target: c, up };
      }
      const i = Number(f.slice(6));
      const c = new V3(0.6, DRAWER_Y[i] - 0.04, 0.5);
      const dir = new V3(0, 0.92, 0.4).normalize(); // steep enough to see over the drawer front
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
    const exitFocus = () => {
      if (!focusId) return;
      if (focusId.startsWith("drawer")) playSound("drawer");
      else playSound("close");
      drawers.forEach((d) => (d.open = false));
      focusId = null;
      setHover(null);
      startCam(freePose);
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
        setTimeout(() => scrollToSection("work"), 700);
      }
    };
    const activate = (target: string) => {
      if (target === "panda") return onPandaClicked();
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
        const w = (weights[k] / total) * (1 - moodAmt);
        if (w > 0.001) addPose(TASK_POSES[k](t), w);
      }
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
      const idleWave = quiet ? 0 : pulse(t % 12, 7.2, 2.8) * (1 - weights.call);
      const wave = Math.max(idleWave, clickWave);
      const glanceIdle = quiet ? 0 : pulse(t % 12, 1.4, 1.2) * 0.5;

      // Attention: looking at the visitor (hover, waves, reactions, listening/talking).
      const targetAttention = Math.max((hovered ? 1 : 0) * (1 - asleep), wave, cheer, surprised, glanceIdle, base.look, confused, dance);
      attention = lerp(attention, targetAttention, ease(5));

      // Where the visitor is: towards the camera, nudged by the mouse.
      const px = clamp(pointerSmooth.x, -1.6, 1.6);
      const py = clamp(pointerSmooth.y, -1.6, 1.6);
      const lookYaw = 0.42 + px * 0.35;
      const lookPitch = -0.08 + py * 0.22;
      // Even while working, the head drifts a little towards the mouse.
      const follow = 1 - asleep;
      const workYaw = base.hy + px * 0.12 * follow;
      const workPitch = base.hx + py * 0.05 * follow;

      head.rotation.x =
        lerp(workPitch, lookPitch, attention) + Math.sin(t * 0.7) * 0.02 + Math.sin(rt * 14) * 0.18 * nod - think * 0.15 +
        Math.sin(t * 10) * 0.08 * dance;
      head.rotation.y = lerp(workYaw, lookYaw, attention) - think * 0.25 + Math.sin(t * 9) * 0.25 * dizzy;
      head.rotation.z =
        lerp(base.hz, base.hz * 0.6, attention) + think * 0.25 + Math.sin(t * 0.5) * 0.02 + Math.sin(rt * 3.2) * 0.3 * confused +
        Math.sin(t * 6) * 0.2 * dizzy;

      // Pupils follow the mouse (swirl when dizzy, roll up when thinking).
      const eyeX = clamp(px, -1, 1) * 0.006 * follow + Math.cos(t * 14) * 0.007 * dizzy;
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
      chair.rotation.y = sway + spin;
      panda.rotation.y = sway * 0.8 + spin;
      panda.position.y =
        Math.abs(Math.sin(t * 8.5)) * 0.002 * weights.invoice * (1 - busy) * (1 - moodAmt) +
        Math.abs(Math.sin(rt * 9)) * 0.05 * cheer +
        Math.abs(Math.sin(t * 7)) * 0.035 * dance;

      // Props follow the paws while held (phone in the left on calls, mug in the right on coffee breaks).
      panda.updateMatrixWorld(true);
      // Put props down for moods and chair spins.
      const propFree = (1 - moodAmt) * (spin ? 0 : 1) * (1 - focusW);
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
        s.position.set(Math.sin(u * 6 + i) * 0.015, 0.13 + u * 0.22, 0);
        s.scale.setScalar(0.6 + u * 1.2);
        (s.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - u) * Math.min(1, u * 5) * (1 - base.sip);
      });

      screenLight.color.copy(screenBlue).lerp(screenCrm, weights.crm * (1 - moodAmt));
      screenLight.intensity = (0.55 + Math.sin(t * 3) * 0.05 + weights.crm * 0.35) * (1 - asleep * 0.6);

      /* Desk objects */
      const toward = (cur: number, target: number, rate: number) => (reduce ? target : cur + (target - cur) * ease(rate));
      // The laptop turns round to face the visitor while it's in use.
      laptopSpin = toward(laptopSpin, focusId === "laptop" ? 1 : 0, 3.4);
      laptop.rotation.y = smooth(clamp(laptopSpin, 0, 1)) * Math.PI;
      // Drawers slide on their runners.
      drawers.forEach((d) => {
        d.t = toward(d.t, d.open ? 1 : 0, 5);
        d.group.position.z = 0.3 * smooth(clamp(d.t, 0, 1));
      });
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
      laptopSpin < 0.001 &&
      drawers.every((d) => d.t < 0.001) &&
      keys.every((k) => clock.getElapsedTime() - k.pressedAt > 0.2);
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (motionPaused && settled() && !ptr.dirty) return;
      pointerSmooth.lerp(pointer, 0.06);
      pose(clock.getElapsedTime());
      draw();
    };

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
    if (reduce) renderOnce();
    else loop();

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(mount);

    return () => {
      redrawRef.current = null;
      cancelAnimationFrame(frame);
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
          const m = o.material as THREE.Material & { map?: THREE.Texture };
          m.map?.dispose();
          m.dispose();
        }
      });
      zSprites.forEach((s) => s.material.dispose());
      zTex.dispose();
      envTex.dispose();
      furNoise.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, interactive]);

  const glassBtn =
    "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-fg shadow-[0_8px_20px_-12px_rgb(80_60_40/0.45)] transition-colors hover:border-fg/30 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <div
      className={`relative overflow-hidden ${className} ${fullscreen ? "!fixed !inset-0 z-[80] !m-0 !aspect-auto !h-[100svh] !w-screen !max-w-none bg-ink" : ""}`}
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
                  setTimeout(() => scrollToSection(id), 700);
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
