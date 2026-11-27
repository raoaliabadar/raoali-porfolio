"use client";

import { useEffect, useRef } from "react";
import { IsoIcon } from "@/components/blueprint/IsoIcon";
import type { IconName } from "@/components/blueprint/iso";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { accounting } from "@/src/content";
import { Modal } from "./Modal";

const pad = (i: number) => String(i + 1).padStart(2, "0");

type Props = {
  open: boolean;
  index: number;
  fileNo: string;
  onClose: () => void;
  onStep: (d: number) => void;
};

/**
 * One document taken out of the Accounting file: what the area covers, how it is done and the
 * tools used for it. ← / → (or the buttons) leaf through the other documents in the file.
 */
export function AreaSheet({ open, index, fileNo, onClose, onStep }: Props) {
  const sheet = useRef<HTMLDivElement>(null);
  const a = accounting.areas[index];
  const total = accounting.areas.length;

  // Arrow keys leaf through the file while it is open.
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onStep]);

  // Each document slides in like a fresh page; its icon draws itself.
  useEffect(() => {
    const s = sheet.current;
    if (!s || !open) return;
    setupGsap();
    const parts = s.querySelectorAll("[data-draw]");
    if (prefersReducedMotion()) {
      gsap.set(parts, { strokeDashoffset: 0 });
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo(s, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "expo.out" })
      .fromTo(parts, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.02 }, 0.1)
      .fromTo(s.querySelectorAll("[data-line]"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.05 }, 0.15);
    return () => void tl.kill();
  }, [index, open]);

  return (
    <Modal open={open} onClose={onClose} labelledBy="area-title" className="max-w-[52rem]">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 py-3">
        <p className="label text-ink">
          <span className="text-signal">File {fileNo}</span> · Accounting
        </p>
        <button type="button" onClick={onClose} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
          Close
        </button>
      </div>

      <div ref={sheet} key={index} className="grid md:grid-cols-[1fr_15rem]">
        {/* The document */}
        <div className="p-6 sm:p-8">
          <p data-line className="label text-mute">
            Document <span className="text-signal">{pad(index)}</span> / {String(total).padStart(2, "0")}
          </p>
          <h3 id="area-title" data-line className="font-display mt-4 text-[clamp(1.7rem,3.4vw,2.5rem)] font-[700] leading-[0.95] text-ink">
            {a.title}
          </h3>
          <p data-line className="mt-4 max-w-[46ch] text-[1.02rem] leading-relaxed text-ink/80">
            {a.details.summary}
          </p>

          <p data-line className="label mt-8 border-b border-ink/20 pb-2 text-mute">
            What it covers
          </p>
          <ol className="mt-1">
            {a.details.covers.map((c, k) => (
              <li key={c} data-line className="flex gap-4 border-b border-dashed border-ink/15 py-3 text-[0.95rem] leading-snug text-ink">
                <span className="font-[family-name:var(--font-pixel)] text-[0.62rem] leading-[1.6] text-signal">{pad(k)}</span>
                {c}
              </li>
            ))}
          </ol>
        </div>

        {/* Margin: icon and tools */}
        <aside className="flex flex-col gap-6 border-t border-rule bg-panel p-6 md:border-l md:border-t-0">
          <IsoIcon name={a.icon as IconName} className="mx-auto h-28 w-28" />
          <div>
            <p data-line className="label border-b border-ink/20 pb-2 text-mute">
              Tools used
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {a.details.tools.map((t) => (
                <li key={t} data-line className="rounded-[3px] border border-ink/20 bg-paper px-2 py-1 font-mono text-[0.72rem] text-ink">
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div data-line className="mt-auto rotate-[-3deg] self-start rounded-[3px] border-2 border-signal px-3 py-1.5">
            <p className="label text-signal">Filed &amp; verified</p>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-rule px-5 py-3">
        <button type="button" onClick={() => onStep(-1)} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
          ← Previous
        </button>
        <span className="label hidden text-mute sm:inline">Use ← → to leaf through</span>
        <button type="button" onClick={() => onStep(1)} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
          Next →
        </button>
      </div>
    </Modal>
  );
}
