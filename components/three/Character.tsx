"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useHeadTracking } from "@/hooks/useHeadTracking";
import { toWorld, VOXEL_SIZE } from "@/voxels/build";
import { character } from "@/voxels/character";
import { VoxelMesh, type IntroState } from "./VoxelMesh";

const V = VOXEL_SIZE;
/** Arms reach forward onto the keyboard. */
const ARM_TYPE_X = -1.38;
/** Looking down at the laptop. */
const REST = { yaw: 0, pitch: 0.14 };
const WAVE_SECONDS = 1.5;
/** Torso height in voxels — used to move head/arms with the breathing. */
const TORSO_H = 7;

const smooth = (x: number) => x * x * (3 - 2 * x);

type Props = {
  intro: IntroState;
  /** Idle animation, blinking, waving. Off for reduced motion. */
  animate: boolean;
  /** Mouse head tracking. Off on mobile and for reduced motion. */
  tracking: boolean;
  shadows: boolean;
  /** World point the head should follow instead of the mouse (paper plane). */
  lookTarget: RefObject<THREE.Vector3 | null>;
  /** False while the scene is faded out / still assembling. */
  interactive: RefObject<boolean>;
};

export function Character({ intro, animate, tracking, shadows, lookTarget, interactive }: Props) {
  const { head, lids, torso, armLeft, armRight, legs } = character;
  const clock = useThree((s) => s.clock);
  const camera = useThree((s) => s.camera);

  const headRef = useRef<THREE.Group>(null);
  const lidsRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const waveStart = useRef(-Infinity);
  const nextBlink = useRef(3 + Math.random() * 3);

  const track = useHeadTracking(headRef, { enabled: tracking, rest: REST, idleSway: !tracking });

  const headY = toWorld(head.pivot)[1];
  const armY = toWorld(armLeft.pivot)[1];

  // Static pose (also the reduced-motion pose).
  useLayoutEffect(() => {
    armLRef.current?.rotation.set(ARM_TYPE_X, 0, 0.06);
    armRRef.current?.rotation.set(ARM_TYPE_X, 0, -0.06);
    headRef.current?.rotation.set(REST.pitch, REST.yaw, 0, "YXZ");
  }, []);

  useFrame((_, delta) => {
    if (!animate) return;
    const t = clock.elapsedTime;
    const h = headRef.current;
    const tr = torsoRef.current;
    const aL = armLRef.current;
    const aR = armRRef.current;
    if (!h || !tr || !aL || !aR) return;

    // Breathing: torso scale.y 1 → 1.02 → 1 every 3 s; head and arms ride along.
    const s = 1 + 0.01 * (1 - Math.cos((t * Math.PI * 2) / 3));
    tr.scale.y = s;
    const lift = TORSO_H * V * (s - 1);
    h.position.y = headY + lift;
    aL.position.y = armY + lift;
    aR.position.y = armY + lift;

    // Blink every 3–6 s for 120 ms.
    const lidsGroup = lidsRef.current;
    if (lidsGroup) {
      if (t >= nextBlink.current + 0.12) {
        lidsGroup.visible = false;
        nextBlink.current = t + 3 + Math.random() * 3;
      } else {
        lidsGroup.visible = t >= nextBlink.current;
      }
    }

    // Wave envelope (0..1) after a click.
    const wt = t - waveStart.current;
    const u = wt / WAVE_SECONDS;
    const w = u >= 0 && u <= 1 ? smooth(Math.min(1, u * 5)) * smooth(Math.min(1, (1 - u) * 5)) : 0;

    // Typing: arms bob alternately; right arm blends into the wave.
    const tapL = Math.sin(t * 14) * 0.07;
    const tapR = Math.sin(t * 14 + Math.PI) * 0.07;
    aL.rotation.set(ARM_TYPE_X + tapL, 0, 0.06);
    aR.rotation.set(
      THREE.MathUtils.lerp(ARM_TYPE_X + tapR, -0.25, w),
      0,
      THREE.MathUtils.lerp(-0.06, -2.6 + Math.sin(t * 12) * 0.35, w),
    );

    // Head: plane > wave (look at the visitor) > mouse > rest.
    const override = lookTarget.current ?? (w > 0.05 ? camera.position : null);
    track(delta, t, override);
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!interactive.current || !animate) return;
    e.stopPropagation();
    waveStart.current = clock.elapsedTime;
  };
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive.current) return;
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    document.body.style.cursor = "";
  };

  return (
    <group onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
      <group position={toWorld(legs.pivot)}>
        <VoxelMesh part={legs} intro={intro} shadows={shadows} />
      </group>
      <group ref={torsoRef} position={toWorld(torso.pivot)}>
        <VoxelMesh part={torso} intro={intro} shadows={shadows} />
      </group>
      <group ref={headRef} position={toWorld(head.pivot)}>
        <VoxelMesh part={head} intro={intro} shadows={shadows} />
        <group ref={lidsRef} visible={false}>
          <VoxelMesh part={lids} intro={intro} voxelScale={1.08} />
        </group>
      </group>
      <group ref={armLRef} position={toWorld(armLeft.pivot)}>
        <VoxelMesh part={armLeft} intro={intro} shadows={shadows} />
      </group>
      <group ref={armRRef} position={toWorld(armRight.pivot)}>
        <VoxelMesh part={armRight} intro={intro} shadows={shadows} />
      </group>
    </group>
  );
}
