"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let ready = false;

/** Registers the plugins and the site's eases once (client only). */
export function setupGsap() {
  if (ready || typeof window === "undefined") return gsap;
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create("drawer", "0.76,0,0.24,1");
  gsap.defaults({ ease: "power3.out", duration: 1 });
  ready = true;
  return gsap;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Desktop-class layout: pinned scenes and scroll scrubs only run here. */
export const DESKTOP = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
export const MOBILE = "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)";
export const REDUCED = "(prefers-reduced-motion: reduce)";

export { gsap, ScrollTrigger, SplitText };
