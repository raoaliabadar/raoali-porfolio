"use client";

import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { cubicleConfig } from "@/lib/heroCubicle.config";
import { Batch, Merged } from "./batch";

/**
 * The site's panda, built from simple shapes with the same proportions and colours as the
 * desk panda elsewhere on the page. Faces +z with its feet at y = 0.
 *
 * pose "typing": seated, paws on a keyboard ~0.36 m in front, head bobbing gently.
 * pose "peek":   upper body only (for leaning over a wall), one paw resting, one waving.
 *
 * To use a real model instead, set `cubicleConfig.pandaModel` (see <PandaModel/>).
 */
export type PandaPose = "typing" | "peek";
export type PandaOutfit = "hoodie" | "scarf";

const C = cubicleConfig.colors;
const SCARF = "#ea7a2c";
const HC = 0.19; // head centre inside the head group
const HR = 0.235; // head radius

type ArmRefs = { shoulder: THREE.Group | null; elbow: THREE.Group | null };

export function Panda({
  pose,
  outfit = "hoodie",
  animate = true,
  position,
  rotation,
}: {
  pose: PandaPose;
  outfit?: PandaOutfit;
  /** false = hold the first frame (reduced motion). */
  animate?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  if (cubicleConfig.pandaModel) return <PandaModel url={cubicleConfig.pandaModel} position={position} rotation={rotation} />;
  return <PandaShapes pose={pose} outfit={outfit} animate={animate} position={position} rotation={rotation} />;
}

function PandaShapes({
  pose,
  outfit,
  animate,
  position,
  rotation,
}: {
  pose: PandaPose;
  outfit: PandaOutfit;
  animate: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<ArmRefs>({ shoulder: null, elbow: null });
  const armR = useRef<ArmRefs>({ shoulder: null, elbow: null });
  const sleeve = outfit === "hoodie" ? C.hoodie : C.furDark;
  // A per-panda phase so two pandas never move in lockstep.
  const phase = useMemo(() => Math.random() * 10, []);

  // Rest poses: [shoulder x, y, z, elbow x, z] (same values the desk panda types with).
  const rest = useMemo(
    () =>
      pose === "typing"
        ? { L: [-0.62, 0, 0.12, -0.95, -0.1], R: [-0.62, 0, -0.12, -0.95, 0.1], lean: 0.12, head: 0.12 }
        : { L: [-0.35, -0.3, 2.5, -0.2, 0.45], R: [-1.45, 0, -0.1, -0.15, 0.05], lean: 0.02, head: -0.05 },
    [pose],
  );

  const setArm = (a: ArmRefs, v: number[], tap = 0, waveZ = 0) => {
    a.shoulder?.rotation.set(v[0], v[1], v[2]);
    a.elbow?.rotation.set(v[3] + tap, 0, v[4] + waveZ);
  };

  useFrame(({ clock }) => {
    const t = animate ? clock.getElapsedTime() + phase : 0;
    const breathe = Math.sin(t * 1.6);
    if (torso.current) {
      torso.current.rotation.x = rest.lean + breathe * 0.01;
      torso.current.scale.set(1 + breathe * 0.008, 1 + breathe * 0.012, 1);
    }
    if (pose === "typing") {
      // Alternating taps, plus a small head bob while reading the screen.
      setArm(armL.current, rest.L, Math.sin(t * 15) * 0.06);
      setArm(armR.current, rest.R, Math.sin(t * 15 + Math.PI) * 0.06);
      if (head.current) {
        head.current.rotation.x = rest.head + Math.sin(t * 2.1) * 0.035;
        head.current.rotation.y = Math.sin(t * 0.6) * 0.06;
      }
    } else {
      // Slow friendly wave with the left paw; the right paw rests on the wall.
      setArm(armL.current, rest.L, 0, Math.sin(t * 3.2) * 0.38);
      setArm(armR.current, rest.R);
      if (head.current) {
        head.current.rotation.x = rest.head;
        head.current.rotation.z = Math.sin(t * 1.1) * 0.08;
        head.current.rotation.y = 0.15 + Math.sin(t * 0.7) * 0.05;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {pose === "typing" && (
        <Merged
          build={() => {
            const b = new Batch();
            for (const sx of [-0.11, 0.11]) {
              b.add(new THREE.CapsuleGeometry(0.095, 0.24, 6, 14), C.furDark, [sx, 0.56, 0.12], [Math.PI / 2, 0, 0]);
              b.add(new THREE.CapsuleGeometry(0.082, 0.32, 6, 14), C.furDark, [sx, 0.33, 0.3], [0.08, 0, 0]);
              b.sphere(0.095, C.furDark, [sx, 0.075, 0.37], [1, 0.78, 1.3]);
            }
            b.sphere(0.24, C.fur, [0, 0.6, -0.04], [1.05, 0.62, 0.95], "matte", 24);
            return b;
          }}
        />
      )}

      {/* torso pivots at the hips */}
      <group ref={torso} position={[0, 0.6, -0.04]}>
        <Merged build={() => torsoBatch(outfit)} />

        {/* head */}
        <group position={[0, 0.5, 0.01]}>
          <group ref={head} position={[0, 0.05, 0]}>
            <Merged build={headBatch} />
          </group>
        </group>

        {/* arms */}
        {([1, -1] as const).map((side) => (
          <group
            key={side}
            position={[side * 0.23, 0.4, 0]}
            ref={(g) => {
              (side === 1 ? armL : armR).current.shoulder = g;
            }}
          >
            <Merged
              build={() =>
                new Batch()
                  .sphere(0.095, sleeve, [0, 0, 0])
                  .add(new THREE.CapsuleGeometry(0.078, 0.15, 6, 14), sleeve, [0, -0.12, 0])
              }
            />
            <group
              position={[0, -0.24, 0]}
              ref={(g) => {
                (side === 1 ? armL : armR).current.elbow = g;
              }}
            >
              <Merged
                build={() => {
                  const b = new Batch().add(new THREE.CapsuleGeometry(0.07, 0.15, 6, 14), sleeve, [0, -0.11, 0]);
                  if (outfit === "hoodie") b.cyl(0.075, 0.075, 0.04, C.hoodie, [0, -0.19, 0]); // cuff
                  b.sphere(0.074, C.furDark, [0, -0.235, 0], [1, 0.85, 1.1]);
                  b.sphere(0.03, C.pad, [0, -0.29, 0.02], [1, 0.6, 1]);
                  return b;
                }}
              />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

function torsoBatch(outfit: PandaOutfit) {
  const b = new Batch();
  const profile = [
    [0.001, -0.02],
    [0.2, 0.0],
    [0.255, 0.1],
    [0.26, 0.2],
    [0.235, 0.31],
    [0.18, 0.41],
    [0.11, 0.48],
    [0.001, 0.51],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const curve = new THREE.SplineCurve(profile).getPoints(28);
  if (outfit === "hoodie") {
    b.add(new THREE.LatheGeometry(curve, 32), C.hoodie, [0, 0, 0], [0, 0, 0], [1.06, 1.02, 0.96]);
    // hood resting behind the neck, front pocket, drawstrings
    b.add(new THREE.TorusGeometry(0.15, 0.065, 10, 28), C.hoodie, [0, 0.45, -0.07], [Math.PI / 2 - 0.45, 0, 0]);
    b.box([0.24, 0.09, 0.03], "#c7c8cd", [0, 0.17, 0.235], 0.012, [-0.12, 0, 0]);
    for (const sx of [-0.045, 0.045]) b.cyl(0.006, 0.006, 0.13, "#ffffff", [sx, 0.35, 0.215], [0.25, 0, 0]);
  } else {
    b.add(new THREE.LatheGeometry(curve, 32), C.fur, [0, 0, 0], [0, 0, 0], [1, 1, 0.9]);
    b.add(new THREE.CapsuleGeometry(0.115, 0.3, 8, 16), C.furDark, [0, 0.385, -0.045], [0, 0, Math.PI / 2], [1, 1, 0.9]);
    b.add(new THREE.TorusGeometry(0.13, 0.045, 12, 28), SCARF, [0, 0.47, 0], [Math.PI / 2, 0, 0]);
    b.box([0.075, 0.17, 0.03], SCARF, [0.08, 0.37, 0.19], 0.012, [-0.25, 0, 0.25]);
  }
  return b;
}

function headBatch() {
  const b = new Batch();
  b.sphere(HR, C.fur, [0, HC, 0], [1.1, 0.97, 1], "matte", 32);
  for (const sx of [-1, 1]) {
    b.add(new THREE.SphereGeometry(0.078, 18, 14), C.furDark, [sx * 0.175, HC + 0.19, -0.04], [0, 0, -sx * 0.35], [1, 0.95, 0.6]);
    // tilted teardrop eye patch, pressed onto the face
    b.add(new THREE.SphereGeometry(0.075, 18, 14), C.furDark, [sx * 0.092, HC + 0.004, 0.198], [0, sx * 0.4, -sx * 0.5], [0.78, 1.08, 0.35]);
    b.add(new THREE.SphereGeometry(0.027, 14, 10), "#ffffff", [sx * 0.096, HC + 0.012, 0.212], [0, 0, 0], [1, 1.08, 0.75], "gloss");
    b.add(new THREE.SphereGeometry(0.0175, 12, 9), "#0d0c10", [sx * 0.096, HC + 0.012, 0.227], [0, 0, 0], [1, 1, 1], "gloss");
    b.sphere(0.03, C.pad, [sx * 0.15, HC - 0.05, 0.19], [1, 0.6, 0.3]);
  }
  b.sphere(0.088, C.fur, [0, HC - 0.07, 0.165], [1.3, 0.82, 0.85]);
  b.sphere(0.026, "#16151a", [0, HC - 0.045, 0.238], [1.45, 0.9, 0.9], "gloss");
  b.add(new THREE.TorusGeometry(0.024, 0.0055, 8, 18, Math.PI), "#2a2228", [0, HC - 0.083, 0.236], [0, 0, Math.PI]);
  return b;
}

/** A .glb/.gltf panda from /public, used instead of the shapes when configured. */
function PandaModel({ url, position, rotation }: { url: string; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const { scene } = useGLTF(url);
  const copy = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={copy} position={position} rotation={rotation} />;
}
