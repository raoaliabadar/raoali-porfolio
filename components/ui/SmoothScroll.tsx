"use client";

import "lenis/dist/lenis.css";
import { useEffect } from "react";

/**
 * Lenis smooth scrolling, synced with GSAP ScrollTrigger. Disabled for reduced motion.
 * Lenis + GSAP are loaded lazily once the browser is idle, so they never compete
 * with the first paint / hydration.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let cleanup = () => {};

    const init = async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // anchors: smooth-scroll in-page links (sections already set scroll-margin-top)
      const lenis = new Lenis({ anchors: true, autoRaf: false });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    };

    const hasIdle = typeof window.requestIdleCallback === "function";
    const handle = hasIdle
      ? window.requestIdleCallback(() => void init(), { timeout: 2000 })
      : window.setTimeout(() => void init(), 600);

    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      cleanup();
    };
  }, []);

  return null;
}
