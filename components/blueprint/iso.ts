/**
 * A tiny isometric scene builder for the wireframe icons: boxes, flat shapes and polylines in
 * 3D, projected to SVG paths. Same projection as the hero drawing.
 */
type V = [number, number, number];

const COS = Math.cos(Math.PI / 6);
const proj = ([x, y, z]: V): [number, number] => [(x - y) * COS, (x + y) * 0.5 - z];

export type IconPath = { d: string; face: "top" | "left" | "right" | "line"; accent?: boolean };

export function scene() {
  const out: IconPath[] = [];
  const path = (pts: V[], close = true) =>
    pts.map((p, i) => `${i ? "L" : "M"}${proj(p)[0].toFixed(2)} ${proj(p)[1].toFixed(2)}`).join("") + (close ? "Z" : "");

  const api = {
    box([x, y, z]: V, [w, d, h]: V, accent = false) {
      const X = x + w,
        Y = y + d,
        Z = z + h;
      out.push({ face: "left", accent, d: path([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]]) });
      out.push({ face: "right", accent, d: path([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]]) });
      out.push({ face: "top", accent, d: path([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]]) });
      return api;
    },
    /** A flat rectangle lying on z. */
    sheet(z: number, [x0, y0, x1, y1]: [number, number, number, number], accent = false) {
      out.push({ face: "top", accent, d: path([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]) });
      return api;
    },
    line(pts: V[], accent = false) {
      out.push({ face: "line", accent, d: path(pts, false) });
      return api;
    },
    done() {
      const pts = out.flatMap((p) => [...p.d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]));
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      const pad = 3;
      const x = Math.min(...xs) - pad;
      const y = Math.min(...ys) - pad;
      const w = Math.max(...xs) - Math.min(...xs) + pad * 2;
      const h = Math.max(...ys) - Math.min(...ys) + pad * 2;
      // Square viewBox so every icon sits on the same footprint.
      const s = Math.max(w, h);
      return { paths: out, viewBox: `${(x - (s - w) / 2).toFixed(1)} ${(y - (s - h) / 2).toFixed(1)} ${s.toFixed(1)} ${s.toFixed(1)}` };
    },
  };
  return api;
}

/* One wireframe per accounting area (keys match `accounting.areas[].icon` in src/content.ts). */
export const ICONS = {
  // Two invoices stacked, ruled lines, one total line in accent.
  invoice: (() => {
    const s = scene().box([0, 0, 0], [26, 34, 1.2]).box([4, -4, 1.2], [26, 34, 1.2]);
    for (let i = 0; i < 5; i++) s.line([[8, 2 + i * 4.5, 2.5], [i === 0 ? 18 : 26, 2 + i * 4.5, 2.5]]);
    return s.line([[16, 26, 2.5], [26, 26, 2.5]], true).done();
  })(),
  // A wallet: body, flap, clasp.
  wallet: scene().box([0, 0, 0], [34, 10, 22]).box([4, 10, 6], [30, 3, 10], true).line([[0, 10, 22], [10, 10, 14], [34, 10, 22]]).done(),
  // A ledger: closed book with page block and a spine band.
  ledger: scene().box([0, 0, 0], [24, 32, 3]).box([1, 1, 3], [22, 30, 4]).box([0, 0, 7], [24, 32, 2]).box([0, 29, 0], [24, 3, 9], true).done(),
  // Transfer: a plate with two opposing arrows.
  transfer: scene()
    .sheet(0, [0, 0, 34, 24])
    .line([[4, 8, 0.5], [30, 8, 0.5]])
    .line([[25, 4, 0.5], [30, 8, 0.5], [25, 12, 0.5]])
    .line([[30, 17, 0.5], [4, 17, 0.5]], true)
    .line([[9, 13, 0.5], [4, 17, 0.5], [9, 21, 0.5]], true)
    .done(),
  // Verification: a record block with a check mark on top.
  check: scene().box([0, 0, 0], [28, 28, 8]).line([[6, 14, 8.2], [12, 20, 8.2], [24, 6, 8.2]], true).done(),
  // Spreadsheet: a ruled grid lying flat, one column highlighted.
  sheet: (() => {
    const s = scene().sheet(0, [0, 0, 36, 28]).sheet(0.3, [12, 0, 20, 28], true);
    for (let i = 1; i < 4; i++) s.line([[i * 9, 0, 0.4], [i * 9, 28, 0.4]]);
    for (let j = 1; j < 4; j++) s.line([[0, j * 7, 0.4], [36, j * 7, 0.4]]);
    return s.done();
  })(),
  // Reporting: a bar chart of blocks.
  chart: scene().sheet(0, [0, 0, 36, 14]).box([3, 4, 0], [6, 6, 8]).box([12, 4, 0], [6, 6, 14]).box([21, 4, 0], [6, 6, 11]).box([30, 4, 0], [6, 6, 20], true).done(),
  // Monthly billing: a desk calendar block with ring binders.
  calendar: scene()
    .box([0, 0, 0], [30, 8, 26])
    .box([0, 8, 0], [30, 2, 20], true)
    .line([[7, 4, 26], [7, 4, 30]])
    .line([[23, 4, 26], [23, 4, 30]])
    .done(),
  // Reconciliation: statement and ledger side by side, linked.
  reconcile: scene()
    .box([0, 0, 0], [16, 26, 1.2])
    .box([22, 0, 0], [16, 26, 1.2])
    .line([[16, 8, 1.2], [22, 8, 1.2]], true)
    .line([[16, 18, 1.2], [22, 18, 1.2]], true)
    .done(),
} as const;

export type IconName = keyof typeof ICONS;
