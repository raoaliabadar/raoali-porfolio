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

/**
 * Whether the OS "reduce motion" setting switches the site's motion off.
 *
 * Off on purpose (Ali's call): many phones ship with animations reduced or removed (Android
 * "Remove animations", battery savers), and on those the whole site went static: no render,
 * no file, no workflow track. The scenes are driven by the visitor's own scrolling, so they
 * now run everywhere. Set to true to honour the setting again; every gate reads from here.
 */
const RESPECT_REDUCED_MOTION = false;

export const prefersReducedMotion = () =>
  RESPECT_REDUCED_MOTION && typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ON = RESPECT_REDUCED_MOTION ? " and (prefers-reduced-motion: no-preference)" : "";
/** Desktop-class layout. */
export const DESKTOP = `(min-width: 1024px)${ON}`;
export const MOBILE = `(max-width: 1023.98px)${ON}`;
/** Never matches while the setting is ignored ("not all"). */
export const REDUCED = RESPECT_REDUCED_MOTION ? "(prefers-reduced-motion: reduce)" : "not all";
/** Every screen size: the scroll scenes run the same on phones and desktop. */
export const MOTION = RESPECT_REDUCED_MOTION ? "(prefers-reduced-motion: no-preference)" : "all";

export { gsap, ScrollTrigger, SplitText };
