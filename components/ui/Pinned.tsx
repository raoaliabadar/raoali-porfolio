"use client";

import { useReducedMotion, useScroll, type MotionValue } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Scroll-pinned section.
 *
 * The section sticks in place when it reaches the viewport. While it is pinned,
 * page scrolling drives `progress` (0 → 1), and every <Reveal> inside slides in
 * one after another — alternating from the left and the right. When everything
 * is shown, the section releases and the page scrolls on to the next one.
 *
 * Sections taller than the viewport scroll naturally until their bottom edge is
 * visible, then pin for the remaining animation.
 */

type PinContext = {
  /** Overall section progress, 0 → 1. */
  progress: MotionValue<number>;
  /** Share of `progress` used for item reveals (the rest is free for custom use). */
  portion: number;
  /** Total number of reveal items (read lazily). */
  count: React.RefObject<number>;
  /** Horizontal slide distance in px (read lazily). */
  distance: React.RefObject<number>;
  /** False when pinning is off (reduced motion). */
  enabled: boolean;
  /** Smoothly scroll the page so section progress equals `p`. */
  scrollToProgress: (p: number) => void;
};

const Ctx = createContext<PinContext | null>(null);
export const usePin = () => useContext(Ctx);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Reveal progress (0 → 1) for item `i` of `n`, given section progress `p`. */
export function itemProgress(p: number, i: number, n: number, portion: number) {
  const P = Math.min(1, Math.max(0, p / portion));
  if (n <= 1) return P;
  const w = Math.min(0.45, 2.4 / (n + 1)); // each item's window, overlapping its neighbours
  const start = (i * (1 - w)) / (n - 1);
  return Math.min(1, Math.max(0, (P - start) / w));
}

export function PinnedSection({
  id,
  className = "",
  children,
  as: Tag = "section",
  stepSvh = 9,
  minSvh = 45,
  maxSvh = 150,
  extraSvh,
  portion = 0.88,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div";
  /** Pinned scroll length per item (in svh). */
  stepSvh?: number;
  minSvh?: number;
  maxSvh?: number;
  /** Override the pinned scroll length (in svh). */
  extraSvh?: number;
  portion?: number;
}) {
  const reduce = useReducedMotion();
  const enabled = !reduce;
  const track = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLElement>(null);
  const count = useRef(0);
  const distance = useRef(90);
  const [items, setItems] = useState(0);
  const [height, setHeight] = useState(0);

  const { scrollYProgress } = useScroll({ target: track, offset: ["start 85%", "end end"] });

  // Index reveal items in DOM order (robust to re-renders and StrictMode).
  useIsoLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement>("[data-pin-item]");
    nodes.forEach((node, i) => (node.dataset.pinIndex = String(i)));
    count.current = nodes.length;
    setItems(nodes.length);
  });

  // Track section height (for the sticky offset) and slide distance per breakpoint.
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    const mq = window.matchMedia("(min-width: 768px)");
    const setDist = () => (distance.current = mq.matches ? 110 : 44);
    setDist();
    mq.addEventListener("change", setDist);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", setDist);
    };
  }, []);

  const scrollToProgress = useCallback((p: number) => {
    const el = track.current;
    if (!el) return;
    const vh = window.innerHeight;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const start = top - vh * 0.85;
    const end = top + el.offsetHeight - vh;
    window.scrollTo({ top: start + (end - start) * p, behavior: "smooth" });
  }, []);

  const extra = extraSvh ?? Math.min(maxSvh, Math.max(minSvh, items * stepSvh));

  return (
    <Ctx.Provider value={{ progress: scrollYProgress, portion, count, distance, enabled, scrollToProgress }}>
      <div ref={track} className="relative">
        <Tag
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={inner as any}
          id={id}
          className={`overflow-x-clip ${enabled ? "sticky flex min-h-svh flex-col justify-center" : ""} ${className}`}
          style={enabled && height ? { top: `min(0px, calc(100svh - ${height}px))` } : enabled ? { top: 0 } : undefined}
        >
          {children}
        </Tag>
        {enabled && <div aria-hidden style={{ height: `${extra}svh` }} />}
      </div>
    </Ctx.Provider>
  );
}
