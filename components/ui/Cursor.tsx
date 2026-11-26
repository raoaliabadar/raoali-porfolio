"use client";

import { useEffect, useRef } from "react";
import { gsap, setupGsap } from "@/lib/animations/gsap";

/**
 * A small accent square that follows the pointer. Over [data-cursor="view|drag"] it opens into
 * a labelled tag; over links and buttons it grows slightly. Fine pointers only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = dot.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setupGsap();
    document.documentElement.classList.add("has-cursor");
    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
    let mode = "";

    const set = (next: string) => {
      if (next === mode) return;
      mode = next;
      const tag = next === "view" || next === "drag";
      if (label.current) label.current.textContent = tag ? next.toUpperCase() : "";
      gsap.to(el, {
        width: tag ? 64 : next === "link" ? 18 : 10,
        height: tag ? 28 : next === "link" ? 18 : 10,
        backgroundColor: next === "link" ? "rgba(47,107,79,0)" : "#2f6b4f",
        borderColor: "#2f6b4f",
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const move = (e: PointerEvent) => {
      gsap.to(el, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
      xTo(e.clientX);
      yTo(e.clientY);
      const t = e.target as Element | null;
      const c = t?.closest<HTMLElement>("[data-cursor]");
      if (c) set(c.dataset.cursor ?? "");
      else if (t?.closest("a,button,[role=button],input,textarea")) set("link");
      else set("");
    };
    const leave = () => gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[300] grid size-2.5 place-items-center rounded-[2px] border border-signal bg-signal opacity-0"
    >
      <span ref={label} className="font-mono text-[0.62rem] font-medium tracking-[0.08em] text-paper" />
    </div>
  );
}
