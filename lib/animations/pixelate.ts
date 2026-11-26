"use client";

/**
 * Pixel → sharp: draws an SVG onto a canvas at a coarse resolution and scales it up without
 * smoothing, so the drawing can resolve from big blocks into the crisp vector.
 */
export function createPixelator(svg: SVGSVGElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  const small = document.createElement("canvas");
  const sctx = small.getContext("2d");
  let ready = false;
  let pending: number | null = null;
  let last = -1;

  // Render the source at a fixed, generous size so the sharp end of the scale stays crisp.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  clone.setAttribute("width", "1600");
  clone.setAttribute("height", String(Math.round((1600 * vb.height) / vb.width)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const xml = new XMLSerializer().serializeToString(clone);
  img.decoding = "async";
  img.onload = () => {
    ready = true;
    if (pending !== null) draw(pending);
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    last = -1;
  }

  /** cell = block size in CSS pixels (1 = sharp). */
  function draw(cell: number) {
    if (!ctx || !sctx) return;
    if (!ready) {
      pending = cell;
      return;
    }
    const c = Math.max(1, Math.round(cell));
    if (c === last) return;
    last = c;
    if (!canvas.width) resize();
    const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
    const w = Math.max(1, Math.round(canvas.width / (c * dpr)));
    const h = Math.max(1, Math.round(canvas.height / (c * dpr)));
    small.width = w;
    small.height = h;
    sctx.clearRect(0, 0, w, h);
    sctx.drawImage(img, 0, 0, w, h);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = c <= 1;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  }

  resize();
  return { draw, resize };
}
