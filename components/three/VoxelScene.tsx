"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { VOXEL_SIZE } from "@/voxels/build";
import { buildOffice } from "@/voxels/office";
import { Character } from "./Character";
import { Office } from "./Office";
import { INTRO_DURATION, type IntroState } from "./VoxelMesh";

/**
 * Full-screen, fixed voxel scene that sits behind the hero copy.
 *
 *  - Intro: every voxel flies into place (GSAP, expo.out, ~1.6 s).
 *  - Scroll (ScrollTrigger, scrubbed over the hero):
 *      0–30 % camera dollies in · 30–60 % paper plane flies off ·
 *      60–100 % camera orbits ~25° while the scene scales down and fades.
 *  - Pauses (frameloop "demand") once the hero is off-screen.
 *  - Reduced motion: static, assembled scene. Mobile: dpr 1, no shadows, no head tracking.
 */

const V = VOXEL_SIZE;
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = THREE.MathUtils.lerp;

function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}

/** Follows the site's light/dark toggle (class on <html>). */
function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const root = document.documentElement;
    const mo = new MutationObserver(() => setDark(root.classList.contains("dark")));
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

/* ───────── Camera + scroll choreography ───────── */

const TARGET = new THREE.Vector3(0, 0.72, 0.3);

function Rig({
  progress,
  world,
  fadeEl,
  interactive,
  intro,
  mobile,
  animate,
}: {
  progress: RefObject<number>;
  world: RefObject<THREE.Group | null>;
  fadeEl: RefObject<HTMLDivElement | null>;
  interactive: RefObject<boolean>;
  intro: IntroState;
  mobile: boolean;
  animate: boolean;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const pos = useMemo(() => new THREE.Vector3(), []);

  const place = (p: number) => {
    const aspect = size.width / Math.max(size.height, 1);
    const dolly = smooth(clamp01(p / 0.3));
    const orbit = smooth(clamp01((p - 0.6) / 0.4));

    let radius = 6.8 * lerp(1, 0.72, dolly);
    if (aspect < 0.8) radius *= 1.75;
    else if (aspect < 1.3) radius *= 1.25;
    const az = -0.5 + THREE.MathUtils.degToRad(25) * orbit;
    const el = 0.5 - 0.08 * dolly;
    pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(radius).add(TARGET);
    camera.position.copy(pos);
    camera.lookAt(TARGET);

    // Push the scene into the lower part of the screen so the hero copy stays readable.
    const shift = lerp(mobile ? 0.36 : 0.4, 0.06, dolly);
    camera.setViewOffset(size.width, size.height, 0, -size.height * shift, size.width, size.height);
    camera.updateProjectionMatrix();

    // Scale down + fade as the About section arrives.
    if (world.current) world.current.scale.setScalar(lerp(1, 0.8, orbit));
    // fully gone before the About copy reaches the middle of the screen
    const fade = 1 - smooth(clamp01((p - 0.6) / 0.22));
    if (fadeEl.current) {
      fadeEl.current.style.opacity = String(fade);
      fadeEl.current.style.visibility = fade < 0.01 ? "hidden" : "visible";
    }
    interactive.current = intro.done && fade > 0.5;
  };

  // Static placement (reduced motion) and on resize.
  useEffect(() => {
    place(animate ? progress.current ?? 0 : 0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, animate, mobile]);

  useFrame(() => {
    if (animate) place(progress.current ?? 0);
  });

  return null;
}

/* ───────── Lights + floor ───────── */

function Stage({ shadows, dark }: { shadows: boolean; dark: boolean }) {
  const floorTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    if (dark) {
      grad.addColorStop(0, "rgba(24,32,56,0.95)");
      grad.addColorStop(0.45, "rgba(16,22,40,0.7)");
      grad.addColorStop(1, "rgba(5,6,8,0)");
    } else {
      grad.addColorStop(0, "rgba(226,208,192,0.75)");
      grad.addColorStop(0.45, "rgba(240,226,214,0.45)");
      grad.addColorStop(1, "rgba(251,250,248,0)");
    }
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [dark]);
  useEffect(() => () => floorTex.dispose(), [floorTex]);

  return (
    <>
      <hemisphereLight args={["#fff4ea", dark ? "#2a3048" : "#d9cdbf", dark ? 0.9 : 1.25]} />
      <directionalLight
        position={[-2.6, 5, 3.4]}
        intensity={dark ? 2.2 : 2.4}
        color="#ffe2c4"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={0.5}
        shadow-camera-far={14}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* orange rim light from behind */}
      <directionalLight position={[2.4, 2.6, -3.6]} intensity={dark ? 3 : 2.2} color="#ff7a2a" />
      {/* laptop glow on the character's face */}
      <pointLight position={[-0.03, 0.9, 0.45]} color="#00ffe0" intensity={dark ? 0.04 : 0.02} distance={0.9} decay={2} />

      <mesh rotation-x={-Math.PI / 2} position-y={-0.5 * V - 0.002}>
        <circleGeometry args={[4.2, 64]} />
        <meshBasicMaterial map={floorTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {shadows && (
        <mesh rotation-x={-Math.PI / 2} position-y={-0.5 * V} receiveShadow>
          <planeGeometry args={[8, 8]} />
          <shadowMaterial opacity={dark ? 0.35 : 0.14} />
        </mesh>
      )}
    </>
  );
}

/* ───────── Main ───────── */

export default function VoxelScene() {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const mobile = useMedia("(max-width: 767px)");
  const dark = useIsDark();
  const animate = !reduced;
  const shadows = !mobile;

  const office = useMemo(() => buildOffice({ detailed: !mobile }), [mobile]);
  const intro = useRef<IntroState>({ t: 0, done: reduced }).current;
  const [ready, setReady] = useState(false);
  const [introPct, setIntroPct] = useState(reduced ? 100 : 0);
  const [heroVisible, setHeroVisible] = useState(true);
  const { active, progress: assetProgress } = useProgress();

  const progress = useRef(0);
  const planeWorld = useRef<THREE.Vector3 | null>(null);
  const interactive = useRef(false);
  const world = useRef<THREE.Group>(null);
  const fadeEl = useRef<HTMLDivElement>(null);

  // Intro: GSAP drives a shared clock; each voxel eases with expo.out from it.
  useEffect(() => {
    if (!ready || intro.done) return;
    const tween = gsap.to(intro, {
      t: INTRO_DURATION,
      duration: INTRO_DURATION,
      ease: "none",
      onUpdate: () => setIntroPct(Math.round((intro.t / INTRO_DURATION) * 100)),
      onComplete: () => {
        intro.done = true;
        setIntroPct(100);
      },
    });
    return () => {
      tween.kill();
    };
  }, [ready, intro]);

  // Scroll choreography over the hero section.
  useEffect(() => {
    if (!animate) return;
    const hero = document.getElementById("top");
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });
    progress.current = st.progress;
    return () => st.kill();
  }, [animate]);

  // Stop rendering when the hero is off-screen.
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const frameloop = animate && heroVisible ? "always" : "demand";
  const pct = active ? Math.round(assetProgress) : introPct;

  return (
    <div ref={fadeEl} aria-hidden className="pointer-events-none fixed inset-0 -z-[1]">
      <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
        <Canvas
          frameloop={frameloop}
          dpr={mobile ? 1 : [1, 1.5]}
          shadows={shadows}
          camera={{ fov: 30, near: 0.1, far: 60, position: [-2.5, 2, 3.5] }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          eventSource={document.body}
          eventPrefix="client"
          onCreated={() => setReady(true)}
        >
          <Stage shadows={shadows} dark={dark} />
          <group ref={world}>
            <Office
              parts={office}
              intro={intro}
              animate={animate}
              shadows={shadows}
              progress={progress}
              planeWorld={planeWorld}
              interactive={interactive}
            />
            <Character
              intro={intro}
              animate={animate}
              tracking={animate && !mobile}
              shadows={shadows}
              lookTarget={planeWorld}
              interactive={interactive}
            />
          </group>
          <Rig
            progress={progress}
            world={world}
            fadeEl={fadeEl}
            interactive={interactive}
            intro={intro}
            mobile={mobile}
            animate={animate}
          />
        </Canvas>
      </div>

      {/* Build progress */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-line bg-surface/90 px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted backdrop-blur transition-opacity duration-500 ${
          pct >= 100 ? "opacity-0" : "opacity-100"
        }`}
      >
        Building scene {pct}%
      </div>
    </div>
  );
}
