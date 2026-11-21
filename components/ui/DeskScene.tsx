"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { PANDA_EVENT, type PandaEvent, type PandaReaction } from "@/lib/panda";

/**
 * Original 3D panda working at a desk (three.js).
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
  glasses: "#2f3340",
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
    const camBase = compact ? new THREE.Vector3(1.6, 1.75, 2.6) : new THREE.Vector3(2.3, 1.85, 3.3);
    const lookAt = compact ? new THREE.Vector3(0, 1.0, -0.45) : new THREE.Vector3(0, 0.66, -0.2);

    /* ───── Lights ───── */
    scene.add(new THREE.HemisphereLight("#fff6ee", "#d6ccc2", 1.25));
    const key = new THREE.DirectionalLight("#fff1e2", 2.1);
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
    const fur = mat(C.fur, 0.85);
    const black = mat(C.black, 0.8);

    // legs: black fur, rounded paws
    for (const sx of [-0.1, 0.1]) {
      const thigh = add(panda, new THREE.CapsuleGeometry(0.085, 0.26, 6, 12), black, sx, 0.56, 0.12);
      thigh.rotation.x = Math.PI / 2;
      const shin = add(panda, new THREE.CapsuleGeometry(0.075, 0.34, 6, 12), black, sx, 0.33, 0.3);
      shin.rotation.x = 0.08;
      add(panda, new THREE.SphereGeometry(0.085, 16, 12), black, sx, 0.07, 0.36).scale.set(1, 0.75, 1.3);
    }
    add(panda, new THREE.CapsuleGeometry(0.16, 0.12, 6, 14), fur, 0, 0.58, -0.02).rotation.z = Math.PI / 2;

    // torso (pivot at the hips): round white belly
    const torso = new THREE.Group();
    torso.position.set(0, 0.6, -0.04);
    panda.add(torso);
    add(torso, new THREE.CapsuleGeometry(0.21, 0.26, 8, 18), fur, 0, 0.24, 0).scale.set(1.08, 1, 0.9);
    // orange scarf
    const scarf = add(torso, new THREE.TorusGeometry(0.12, 0.04, 12, 28), mat(C.scarf, 0.8), 0, 0.46, 0);
    scarf.rotation.x = Math.PI / 2;
    const scarfTail = add(torso, new RoundedBoxGeometry(0.07, 0.16, 0.03, 2, 0.012), mat(C.scarf, 0.8), 0.07, 0.36, 0.17);
    scarfTail.rotation.z = 0.25;

    // head
    const neck = new THREE.Group();
    neck.position.set(0, 0.5, 0.01);
    torso.add(neck);
    const head = new THREE.Group();
    head.position.set(0, 0.05, 0);
    neck.add(head);
    add(head, new THREE.SphereGeometry(0.2, 40, 30), fur, 0, 0.17, 0).scale.set(1.08, 1, 0.98);
    for (const ex of [-0.15, 0.15]) add(head, new THREE.SphereGeometry(0.068, 20, 16), black, ex, 0.335, -0.02).scale.set(1, 1, 0.7); // ears
    // eye patches (tilted, panda-style)
    for (const sx of [-1, 1]) {
      const patch = add(head, new THREE.SphereGeometry(0.052, 20, 16), black, sx * 0.075, 0.175, 0.165);
      patch.scale.set(1, 1.3, 0.5);
      patch.rotation.z = -sx * 0.55;
      patch.castShadow = false;
    }
    // eyes: white + pupil + highlight (pupils follow the mouse)
    const eyeWhite = mat("#ffffff", 0.3);
    const pupilMat = mat("#111013", 0.2);
    type Eye = { group: THREE.Group; pupil: THREE.Mesh };
    const eyes: Eye[] = [-1, 1].map((sx) => {
      const group = new THREE.Group();
      group.position.set(sx * 0.072, 0.178, 0.188);
      head.add(group);
      const w = add(group, new THREE.SphereGeometry(0.022, 16, 12), eyeWhite, 0, 0, 0);
      w.castShadow = false;
      const pupil = add(group, new THREE.SphereGeometry(0.0135, 14, 10), pupilMat, 0, 0, 0.012);
      pupil.castShadow = false;
      const hl = add(pupil, new THREE.SphereGeometry(0.004, 8, 8), new THREE.MeshBasicMaterial({ color: "#ffffff" }), 0.004, 0.005, 0.011);
      hl.castShadow = false;
      return { group, pupil };
    });
    // muzzle, nose, mouth
    add(head, new THREE.SphereGeometry(0.075, 24, 16), fur, 0, 0.1, 0.15).scale.set(1.25, 0.8, 0.75);
    add(head, new THREE.SphereGeometry(0.024, 16, 12), black, 0, 0.125, 0.205).scale.set(1.4, 0.85, 1);
    const smile = add(head, new THREE.TorusGeometry(0.026, 0.006, 8, 20, Math.PI), mat("#3a2a2a", 0.5), 0, 0.093, 0.2);
    smile.rotation.z = Math.PI;
    smile.castShadow = false;
    for (const cx of [-0.13, 0.13]) {
      const cheek = add(head, new THREE.CircleGeometry(0.022, 20), new THREE.MeshBasicMaterial({ color: "#f3a08c", transparent: true, opacity: 0.6 }), cx, 0.11, 0.17);
      cheek.rotation.y = cx > 0 ? 0.6 : -0.6;
      cheek.castShadow = false;
    }
    // round glasses
    const glassMat = mat(C.glasses, 0.35, 0.3);
    for (const sx of [-1, 1]) {
      const ring = add(head, new THREE.TorusGeometry(0.048, 0.006, 10, 32), glassMat, sx * 0.075, 0.178, 0.2);
      ring.castShadow = false;
    }
    add(head, new THREE.CylinderGeometry(0.004, 0.004, 0.05, 8), glassMat, 0, 0.185, 0.205).rotation.z = Math.PI / 2;

    // arms: black, shoulder → upper arm → elbow → forearm → paw
    type Arm = { shoulder: THREE.Group; elbow: THREE.Group };
    const makeArm = (side: 1 | -1): Arm => {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.4, 0);
      torso.add(shoulder);
      add(shoulder, new THREE.SphereGeometry(0.085, 16, 12), black, 0, 0, 0);
      add(shoulder, new THREE.CapsuleGeometry(0.068, 0.15, 6, 12), black, 0, -0.12, 0);
      const elbow = new THREE.Group();
      elbow.position.set(0, -0.24, 0);
      shoulder.add(elbow);
      add(elbow, new THREE.CapsuleGeometry(0.06, 0.16, 6, 12), black, 0, -0.11, 0);
      add(elbow, new THREE.SphereGeometry(0.065, 14, 12), black, 0, -0.24, 0).scale.set(1, 0.85, 1.1);
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
      <p className="sr-only">Animated illustration of a panda wearing glasses, working on a laptop at a desk.</p>
    </div>
  );
}
