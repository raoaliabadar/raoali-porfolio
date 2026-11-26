"use client";

import { useEffect, type RefObject } from "react";
import { onLoaded } from "./loader";
import { gsap, prefersReducedMotion, setupGsap, SplitText } from "./gsap";

type Options = {
  /** "lines" slides each line up out of a mask; "words" staggers the words. */
  type?: "lines" | "words";
  delay?: number;
  stagger?: number;
  /** Start right after the preloader (hero) instead of on scroll. */
  onLoad?: boolean;
};

/** Masked line / word reveal for a heading (SplitText). Re-splits on resize. */
export function useSplitReveal<T extends HTMLElement>(ref: RefObject<T | null>, o: Options = {}) {
  const { type = "lines", delay = 0, stagger = 0.08, onLoad = false } = o;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;

    let tween: gsap.core.Tween | null = null;
    let played = false;
    gsap.set(el, { autoAlpha: 0 });
    const split = SplitText.create(el, {
      type: type === "lines" ? "lines" : "words,lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true,
      onSplit(self) {
        const targets = type === "lines" ? self.lines : self.words;
        tween?.kill();
        gsap.set(el, { autoAlpha: 1 });
        if (played) return;
        gsap.set(targets, { yPercent: 110 });
        tween = gsap.to(targets, {
          yPercent: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger,
          delay,
          paused: onLoad,
          ...(onLoad ? {} : { scrollTrigger: { trigger: el, start: "top 85%", once: true } }),
          onComplete: () => {
            played = true;
          },
        });
        return tween;
      },
    });
    const off = onLoad ? onLoaded(() => tween?.play()) : () => {};
    return () => {
      off();
      tween?.kill();
      split.revert();
      gsap.set(el, { clearProps: "visibility,opacity" });
    };
  }, [ref, type, delay, stagger, onLoad]);
}
