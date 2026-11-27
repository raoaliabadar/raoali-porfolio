/**
 * The moving parts of the desk, built with the same isometric projection as the drawing:
 * drawers that slide out of the pedestal (with what is kept in them) and a toy car.
 * Each builder returns flat polygons, back to front, ready to paint in order.
 */
import { DRAWERS, FACE_K, PED_FRONT, PED_X0, PED_X1, TOP, path, project, shade_, type Vec3 } from "./workspace";

export type Part = {
  d: string;
  /** Flat colour for the rendered finish (line art uses paper + ink instead). */
  fill?: string;
  /** Lines only (no fill). */
  line?: boolean;
  /** Clicking this opens something (see DeskLive). */
  item?: DrawerItem;
  /** Belongs to the inside of the drawer: clipped to the drawer opening. */
  inside?: boolean;
  weight?: "fine" | "normal";
  /** A soft shadow: only in the colour finish, translucent, no outline. */
  shadow?: boolean;
  /** A line drawn dark in the colour finish too (e.g. rim spokes). */
  dark?: boolean;
};

export type DrawerItem = "calculator" | "pens" | "notebook" | "stamp" | "folders" | "clips";

const C = {
  tray: "#d8d1c2",
  cavity: "#3a3d37",
  front: "#e6e1d6",
  calc: "#2b2d29",
  calcKey: "#d9cfbc",
  display: "#8db39e",
  pen: ["#2f6b4f", "#c9a24a", "#1f3550"],
  notebook: "#6b2e2a",
  notebook2: "#14271f",
  band: "#c9a24a",
  paper: "#fbfaf6",
  stamp: "#3a3d37",
  folder: ["#c9a24a", "#d6c49a", "#8db39e", "#cfc7b4"],
  clip: "#a2a39b",
};

function boxParts(o: Vec3, s: Vec3, color: string, extra: Partial<Part> = {}): Part[] {
  const [x, y, z] = o;
  const [w, d, h] = s;
  const X = x + w,
    Y = y + d,
    Z = z + h;
  return [
    { d: path([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]), fill: shade_(color, FACE_K.top), ...extra },
    { d: path([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]), fill: shade_(color, FACE_K.right), ...extra },
    { d: path([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]), fill: shade_(color, FACE_K.left), ...extra },
  ];
}
const flat = (z: number, [x0, y0, x1, y1]: [number, number, number, number], color: string, extra: Partial<Part> = {}): Part => ({
  d: path([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]),
  fill: color,
  ...extra,
});
const ln = (pts: Vec3[], extra: Partial<Part> = {}): Part => ({ d: path(pts, false), line: true, weight: "fine", ...extra });

/** How far each drawer slides out, in drawing units, and how deep its tray is. */
export const DRAWER_TRAVEL = 20;
const TRAY_DEPTH = 26;
/**
 * How far below the top of each drawer front its tray floor sits. Seen from above at this
 * angle a deep tray hides its floor behind the front, so the pencil (top) and stationery
 * (middle) drawers have shallow trays; the bottom one is a deep file drawer with tall folders.
 */
const FLOOR_DROP = [17, 8, 5.5];

/**
 * Things kept in each drawer, in tray coordinates: x across the drawer (PED_X0+1 … PED_X1-1),
 * v = distance back from the inside of the drawer front, z up from the tray floor.
 */
function contents(i: number, front: number, floor: number): Part[] {
  const Y = (v: number) => front - v; // tray depth → world y
  const parts: Part[] = [];
  const box = (x: number, v0: number, v1: number, z: number, [w, h]: [number, number], color: string, item?: DrawerItem) =>
    parts.push(...boxParts([x, Y(v1), floor + z], [w, v1 - v0, h], color, { inside: true, item }));

  if (i === 2) {
    // Top drawer: a calculator, three pens, a few paper clips.
    box(10, 3, 18, 0, [12, 1.6], C.calc, "calculator");
    parts.push(flat(floor + 1.62, [11, Y(5), 21, Y(3.6)], C.display, { inside: true, item: "calculator" }));
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        parts.push(flat(floor + 1.63, [11 + c * 2.5, Y(15.6 - r * 2.4), 12.8 + c * 2.5, Y(14.2 - r * 2.4)], C.calcKey, { inside: true, item: "calculator" }));
    C.pen.forEach((col, k) => box(25 + k * 2.6, 2, 19, 0, [1.3, 1.3], col, "pens"));
    [[34, 4], [37, 8], [34.5, 12]].forEach(([x, v]) => {
      parts.push(ln([[x, Y(v), floor + 0.1], [x + 3, Y(v), floor + 0.1], [x + 3, Y(v + 1.2), floor + 0.1], [x + 0.6, Y(v + 1.2), floor + 0.1]], { inside: true, item: "clips" }));
    });
  } else if (i === 1) {
    // Middle drawer: two notebooks with an elastic band, and an approval stamp.
    box(10, 3, 20, 0, [15, 2.2], C.notebook2, "notebook");
    box(10.6, 3.5, 19.5, 2.2, [14, 2.2], C.notebook, "notebook");
    parts.push(flat(floor + 4.42, [21.5, Y(19.5), 22.4, Y(3.5)], C.band, { inside: true, item: "notebook" }));
    box(31, 6, 13, 0, [7, 2], C.stamp, "stamp");
    box(33.5, 8.5, 10.5, 2, [2, 4.5], C.stamp, "stamp");
  } else {
    // Bottom drawer: hanging folders of financial documents, standing on edge.
    C.folder.forEach((col, k) => {
      box(11 + k * 7, 3, 21, 0, [1.2, 13], col, "folders");
      parts.push(flat(floor + 13.02, [11 + k * 7, Y(8 + k * 2.5), 12.2 + k * 7, Y(5 + k * 2.5)], C.paper, { inside: true, item: "folders" }));
    });
  }
  return parts;
}

/**
 * One drawer slid out by `o` units (0 = shut). Painted after the pedestal and before the desk
 * top. Returns the parts plus the clip outline for everything inside (the drawer opening as
 * seen through the protruding tray).
 */
export function drawerParts(i: number, o: number) {
  const [z0, z1] = DRAWERS[i];
  const front = PED_FRONT + o; // outer face of the drawer front
  const inner = front - 1.4; // inside face of the front panel
  const floor = z1 - FLOOR_DROP[i];
  const wall = z1 - 2.5;
  const back = inner - TRAY_DEPTH;
  const x0 = PED_X0 + 1;
  const x1 = PED_X1 - 1;

  // Opening: what can be seen of the slot and the tray, i.e. the protruding volume.
  const corners: Vec3[] = [];
  for (const x of [PED_X0, PED_X1]) for (const y of [PED_FRONT, front]) for (const z of [z0, z1]) corners.push([x, y, z]);
  const clip = corners.map(project);

  const parts: Part[] = [
    // The dark slot left in the pedestal.
    { d: path([[PED_X0, PED_FRONT, z0], [PED_X1, PED_FRONT, z0], [PED_X1, PED_FRONT, z1], [PED_X0, PED_FRONT, z1]]), fill: C.cavity, inside: true },
    // Tray floor and its inner left wall (seen from the right, over the front).
    flat(floor, [x0, back, x1, inner], C.tray, { inside: true }),
    { d: path([[x0, back, floor], [x0, inner, floor], [x0, inner, wall], [x0, back, wall]]), fill: shade_(C.tray, FACE_K.right), inside: true },
    ...contents(i, inner, floor),
    // The tray's outer right side, where it sticks out of the pedestal.
    { d: path([[x1, PED_FRONT, z0], [x1, inner, z0], [x1, inner, wall], [x1, PED_FRONT, wall]]), fill: shade_(C.tray, FACE_K.right) },
    // The drawer front (a thin board) and its handle.
    ...boxParts([PED_X0, inner, z0], [PED_X1 - PED_X0, 1.4, z1 - z0], C.front),
    ln([[20, front, (z0 + z1) / 2], [30, front, (z0 + z1) / 2]], { weight: "normal" }),
  ];
  return { parts, clip: hullPoints(clip) };
}

/** The drawer front's outline when shut or open (its click target). */
export function drawerFront(i: number, o: number) {
  const [z0, z1] = DRAWERS[i];
  const y = PED_FRONT + o;
  return path([[PED_X0, y, z0], [PED_X1, y, z0], [PED_X1, y, z1], [PED_X0, y, z1]]);
}

function hullPoints(pts: [number, number][]) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return [...lo.slice(0, -1), ...up.slice(0, -1)].map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("") + "Z";
}

/* ---------------- The toy car ---------------- */

/** Where the car can drive: along x on the front strip of the desk top. */
export const CAR = { length: 18, width: 7.6, y: 72.6, xMin: 3, xMax: 139, wheel: 2.05 };

const CAR_C = {
  body: "#3a4044",
  glass: "#1d2a30",
  glassHi: "#5d7782",
  trim: "#1f2326",
  accent: "#8db39e",
  tyre: "#1a1c1d",
  rim: "#c9cdd0",
  hub: "#2b2f32",
  led: "#f4fbff",
  tail: "#c24a3c",
  shadow: "#1b1d1a",
};

/** A small ellipse: a circle of radius r in the x–z plane at y. */
const wheelRing = (cx: number, y: number, cz: number, r: number, n = 20) =>
  path(Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as Vec3;
  }));

/**
 * A modern electric coupé at x (its rear left corner), wheels turned by `spin` radians.
 * A low wedge body drawn from a side profile, a panoramic glass roof that runs into the
 * windscreen, a full-width LED bar at the nose, a black sill with a thin accent line, flush
 * door handles, and large five-spoke rims that turn as it rolls.
 */
export function carParts(x: number, spin: number) {
  const { length: L, width: W, y, wheel: r } = CAR;
  const zb = TOP + r * 0.72; // underside
  const Y = y + W;
  const at = (px: number) => x + px;
  const parts: Part[] = [];

  // Side profile (x along the car, z above the underside), rear → front over the top.
  const P: [number, number][] = [
    [0, 0.4],
    [0, 2.9], // tail
    [1.6, 3.3], // boot lid
    [4.2, 4.9], // rear of the glass roof
    [10.4, 5.05], // front of the roof
    [13.4, 3.15], // base of the windscreen
    [17.2, 2.35], // bonnet nose
    [L, 1.7],
    [L, 0.4],
  ];
  const Z = (k: number) => zb + P[k][1];
  const X = (k: number) => at(P[k][0]);
  const side = (yy: number) => path(P.map(([px, pz]) => [at(px), yy, zb + pz] as Vec3).concat([[at(0), yy, zb]]).slice(0, P.length));

  // Soft shadow on the desk.
  parts.push({ d: path([[at(0.4), y + 0.5, TOP + 0.02], [at(L + 0.6), y + 0.5, TOP + 0.02], [at(L + 0.6), Y + 1, TOP + 0.02], [at(0.4), Y + 1, TOP + 0.02]]), fill: CAR_C.shadow, shadow: true });
  // Far-side wheels just show under the sill.
  [3.8, L - 3.9].forEach((wx) => parts.push({ d: wheelRing(at(wx), y + 0.5, TOP + r, r * 0.95), fill: CAR_C.tyre }));

  // Upper surfaces, back to front: boot, glass roof (+ its reflection band), windscreen, bonnet.
  const strip = (k0: number, k1: number, fill: string, inset = 0) =>
    parts.push({ d: path([[X(k0), y + inset, Z(k0)], [X(k1), y + inset, Z(k1)], [X(k1), Y - inset, Z(k1)], [X(k0), Y - inset, Z(k0)]]), fill });
  strip(1, 2, CAR_C.body);
  strip(2, 3, CAR_C.glass, 0.5);
  strip(3, 4, CAR_C.glass, 0.5);
  parts.push({ d: path([[X(3) + 1.2, y + 2.2, Z(3) + 0.02], [X(4) - 1.4, y + 2.2, Z(4) + 0.02], [X(4) - 1.4, y + 3.1, Z(4) + 0.02], [X(3) + 1.2, y + 3.1, Z(3) + 0.02]]), fill: CAR_C.glassHi });
  strip(4, 5, CAR_C.glass, 0.5);
  strip(5, 6, CAR_C.body);
  strip(6, 7, CAR_C.body);
  // Roof rails between the glass and the sides.
  [[2, 3], [3, 4], [4, 5]].forEach(([a, b]) => parts.push(ln([[X(a), Y - 0.5, Z(a) + 0.01], [X(b), Y - 0.5, Z(b) + 0.01]], { weight: "normal" })));

  // Nose (+x face): black intake, full-width LED bar.
  parts.push({ d: path([[at(L), y, zb + 0.4], [at(L), Y, zb + 0.4], [at(L), Y, zb + 1.7], [at(L), y, zb + 1.7]]), fill: CAR_C.body });
  parts.push({ d: path([[at(L) + 0.01, y + 1.4, zb + 0.5], [at(L) + 0.01, Y - 1.4, zb + 0.5], [at(L) + 0.01, Y - 1.4, zb + 0.95], [at(L) + 0.01, y + 1.4, zb + 0.95]]), fill: CAR_C.trim });
  parts.push({ d: path([[at(L) + 0.02, y + 0.4, zb + 1.3], [at(L) + 0.02, Y - 0.4, zb + 1.3], [at(L) + 0.02, Y - 0.4, zb + 1.55], [at(L) + 0.02, y + 0.4, zb + 1.55]]), fill: CAR_C.led });

  // Near side (+y face): body panel, side glass, sill, accent line, door seam, flush handle, tail light.
  parts.push({ d: side(Y), fill: shade_(CAR_C.body, FACE_K.left) });
  parts.push({ d: path([[at(4.6), Y + 0.01, zb + 3.3], [at(12.8), Y + 0.01, zb + 3.3], [at(10.2), Y + 0.01, zb + 4.75], [at(4.9), Y + 0.01, zb + 4.6], [at(3.4), Y + 0.01, zb + 3.6]]), fill: CAR_C.glass });
  parts.push(ln([[at(9.1), Y + 0.02, zb + 3.3], [at(8.9), Y + 0.02, zb + 4.75]], { weight: "normal" }));
  parts.push({ d: path([[at(0.6), Y + 0.01, zb + 0.4], [at(L - 0.6), Y + 0.01, zb + 0.4], [at(L - 0.6), Y + 0.01, zb + 1.05], [at(0.6), Y + 0.01, zb + 1.05]]), fill: CAR_C.trim });
  parts.push({ d: path([[at(1), Y + 0.02, zb + 1.05], [at(L - 1), Y + 0.02, zb + 1.05], [at(L - 1), Y + 0.02, zb + 1.25], [at(1), Y + 0.02, zb + 1.25]]), fill: CAR_C.accent });
  parts.push(ln([[at(9.3), Y + 0.02, zb + 1.3], [at(9.3), Y + 0.02, zb + 3.25]]));
  parts.push({ d: path([[at(10.2), Y + 0.02, zb + 2.55], [at(11.4), Y + 0.02, zb + 2.55], [at(11.4), Y + 0.02, zb + 2.8], [at(10.2), Y + 0.02, zb + 2.8]]), fill: CAR_C.trim });
  parts.push({ d: path([[at(0.02), Y + 0.02, zb + 2.3], [at(1.3), Y + 0.02, zb + 2.5], [at(1.3), Y + 0.02, zb + 2.75], [at(0.02), Y + 0.02, zb + 2.6]]), fill: CAR_C.tail });

  // Near-side wheels: tyre, rim, hub, five turning spokes.
  [3.8, L - 3.9].forEach((wx) => {
    const cx = at(wx);
    const wy = Y + 0.12;
    const cz = TOP + r;
    parts.push({ d: wheelRing(cx, wy, cz, r), fill: CAR_C.tyre });
    parts.push({ d: wheelRing(cx, wy + 0.02, cz, r * 0.7, 20), fill: CAR_C.rim });
    for (let k = 0; k < 5; k++) {
      const a = spin + (k * Math.PI * 2) / 5;
      parts.push(ln([[cx + Math.cos(a) * r * 0.2, wy + 0.04, cz + Math.sin(a) * r * 0.2], [cx + Math.cos(a) * r * 0.66, wy + 0.04, cz + Math.sin(a) * r * 0.66]], { weight: "normal", dark: true }));
    }
    parts.push({ d: wheelRing(cx, wy + 0.05, cz, r * 0.2, 10), fill: CAR_C.hub });
  });
  return parts;
}

/** The car's outline at x (its click/drag target). */
export function carHit(x: number) {
  const { length: L, width: W, y } = CAR;
  const pts: [number, number][] = [];
  for (const px of [x - 0.5, x + L + 0.5]) for (const py of [y - 0.5, y + W + 1]) for (const pz of [TOP, TOP + CAR.wheel * 0.72 + 5.3]) pts.push(project([px, py, pz]));
  return hullPoints(pts);
}
