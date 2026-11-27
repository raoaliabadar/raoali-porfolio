"use client";

import { useEffect, type RefObject } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "./gsap";

/**
 * Draws a section's blueprint chrome when it enters: column rules ([data-frame] grow down,
 * [data-frame-x] grow across), "+" marks ([data-plus]) and SVG strokes ([data-draw], drawn
 * with pathLength=1). Elements inside [data-draw-group] draw when that group enters instead.
 */
export function useDrawLines<T extends HTMLElement>(ref: RefObject<T | null>, { start = "top 78%" } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setupGsap();
    const q = gsap.utils.selector(el);
    const own = (sel: string) => q(sel).filter((n) => !n.closest("[data-draw-group]") || n.closest("[data-draw-group]") === el);

    if (prefersReducedMotion()) {
      gsap.set(q("[data-draw]"), { strokeDashoffset: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start, once: true } });
      tl.from(own("[data-frame]"), { scaleY: 0, transformOrigin: "50% 0%", duration: 1.3, ease: "drawer", stagger: 0.05 }, 0)
        .from(own("[data-frame-x]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1.3, ease: "drawer", stagger: 0.05 }, 0.05)
        .from(own("[data-plus]"), { scale: 0, autoAlpha: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.04 }, 0.35)
        .to(own("[data-draw]"), { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: 0.015 }, 0.15);

      // Groups (cards, icons) draw as each one scrolls in.
      q("[data-draw-group]").forEach((g) => {
        // Groups inside [data-draw-skip] are drawn by their own section's animation.
        if (g === el || g.closest("[data-draw-skip]")) return;
        const parts = g.querySelectorAll("[data-draw]");
        gsap.to(parts, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.inOut",
          stagger: 0.03,
          scrollTrigger: { trigger: g, start: "top 85%", once: true },
        });
      });
    }, el);
    return () => ctx.revert();
  }, [ref, start]);
}
