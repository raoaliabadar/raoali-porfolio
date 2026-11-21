"use client";

import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { VOXEL_SIZE, type VoxelPart } from "@/voxels/build";

/** Shared intro clock, advanced by a GSAP tween in VoxelScene. */
export type IntroState = { t: number; done: boolean };
/** Max stagger between voxels (s). */
export const INTRO_SPREAD = 0.6;
/** Flight time of a single voxel (s). */
export const INTRO_FLIGHT = 1.0;
/** Total assemble time (s). */
export const INTRO_DURATION = INTRO_SPREAD + INTRO_FLIGHT;

const V = VOXEL_SIZE;
const boxGeometry = new THREE.BoxGeometry(V, V, V);
const expoOut = gsap.parseEase("expo.out");

/** Deterministic 0..1 hash so colours / scatter are stable between renders. */
function hash(x: number, y: number, z: number, seed = 0) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453;
  return h - Math.floor(h);
}

type Props = {
  part: VoxelPart;
  intro: IntroState;
  /** "glow" = unlit (laptop screen). */
  material?: "standard" | "glow";
  /** Draw voxels slightly larger (used for eyelids so they cover the eyes). */
  voxelScale?: number;
  shadows?: boolean;
};

/** One InstancedMesh for a whole voxel group, with the "assemble" intro built in. */
export function VoxelMesh({ part, intro, material = "standard", voxelScale = 1, shadows = false }: Props) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const finalized = useRef(false);
  const count = part.voxels.length;

  const data = useMemo(() => {
    const target = new Float32Array(count * 3);
    const offset = new Float32Array(count * 3);
    const delay = new Float32Array(count);
    const [px, py, pz] = part.pivot;
    part.voxels.forEach((v, i) => {
      target[i * 3] = (v.x - px) * V;
      target[i * 3 + 1] = (v.y - py) * V;
      target[i * 3 + 2] = (v.z - pz) * V;
      // scatter in a random direction, biased upwards
      const theta = hash(v.x, v.y, v.z, 1) * Math.PI * 2;
      const phi = Math.acos(hash(v.x, v.y, v.z, 2) * 1.6 - 0.6);
      const r = 0.6 + hash(v.x, v.y, v.z, 3) * 1.2;
      offset[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      offset[i * 3 + 1] = Math.cos(phi) * r;
      offset[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      // bottom-up build with randomness
      delay[i] = INTRO_SPREAD * (0.6 * hash(v.x, v.y, v.z, 4) + 0.4 * Math.min(Math.max(v.y / 26, 0), 1));
    });
    return { target, offset, delay };
  }, [part, count]);

  const mat = useMemo(
    () =>
      material === "glow"
        ? new THREE.MeshBasicMaterial({ toneMapped: false })
        : new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0 }),
    [material],
  );
  useEffect(() => () => mat.dispose(), [mat]);

  const m = useMemo(() => new THREE.Matrix4(), []);

  /** Write instance matrices; `t === null` means fully assembled. */
  const write = (t: number | null) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { target, offset, delay } = data;
    for (let i = 0; i < count; i++) {
      let e = 1;
      if (t !== null) {
        const p = Math.min(Math.max((t - delay[i]) / INTRO_FLIGHT, 0), 1);
        e = expoOut(p);
      }
      const k = 1 - e;
      const s = e * voxelScale;
      m.makeScale(s, s, s);
      m.setPosition(target[i * 3] + offset[i * 3] * k, target[i * 3 + 1] + offset[i * 3 + 1] * k, target[i * 3 + 2] + offset[i * 3 + 2] * k);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (t === null) {
      // accurate bounds for raycasting (hover / click) once assembled
      mesh.boundingSphere = null;
      mesh.computeBoundingSphere();
    }
  };

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const col = new THREE.Color();
    part.voxels.forEach((v, i) => {
      col.set(v.color);
      // subtle per-voxel shade variation for a hand-made voxel look
      if (material === "standard") col.multiplyScalar(0.96 + hash(v.x, v.y, v.z, 5) * 0.08);
      mesh.setColorAt(i, col);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    finalized.current = intro.done;
    write(intro.done ? null : intro.t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, material]);

  useFrame(() => {
    if (finalized.current) return;
    if (intro.done) {
      write(null);
      finalized.current = true;
    } else {
      write(intro.t);
    }
  });

  return (
    <instancedMesh
      ref={ref}
      args={[boxGeometry, mat, count]}
      castShadow={shadows}
      receiveShadow={shadows}
      frustumCulled={false}
    />
  );
}
