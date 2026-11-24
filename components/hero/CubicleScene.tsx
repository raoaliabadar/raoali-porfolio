"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { cubicleConfig } from "@/lib/heroCubicle.config";
import { Batch, Merged } from "./batch";
import { Panda } from "./Panda";

/**
 * Isometric L-shaped cubicle with the panda at work (React Three Fiber).
 *
 * Layout (metres, y up): the cubicle corner is at (-1.3, -1.3). The left partition runs along
 * x = -1.3, the back partition along z = -1.3, and the camera looks into that corner from the front-right.
 */
const C = cubicleConfig.colors;
const W = -1.3; // left wall plane (x) and back wall plane (z)
const WALL_H = 1.65;
const DESK_Y = 0.77; // desk top surface
const PANDA = { x: -0.2, z: -0.34 }; // chair + panda, facing the monitor (-z)

export default function CubicleScene({ animate, active, onReady }: { animate: boolean; active: boolean; onReady?: () => void }) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      frameloop={animate && active ? "always" : "demand"}
      camera={{ position: [6, 5.1, 6], zoom: 100, near: 0.1, far: 50 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        onReady?.();
      }}
      aria-hidden
    >
      <FitCamera />
      <hemisphereLight args={["#ffffff", "#d9d2ee", 1.15]} />
      <directionalLight position={[4, 7, 5]} intensity={1.6} color="#fff6ec" />
      <Suspense fallback={null}>
        <Parallax animate={animate}>
          <Room />
          <Posters />
          <Screen animate={animate} />
          <DeskDisplays />
          <Chair animate={animate} />
          {/* the second panda, peeking over the back partition and waving */}
          <Panda pose="peek" outfit="scarf" animate={animate} position={[0.62, 0.5, -1.6]} rotation={[0, -0.35, 0]} />
        </Parallax>
        <ContactShadows position={[0, 0.002, 0]} scale={7} blur={2.6} far={2.5} opacity={0.35} resolution={512} frames={1} color="#3d3554" />
      </Suspense>
      <DrawCallProbe />
    </Canvas>
  );
}

/** Keep the whole cubicle in view at any canvas size (orthographic zoom). */
function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.lookAt(-0.15, 0.85, -0.15);
    cam.zoom = Math.min(size.width / 4.9, size.height / 3.9);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** The scene tilts a few degrees towards the mouse (no orbit controls). */
function Parallax({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!animate) return;
    const on = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [animate]);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g || !animate) return;
    const k = 1 - Math.exp(-dt * 3);
    g.rotation.y += (target.current.x * 0.06 - g.rotation.y) * k; // about 3.5°
    g.rotation.x += (target.current.y * 0.035 - g.rotation.x) * k;
  });
  return <group ref={group}>{children}</group>;
}

/* ───── Static geometry: partitions, desk, cabinets, computer, props (one batch) ───── */
function Room() {
  // No floor plane: the canvas is transparent, so the section's lavender shows through and
  // the contact shadows ground the furniture.
  return <Merged build={buildRoom} />;
}

function buildRoom() {
  const b = new Batch();
  const T = 0.07; // partition thickness

  // Partitions with a rounded cap and feet
  b.box([T, WALL_H, 2.75], C.partition, [W, WALL_H / 2, 0.075], 0.03);
  b.box([2.75, WALL_H, T], C.partition, [0.075, WALL_H / 2, W], 0.03);
  b.box([T + 0.02, 0.05, 2.79], C.partitionTrim, [W, WALL_H, 0.075], 0.024);
  b.box([2.79, 0.05, T + 0.02], C.partitionTrim, [0.075, WALL_H, W], 0.024);
  b.box([T + 0.08, 0.05, 2.75], C.partitionTrim, [W, 0.025, 0.075], 0.02);
  b.box([2.75, 0.05, T + 0.08], C.partitionTrim, [0.075, 0.025, W], 0.02);

  // L-shaped desk: a long top along the back wall + a return along the left wall
  b.box([2.5, 0.045, 0.72], C.desk, [-0.07, DESK_Y - 0.022, -0.95], 0.015);
  b.box([0.72, 0.045, 1.62], C.desk, [-0.95, DESK_Y - 0.022, 0.2], 0.015);

  // 3-drawer pedestal (right) and small 3-drawer unit (left)
  b.box([0.46, 0.72, 0.6], C.cabinet, [0.92, 0.36, -0.97], 0.02);
  for (let i = 0; i < 3; i++) {
    const y = 0.13 + i * 0.23;
    b.box([0.42, 0.2, 0.02], "#b6b7bf", [0.92, y, -0.665], 0.012);
    b.box([0.14, 0.022, 0.025], C.handle, [0.92, y + 0.05, -0.645], 0.01);
  }
  b.box([0.55, 0.6, 0.5], C.cabinet, [-0.98, 0.3, 0.72], 0.02);
  for (let i = 0; i < 3; i++) {
    const y = 0.1 + i * 0.19;
    b.box([0.02, 0.16, 0.46], "#b6b7bf", [-0.695, y, 0.72], 0.01);
    b.box([0.025, 0.02, 0.12], C.handle, [-0.68, y + 0.04, 0.72], 0.008);
  }

  // Retro CRT: base, body, bezel; keyboard; tower under the desk
  const mx = PANDA.x;
  b.box([0.44, 0.05, 0.4], C.crtDark, [mx, DESK_Y + 0.025, -1.06], 0.02);
  b.box([0.58, 0.48, 0.46], C.crt, [mx, DESK_Y + 0.3, -1.06], 0.06);
  b.box([0.5, 0.39, 0.02], C.crtDark, [mx, DESK_Y + 0.31, -0.825], 0.02);
  b.box([0.5, 0.028, 0.17], C.crt, [mx, DESK_Y + 0.014, -0.73], 0.01, [-0.06, 0, 0]);
  for (let r = 0; r < 3; r++) b.box([0.44, 0.012, 0.035], C.crtDark, [mx, DESK_Y + 0.032, -0.78 + r * 0.045], 0.004, [-0.06, 0, 0]);
  b.box([0.07, 0.025, 0.11], C.crt, [mx + 0.34, DESK_Y + 0.013, -0.74], 0.02); // mouse
  b.box([0.21, 0.46, 0.5], C.crt, [-0.86, 0.23, -0.98], 0.02); // tower on the floor
  b.box([0.14, 0.015, 0.01], C.crtDark, [-0.86, 0.38, -0.725], 0.003);

  // Desk props
  // green mug with handle
  b.cyl(0.045, 0.04, 0.1, C.mug, [0.22, DESK_Y + 0.05, -0.76]);
  b.add(new THREE.TorusGeometry(0.03, 0.009, 8, 14, Math.PI), C.mug, [0.268, DESK_Y + 0.05, -0.76], [0, 0, -Math.PI / 2]);
  b.cyl(0.038, 0.038, 0.004, "#5a3a26", [0.22, DESK_Y + 0.098, -0.76]);
  // desk lamp: base, two arm segments, shade
  b.cyl(0.07, 0.08, 0.025, C.lamp, [0.42, DESK_Y + 0.012, -1.12]);
  b.cyl(0.012, 0.012, 0.38, C.lamp, [0.42, DESK_Y + 0.2, -1.07], [0.35, 0, 0]);
  b.cyl(0.012, 0.012, 0.3, C.lamp, [0.42, DESK_Y + 0.42, -0.9], [1.25, 0, 0]);
  b.add(new THREE.ConeGeometry(0.09, 0.14, 18, 1, true), C.lamp, [0.42, DESK_Y + 0.44, -0.74], [2.4, 0, 0]);
  b.sphere(0.03, "#fff3c4", [0.42, DESK_Y + 0.405, -0.71], [1, 1, 1], "gloss");
  // pen
  b.cyl(0.006, 0.006, 0.14, "#2f3340", [0.08, DESK_Y + 0.006, -0.68], [0, 0.4, Math.PI / 2]);
  // blue magazine file holder with magazines (back-left of the long desk)
  b.box([0.12, 0.3, 0.26], C.fileHolder, [-1.0, DESK_Y + 0.15, -1.12], 0.015);
  b.box([0.09, 0.27, 0.22], "#f2efe6", [-1.0, DESK_Y + 0.17, -1.12], 0.006);
  b.box([0.1, 0.24, 0.005], "#e8742a", [-1.0, DESK_Y + 0.18, -1.0], 0.002);
  // cactus in a terracotta pot, succulent, Rubik's cube (on the left return)
  b.cyl(0.07, 0.055, 0.1, C.pot, [-1.05, DESK_Y + 0.05, -0.2]);
  b.add(new THREE.CapsuleGeometry(0.04, 0.13, 6, 12), C.plant, [-1.05, DESK_Y + 0.2, -0.2]);
  b.add(new THREE.CapsuleGeometry(0.02, 0.05, 6, 10), C.plant, [-1.0, DESK_Y + 0.21, -0.2], [0, 0, -0.9]);
  b.add(new THREE.CapsuleGeometry(0.018, 0.04, 6, 10), C.plant, [-1.1, DESK_Y + 0.24, -0.2], [0, 0, 0.9]);
  b.cyl(0.06, 0.05, 0.06, "#e9e2d6", [-1.05, DESK_Y + 0.03, 0.12]);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    b.sphere(0.035, C.plantLight, [-1.05 + Math.cos(a) * 0.035, DESK_Y + 0.08, 0.12 + Math.sin(a) * 0.035], [0.7, 0.45, 1.1]);
  }
  b.sphere(0.03, C.plant, [-1.05, DESK_Y + 0.095, 0.12], [1, 0.7, 1]);
  buildRubik(b, [-0.98, DESK_Y + 0.035, 0.45]);
  // digital clock + desk calendar bodies (their faces are textures, see <DeskDisplays/>)
  b.box([0.16, 0.08, 0.06], "#2b2c31", [0.7, DESK_Y + 0.04, -1.15], 0.012);
  b.box([0.14, 0.12, 0.02], "#f4f2ee", [0.62, DESK_Y + 0.06, -0.86], 0.006, [-0.25, -0.35, 0]);
  b.box([0.14, 0.12, 0.02], "#f4f2ee", [0.62, DESK_Y + 0.06, -0.9], 0.006, [0.25, -0.35, 0]);
  // potted plant on the right-hand corner of the desk
  b.cyl(0.1, 0.08, 0.17, C.pot, [1.02, DESK_Y + 0.085, -1.12]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    b.add(
      new THREE.SphereGeometry(0.07, 12, 9),
      i % 2 ? C.plant : C.plantLight,
      [1.02 + Math.cos(a) * 0.06, DESK_Y + 0.27 + (i % 3) * 0.05, -1.12 + Math.sin(a) * 0.06],
      [Math.sin(a) * 0.6, a, Math.cos(a) * 0.6],
      [0.55, 1.5, 0.3],
    );
  }

  // Cork pinboard on the back partition (right side), with notes, photos and pins
  const pz = W + 0.05;
  b.box([0.86, 0.56, 0.03], C.frame, [0.62, 1.22, pz], 0.012);
  b.box([0.8, 0.5, 0.032], C.cork, [0.62, 1.22, pz + 0.004], 0.006);
  const cards: [number, number, string, number][] = [
    [0.34, 1.33, C.stickyNotes[0], 0.08],
    [0.52, 1.12, "#ffffff", -0.06],
    [0.74, 1.34, C.stickyNotes[2], -0.1],
    [0.9, 1.12, C.stickyNotes[1], 0.12],
    [0.66, 1.1, "#d9e6ff", 0.04],
  ];
  cards.forEach(([x, y, col, r]) => {
    b.box([0.15, 0.13, 0.006], col, [x, y, pz + 0.024], 0.002, [0, 0, r]);
    b.sphere(0.012, "#e0453a", [x, y + 0.05, pz + 0.032], [1, 1, 1], "gloss");
  });
  // photo prints (simple two-tone cards)
  b.box([0.13, 0.1, 0.006], "#ffffff", [0.46, 1.36, pz + 0.026], 0.002, [0, 0, -0.05]);
  b.box([0.11, 0.06, 0.007], "#7fb2e5", [0.46, 1.37, pz + 0.028], 0.002, [0, 0, -0.05]);
  b.box([0.11, 0.02, 0.007], "#6fc26a", [0.46, 1.335, pz + 0.028], 0.002, [0, 0, -0.05]);

  // Sticky notes on both partitions
  ([
    [-0.65, 1.0, C.stickyNotes[0], 0.1],
    [-0.5, 0.94, C.stickyNotes[1], -0.08],
    [0.2, 1.42, C.stickyNotes[2], 0.06],
  ] as [number, number, string, number][]).forEach(([x, y, col, r]) =>
    b.box([0.1, 0.1, 0.006], col, [x, y, W + 0.04], 0.002, [0, 0, r]),
  );
  ([
    [0.55, 0.95, C.stickyNotes[1], 0.08],
    [0.78, 1.0, C.stickyNotes[0], -0.1],
  ] as [number, number, string, number][]).forEach(([z, y, col, r]) =>
    b.box([0.006, 0.1, 0.1], col, [W + 0.04, y, z], 0.002, [r, 0, 0]),
  );

  // Poster frames on the left partition (artwork is a separate textured plane)
  POSTERS.forEach(([z, y]) => b.box([0.025, 0.56, 0.44], C.frame, [W + 0.045, y, z], 0.008));
  return b;
}

function buildRubik(b: Batch, [cx, cy, cz]: [number, number, number]) {
  const s = 0.07;
  const q = s / 3;
  b.box([s, s, s], "#1d1c22", [cx, cy, cz], 0.006, [0, 0.4, 0]);
  const faces = ["#e0453a", "#3e6fd8", "#f4c542", "#3f9a5c", "#ffffff", "#f08a3c"];
  const rot = new THREE.Euler(0, 0.4, 0);
  const place = (lx: number, ly: number, lz: number) => new THREE.Vector3(lx, ly, lz).applyEuler(rot).add(new THREE.Vector3(cx, cy, cz));
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const u = (i - 1) * q;
      const v = (j - 1) * q;
      const top = place(u, s / 2 + 0.001, v);
      const front = place(u, v, s / 2 + 0.001);
      const side = place(s / 2 + 0.001, v, u);
      b.box([q * 0.84, 0.003, q * 0.84], faces[(i + j) % 3 === 0 ? 4 : (i * 3 + j) % 6], [top.x, top.y, top.z], 0.001, [0, 0.4, 0]);
      b.box([q * 0.84, q * 0.84, 0.003], faces[(i + 2 * j) % 6], [front.x, front.y, front.z], 0.001, [0, 0.4, 0]);
      b.box([0.003, q * 0.84, q * 0.84], faces[(2 * i + j + 1) % 6], [side.x, side.y, side.z], 0.001, [0, 0.4, 0]);
    }
}

/* ───── Posters (replaceable artwork) ───── */
const POSTERS: [number, number][] = [
  [-0.95, 1.2],
  [-0.4, 1.26],
  [0.15, 1.2],
  [0.7, 1.26],
];
function Posters() {
  const textures = useTexture(cubicleConfig.posters.slice(0, POSTERS.length));
  useEffect(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
    });
  }, [textures]);
  return (
    <>
      {POSTERS.map(([z, y], i) => (
        <mesh key={i} position={[W + 0.059, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 0.52]} />
          <meshStandardMaterial map={textures[i]} roughness={0.9} />
        </mesh>
      ))}
    </>
  );
}

/* ───── CRT screen with slowly scrolling green code ───── */
function Screen({ animate }: { animate: boolean }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = C.screen;
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = C.code;
    for (let i = 0; i < 20; i++) {
      const indent = [10, 26, 42, 26][i % 4];
      g.globalAlpha = 0.35 + ((i * 37) % 10) / 30;
      g.fillRect(indent, 8 + i * 12.5, 40 + ((i * 53) % 150), 5);
      if (i % 3 === 0) g.fillRect(indent + 60 + ((i * 29) % 70), 8 + i * 12.5, 30, 5);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 0.6);
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame((_, dt) => {
    if (animate) tex.offset.y = (tex.offset.y + dt * 0.05) % 1;
  });
  return (
    <mesh position={[PANDA.x, DESK_Y + 0.31, -0.813]}>
      <planeGeometry args={[0.42, 0.31]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* ───── Digital clock + desk calendar faces (real time / today's date) ───── */
function DeskDisplays() {
  const { clockTex, calTex, drawClock } = useMemo(() => {
    const cc = document.createElement("canvas");
    cc.width = 128;
    cc.height = 64;
    const cg = cc.getContext("2d")!;
    const clockTex = new THREE.CanvasTexture(cc);
    clockTex.colorSpace = THREE.SRGBColorSpace;
    const drawClock = () => {
      cg.fillStyle = "#111214";
      cg.fillRect(0, 0, 128, 64);
      cg.fillStyle = "#ff7a3d";
      cg.font = "bold 34px ui-monospace, Menlo, Consolas, monospace";
      cg.textAlign = "center";
      cg.textBaseline = "middle";
      cg.fillText(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }), 64, 34);
      clockTex.needsUpdate = true;
    };
    drawClock();

    const kc = document.createElement("canvas");
    kc.width = 128;
    kc.height = 112;
    const kg = kc.getContext("2d")!;
    const now = new Date();
    kg.fillStyle = "#ffffff";
    kg.fillRect(0, 0, 128, 112);
    kg.fillStyle = "#e0453a";
    kg.fillRect(0, 0, 128, 30);
    kg.fillStyle = "#ffffff";
    kg.font = "bold 18px system-ui, sans-serif";
    kg.textAlign = "center";
    kg.fillText(now.toLocaleString("en", { month: "short" }).toUpperCase(), 64, 22);
    kg.fillStyle = "#1d1c22";
    kg.font = "bold 54px system-ui, sans-serif";
    kg.fillText(String(now.getDate()), 64, 92);
    const calTex = new THREE.CanvasTexture(kc);
    calTex.colorSpace = THREE.SRGBColorSpace;
    return { clockTex, calTex, drawClock };
  }, []);
  useEffect(() => {
    const id = setInterval(drawClock, 30_000);
    return () => {
      clearInterval(id);
      clockTex.dispose();
      calTex.dispose();
    };
  }, [clockTex, calTex, drawClock]);
  return (
    <>
      <mesh position={[0.7, DESK_Y + 0.04, -1.119]}>
        <planeGeometry args={[0.13, 0.055]} />
        <meshBasicMaterial map={clockTex} toneMapped={false} />
      </mesh>
      <mesh position={[0.62, DESK_Y + 0.06, -0.848]} rotation={[-0.25, -0.35, 0]}>
        <planeGeometry args={[0.125, 0.105]} />
        <meshStandardMaterial map={calTex} roughness={0.9} />
      </mesh>
    </>
  );
}

/* ───── Orange executive chair (chrome frame, 5-star base, casters) with the typing panda ───── */
function Chair({ animate }: { animate: boolean }) {
  const swivel = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (swivel.current) swivel.current.rotation.y = Math.PI + (animate ? Math.sin(clock.getElapsedTime() * 0.5) * 0.06 : 0) - 0.18;
  });
  return (
    <group position={[PANDA.x, 0, PANDA.z]}>
      {/* the base doesn't swivel */}
      <Merged
        build={() => {
          const b = new Batch();
          b.cyl(0.028, 0.028, 0.3, C.chrome, [0, 0.27, 0], [0, 0, 0], "chrome");
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            b.box([0.3, 0.035, 0.05], C.chrome, [Math.cos(a) * 0.15, 0.075, Math.sin(a) * 0.15], 0.012, [0, -a, 0], "chrome");
            b.sphere(0.035, C.caster, [Math.cos(a) * 0.3, 0.035, Math.sin(a) * 0.3]);
          }
          return b;
        }}
      />
      <group ref={swivel}>
        <Merged
          build={() => {
            const b = new Batch();
            // seat, tall padded back with stitched panels, headrest, armrests
            b.box([0.56, 0.1, 0.54], C.chair, [0, 0.46, -0.02], 0.045);
            b.box([0.54, 0.62, 0.11], C.chair, [0, 0.85, -0.29], 0.05, [-0.12, 0, 0]);
            b.box([0.4, 0.16, 0.1], C.chair, [0, 1.24, -0.34], 0.05, [-0.12, 0, 0]);
            for (const y of [0.72, 0.9]) b.box([0.5, 0.012, 0.115], "#c95f1d", [0, y, -0.285], 0.004, [-0.12, 0, 0]);
            for (const sx of [-1, 1]) {
              b.box([0.06, 0.05, 0.36], C.chair, [sx * 0.31, 0.67, -0.04], 0.022);
              b.box([0.03, 0.2, 0.03], C.chrome, [sx * 0.31, 0.56, 0.06], 0.01, [0, 0, 0], "chrome");
              b.box([0.03, 0.2, 0.03], C.chrome, [sx * 0.31, 0.56, -0.16], 0.01, [0, 0, 0], "chrome");
            }
            b.box([0.12, 0.05, 0.12], C.chrome, [0, 0.4, 0], 0.01, [0, 0, 0], "chrome");
            return b;
          }}
        />
        <Panda pose="typing" outfit="hoodie" animate={animate} />
      </group>
    </group>
  );
}

/** Dev only: report draw calls so the budget (~60) can be checked. */
function DrawCallProbe() {
  const { gl } = useThree();
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (process.env.NODE_ENV === "production") return;
    const t = clock.getElapsedTime();
    if (t - last.current < 1) return;
    last.current = t;
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
  });
  return null;
}
