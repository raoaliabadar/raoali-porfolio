"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { toWorld } from "@/voxels/build";
import type { OfficeParts } from "@/voxels/office";
import { VoxelMesh, type IntroState } from "./VoxelMesh";

const HOVER_LIFT = 0.1;
const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const smooth = (x: number) => x * x * (3 - 2 * x);

type Props = {
  parts: OfficeParts;
  intro: IntroState;
  animate: boolean;
  shadows: boolean;
  /** Hero scroll progress 0..1 (ScrollTrigger). */
  progress: RefObject<number>;
  /** Written every frame: the plane's world position while it flies, else null. */
  planeWorld: RefObject<THREE.Vector3 | null>;
  interactive: RefObject<boolean>;
};

export function Office({ parts, intro, animate, shadows, progress, planeWorld, interactive }: Props) {
  const mugRef = useRef<THREE.Group>(null);
  const planeRef = useRef<THREE.Group>(null);
  const hover = useRef<{ mug: boolean; plane: boolean }>({ mug: false, plane: false });

  const mugBase = useMemo(() => new THREE.Vector3(...toWorld(parts.mug.pivot)), [parts]);
  const planeBase = useMemo(() => new THREE.Vector3(...toWorld(parts.plane.pivot)), [parts]);

  // Flight path for the paper plane (scene-local coordinates).
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        planeBase.clone(),
        planeBase.clone().add(new THREE.Vector3(-0.05, 0.25, 0.25)),
        new THREE.Vector3(0.25, 1.3, 1.15),
        new THREE.Vector3(0.75, 1.75, 0.35),
        new THREE.Vector3(0.1, 2.15, -0.9),
        new THREE.Vector3(-1.6, 2.9, -2.2),
      ]),
    [planeBase],
  );
  const tmp = useMemo(() => ({ next: new THREE.Vector3(), world: new THREE.Vector3() }), []);

  useFrame((_, delta) => {
    if (!animate) return;
    const lift = (on: boolean) => (on && interactive.current ? HOVER_LIFT : 0);

    const mug = mugRef.current;
    if (mug) mug.position.y = THREE.MathUtils.damp(mug.position.y, mugBase.y + lift(hover.current.mug), 10, delta);

    const plane = planeRef.current;
    if (!plane) return;
    // 30–60 % of the hero scroll: lift off and fly out of frame.
    const f = smooth(clamp01(((progress.current ?? 0) - 0.3) / 0.3));
    if (f > 0.0001) {
      const p = Math.min(f, 0.999);
      plane.position.copy(curve.getPointAt(p));
      curve.getPointAt(Math.min(p + 0.01, 1), tmp.next);
      if (plane.parent) plane.lookAt(plane.parent.localToWorld(tmp.next));
      planeWorld.current = f < 0.98 ? plane.getWorldPosition(tmp.world) : null;
    } else {
      plane.rotation.set(0, 0, 0);
      plane.position.set(
        planeBase.x,
        THREE.MathUtils.damp(plane.position.y, planeBase.y + lift(hover.current.plane), 10, delta),
        planeBase.z,
      );
      planeWorld.current = null;
    }
  });

  const hoverable = (key: "mug" | "plane") => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (!interactive.current || !animate) return;
      e.stopPropagation();
      hover.current[key] = true;
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      hover.current[key] = false;
      document.body.style.cursor = "";
    },
  });

  const statics = [parts.desk, parts.chair, parts.laptop, parts.mouse, parts.plant, parts.shelf].filter(
    (p): p is NonNullable<typeof p> => p !== null,
  );

  return (
    <group>
      {statics.map((part, i) => (
        <VoxelMesh key={i} part={part} intro={intro} shadows={shadows} />
      ))}
      <VoxelMesh part={parts.screen} intro={intro} material="glow" />
      <group ref={mugRef} position={mugBase} {...hoverable("mug")}>
        <VoxelMesh part={parts.mug} intro={intro} shadows={shadows} />
      </group>
      <group ref={planeRef} position={planeBase} {...hoverable("plane")}>
        <VoxelMesh part={parts.plane} intro={intro} shadows={shadows} />
      </group>
    </group>
  );
}
