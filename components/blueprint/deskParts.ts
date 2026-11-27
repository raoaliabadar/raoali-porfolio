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
export const CAR = { length: 17, width: 7.6, y: 72.6, xMin: 3, xMax: 140, wheel: 1.9 };

const CAR_C = {
  body: "#24533d",
  roof: "#2f6b4f",
  stripe: "#c9a24a",
  glass: "#a9c4c9",
  tyre: "#1f221e",
  hub: "#cfc7b4",
  light: "#fbf3d5",
  grille: "#2b2d29",
  shadow: "#1b1d1a",
};

/** A small ellipse: a circle of radius r in the x–z plane at y. */
const wheelRing = (cx: number, y: number, cz: number, r: number, n = 18) =>
  path(Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as Vec3;
  }));

/**
 * The car at x (its rear left corner on the desk), with its wheels turned by `spin` radians.
 * Body: a low chassis, a bonnet stripe, a cabin with a sloped windscreen, lights and a grille;
 * the two near-side wheels show, with spokes that turn as it rolls.
 */
export function carParts(x: number, spin: number) {
  const { length: L, width: W, y, wheel: r } = CAR;
  const zb = TOP + r * 0.95; // chassis bottom
  const zt = zb + 2.6; // chassis top
  const zr = zt + 2.5; // roof
  const Y = y + W;
  const parts: Part[] = [];
  const at = (px: number) => x + px;

  // Soft shadow on the desk.
  parts.push({ d: path([[at(0.5), y + 0.6, TOP + 0.02], [at(L + 0.6), y + 0.6, TOP + 0.02], [at(L + 0.6), Y + 0.9, TOP + 0.02], [at(0.5), Y + 0.9, TOP + 0.02]]), fill: CAR_C.shadow, shadow: true });

  // Far-side wheels peek out under the body.
  [3.6, L - 3.6].forEach((wx) => parts.push({ d: wheelRing(at(wx), y + 0.4, TOP + r, r * 0.92), fill: CAR_C.tyre }));

  // Chassis.
  parts.push(...boxParts([at(0), y, zb], [L, W, zt - zb], CAR_C.body));
  // Bonnet stripe and boot line.
  parts.push(flat(zt + 0.01, [at(L - 5.6), y + W / 2 - 0.7, at(L), y + W / 2 + 0.7], CAR_C.stripe));
  parts.push(flat(zt + 0.01, [at(0), y + W / 2 - 0.7, at(3.6), y + W / 2 + 0.7], CAR_C.stripe));
  // Side stripe along the near flank.
  parts.push({ d: path([[at(0.4), Y + 0.01, zb + 1.1], [at(L - 0.4), Y + 0.01, zb + 1.1], [at(L - 0.4), Y + 0.01, zb + 1.6], [at(0.4), Y + 0.01, zb + 1.6]]), fill: CAR_C.stripe });
  // Front: grille and headlights.
  parts.push({ d: path([[at(L) + 0.01, y + 2.2, zb + 0.5], [at(L) + 0.01, Y - 2.2, zb + 0.5], [at(L) + 0.01, Y - 2.2, zb + 1.7], [at(L) + 0.01, y + 2.2, zb + 1.7]]), fill: CAR_C.grille });
  [[y + 0.6, y + 1.8], [Y - 1.8, Y - 0.6]].forEach(([a, b]) =>
    parts.push({ d: path([[at(L) + 0.01, a, zb + 1.2], [at(L) + 0.01, b, zb + 1.2], [at(L) + 0.01, b, zb + 2.2], [at(L) + 0.01, a, zb + 2.2]]), fill: CAR_C.light }),
  );

  // Cabin: sloped windscreen (+x), side window (+y), roof.
  const c0 = 4.2,
    c1 = 12.4,
    t0 = 5.6,
    t1 = 10.4,
    cy0 = y + 0.9,
    cy1 = Y - 0.9;
  parts.push({ d: path([[at(c1), cy0, zt], [at(c1), cy1, zt], [at(t1), cy1, zr], [at(t1), cy0, zr]]), fill: CAR_C.glass });
  parts.push({ d: path([[at(c0), cy1, zt], [at(c1), cy1, zt], [at(t1), cy1, zr], [at(t0), cy1, zr]]), fill: shade_(CAR_C.roof, FACE_K.left) });
  parts.push({ d: path([[at(c0 + 0.9), cy1 + 0.01, zt + 0.35], [at(c1 - 1.1), cy1 + 0.01, zt + 0.35], [at(t1 - 0.4), cy1 + 0.01, zr - 0.45], [at(t0 + 0.4), cy1 + 0.01, zr - 0.45]]), fill: CAR_C.glass });
  parts.push(ln([[at((c0 + c1) / 2 + 0.2), cy1 + 0.02, zt + 0.35], [at((t0 + t1) / 2 + 0.2), cy1 + 0.02, zr - 0.45]], { weight: "normal" }));
  parts.push({ d: path([[at(t0), cy0, zr], [at(t1), cy0, zr], [at(t1), cy1, zr], [at(t0), cy1, zr]]), fill: CAR_C.roof });

  // Near-side wheels with turning spokes.
  [3.6, L - 3.6].forEach((wx) => {
    const cx = at(wx);
    const wy = Y + 0.15;
    parts.push({ d: wheelRing(cx, wy, TOP + r, r), fill: CAR_C.tyre });
    parts.push({ d: wheelRing(cx, wy + 0.02, TOP + r, r * 0.55, 14), fill: CAR_C.hub });
    for (let k = 0; k < 3; k++) {
      const a = spin + (k * Math.PI * 2) / 3;
      parts.push(ln([[cx, wy + 0.04, TOP + r], [cx + Math.cos(a) * r * 0.9, wy + 0.04, TOP + r + Math.sin(a) * r * 0.9]], { weight: "normal" }));
    }
  });
  return parts;
}

/** The car's outline at x (its click/drag target). */
export function carHit(x: number) {
  const { length: L, width: W, y } = CAR;
  const pts: [number, number][] = [];
  for (const px of [x - 0.5, x + L + 0.5]) for (const py of [y - 0.5, y + W + 1]) for (const pz of [TOP, TOP + CAR.wheel * 0.95 + 5.1]) pts.push(project([px, py, pz]));
  return hullPoints(pts);
}
