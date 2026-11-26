"use client";

type Fit = "fill" | "cover";

/**
 * Pixel → sharp: draws an image onto a canvas at a coarse resolution and scales it up without
 * smoothing, so it can resolve from big blocks into the crisp picture.
 */
function pixelator(img: HTMLImageElement, canvas: HTMLCanvasElement, fit: Fit, filter = "none") {
  const ctx = canvas.getContext("2d");
  const small = document.createElement("canvas");
  const sctx = small.getContext("2d");
  let ready = img.complete && img.naturalWidth > 0;
  let pending: number | null = null;
  let last = -1;

  img.addEventListener("load", () => {
    ready = true;
    if (pending !== null) draw(pending);
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    const keep = last;
    last = -1;
    if (keep > 0) draw(keep);
  }

  /** The source rectangle for object-fit: cover. */
  function srcRect() {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (fit === "fill") return [0, 0, iw, ih] as const;
    const ca = canvas.width / canvas.height;
    const ia = iw / ih;
    if (ia > ca) {
      const w = ih * ca;
      return [(iw - w) / 2, 0, w, ih] as const;
    }
    const h = iw / ca;
    return [0, (ih - h) * 0.3, iw, h] as const;
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
    if (canvas.width <= 1) resize();
    const dpr = canvas.width / Math.max(1, canvas.getBoundingClientRect().width);
    const w = Math.max(1, Math.round(canvas.width / (c * dpr)));
    const h = Math.max(1, Math.round(canvas.height / (c * dpr)));
    small.width = w;
    small.height = h;
    sctx.filter = filter;
    const [sx, sy, sw, sh] = srcRect();
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = c <= 1;
    ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
  }

  resize();
  return { draw, resize };
}

/** Pixelate an inline SVG (rendered at a fixed, generous size so the sharp end stays crisp). */
export function createPixelator(svg: SVGSVGElement, canvas: HTMLCanvasElement) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const vb = svg.viewBox.baseVal;
  clone.setAttribute("width", "1600");
  clone.setAttribute("height", String(Math.round((1600 * vb.height) / vb.width)));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("class");
  const img = new Image();
  img.decoding = "async";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return pixelator(img, canvas, "fill");
}

/** Pixelate a photo, cropped like object-fit: cover. */
export function createImagePixelator(src: string, canvas: HTMLCanvasElement, filter?: string) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return pixelator(img, canvas, "cover", filter);
}
