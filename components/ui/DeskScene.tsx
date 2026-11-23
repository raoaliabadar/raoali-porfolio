"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
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
 * Work: the `task` prop picks what it is doing — typing invoices, tapping a calculator,
 * a client phone call, reading CRM records chin-in-paw, or a coffee break — and it
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

/* Click easter eggs — shared by every panda on the page so they stay in sync. */
const CLICK_LINES: [PandaReaction, string][] = [
  ["wave", "Hi there! 👋"],
  ["cheer", "Yay, a visitor! 🎉"],
  ["nod", "Ask me anything about Rao Ali!"],
  ["spin", "Wheee! 🌀"],
  ["surprised", "Oh! You found me 👀"],
  ["wave", "Need help? Open the chat 💬"],
];
let clickTimes: number[] = [];
let lastClickLine = -1;

function onPandaClicked() {
  // A click always wakes a sleeping panda.
  if (getPandaMood() === "sleeping") {
    setPandaMood("idle");
    pandaReact("surprised", "Oh! I'm awake 👀");
    return;
  }
  const now = performance.now();
  clickTimes = clickTimes.filter((t) => now - t < 2200).concat(now);
  // Five quick clicks → the panda gets dizzy.
  if (clickTimes.length >= 5) {
    clickTimes = [];
    pandaReact("dizzy", "Okay, okay — I'm dizzy! 😵‍💫");
    return;
  }
  if (clickTimes.length === 3) {
    pandaReact("surprised", "Easy there! 😄");
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

export function DeskScene({
  className = "",
  variant = "desk",
  task = "invoice",
  showChip = true,
}: {
  className?: string;
  /** "desk" shows the whole scene; "compact" frames the panda's upper body. */
  variant?: Variant;
  /** What the panda is working on. */
  task?: PandaTask;
  /** Show the floating status / message chip above the panda. */
  showChip?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [chipText, setChipText] = useState("");
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskRef = useRef<PandaTask>(task);
  const redrawRef = useRef<(() => void) | null>(null);

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

    /* ───── Renderer / camera ───── */
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

    /* ───── Lights ───── */
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

    /* ───── Floor shadow catcher + soft contact glow ───── */
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

    /* ───── Desk ───── */
    const desk = new THREE.Group();
    scene.add(desk);
    add(desk, new RoundedBoxGeometry(1.7, 0.06, 0.8, 4, 0.025), mat(C.desk, 0.5), 0, 0.72, 0);
    add(desk, new RoundedBoxGeometry(0.06, 0.69, 0.72, 3, 0.02), mat(C.deskSide), -0.78, 0.345, 0);
    add(desk, new RoundedBoxGeometry(0.42, 0.62, 0.7, 3, 0.03), mat(C.deskSide), 0.6, 0.33, 0.0);
    for (let i = 0; i < 3; i++) add(desk, new RoundedBoxGeometry(0.16, 0.02, 0.02, 2, 0.008), mat("#b9b0a6"), 0.6, 0.18 + i * 0.19, 0.36);

    /* ───── Laptop (screen faces the panda) ───── */
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
    const screenLight = new THREE.PointLight("#9fc4ff", 0.6, 1.2);
    screenLight.position.set(0, 0.2, -0.15);
    lidPivot.add(screenLight);

    /* ───── Props ───── */
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
    const keyMat = mat("#e9e5df", 0.6);
    const keyAccent = mat(C.accent, 0.5);
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        add(calc, new RoundedBoxGeometry(0.022, 0.008, 0.02, 2, 0.003), c === 3 ? keyAccent : keyMat, -0.042 + c * 0.028, 0.022, -0.065 + r * 0.026);
    const calcCanvas = document.createElement("canvas");
    calcCanvas.width = 256;
    calcCanvas.height = 80;
    const cc = calcCanvas.getContext("2d")!;
    const calcTex = new THREE.CanvasTexture(calcCanvas);
    calcTex.colorSpace = THREE.SRGBColorSpace;
    const drawCalc = (text: string) => {
      cc.fillStyle = "#c9dcc0";
      cc.fillRect(0, 0, 256, 80);
      cc.fillStyle = "#1f2b1c";
      cc.font = "bold 46px ui-monospace, Menlo, Consolas, monospace";
      cc.textAlign = "right";
      cc.textBaseline = "middle";
      cc.fillText(text, 240, 42);
      calcTex.needsUpdate = true;
    };
    const CALC_SEQ = ["1,250.00", "+ 860.00", "+ 2,100.00", "+ 540.00", "= 4,750.00", "✓ 4,750.00", "0."];
    let calcStep = 0;
    let calcBeat = -1;
    drawCalc("0.");
    const calcScreen = add(calc, new THREE.PlaneGeometry(0.104, 0.033), new THREE.MeshBasicMaterial({ map: calcTex }), 0, 0.0205, 0.052);
    calcScreen.rotation.x = -Math.PI / 2;
    calcScreen.castShadow = false;

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

    /* ───── Chair ───── */
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

    /* ───── Panda (faces +z, sits on the chair) ───── */
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
        map,
        roughness: 0.92,
        sheen,
        sheenColorMap: map,
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

    /* ───── Interaction state ───── */
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
    const onEnter = () => (hovered = true);
    const onLeave = () => (hovered = false);
    const react = (type: PandaReaction) => (reaction = { type, t0: clock.getElapsedTime() });
    const onClick = () => onPandaClicked();
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

    /* ───── Sizing ───── */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / h;
      const pull = !compact && w / h < 1.2 ? 1.35 : 1;
      camera.position.copy(camBase).multiplyScalar(pull);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    /* ───── Animation ───── */
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
     * Assistant moods — they override the task pose while active.
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
      const propFree = (1 - moodAmt) * (spin ? 0 : 1);
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
        if (weights.reconcile > 0.6 && moodAmt < 0.3 && !reduce) drawCalc(CALC_SEQ[calcStep++ % CALC_SEQ.length]);
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
    };

    let frame = 0;
    let visible = true;
    const draw = () => {
      const base = camera.position.clone();
      camera.position.x += pointerSmooth.x * 0.2;
      camera.position.y -= pointerSmooth.y * 0.12;
      camera.lookAt(lookAt);
      renderer.render(scene, camera);
      camera.position.copy(base);
    };
    const renderOnce = () => {
      pose(reaction ? clock.getElapsedTime() : 0);
      draw();
    };
    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      pointerSmooth.lerp(pointer, 0.06);
      pose(clock.getElapsedTime());
      draw();
    };

    // Reduced motion: no loop, so redraw the still frame whenever the task changes.
    redrawRef.current = reduce ? renderOnce : null;
    if (reduce) renderOnce();
    else loop();

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(mount);

    return () => {
      redrawRef.current = null;
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(PANDA_EVENT, onEvent);
      window.removeEventListener(PANDA_MOOD_EVENT, onMood);
      mount.removeEventListener("pointerenter", onEnter);
      mount.removeEventListener("pointerleave", onLeave);
      mount.removeEventListener("click", onClick);
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
  }, [variant]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mountRef} className="absolute inset-0 cursor-pointer" title="Say hi to the panda" />
      <div
        aria-hidden
        className={`${showChip ? "" : "hidden "}pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-[0_10px_30px_-12px_rgb(80_60_40/0.35)] transition-all duration-500 sm:top-[3%] ${
          chip ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
        {chipText || " "}
      </div>
      <p className="sr-only">
        Animated illustration of a panda in an orange scarf at a desk, currently:{" "}
        {PANDA_TASKS.find((x) => x.id === task)?.label.toLowerCase()}.
      </p>
    </div>
  );
}
