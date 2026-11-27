"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";

type Props = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  className?: string;
};

type LenisLike = { stop(): void; start(): void };

/**
 * Centered dialog on a dimmed sheet. Esc or a click on the backdrop closes it; smooth scroll
 * pauses while it is open; focus moves in on open and back to the opener on close.
 */
export function Modal({ open, onClose, labelledBy, children, className = "" }: Props) {
  const shade = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const was = useRef(false);

  useEffect(() => {
    const s = shade.current;
    const b = box.current;
    if (!s || !b) return;
    setupGsap();
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    const d = prefersReducedMotion() ? 0 : 0.6;
    if (open) {
      was.current = true;
      opener.current = document.activeElement as HTMLElement | null;
      lenis?.stop();
      gsap.set([s, b], { visibility: "visible" });
      gsap.to(s, { opacity: 1, duration: d * 0.6 });
      gsap.fromTo(b, { y: 30, opacity: 0, clipPath: "inset(0 0 100% 0)" }, {
        y: 0,
        opacity: 1,
        clipPath: "inset(0 0 0% 0)",
        duration: d,
        ease: "drawer",
        onComplete: () => (b.querySelector<HTMLElement>("[data-autofocus]") ?? b.querySelector<HTMLElement>("button, textarea, input"))?.focus({ preventScroll: true }),
      });
      const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", esc);
      return () => window.removeEventListener("keydown", esc);
    }
    if (!was.current) return;
    lenis?.start();
    gsap.to(s, { opacity: 0, duration: d * 0.5 });
    gsap.to(b, { y: 20, opacity: 0, duration: d * 0.5, onComplete: () => void gsap.set([s, b], { visibility: "hidden" }) });
    opener.current?.focus?.({ preventScroll: true });
  }, [open, onClose]);

  return (
    <>
      <div ref={shade} onClick={onClose} aria-hidden className="invisible fixed inset-0 z-[170] bg-ink/45 opacity-0" />
      {/* Centred by a flex wrapper (not CSS translate), so GSAP can move the box freely. */}
      <div className="pointer-events-none fixed inset-0 z-[180] flex items-center justify-center p-4">
        <div
          ref={box}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          data-lenis-prevent
          className={`pointer-events-auto invisible max-h-full w-full overflow-y-auto rounded-[6px] border border-ink/25 bg-paper opacity-0 ${className}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}
