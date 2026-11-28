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
  /** A smooth panel: no outline of its own (its neighbours share its colour), so a curved
   *  surface built from strips reads as one surface. Edges are drawn as separate lines. */
  soft?: boolean;
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

/**
 * Where the car can drive: along x on the front strip of the desk top. Sized like a real
 * F90 M5 to scale: 19 long, 7.8 wide, 5.6 tall, 20-inch wheels (radius 1.37).
 */
export const CAR = { length: 19, width: 7.8, y: 72.5, xMin: 3, xMax: 138, wheel: 1.37 };

/** BMW M5 Competition (F90) look: silver-grey, carbon roof, gloss black trim, bronze wheels. */
const CAR_C = {
  body: "#a7adb2", // metallic silver-grey
  carbon: "#2a2d31",
  glass: "#1a242d",
  glassHi: "#5b7385",
  trim: "#121416", // gloss black (kidneys surround, window line, sills)
  grille: "#07080a",
  led: "#f2f8ff",
  plate: "#eeeee8",
  plateEu: "#2340a0",
  caliper: "#2a59a8",
  mBlue: "#2aa6df",
  mNavy: "#1d3f8f",
  mRed: "#e4002b",
  tail: "#b3122a",
  well: "#0b0c0d",
  tyre: "#17191b",
  rim: "#8a6f4d", // gunmetal bronze
  rimDark: "#24201b",
  rimHi: "#b89a72",
  shadow: "#1b1d1a",
};

/** A circle of radius r in the x-z plane at y, as a closed path. */
const wheelRing = (cx: number, y: number, cz: number, r: number, n = 24) =>
  path(Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] as Vec3;
  }));

/** Linear interpolation of a profile (u ascending) at u. */
const along = (pts: [number, number][], u: number) => {
  for (let k = 1; k < pts.length; k++) {
    const [u0, w0] = pts[k - 1];
    const [u1, w1] = pts[k];
    if (u <= u1) return w0 + ((w1 - w0) * (u - u0)) / (u1 - u0 || 1);
  }
  return pts[pts.length - 1][1];
};

/**
 * The car at x (its rear left corner), wheels turned by `spin` radians. Built like the real
 * car: a full-width lower body (boot deck, shoulders, long bonnet) with wheel arches cut into
 * its sides, and a narrower glass-house on top that leans in (tumblehome) under a carbon roof.
 * Nose: gloss black kidneys, slim LED headlights, big intakes, plate and a carbon lip.
 * Side: shoulder highlight, black window line, door seams, flush handles, mirror, the M gill,
 * black sills, and 10-spoke bronze wheels with blue calipers that turn as it rolls.
 * u runs along the car from the rear (0) to the nose (19); w is height above the desk.
 */
export function carParts(x: number, spin: number) {
  const { length: L, width: W, y, wheel: r } = CAR;
  const Y = y + W;
  const mid = y + W / 2;
  const p = (u: number, yy: number, w: number): Vec3 => [x + u, yy, TOP + w];
  const quad = (pts: [number, number, number][], fill: string, extra: Partial<Part> = {}): Part => ({ d: path(pts.map(([u, yy, w]) => p(u, yy, w))), fill, ...extra });
  const parts: Part[] = [];

  const GROUND = 0.45; // body bottom: lowered
  const AXLES = [4.0, 15.4];
  const ARCH = 1.62;

  // Body top line, rear to nose: boot lip, deck, shoulders along the glass-house, bonnet.
  const U: [number, number][] = [
    [0, 3.1], [0.15, 3.7], [0.45, 4.0], [1.3, 4.02], [3.3, 3.95],
    [11.6, 3.82], [13.5, 3.74], [15.4, 3.6], [17.4, 3.36], [18.5, 3.1], [L, 2.75],
  ];
  // Glass-house profile: rear glass, roof, windscreen.
  const G: [number, number][] = [[3.3, 3.95], [4.4, 4.75], [5.7, 5.35], [7.4, 5.6], [9.0, 5.5], [9.6, 5.3], [11.6, 3.82]];
  const ROOF = 5.6;
  const BELT = 3.9;
  // Glass-house sides lean in: 0.45 in at the belt, 1.2 in at the roof.
  const inset = (w: number) => 0.45 + (Math.max(0, w - BELT) / (ROOF - BELT)) * 0.75;
  const near = (w: number) => Y - inset(w);
  const far = (w: number) => y + inset(w);

  // Arch: from the front edge over the top to the rear edge, at body bottom height.
  const a0 = Math.asin((GROUND - r) / ARCH);
  const arch = (c: number, R = ARCH, n = 14) =>
    Array.from({ length: n + 1 }, (_, k) => {
      const a = a0 + ((Math.PI - 2 * a0) * k) / n;
      return [c + Math.cos(a) * R, r + Math.sin(a) * R] as [number, number];
    });
  const archHalf = Math.cos(a0) * ARCH;

  // Shadow and far wheels.
  parts.push({ ...quad([[-0.3, y + 0.3, 0.02], [L + 0.8, y + 0.3, 0.02], [L + 0.8, Y + 1.2, 0.02], [-0.3, Y + 1.2, 0.02]], CAR_C.shadow), shadow: true });
  AXLES.forEach((c) => parts.push({ d: wheelRing(x + c, y + 0.5, TOP + r, r), fill: CAR_C.tyre }));

  // Body top surfaces, full width.
  for (let k = 1; k < U.length; k++) {
    const [u0, w0] = U[k - 1];
    const [u1, w1] = U[k];
    parts.push(quad([[u0, y, w0], [u1, y, w1], [u1, Y, w1], [u0, Y, w0]], CAR_C.body, { soft: true }));
  }
  parts.push(ln(U.slice(2).map(([u, w]) => p(u, y, w)), { weight: "normal" }));
  // Bonnet power-dome creases.
  [y + 2.3, Y - 2.3].forEach((yy) => parts.push(ln([p(12.2, yy, along(U, 12.2) + 0.01), p(18.2, yy + (yy < mid ? 0.4 : -0.4), along(U, 18.2) + 0.01)])));

  // Glass-house tops: rear glass, carbon roof, windscreen.
  const gTop = (k0: number, k1: number, fill: string, soft = false) => {
    const [u0, w0] = G[k0];
    const [u1, w1] = G[k1];
    parts.push(quad([[u0, far(w0), w0], [u1, far(w1), w1], [u1, near(w1), w1], [u0, near(w0), w0]], fill, { soft }));
  };
  gTop(0, 1, CAR_C.glass);
  gTop(1, 2, CAR_C.glass);
  gTop(2, 3, CAR_C.carbon, true);
  gTop(3, 4, CAR_C.carbon, true);
  gTop(4, 5, CAR_C.carbon, true);
  parts.push(ln(G.slice(1, -1).map(([u, w]) => p(u, far(w), w)), { weight: "normal" }));
  gTop(5, 6, CAR_C.glass);

  // Glass-house near side: body-coloured C-pillar, black window line, B-pillar.
  parts.push({ d: path([...G.map(([u, w]) => p(u, near(w), w)), p(11.6, near(3.82), 3.82)]), fill: shade_(CAR_C.body, FACE_K.left) });
  const DLO: [number, number][] = [[4.7, 3.98], [5.1, 4.38], [5.5, 4.62], [6.2, 5.12], [7.4, 5.36], [8.9, 5.28], [9.4, 5.1], [11.1, 3.9]];
  parts.push({ d: path(DLO.map(([u, w]) => p(u, near(w) + 0.01, w))), fill: CAR_C.glass });
  parts.push(quad([[8.0, near(3.95) + 0.02, 3.95], [8.25, near(3.95) + 0.02, 3.95], [8.25, near(5.3) + 0.02, 5.3], [8.0, near(5.32) + 0.02, 5.32]], CAR_C.trim));
  parts.push(quad([[9.0, near(4.25) + 0.02, 4.25], [9.5, near(4.25) + 0.02, 4.25], [9.1, near(4.95) + 0.02, 4.95], [8.75, near(4.95) + 0.02, 4.95]], CAR_C.glassHi));
  parts.push(ln(DLO.map(([u, w]) => p(u, near(w) + 0.03, w)), { weight: "normal" }));

  // Nose (+x face).
  const N = L + 0.01;
  const face = (y0: number, y1: number, w0: number, w1: number, fill: string, dx = 0) =>
    parts.push(quad([[N + dx, y0, w0], [N + dx, y1, w0], [N + dx, y1, w1], [N + dx, y0, w1]], fill));
  parts.push(quad([[L, y, 0.6], [L, Y, 0.6], [L, Y, 2.75], [L, y, 2.75]], shade_(CAR_C.body, FACE_K.right)));
  // Kidneys: gloss black surround, black mesh, slats.
  [[mid - 1.55, mid - 0.12], [mid + 0.12, mid + 1.55]].forEach(([a, b]) => {
    face(a - 0.1, b + 0.1, 1.65, 2.62, CAR_C.trim);
    face(a, b, 1.75, 2.52, CAR_C.grille, 0.01);
    for (let k = 1; k < 4; k++) parts.push(ln([p(N + 0.02, a + ((b - a) * k) / 4, 1.8), p(N + 0.02, a + ((b - a) * k) / 4, 2.47)]));
  });
  // Slim headlights, outer edge higher, two LED rings each.
  [[y + 0.2, mid - 1.8], [Y - 0.2, mid + 1.8]].forEach(([outer, inner]) => {
    const s = Math.sign(inner - outer);
    parts.push(quad([[N, outer, 2.2], [N, inner, 2.05], [N, inner, 2.5], [N, outer, 2.66]], CAR_C.trim));
    [0.25, 0.95].forEach((o) => {
      const c = outer + s * o;
      parts.push(quad([[N + 0.01, c, 2.27], [N + 0.01, c + s * 0.5, 2.24], [N + 0.01, c + s * 0.5, 2.5], [N + 0.01, c, 2.53]], CAR_C.led));
    });
  });
  // Bumper: big outer intakes, centre intake with the plate, carbon lip.
  face(y + 0.3, y + 2.0, 0.75, 1.75, CAR_C.grille);
  face(Y - 2.0, Y - 0.3, 0.75, 1.75, CAR_C.grille);
  face(y + 2.3, Y - 2.3, 0.75, 1.5, CAR_C.grille);
  face(mid - 1.0, mid + 1.0, 1.0, 1.36, CAR_C.plate, 0.02);
  face(mid - 1.0, mid - 0.78, 1.0, 1.36, CAR_C.plateEu, 0.03);
  parts.push(quad([[L, y + 0.25, 0.6], [L + 0.35, y + 0.25, 0.55], [L + 0.35, Y - 0.25, 0.55], [L, Y - 0.25, 0.6]], CAR_C.carbon));
  face(y + 0.25, Y - 0.25, 0.42, 0.55, CAR_C.carbon, 0.34);

  // Wheel wells, then the near wheels (the body side drawn next frames them in the arches).
  AXLES.forEach((c) => parts.push({ d: path(arch(c).map(([u, w]) => p(u, Y - 0.4, w))), fill: CAR_C.well }));
  AXLES.forEach((c) => {
    const cx = x + c;
    const cz = TOP + r;
    const wy = Y - 0.12;
    parts.push({ d: wheelRing(cx, wy - 0.7, cz, r), fill: CAR_C.tyre });
    parts.push({ d: wheelRing(cx, wy, cz, r), fill: CAR_C.tyre });
    parts.push({ d: wheelRing(cx, wy + 0.01, cz, r * 0.8), fill: CAR_C.rim });
    parts.push({ d: wheelRing(cx, wy + 0.02, cz, r * 0.72), fill: CAR_C.rimDark });
    const pt = (a: number, rr: number, dy = 0.04): Vec3 => [cx + Math.cos(a) * rr, wy + dy, cz + Math.sin(a) * rr];
    parts.push({ d: path([pt(0.35, r * 0.3, 0.03), pt(1.05, r * 0.3, 0.03), pt(1.05, r * 0.6, 0.03), pt(0.35, r * 0.6, 0.03)]), fill: CAR_C.caliper });
    // Ten spokes in five Y-pairs.
    for (let k = 0; k < 5; k++) {
      const a = spin + (k * Math.PI * 2) / 5;
      for (const o of [-0.2, 0.2]) {
        const b = a + o;
        parts.push({ d: path([pt(a - 0.1, r * 0.2), pt(a + 0.1, r * 0.2), pt(b + 0.06, r * 0.73), pt(b - 0.06, r * 0.73)]), fill: CAR_C.rim });
      }
    }
    parts.push({ d: wheelRing(cx, wy + 0.05, cz, r * 0.2, 12), fill: CAR_C.rimHi });
  });

  // Near side (+y face) with the arches cut out.
  const bottom: [number, number][] = [[L - 0.2, GROUND], ...arch(AXLES[1]), ...arch(AXLES[0]), [0.3, GROUND], [0, 0.95]];
  const sidePts: [number, number][] = [...U, [L, 0.6], ...bottom];
  parts.push({ d: path(sidePts.map(([u, w]) => p(u, Y, w))), fill: shade_(CAR_C.body, 0.84) });
  // Shoulder highlight band along the top of the side.
  const band = U.slice(1, -1);
  parts.push({ d: path([...band.map(([u, w]) => p(u, Y + 0.01, w)), ...band.slice().reverse().map(([u, w]) => p(u, Y + 0.01, w - 0.55))]), fill: shade_(CAR_C.body, 0.97) });
  // Arch lips.
  AXLES.forEach((c) => parts.push(ln(arch(c, ARCH + 0.14).map(([u, w]) => p(u, Y + 0.02, Math.max(w, GROUND))))));
  // Black sill between the arches.
  parts.push(quad([[AXLES[0] + archHalf, Y + 0.02, GROUND], [AXLES[1] - archHalf, Y + 0.02, GROUND], [AXLES[1] - archHalf, Y + 0.02, 0.78], [AXLES[0] + archHalf, Y + 0.02, 0.78]], CAR_C.trim));
  // Door seams and flush handles.
  [5.9, 8.12, 11.75].forEach((u) => parts.push(ln([p(u, Y + 0.02, 0.8), p(u, Y + 0.02, along(U, u) - 0.02)])));
  [[6.5, 7.2], [10.3, 11.0]].forEach(([a, b]) => parts.push(quad([[a, Y + 0.02, 3.1], [b, Y + 0.02, 3.1], [b, Y + 0.02, 3.22], [a, Y + 0.02, 3.22]], shade_(CAR_C.body, 0.78))));
  // M gill with the tri-colour stripe behind the front wheel.
  parts.push(quad([[12.9, Y + 0.02, 2.55], [13.9, Y + 0.02, 2.55], [13.9, Y + 0.02, 2.85], [12.9, Y + 0.02, 2.85]], CAR_C.trim));
  [CAR_C.mBlue, CAR_C.mNavy, CAR_C.mRed].forEach((c, k) => parts.push(quad([[13.0 + k * 0.3, Y + 0.03, 2.62], [13.25 + k * 0.3, Y + 0.03, 2.62], [13.25 + k * 0.3, Y + 0.03, 2.78], [13.0 + k * 0.3, Y + 0.03, 2.78]], c)));
  // Tail light wrapping the rear corner.
  parts.push(quad([[0.05, Y + 0.02, 3.15], [1.7, Y + 0.02, 3.4], [1.7, Y + 0.02, 3.62], [0.12, Y + 0.02, 3.55]], CAR_C.tail));
  // Carbon mirror on the door.
  parts.push(...boxParts([x + 11.1, Y - 0.2, TOP + 3.95], [0.65, 0.85, 0.45], CAR_C.carbon));
  return parts;
}

/** The car's outline at x (its click/drag target). */
export function carHit(x: number) {
  const { length: L, width: W, y } = CAR;
  const pts: [number, number][] = [];
  for (const px of [x - 0.5, x + L + 0.5]) for (const py of [y - 0.5, y + W + 1]) for (const pz of [TOP, TOP + 6.0]) pts.push(project([px, py, pz]));
  return hullPoints(pts);
}
