"use client";

import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

type Options = {
  /** Follow the mouse (off on mobile / reduced motion). */
  enabled: boolean;
  /** Pose to return to when idle — looking at the laptop. */
  rest?: { yaw: number; pitch: number };
  /** Max head turn left/right (radians). Default ±40°. */
  maxYaw?: number;
  /** Max head tilt up/down (radians). Default ±20°. */
  maxPitch?: number;
  /** THREE.MathUtils.damp lambda. Default 6. */
  lambda?: number;
  /** Return to rest after this long without mouse movement. Default 3000ms. */
  idleMs?: number;
  /** Gentle look-around while resting (used on mobile). */
  idleSway?: boolean;
};

const DEG = Math.PI / 180;

/**
 * Turns a head group towards the cursor (projected into the 3D scene).
 * Returns an `update(delta, elapsed, override?)` function to call from useFrame.
 * Pass a world-space `override` point to look at something else (e.g. the paper plane).
 */
export function useHeadTracking(head: RefObject<THREE.Object3D | null>, options: Options) {
  const {
    enabled,
    rest = { yaw: 0, pitch: 0.3 },
    maxYaw = 40 * DEG,
    maxPitch = 20 * DEG,
    lambda = 6,
    idleMs = 3000,
    idleSway = false,
  } = options;
  const camera = useThree((s) => s.camera);

  const pointer = useRef(new THREE.Vector2());
  const lastMove = useRef(-Infinity);
  const yaw = useRef(rest.yaw);
  const pitch = useRef(rest.pitch);
  const tmp = useMemo(
    () => ({ ray: new THREE.Raycaster(), target: new THREE.Vector3(), headWorld: new THREE.Vector3() }),
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      lastMove.current = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [enabled]);

  return useCallback(
    (delta: number, elapsed: number, override?: THREE.Vector3 | null) => {
      const h = head.current;
      if (!h || !h.parent) return;

      let targetYaw = rest.yaw + (idleSway ? Math.sin(elapsed * 0.4) * 0.14 : 0);
      let targetPitch = rest.pitch + (idleSway ? Math.sin(elapsed * 0.27) * 0.04 : 0);

      let point: THREE.Vector3 | null = null;
      if (override) {
        point = tmp.target.copy(override);
      } else if (enabled && performance.now() - lastMove.current < idleMs) {
        // Cast a ray through the cursor and pick a point at the head's depth.
        h.getWorldPosition(tmp.headWorld);
        tmp.ray.setFromCamera(pointer.current, camera);
        const dist = camera.position.distanceTo(tmp.headWorld) * 0.85;
        point = tmp.target.copy(tmp.ray.ray.origin).addScaledVector(tmp.ray.ray.direction, dist);
      }

      if (point) {
        const local = h.parent.worldToLocal(point);
        const dx = local.x - h.position.x;
        const dy = local.y - h.position.y;
        const dz = local.z - h.position.z;
        targetYaw = THREE.MathUtils.clamp(Math.atan2(dx, dz), -maxYaw, maxYaw);
        targetPitch = THREE.MathUtils.clamp(Math.atan2(-dy, Math.hypot(dx, dz)), -maxPitch, maxPitch);
      }

      yaw.current = THREE.MathUtils.damp(yaw.current, targetYaw, lambda, delta);
      pitch.current = THREE.MathUtils.damp(pitch.current, targetPitch, lambda, delta);
      h.rotation.set(pitch.current, yaw.current, 0, "YXZ");
    },
    [head, camera, enabled, rest.yaw, rest.pitch, maxYaw, maxPitch, lambda, idleMs, idleSway, tmp],
  );
}
