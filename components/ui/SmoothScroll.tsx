"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";

/** Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function SmoothScroll() {
  useEffect(() => {
    setupGsap();
    if (prefersReducedMotion()) return;
    // Quick, light smoothing: each wheel step travels further and settles fast.
    const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1.35, touchMultiplier: 1.2, anchors: { offset: 0 } });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Stop scrolling while the preloader covers the page.
    const sync = () => (document.documentElement.classList.contains("is-loading") ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sync();
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      mo.disconnect();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
