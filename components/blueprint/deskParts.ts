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
export const CAR = { length: 19, width: 7.8, y: 72.5, xMin: 3, xMax: 138, wheel: 2.05 };

/** A BMW M5-style sports saloon model (no maker's badge: the shape and the M colours say it). */
const CAR_C = {
  body: "#1f4e8c", // a deep metallic blue
  glass: "#18232b",
  glassHi: "#4f6a7a",
  trim: "#15181b",
  chrome: "#c9cdd0",
  grille: "#0e1012",
  ring: "#cfe8ff",
  caliper: "#2a59a8",
  mBlue: "#2aa6df",
  mNavy: "#1d3f8f",
  mRed: "#e4002b",
  tyre: "#141617",
  rim: "#3a3f44",
  rimHi: "#9aa1a7",
  shadow: "#1b1d1a",
};

/** A small ellipse: a circle of radius r in the x-z plane at y. */
const wheelRing = (cx: number, y: number, cz: number, r: number, n = 20) =>
  path(Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as Vec3;
  }));

/**
 * The car at x (its rear left corner), wheels turned by `spin` radians. A long, low four-door
 * saloon drawn from its side profile: boot, rear glass, roof, windscreen and a long bonnet;
 * twin kidney grille and angel-eye headlights on the nose; two side windows split by the
 * B-pillar, door seams and handles, a gill with the tri-colour M stripe behind the front wheel,
 * black sills, and large double-spoke wheels with blue calipers that turn as it rolls.
 */
export function carParts(x: number, spin: number) {
  const { length: L, width: W, y, wheel: r } = CAR;
  const zb = TOP + r * 0.7; // underside
  const Y = y + W;
  const at = (px: number) => x + px;
  const parts: Part[] = [];

  // Side profile (x along the car, z above the underside), rear to front over the top.
  const P: [number, number][] = [
    [0, 0.4],
    [0, 2.7], // rear bumper
    [0.5, 3.15], // boot lid
    [3.2, 3.3], // base of the rear glass
    [5.6, 4.9], // rear of the roof
    [10.6, 5.0], // front of the roof
    [13.4, 3.3], // base of the windscreen
    [18.3, 2.85], // bonnet
    [L, 2.3], // nose
    [L, 0.4],
  ];
  const Z = (k: number) => zb + P[k][1];
  const X = (k: number) => at(P[k][0]);
  const side = (yy: number) => path(P.map(([px, pz]) => [at(px), yy, zb + pz] as Vec3));

  // Shadow, and the far-side wheels under the sill.
  parts.push({ d: path([[at(0.3), y + 0.5, TOP + 0.02], [at(L + 0.6), y + 0.5, TOP + 0.02], [at(L + 0.6), Y + 1, TOP + 0.02], [at(0.3), Y + 1, TOP + 0.02]]), fill: CAR_C.shadow, shadow: true });
  [3.9, L - 4.1].forEach((wx) => parts.push({ d: wheelRing(at(wx), y + 0.5, TOP + r, r * 0.95), fill: CAR_C.tyre }));

  // Upper surfaces, back to front.
  const strip = (k0: number, k1: number, fill: string, inset = 0) =>
    parts.push({ d: path([[X(k0), y + inset, Z(k0)], [X(k1), y + inset, Z(k1)], [X(k1), Y - inset, Z(k1)], [X(k0), Y - inset, Z(k0)]]), fill });
  strip(1, 2, CAR_C.body);
  strip(2, 3, CAR_C.body); // boot lid
  strip(3, 4, CAR_C.glass, 0.7); // rear glass
  strip(4, 5, CAR_C.body); // roof
  strip(5, 6, CAR_C.glass, 0.6); // windscreen
  parts.push({ d: path([[X(5) + 0.6, y + 2.4, Z(5) - 0.3], [X(6) - 0.9, y + 2.4, Z(6) + 0.4], [X(6) - 0.9, y + 3.2, Z(6) + 0.4], [X(5) + 0.6, y + 3.2, Z(5) - 0.3]]), fill: CAR_C.glassHi });
  strip(6, 7, CAR_C.body); // bonnet
  parts.push(ln([[X(6) + 1, y + 2.4, Z(6) + 0.05], [X(7) - 0.4, y + 2.6, Z(7) + 0.02]])); // bonnet creases
  parts.push(ln([[X(6) + 1, Y - 2.4, Z(6) + 0.05], [X(7) - 0.4, Y - 2.6, Z(7) + 0.02]]));
  strip(7, 8, CAR_C.body);

  // Nose (+x face): body, twin kidney grille, angel-eye headlights, lower intake.
  const nx = at(L) + 0.01;
  const face = (y0: number, y1: number, z0: number, z1: number, fill: string, dx = 0) =>
    parts.push({ d: path([[nx + dx, y0, z0], [nx + dx, y1, z0], [nx + dx, y1, z1], [nx + dx, y0, z1]]), fill });
  parts.push({ d: path([[at(L), y, zb + 0.4], [at(L), Y, zb + 0.4], [at(L), Y, zb + 2.3], [at(L), y, zb + 2.3]]), fill: CAR_C.body });
  const mid = y + W / 2;
  [[mid - 1.75, mid - 0.2], [mid + 0.2, mid + 1.75]].forEach(([a, b]) => {
    face(a - 0.12, b + 0.12, zb + 1.05, zb + 2.15, CAR_C.chrome);
    face(a, b, zb + 1.15, zb + 2.05, CAR_C.grille, 0.01);
  });
  [[y + 0.35, y + 1.9], [Y - 1.9, Y - 0.35]].forEach(([a, b]) => {
    face(a, b, zb + 1.55, zb + 2.1, CAR_C.trim);
    face(a + 0.15, a + 0.7, zb + 1.65, zb + 2.0, CAR_C.ring, 0.01);
    face(b - 0.7, b - 0.15, zb + 1.65, zb + 2.0, CAR_C.ring, 0.01);
  });
  face(y + 1.2, Y - 1.2, zb + 0.5, zb + 0.95, CAR_C.grille);

  // Near side (+y face).
  parts.push({ d: side(Y), fill: shade_(CAR_C.body, FACE_K.left) });
  const gz0 = zb + 3.35;
  // Side glass: rear door + quarter light, front door; the B-pillar between.
  parts.push({ d: path([[at(3.9), Y + 0.01, gz0], [at(8.6), Y + 0.01, gz0], [at(8.6), Y + 0.01, zb + 4.7], [at(5.8), Y + 0.01, zb + 4.6]]), fill: CAR_C.glass });
  parts.push({ d: path([[at(9.1), Y + 0.01, gz0], [at(13.0), Y + 0.01, gz0], [at(10.6), Y + 0.01, zb + 4.75], [at(9.1), Y + 0.01, zb + 4.75]]), fill: CAR_C.glass });
  parts.push(ln([[at(4.2), Y + 0.02, gz0 - 0.05], [at(12.9), Y + 0.02, gz0 - 0.05]], { weight: "normal" }));
  // Door seams and handles.
  [8.85, 13.2].forEach((dx) => parts.push(ln([[at(dx), Y + 0.02, zb + 1.2], [at(dx), Y + 0.02, gz0]])));
  parts.push(ln([[at(4.4), Y + 0.02, zb + 1.2], [at(3.9), Y + 0.02, gz0]]));
  [[6.9, 7.8], [11.2, 12.1]].forEach(([a, b]) =>
    parts.push({ d: path([[at(a), Y + 0.02, zb + 2.75], [at(b), Y + 0.02, zb + 2.75], [at(b), Y + 0.02, zb + 2.95], [at(a), Y + 0.02, zb + 2.95]]), fill: CAR_C.chrome }),
  );
  // Gill behind the front wheel, with the tri-colour M stripe.
  parts.push({ d: path([[at(13.6), Y + 0.02, zb + 1.9], [at(15.0), Y + 0.02, zb + 1.9], [at(15.0), Y + 0.02, zb + 2.35], [at(13.6), Y + 0.02, zb + 2.35]]), fill: CAR_C.trim });
  [CAR_C.mBlue, CAR_C.mNavy, CAR_C.mRed].forEach((c, k) =>
    parts.push({ d: path([[at(13.7 + k * 0.45), Y + 0.03, zb + 2.0], [at(14.05 + k * 0.45), Y + 0.03, zb + 2.0], [at(14.05 + k * 0.45), Y + 0.03, zb + 2.25], [at(13.7 + k * 0.45), Y + 0.03, zb + 2.25]]), fill: c }),
  );
  // Black sill and the rear light.
  parts.push({ d: path([[at(0.5), Y + 0.01, zb + 0.4], [at(L - 0.5), Y + 0.01, zb + 0.4], [at(L - 0.5), Y + 0.01, zb + 0.95], [at(0.5), Y + 0.01, zb + 0.95]]), fill: CAR_C.trim });
  parts.push({ d: path([[at(0.02), Y + 0.02, zb + 2.25], [at(1.5), Y + 0.02, zb + 2.45], [at(1.5), Y + 0.02, zb + 2.75], [at(0.02), Y + 0.02, zb + 2.6]]), fill: CAR_C.mRed });

  // Near-side wheels: tyre, dark rim, blue caliper, five double spokes, hub.
  [3.9, L - 4.1].forEach((wx) => {
    const cx = at(wx);
    const wy = Y + 0.12;
    const cz = TOP + r;
    parts.push({ d: wheelRing(cx, wy, cz, r), fill: CAR_C.tyre });
    parts.push({ d: wheelRing(cx, wy + 0.02, cz, r * 0.74, 22), fill: CAR_C.rim });
    parts.push({ d: path([[cx + r * 0.15, wy + 0.03, cz + r * 0.3], [cx + r * 0.55, wy + 0.03, cz + r * 0.3], [cx + r * 0.55, wy + 0.03, cz + r * 0.55], [cx + r * 0.15, wy + 0.03, cz + r * 0.55]]), fill: CAR_C.caliper });
    for (let k = 0; k < 5; k++) {
      const a = spin + (k * Math.PI * 2) / 5;
      for (const off of [-0.16, 0.16]) {
        const b = a + off;
        parts.push(ln([[cx + Math.cos(a) * r * 0.18, wy + 0.05, cz + Math.sin(a) * r * 0.18], [cx + Math.cos(b) * r * 0.7, wy + 0.05, cz + Math.sin(b) * r * 0.7]], { weight: "normal" }));
      }
    }
    parts.push({ d: wheelRing(cx, wy + 0.06, cz, r * 0.17, 10), fill: CAR_C.rimHi });
  });
  return parts;
}

/** The car's outline at x (its click/drag target). */
export function carHit(x: number) {
  const { length: L, width: W, y } = CAR;
  const pts: [number, number][] = [];
  for (const px of [x - 0.5, x + L + 0.5]) for (const py of [y - 0.5, y + W + 1]) for (const pz of [TOP, TOP + CAR.wheel * 0.7 + 5.2]) pts.push(project([px, py, pz]));
  return hullPoints(pts);
}
