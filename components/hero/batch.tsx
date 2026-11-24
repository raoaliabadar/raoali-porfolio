"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Static batching: pieces that never move relative to each other are merged into ONE mesh
 * per finish (matte / chrome / gloss), with each piece's colour stored per vertex. The whole
 * cubicle (walls, desk, cabinets, props) costs a few draw calls instead of hundreds.
 */
export type Vec3 = [number, number, number];
export type Finish = "matte" | "chrome" | "gloss";
type Part = { geo: THREE.BufferGeometry; finish: Finish };

const tmpColor = new THREE.Color();

export class Batch {
  private parts: Part[] = [];

  add(geo: THREE.BufferGeometry, color: string, pos: Vec3 = [0, 0, 0], rot: Vec3 = [0, 0, 0], scale: Vec3 = [1, 1, 1], finish: Finish = "matte") {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(...pos),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
      new THREE.Vector3(...scale),
    );
    let g = geo.applyMatrix4(m);
    if (!g.index) g = withIndex(g);
    for (const name of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    // colour per vertex (THREE.Color converts the sRGB hex to the linear working space)
    tmpColor.set(color);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = tmpColor.r;
      col[i * 3 + 1] = tmpColor.g;
      col[i * 3 + 2] = tmpColor.b;
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    this.parts.push({ geo: g, finish });
    return this;
  }

  /** Rounded box centred at pos. */
  box(size: Vec3, color: string, pos: Vec3, radius = 0.02, rot: Vec3 = [0, 0, 0], finish: Finish = "matte") {
    const r = Math.min(radius, Math.min(...size) / 2 - 0.001);
    const geo = r > 0.002 ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, r) : new THREE.BoxGeometry(...size);
    return this.add(geo, color, pos, rot, [1, 1, 1], finish);
  }

  cyl(rTop: number, rBottom: number, h: number, color: string, pos: Vec3, rot: Vec3 = [0, 0, 0], finish: Finish = "matte", seg = 18) {
    return this.add(new THREE.CylinderGeometry(rTop, rBottom, h, seg), color, pos, rot, [1, 1, 1], finish);
  }

  sphere(r: number, color: string, pos: Vec3, scale: Vec3 = [1, 1, 1], finish: Finish = "matte", seg = 16) {
    return this.add(new THREE.SphereGeometry(r, seg, Math.max(8, Math.round(seg * 0.75))), color, pos, [0, 0, 0], scale, finish);
  }

  /** Merge everything: one geometry per finish. */
  build() {
    const groups = new Map<Finish, THREE.BufferGeometry[]>();
    for (const p of this.parts) groups.set(p.finish, [...(groups.get(p.finish) ?? []), p.geo]);
    const out: { finish: Finish; geometry: THREE.BufferGeometry }[] = [];
    for (const [finish, list] of groups) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (merged) out.push({ finish, geometry: merged });
    }
    this.parts = [];
    return out;
  }
}

function withIndex(g: THREE.BufferGeometry) {
  g.setIndex(Array.from({ length: g.attributes.position.count }, (_, i) => i));
  return g;
}

/* Three shared vertex-coloured materials for every batch in the scene. */
const materials: Partial<Record<Finish, THREE.Material>> = {};
export function materialFor(finish: Finish) {
  return (materials[finish] ??=
    finish === "chrome"
      ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.8 })
      : finish === "gloss"
        ? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 })
        : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }));
}

/** Renders a Batch as one mesh per finish. `build` runs once; geometries are disposed on unmount. */
export function Merged({ build }: { build: () => Batch }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const meshes = useMemo(() => build().build(), []);
  useEffect(() => () => meshes.forEach((m) => m.geometry.dispose()), [meshes]);
  return (
    <>
      {meshes.map((m) => (
        <mesh key={m.finish} geometry={m.geometry} material={materialFor(m.finish)} />
      ))}
    </>
  );
}
