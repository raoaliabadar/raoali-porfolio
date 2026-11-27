"use client";

import { useEffect, type RefObject } from "react";
import { gsap, prefersReducedMotion, setupGsap, SplitText } from "./gsap";

/**
 * Word-by-word ink scrub: words start faint (like pencil) and fill in as the paragraph scrolls
 * through the viewport. Uses opacity, so it works in both themes.
 */
export function useScrubText<T extends HTMLElement>(
  ref: RefObject<T | null>,
  { from = 0.22, start = "top 82%", end = "bottom 55%" }: { from?: number; start?: string; end?: string } = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    let tween: gsap.core.Tween | null = null;
    const split = SplitText.create(el, {
      type: "words",
      autoSplit: true,
      onSplit(self) {
        tween?.kill();
        tween = gsap.fromTo(
          self.words,
          { opacity: from },
          { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start, end, scrub: true } },
        );
        return tween;
      },
    });
    return () => {
      tween?.kill();
      split.revert();
    };
  }, [ref, from, start, end]);
}
