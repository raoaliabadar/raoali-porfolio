"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { PANDA_EVENT, type PandaEvent, type PandaReaction } from "@/lib/panda";

/**
 * Original 3D panda working at a desk (three.js): soft sheen fur, painted face, glossy eyes.
 *
 * Idle: types on a laptop, breathes, blinks, glances up and waves now and then.
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

const STATUSES = ["Invoice sent ✓", "CRM record updated", "Workflow automated", "Report ready"];

const REACTION_LENGTH: Record<PandaReaction, number> = {
  cheer: 1.9,
  nod: 1.2,
  think: 1.8,
  surprised: 1.3,
  wave: 2.4,
};

type Variant = "desk" | "compact";

export function DeskScene({
  className = "",
  variant = "desk",
  cycleStatus = true,
}: {
  className?: string;
  /** "desk" shows the whole scene; "compact" frames the panda's upper body. */
  variant?: Variant;
  /** Show the cycling work-status chip. */
  cycleStatus?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [chipText, setChipText] = useState("");
  const chipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashChip = (text: string, ms = 2400) => {
    setChip(text);
    setChipText(text);
    if (chipTimer.current) clearTimeout(chipTimer.current);
    chipTimer.current = setTimeout(() => setChip(null), ms);
  };

  // Cycle the little work-status chip.
  useEffect(() => {
    if (!cycleStatus) return;
    let i = 0;
    const show = () => flashChip(STATUSES[i++ % STATUSES.length], 2600);
    const first = setTimeout(show, 1800);
    const t = setInterval(show, 5200);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [cycleStatus]);

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
    const compact = variant === "compact";
    const camBase = compact ? new THREE.Vector3(1.7, 1.9, 2.8) : new THREE.Vector3(2.3, 1.85, 3.3);
    const lookAt = compact ? new THREE.Vector3(0, 1.08, -0.45) : new THREE.Vector3(0, 0.66, -0.2);

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
    const mug = new THREE.Group();
    mug.position.set(-0.4, 0.75, 0.12);
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

    const plant = new THREE.Group();
    plant.position.set(-0.66, 0.75, -0.18);
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
    const clock = new THREE.Clock();

    const onPointer = (e: PointerEvent) => {
      const r = mount.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    };
    const onEnter = () => (hovered = true);
    const onLeave = () => (hovered = false);
    const react = (type: PandaReaction) => (reaction = { type, t0: clock.getElapsedTime() });
    const onClick = () => {
      react("wave");
      flashChip("Hi there! 👋");
    };
    const onEvent = (e: Event) => {
      const d = (e as CustomEvent<PandaEvent>).detail;
      if (!d) return;
      react(d.type);
      if (d.message) flashChip(d.message);
      if (reduce) renderOnce();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    mount.addEventListener("pointerenter", onEnter);
    mount.addEventListener("pointerleave", onLeave);
    mount.addEventListener("click", onClick);
    window.addEventListener(PANDA_EVENT, onEvent);

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

    const pose = (t: number) => {
      // Reaction weights
      const rt = reaction ? t - reaction.t0 : 99;
      const rw = (type: PandaReaction) => (reaction?.type === type ? pulse(rt, 0, REACTION_LENGTH[type]) : 0);
      const cheer = rw("cheer");
      const nod = rw("nod");
      const think = rw("think");
      const surprised = rw("surprised");
      const clickWave = rw("wave");
      if (reaction && rt > REACTION_LENGTH[reaction.type]) reaction = null;

      const breathe = Math.sin(t * 1.6);
      torso.scale.set(1 + breathe * 0.008, 1 + breathe * 0.012, 1);
      torso.rotation.x = 0.12 + breathe * 0.01 - surprised * 0.12;

      // Scheduled idle wave every 9 s (suppressed while hovered/reacting).
      const idleWave = hovered || reaction ? 0 : pulse(t % 9, 5.2, 2.8);
      const wave = Math.max(idleWave, clickWave);
      const glanceIdle = hovered || reaction ? 0 : pulse(t % 9, 1.4, 1.2) * 0.5;

      // Attention: looking at the visitor (hover, waves, reactions).
      const targetAttention = Math.max(hovered ? 1 : 0, wave, cheer, surprised, glanceIdle);
      attention = lerp(attention, targetAttention, 0.08);

      // Where "the visitor" is: towards the camera, nudged by the mouse.
      const px = clamp(pointerSmooth.x, -1.6, 1.6);
      const py = clamp(pointerSmooth.y, -1.6, 1.6);
      const lookYaw = 0.42 + px * 0.35;
      const lookPitch = -0.08 + py * 0.22;
      // Even while working, the head drifts a little towards the mouse.
      const workYaw = px * 0.12;
      const workPitch = 0.32 + py * 0.05;

      head.rotation.x =
        lerp(workPitch, lookPitch, attention) + Math.sin(t * 0.7) * 0.02 + Math.sin(rt * 14) * 0.18 * nod - think * 0.15;
      head.rotation.y = lerp(workYaw, lookYaw, attention) - think * 0.25;
      head.rotation.z = think * 0.25 + Math.sin(t * 0.5) * 0.02;

      // Pupils follow the mouse.
      const eyeX = clamp(px, -1, 1) * 0.006;
      const eyeY = -clamp(py, -1, 1) * 0.005 + think * 0.006;
      eyes.forEach(({ pupil }) => pupil.position.set(eyeX, eyeY, 0.012));

      // Expressions
      const happy = Math.max(attention * 0.6, cheer, wave);
      smile.scale.set(1 + happy * 0.4 - surprised * 0.3, 1 + happy * 0.7 + surprised * 0.6, 1);
      const eyeOpen = 1 + surprised * 0.35;

      // Blink every ~3.4 s.
      const b = t % 3.4;
      const blink = b > 3.25 && !surprised ? Math.sin(((b - 3.25) / 0.15) * Math.PI) : 0;
      eyes.forEach(({ group }) => group.scale.set(eyeOpen, eyeOpen * (1 - blink * 0.9), eyeOpen));

      // Arms: typing pose with alternating taps; blend to wave / cheer.
      const busy = Math.max(wave, cheer);
      const tapL = Math.sin(t * 17) * 0.07 * (1 - busy) * (1 - think);
      const tapR = Math.sin(t * 17 + Math.PI) * 0.07 * (1 - cheer) * (1 - think);
      const typeShoulderX = -0.62;
      const typeElbowX = -0.95;

      // Right arm: typing → chin-scratch when thinking → raised when cheering.
      armR.shoulder.rotation.set(
        lerp(lerp(typeShoulderX, -1.3, think), -0.35, cheer),
        lerp(0, 0.3, cheer),
        lerp(-0.12, -2.5, cheer),
      );
      armR.elbow.rotation.set(
        lerp(lerp(typeElbowX + tapR, -1.9, think), -0.2, cheer),
        0,
        lerp(0.1, -0.45 - Math.sin(t * 12) * 0.2, cheer),
      );

      // Left arm: typing → wave / cheer.
      armL.shoulder.rotation.set(lerp(typeShoulderX, -0.35, busy), lerp(0, -0.3, busy), lerp(0.12, 2.5, busy));
      armL.elbow.rotation.set(
        lerp(typeElbowX + tapL, -0.2, busy),
        0,
        lerp(-0.1, 0.45 + Math.sin(t * 11) * 0.38 * Math.max(wave, cheer * 0.6), busy),
      );

      // Chair sway, typing bob, cheer bounce.
      const sway = Math.sin(t * 0.45) * 0.05;
      chair.rotation.y = sway;
      panda.rotation.y = sway * 0.8;
      panda.position.y = Math.abs(Math.sin(t * 8.5)) * 0.002 * (1 - busy) + Math.abs(Math.sin(rt * 9)) * 0.05 * cheer;

      steam.forEach((s, i) => {
        const u = (t * 0.35 + i / 3) % 1;
        s.position.set(Math.sin(u * 6 + i) * 0.015, 0.13 + u * 0.22, 0);
        s.scale.setScalar(0.6 + u * 1.2);
        (s.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - u) * Math.min(1, u * 5);
      });

      screenLight.intensity = 0.55 + Math.sin(t * 3) * 0.05;
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

    if (reduce) renderOnce();
    else loop();

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
    io.observe(mount);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(PANDA_EVENT, onEvent);
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
        className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium shadow-[0_10px_30px_-12px_rgb(80_60_40/0.35)] transition-all duration-500 sm:top-[3%] ${
          chip ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500 align-middle" />
        {chipText || " "}
      </div>
      <p className="sr-only">Animated illustration of a panda in an orange scarf, working on a laptop at a desk.</p>
    </div>
  );
}
