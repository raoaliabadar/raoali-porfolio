"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { BOOKS_EVENT } from "@/lib/desk";
import { desk } from "@/src/content";
import { Modal } from "./Modal";

/**
 * The books from the desk. A shelf of spines on one side; the chosen book lies open as a
 * two-page spread (title page | notes). Switching books turns the page.
 */
export function BookReader() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const spread = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const on = (e: Event) => {
      setI((e as CustomEvent<number>).detail ?? 0);
      setOpen(true);
    };
    window.addEventListener(BOOKS_EVENT, on);
    return () => window.removeEventListener(BOOKS_EVENT, on);
  }, []);

  // Page turn when the book changes.
  useEffect(() => {
    const s = spread.current;
    if (!s || !open || prefersReducedMotion()) return;
    setupGsap();
    gsap.fromTo(s.querySelector("[data-right]"), { rotateY: -70, opacity: 0, transformOrigin: "0% 50%" }, { rotateY: 0, opacity: 1, duration: 0.7, ease: "power3.out" });
    gsap.fromTo(s.querySelectorAll("[data-note]"), { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.05, delay: 0.25 });
  }, [i, open]);

  const b = desk.books[i];
  const go = (d: number) => setI((v) => (v + d + desk.books.length) % desk.books.length);

  return (
    <Modal open={open} onClose={close} labelledBy="book-title" className="max-w-[64rem]">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <p className="label text-ink">
          <span className="text-signal">[B]</span> The books on the desk
        </p>
        <button type="button" onClick={close} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
          Close
        </button>
      </div>

      <div className="grid md:grid-cols-[13rem_1fr]">
        {/* Shelf */}
        <ul className="flex gap-1.5 overflow-x-auto border-b border-rule p-4 md:flex-col md:overflow-visible md:border-b-0 md:border-r" aria-label="Books">
          {desk.books.map((bk, k) => (
            <li key={bk.title} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(k)}
                aria-current={k === i ? "true" : undefined}
                className={`flex w-40 items-center gap-2.5 rounded-[4px] border px-2 py-2 text-left transition-colors md:w-full ${
                  k === i ? "border-ink/40 bg-panel" : "border-transparent hover:border-ink/15"
                }`}
              >
                <span aria-hidden className="h-8 w-2.5 shrink-0 rounded-[1px]" style={{ background: bk.color }} />
                <span className="truncate text-[0.86rem] leading-tight text-ink">{bk.title}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Open book */}
        <div className="p-4 sm:p-6 [perspective:1600px]">
          <div ref={spread} className="grid overflow-hidden rounded-[4px] border border-ink/15 sm:grid-cols-2">
            {/* Left page: title */}
            <div className="relative flex min-h-[14rem] flex-col justify-between p-6 sm:min-h-[22rem]" style={{ background: b.color, color: b.ink }}>
              <span className="label opacity-70">
                Book {String(i + 1).padStart(2, "0")} / {String(desk.books.length).padStart(2, "0")}
              </span>
              <div>
                <h3 id="book-title" className="font-display text-[clamp(1.33rem,2.52vw,1.87rem)] font-[700] leading-[0.95]">
                  {b.title}
                </h3>
                <p className="mt-3 text-[0.95rem] opacity-80">{b.subtitle}</p>
              </div>
              <span aria-hidden className="absolute inset-y-0 right-0 w-3 bg-black/15" />
            </div>
            {/* Right page: notes on ruled paper */}
            <div
              data-right
              className="bg-[#f8f5ec] p-6 text-[#1b1d1a] [background-image:repeating-linear-gradient(transparent_0_31px,rgba(27,29,26,0.09)_31px_32px)] [background-position:0_52px]"
            >
              <p className="label text-[#5b5c55]">Notes</p>
              <ol className="mt-4 space-y-3">
                {b.notes.map((n, k) => (
                  <li key={n} data-note className="flex gap-3 text-[0.94rem] leading-[1.45]">
                    <span className="font-[family-name:var(--font-pixel)] text-[0.7rem] leading-[1.9] text-[#2f6b4f]">{k + 1}</span>
                    {n}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button type="button" onClick={() => go(-1)} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
              ← Previous
            </button>
            <span className="label text-mute">Generic study notes, not real published books</span>
            <button type="button" onClick={() => go(1)} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
              Next →
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
