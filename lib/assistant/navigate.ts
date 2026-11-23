import type Lenis from "lenis";

declare global {
  interface Window {
    /** Set by SmoothScroll once Lenis has loaded. */
    __lenis?: Lenis;
  }
}

/** Smoothly scroll to a page section by id (through Lenis when it's running). Returns false if it isn't on the page. */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  if (window.__lenis && !reduce) {
    window.__lenis.scrollTo(el, { offset: -margin, duration: 1.4 });
  } else {
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  // Move focus for keyboard / screen-reader users without jumping the scroll.
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
  return true;
}

/** Pull a trailing [[go:id]] marker out of a reply. Also hides a half-streamed marker. */
export function splitNavMarker(text: string): { text: string; nav?: string; error: boolean } {
  const error = text.includes("[[error]]");
  let nav: string | undefined;
  const clean = text
    .replace(/\[\[go:([a-z-]+)\]\]/g, (_, id: string) => {
      nav = id;
      return "";
    })
    .replace(/\[\[error\]\]/g, "")
    .replace(/\[\[[^\]]*$/, "") // partial marker still streaming in
    .trim();
  return { text: clean, nav, error };
}
