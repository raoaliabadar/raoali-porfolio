"use client";

import gsap from "gsap";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDeck } from "./SlideDeck";

/**
 * Slide frame: the slide's background, and a content area that clears the header (top),
 * the controls (bottom) and the dots (right). On small screens, tall content scrolls inside
 * it (`.slide-scroll`); the deck moves on once that scroll reaches its end.
 */
export function SlideFrame({
  tone = "light",
  className = "",
  children,
  bg,
}: {
  tone?: "light" | "cream" | "dark";
  className?: string;
  children: ReactNode;
  bg?: ReactNode;
}) {
  const tones = { light: "bg-ink text-fg", cream: "bg-cream text-fg", dark: "bg-forest text-beige" };
  return (
    <div className={`absolute inset-0 ${tones[tone]}`}>
      {bg}
      <div className="slide-scroll relative h-full">
        <div className={`mx-auto flex min-h-full w-full max-w-[86rem] flex-col justify-center px-5 pb-24 pt-20 sm:px-8 md:pb-24 md:pl-12 md:pr-20 md:pt-24 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** "03 / Accounting" style label above a slide title. */
export function Kicker({ n, children, dark = false }: { n: number; children: ReactNode; dark?: boolean }) {
  return (
    <p data-reveal className={`flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] ${dark ? "text-beige/75" : "text-muted"}`}>
      <span className={dark ? "text-bronze" : "text-bronze-ink"}>{String(n).padStart(2, "0")}</span>
      <span aria-hidden className={`h-px w-8 ${dark ? "bg-beige/30" : "bg-fg/25"}`} />
      {children}
    </p>
  );
}

export function SlideTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 data-reveal className={`font-display-serif mt-4 text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-7xl ${className}`}>
      {children}
    </h2>
  );
}

/** Number that counts up from 0 whenever `run` changes (e.g. each time its slide is shown). */
export function CountUp({ value, run, decimals = 0, prefix = "", suffix = "" }: { value: number; run: unknown; decimals?: number; prefix?: string; suffix?: string }) {
  const { reduce } = useDeck();
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  // A new visit counts from zero (this effect runs before the one below).
  useEffect(() => {
    from.current = 0;
  }, [run]);
  useEffect(() => {
    if (reduce) return setShown(value);
    const o = { v: from.current };
    const tw = gsap.to(o, { v: value, duration: 1.4, ease: "power3.out", onUpdate: () => setShown(o.v) });
    from.current = value;
    return () => void tw.kill();
  }, [value, run, reduce]);
  return (
    <span className="tabular-nums">
      {prefix}
      {shown.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Accessible dialog: focus moves in and is kept there, Esc closes, focus returns to the opener. Locks the deck. */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const { setLock, reduce } = useDeck();
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onClose = () => closeRef.current();
    setLock("modal", true);
    const opener = document.activeElement as HTMLElement | null;
    const p = panel.current;
    p?.focus();
    if (p && !reduce) gsap.fromTo(p, { autoAlpha: 0, y: 24, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "power3.out" });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && p) {
        const f = [...p.querySelectorAll<HTMLElement>("button, a[href], input, textarea, select, [tabindex]:not([tabindex='-1'])")].filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setLock("modal", false);
      opener?.focus?.({ preventScroll: true });
    };
  }, [open, setLock, reduce]);
  if (!open || typeof document === "undefined") return null;
  const deck = document.querySelector("[data-slide-deck]");
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-center p-3 sm:p-6" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-forest/55 backdrop-blur-sm" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={`slide-scroll relative max-h-[88svh] w-full ${wide ? "max-w-5xl" : "max-w-3xl"} rounded-[28px] bg-surface p-6 text-fg shadow-[0_40px_90px_-40px_rgb(10_20_15/0.7)] outline-none sm:p-9`}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={id} className="font-display-serif text-3xl leading-tight sm:text-4xl">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:border-fg/30 hover:text-fg"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    deck ?? document.body,
  );
}

/** Small "fictional sample data" tag shown on every demo. */
export function SampleTag({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${dark ? "border-beige/25 text-beige/70" : "border-line text-muted"}`}>
      Sample data · fictional
    </span>
  );
}
