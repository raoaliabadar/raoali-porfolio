"use client";

import { forwardRef, useId } from "react";
import { POLYS, VIEWBOX, VIEW, type Poly } from "./workspace";

type Props = {
  /** "lines" draws only the line art (preloader); "full" adds shading and the colour finish. */
  variant?: "lines" | "full";
  className?: string;
  /** Accessible description of the drawing. */
  title: string;
};

const HATCH: Record<Poly["face"], string> = { top: "a", left: "b", right: "c", detail: "c" };
const INK = "#1b1d1a";
const PAPER = "#f3f1ec";

/** Stroke widths in drawing units (the drawing renders at roughly 2.5 px per unit). */
const strokeFor = (p: Poly) => (p.weight === "arm" ? 0.9 : p.face === "detail" && p.weight === "fine" ? 0.26 : 0.44);

/**
 * The isometric workspace as stacked layers (bottom → top):
 *  color  – the clean illustrated finish (also the source for the pixel canvas)
 *  pixel  – canvas used while the finish resolves from blocks
 *  lines  – line art. Each face also carries a paper fill (so nearer objects hide what is
 *           behind them once the lines are drawn) and a hatch fill (the pencil shading).
 * GSAP drives the layers through the data-layer / data-draw / data-fill / data-hatch hooks.
 */
export const WorkspaceDrawing = forwardRef<HTMLDivElement, Props>(function WorkspaceDrawing(
  { variant = "full", className = "", title },
  ref,
) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const full = variant === "full";

  return (
    <div ref={ref} className={`relative ${className}`} style={{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }}>
      {full && (
        <>
          <svg data-layer="color" viewBox={VIEWBOX} className="absolute inset-0 size-full opacity-0" aria-hidden>
            {POLYS.map((p, i) =>
              p.fill ? (
                <path key={i} d={p.d} fill={p.fill} stroke={INK} strokeOpacity={0.5} strokeWidth={0.26} strokeLinejoin="round" />
              ) : (
                <path
                  key={i}
                  d={p.d}
                  fill="none"
                  stroke={p.weight === "arm" ? "#2b2d29" : p.obj === "screen" ? "#8db39e" : INK}
                  strokeOpacity={p.weight === "arm" || p.obj === "screen" ? 1 : 0.45}
                  strokeWidth={p.weight === "arm" ? 1.1 : p.weight === "normal" ? 0.4 : 0.24}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
            )}
          </svg>
          <canvas data-layer="pixel" className="absolute inset-0 size-full opacity-0" aria-hidden />
        </>
      )}
      <svg data-layer="lines" viewBox={VIEWBOX} className="absolute inset-0 size-full" role="img" aria-label={title}>
        <defs>
          <pattern id={`${id}a`} width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="3.4" stroke={INK} strokeWidth="0.2" strokeOpacity="0.5" />
          </pattern>
          <pattern id={`${id}b`} width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="2" stroke={INK} strokeWidth="0.24" strokeOpacity="0.6" />
          </pattern>
          <pattern id={`${id}c`} width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <path d="M0 0V1.7M0 0H1.7" stroke={INK} strokeWidth="0.24" strokeOpacity="0.62" />
          </pattern>
        </defs>
        {POLYS.map((p, i) => (
          <g key={i}>
            <path
              data-draw={p.obj}
              data-fill={p.fill ? "" : undefined}
              d={p.d}
              pathLength={1}
              fill={p.fill ? PAPER : "none"}
              fillOpacity={0}
              stroke={INK}
              strokeWidth={strokeFor(p)}
              strokeOpacity={p.obj === "floor" ? 0.35 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="1 1"
              strokeDashoffset={1}
            />
            {full && p.fill && p.obj !== "floor" && (
              <path data-hatch={p.obj} d={p.d} fill={`url(#${id}${HATCH[p.face]})`} opacity={0} pointerEvents="none" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
});
