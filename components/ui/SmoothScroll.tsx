"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { onLoaded } from "@/lib/animations/loader";

/** Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function SmoothScroll() {
  useEffect(() => {
    setupGsap();
    // Every visit starts at the top: no browser or ScrollTrigger scroll memory.
    ScrollTrigger.clearScrollMemory("manual");
    window.scrollTo(0, 0);
    if (prefersReducedMotion()) return onLoaded(() => window.scrollTo(0, 0));
    // Quick, light smoothing: each wheel step travels further and settles fast.
    const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1.35, touchMultiplier: 1.2, anchors: { offset: 0 } });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    // Stop scrolling while the preloader covers the page.
    // Only react when the loading state itself changes: Lenis toggles its own classes on <html>
    // too, and restarting on those would undo a stop() made by an open dialog.
    let loading: boolean | null = null;
    const sync = () => {
      const now = document.documentElement.classList.contains("is-loading");
      if (now === loading) return;
      loading = now;
      if (now) lenis.stop();
      else lenis.start();
    };
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sync();
    lenis.scrollTo(0, { immediate: true, force: true });
    const offLoaded = onLoaded(() => lenis.scrollTo(0, { immediate: true, force: true }));
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      offLoaded();
      mo.disconnect();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}
