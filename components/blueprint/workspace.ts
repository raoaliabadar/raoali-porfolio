/**
 * The workspace drawing, built from boxes in 3D and projected isometrically, so the same
 * geometry gives every layer of the render: line art, pencil hatching and the flat colour finish.
 *
 * Axes: x runs to the right-back, y to the left-front, z up. The viewer sees the top (+z),
 * the +x face (right) and the +y face (front-left) of every box.
 */

export type Vec3 = [number, number, number];
export type Face = "top" | "right" | "left";

export type Poly = {
  /** Object this belongs to (annotations and colours key on it). */
  obj: string;
  face: Face | "detail";
  /** SVG path data in projected 2D. */
  d: string;
  fill?: string;
  /** Detail strokes only: draw them lighter than the outlines. */
  weight?: "fine" | "normal" | "arm";
};

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export const project = ([x, y, z]: Vec3): [number, number] => [(x - y) * COS, (x + y) * SIN - z];

export const path = (pts: Vec3[], close = true) =>
  pts
    .map((p, i) => {
      const [a, b] = project(p);
      return `${i ? "L" : "M"}${a.toFixed(2)} ${b.toFixed(2)}`;
    })
    .join("") + (close ? "Z" : "");

/* Materials: face shades are the base colour darkened per side (no gradients). */
export const shade_ = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
export const FACE_K: Record<Face, number> = { top: 1, left: 0.9, right: 0.8 };

const out: Poly[] = [];

function box(obj: string, [x, y, z]: Vec3, [w, d, h]: Vec3, color: string) {
  const X = x + w,
    Y = y + d,
    Z = z + h;
  out.push({ obj, face: "top", d: path([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]), fill: shade_(color, FACE_K.top) });
  out.push({ obj, face: "right", d: path([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]), fill: shade_(color, FACE_K.right) });
  out.push({ obj, face: "left", d: path([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]), fill: shade_(color, FACE_K.left) });
}

/** A flat shape on a box face (screen widgets, drawer fronts…), given in face coordinates. */
function onFrontFace(obj: string, y: number, rect: [number, number, number, number], color?: string, weight: Poly["weight"] = "fine") {
  const [x0, z0, x1, z1] = rect;
  out.push({ obj, face: "detail", d: path([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]), fill: color, weight });
}
function onTop(obj: string, z: number, rect: [number, number, number, number], color?: string, weight: Poly["weight"] = "fine") {
  const [x0, y0, x1, y1] = rect;
  out.push({ obj, face: "detail", d: path([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]), fill: color, weight });
}
/** A lamp shade: a square frustum, wide at the bottom. */
function shade(obj: string, [cx, cy]: [number, number], b: number, t: number, z0: number, z1: number, color: string) {
  out.push({ obj, face: "right", d: path([[cx + b, cy - b, z0], [cx + b, cy + b, z0], [cx + t, cy + t, z1], [cx + t, cy - t, z1]]), fill: shade_(color, FACE_K.right) });
  out.push({ obj, face: "left", d: path([[cx - b, cy + b, z0], [cx + b, cy + b, z0], [cx + t, cy + t, z1], [cx - t, cy + t, z1]]), fill: shade_(color, FACE_K.left) });
  out.push({ obj, face: "top", d: path([[cx - t, cy - t, z1], [cx + t, cy - t, z1], [cx + t, cy + t, z1], [cx - t, cy + t, z1]]), fill: shade_(color, FACE_K.top) });
}
function line(obj: string, pts: Vec3[], weight: Poly["weight"] = "fine") {
  out.push({ obj, face: "detail", d: path(pts, false), weight });
}

export const PALETTE = {
  desk: "#d9cfbc",
  pedestal: "#e6e1d6",
  steel: "#2b2d29",
  monitor: "#1f221e",
  screen: "#203129",
  signal: "#2f6b4f",
  signalSoft: "#8db39e",
  paper: "#fbfaf6",
  ledgerA: "#2f6b4f",
  ledgerB: "#3a3d37",
  ledgerC: "#cfc7b4",
  keyboard: "#ebe7de",
  floor: "#ece9e1",
};

/* ---------------- Interactive parts: drawers and keys ---------------- */

/** Drawer fronts on the pedestal: [bottom z, top z] each, bottom drawer first. */
export const DRAWERS: [number, number][] = [
  [4, 22],
  [24, 46],
  [48, 70],
];
export const PED_FRONT = 76;
export const PED_X0 = 7;
export const PED_X1 = 43;

export type KeyDef = { k: string; label?: string; w?: number };
/** The desk keyboard, back row first. Every row is 12 units wide. */
export const KEY_ROWS: KeyDef[][] = [
  [..."1234567890".split("").map((k) => ({ k })), { k: "Backspace", label: "⌫", w: 2 }],
  [..."QWERTYUIOP".split("").map((k) => ({ k })), { k: "+" }, { k: "-" }],
  [..."ASDFGHJKL".split("").map((k) => ({ k })), { k: "Enter", label: "↵", w: 3 }],
  [..."ZXCVBNM".split("").map((k) => ({ k })), { k: "," }, { k: "." }, { k: "/" }, { k: "*" }, { k: "=" }],
  [{ k: "$" }, { k: "%" }, { k: " ", label: "Space", w: 8 }, { k: "(" }, { k: ")" }],
];
const KB = { x0: 52.7, x1: 95.3, y0: 32.6, y1: 44.4 };
const KEY_PITCH_X = (KB.x1 - KB.x0) / 12;
const KEY_PITCH_Y = (KB.y1 - KB.y0) / KEY_ROWS.length;
/** A key's cap on the keyboard top: [x0, y0, x1, y1] (with a small gap round it). */
export function keyRect(row: number, unit: number, w = 1): [number, number, number, number] {
  const x0 = KB.x0 + unit * KEY_PITCH_X;
  const y0 = KB.y0 + row * KEY_PITCH_Y;
  return [x0 + 0.35, y0 + 0.3, x0 + w * KEY_PITCH_X - 0.35, y0 + KEY_PITCH_Y - 0.3];
}
/** The whole cell a key owns (no gaps), for click targets. */
export function keyCell(row: number, unit: number, w = 1): [number, number, number, number] {
  const x0 = KB.x0 + unit * KEY_PITCH_X;
  const y0 = KB.y0 + row * KEY_PITCH_Y;
  return [x0, y0, x0 + w * KEY_PITCH_X, y0 + KEY_PITCH_Y];
}

/* ---------------- The scene, back to front ---------------- */
export const TOP = 76; // desk surface height

// Floor plate (just a faint sheet the desk stands on).
onTop("floor", 0, [-14, -10, 176, 104], PALETTE.floor, "fine");

// Desk legs at the back right, then the pedestal, then the top.
box("desk", [150, 4, 0], [5, 5, TOP - 4], PALETTE.steel);
box("pedestal", [4, 6, 0], [42, 70, TOP - 4], PALETTE.pedestal);
// Drawer fronts on the pedestal's front face (they slide out: see deskParts.ts).
DRAWERS.forEach(([z0, z1]) => onFrontFace("pedestal", PED_FRONT, [PED_X0, z0, PED_X1, z1], undefined));
[13, 35, 59].forEach((z) => line("pedestal", [[20, 76, z], [30, 76, z]], "normal"));
box("desk", [150, 71, 0], [5, 5, TOP - 4], PALETTE.steel);
box("desk", [0, 0, TOP - 4], [160, 82, 4], PALETTE.desk);

// Monitor: foot, neck, body, screen.
box("monitor", [62, 10, TOP], [24, 13, 1.6], PALETTE.monitor);
box("monitor", [71, 14, TOP + 1.6], [5, 3, 15], PALETTE.monitor);
box("monitor", [40, 12, 88], [68, 3, 40], PALETTE.monitor);
export const SY = 15.01; // the screen plane (front face of the monitor body)
onFrontFace("monitor", SY, [42.5, 90.5, 105.5, 125.5], PALETTE.screen, "normal");
// Dashboard on the screen: KPI tiles, bar chart, trend line.
[[45, 117, 58, 123.5], [60, 117, 73, 123.5], [75, 117, 88, 123.5], [90, 117, 103, 123.5]].forEach((r, i) =>
  onFrontFace("screen", SY, r as [number, number, number, number], i === 2 ? PALETTE.signal : "#2c4237"),
);
[3, 5, 4, 7, 6, 8, 7, 10].forEach((h, i) => onFrontFace("screen", SY, [46 + i * 4.4, 93, 49 + i * 4.4, 93 + h * 1.9], i % 2 ? PALETTE.signalSoft : PALETTE.signal));
line("screen", [[83, SY, 96], [88, SY, 101], [93, SY, 99], [98, SY, 106], [103, SY, 110]], "normal");
line("screen", [[83, SY, 93.5], [103, SY, 93.5]], "fine");

// Lamp (back left): base, two arm segments, shade.
box("lamp", [10, 8, TOP], [14, 14, 2.5], PALETTE.steel);
line("lamp", [[17, 15, TOP + 2.5], [19, 17, 112], [35, 29, 118]], "arm");
shade("lamp", [36, 30], 8.5, 3, 103, 116, PALETTE.signal);

// Ledger books, stacked on the right.
box("books", [118, 12, TOP], [30, 21, 4], PALETTE.ledgerB);
box("books", [119.5, 13, TOP + 4], [28, 20, 4.4], PALETTE.ledgerA);
box("books", [118.5, 12.5, TOP + 8.4], [29, 20, 3.6], PALETTE.ledgerC);
// page edges on the right faces
[TOP + 1.3, TOP + 2.7, TOP + 5.4, TOP + 6.9, TOP + 9.6, TOP + 10.9].forEach((z, i) =>
  line("books", [[i < 2 ? 148 : i < 4 ? 147.5 : 147.5, 14, z], [i < 2 ? 148 : 147.5, 32, z]], "fine"),
);

// Keyboard and the documents in front of it.
box("keyboard", [52, 32, TOP], [44, 13, 1.4], PALETTE.keyboard);
// Individual keycaps (each one is clickable: see KEYS below).
KEY_ROWS.forEach((row, r) => {
  let u = 0;
  row.forEach((k) => {
    const w = k.w ?? 1;
    const [x0, y0, x1, y1] = keyRect(r, u, w);
    onTop("keyboard", TOP + 1.42, [x0, y0, x1, y1]);
    u += w;
  });
});
box("documents", [100, 44, TOP], [27, 21, 0.5], PALETTE.paper);
box("documents", [104, 49, TOP + 0.5], [27, 21, 0.5], PALETTE.paper);
for (let r = 0; r < 6; r++) line("documents", [[108, 53 + r * 2.6, TOP + 1.02], [r === 0 ? 118 : 127, 53 + r * 2.6, TOP + 1.02]], r === 0 ? "normal" : "fine");

export const POLYS: Poly[] = out;

/* Bounds → viewBox (with margin for the annotation cards). */
const allPts: [number, number][] = [];
for (const p of out) {
  for (const m of p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)) allPts.push([+m[1], +m[2]]);
}
const xs = allPts.map((p) => p[0]);
const ys = allPts.map((p) => p[1]);
const PAD = 14;
export const VIEW = {
  x: Math.min(...xs) - PAD,
  y: Math.min(...ys) - PAD,
  w: Math.max(...xs) - Math.min(...xs) + PAD * 2,
  h: Math.max(...ys) - Math.min(...ys) + PAD * 2,
};
export const VIEWBOX = `${VIEW.x.toFixed(1)} ${VIEW.y.toFixed(1)} ${VIEW.w.toFixed(1)} ${VIEW.h.toFixed(1)}`;

/** Where callouts attach (3D points on each object). */
export const ANCHORS: Record<string, Vec3> = {
  monitor: [74, SY, 112],
  books: [133, 22, TOP + 12],
  documents: [117, 60, TOP + 1],
  lamp: [37, 31, 110],
};

/** A 3D point as a fraction of the drawing (0–1), for positioning HTML over the SVG. */
export function toUnit(p: Vec3): [number, number] {
  const [a, b] = project(p);
  return [(a - VIEW.x) / VIEW.w, (b - VIEW.y) / VIEW.h];
}

/** The screen rectangle (fractions of the drawing): the camera's zoom target. */
export const SCREEN_BOX = (() => {
  const c = [toUnit([42.5, SY, 125.5]), toUnit([105.5, SY, 125.5]), toUnit([105.5, SY, 90.5]), toUnit([42.5, SY, 90.5])];
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
})();
/** Three corners of the screen (fractions of the drawing), for laying the screen app onto it. */
export const SCREEN_QUAD = {
  tl: toUnit([42.5, SY, 125.5]),
  tr: toUnit([105.5, SY, 125.5]),
  bl: toUnit([42.5, SY, 90.5]),
};
/** Centre of the screen, used as the camera's zoom target. */
export const SCREEN_CENTER = toUnit([74, SY, 108]);

/* ---------------- Lamp light and click targets ---------------- */

const hull = (pts: [number, number][]) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
};
const d2 = (pts: [number, number][]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(2)} ${q[1].toFixed(2)}`).join("") + "Z";
/** The shade hangs at (36, 30); its light lands straight below it on the desk. */
const LIGHT_AT: [number, number] = [37, 32];
const ring = (rx: number, ry: number): [number, number][] =>
  Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return project([LIGHT_AT[0] + Math.cos(a) * rx, LIGHT_AT[1] + Math.sin(a) * ry, TOP + 0.05]);
  });
const POOL = ring(22, 19);
const SHADE_MOUTH: [number, number][] = [
  [27.5, 21.5],
  [44.5, 21.5],
  [44.5, 38.5],
  [27.5, 38.5],
].map(([x, y]) => project([x, y, 103]));

/** Warm light from the lamp: the cone under the shade and the pool it makes on the desk. */
export const LAMP_CONE = d2(hull([...SHADE_MOUTH, ...POOL]));
export const LAMP_POOL = d2(POOL);
/** Brighter rings towards the middle of the pool: a stepped fall-off in flat shapes. */
export const LAMP_POOL_MID = d2(ring(14, 12));
export const LAMP_POOL_CORE = d2(ring(7, 6));
/** The shade's outline: light is never painted over the shade itself. */
export const LAMP_SHADE = d2(hull(out.filter((p) => p.obj === "lamp").slice(-3).flatMap((p) => [...p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]] as [number, number]))));
/** The bulb, seen just under the shade. */
export const LAMP_BULB = project([36, 30, 103.5]);

/** Bounding box of an object's drawing, as fractions of the drawing (for click targets). */
export function hitBox(obj: string, pad = 0.01) {
  const pts = out
    .filter((p) => p.obj === obj)
    .flatMap((p) => [...p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]));
  const xs = pts.map((q) => (q[0] - VIEW.x) / VIEW.w);
  const ys = pts.map((q) => (q[1] - VIEW.y) / VIEW.h);
  return { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
}

/** Outline (convex hull) of an object's drawing, in drawing units: a precise click target. */
export function hullPath(obj: string) {
  const pts = out
    .filter((p) => p.obj === obj)
    .flatMap((p) => [...p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]] as [number, number]));
  return d2(hull(pts));
}
/** The screen face of the monitor. */
export const SCREEN_PATH = path([
  [42.5, SY, 125.5],
  [105.5, SY, 125.5],
  [105.5, SY, 90.5],
  [42.5, SY, 90.5],
]);
/** The desk top slab (top, right, front faces): redrawn over an open drawer, which slides out under it. */
export const DESK_TOP_POLYS: Poly[] = out.filter((p) => p.obj === "desk").slice(-3);

export type DeskKey = KeyDef & { row: number; cap: string; cell: string };
/** Every key on the desk keyboard with its cap outline and its click cell. */
export const KEYS: DeskKey[] = KEY_ROWS.flatMap((row, r) => {
  let u = 0;
  return row.map((k) => {
    const w = k.w ?? 1;
    const [a, b, c, d] = keyRect(r, u, w);
    const [e, f, g, h] = keyCell(r, u, w);
    u += w;
    const z = TOP + 1.42;
    return {
      ...k,
      row: r,
      cap: path([[a, b, z], [c, b, z], [c, d, z], [a, d, z]]),
      cell: path([[e, f, z], [g, f, z], [g, h, z], [e, h, z]]),
    };
  });
});
