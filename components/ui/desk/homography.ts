/**
 * CSS matrix3d that maps a w×h element (transform-origin 0 0) onto any quad on screen.
 * Used to glue HTML (the laptop desktop, the writing paper) onto 3D surfaces so it
 * follows the surface's perspective exactly.
 *
 * Corners: tl, tr, bl, br in container pixels.
 */
export type Pt = [number, number];

export function quadToMatrix3d(w: number, h: number, tl: Pt, tr: Pt, bl: Pt, br: Pt): string | null {
  // Square-to-quad projective mapping (Heckbert): (0,0)→tl, (1,0)→tr, (1,1)→br, (0,1)→bl.
  const [x0, y0] = tl;
  const [x1, y1] = tr;
  const [x2, y2] = br;
  const [x3, y3] = bl;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const det = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(det) < 1e-9) return null;
  const g = (sx * dy2 - dx2 * sy) / det;
  const hh = (dx1 * sy - sx * dy1) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  if (m.some((v) => !Number.isFinite(v))) return null;
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}
