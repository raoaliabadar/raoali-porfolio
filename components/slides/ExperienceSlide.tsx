"use client";

import gsap from "gsap";
import { Check } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { operations, profile } from "@/lib/content";
import { useDeck, type SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

const LAST = operations.length - 1;

/**
 * Slide 06: Business Operations in Action. The client lifecycle as a workflow.
 * Scrolling (wheel, swipe or arrow keys) walks through the steps one at a time; past the last
 * step the deck moves on, and before the first it goes back. Steps can also be clicked.
 * Only responsibilities you listed.
 */
export function ExperienceSlide({ active }: SlideProps) {
  const { reduce, setStepper, entryDir } = useDeck();
  const [sel, setSel] = useState(0);
  const selRef = useRef(0);
  const detail = useRef<HTMLDivElement>(null);
  const op = operations[sel];
  const cur = profile.current;
  const roleLine = [cur.role, cur.company].filter(Boolean).join(", ");

  const pick = useCallback(
    (i: number) => {
      if (i === selRef.current) return;
      const dir = i > selRef.current ? 1 : -1;
      selRef.current = i;
      setSel(i);
      if (!reduce && detail.current) {
        gsap.killTweensOf(detail.current);
        gsap.fromTo(detail.current, { autoAlpha: 0, y: 14 * dir }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" });
      }
    },
    [reduce],
  );

  // On arrival: start at the first step when scrolling down into the slide, at the last when coming back up.
  useLayoutEffect(() => {
    if (!active) return;
    const start = entryDir() < 0 ? LAST : 0;
    selRef.current = start;
    setSel(start);
  }, [active, entryDir]);

  // While this slide is showing, each scroll step moves through the workflow before the deck moves on.
  useEffect(() => {
    if (!active) return;
    setStepper((dir) => {
      const next = selRef.current + dir;
      if (next < 0 || next > LAST) return false;
      pick(next);
      return true;
    });
    return () => setStepper(null);
  }, [active, pick, setStepper]);

  return (
    <SlideFrame tone="dark">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker n={6} dark>
            Professional experience
          </Kicker>
          <SlideTitle className="text-beige">
            Business Operations <em className="text-bronze">in Action</em>
          </SlideTitle>
        </div>
        <p data-reveal className="max-w-sm text-sm leading-relaxed text-beige/70">
          {roleLine ? `${roleLine} · ` : ""}
          {cur.setting}, {cur.period.toLowerCase()} role. The work that runs alongside every client project, step by step.
        </p>
      </div>

      {/* Workflow: horizontal on large screens, vertical on small ones */}
      <div className="relative mt-10">
        <span aria-hidden data-reveal="line-x" className="absolute left-0 right-0 top-[1.375rem] hidden h-px bg-beige/25 lg:block" />
        {/* Progress along the workflow: runs to the centre of the current step */}
        <span
          aria-hidden
          className="absolute left-0 top-[1.375rem] hidden h-px bg-bronze transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
          style={{ width: `calc((100% + 0.5rem) * ${sel / operations.length} + 1.375rem)` }}
        />
        <span aria-hidden data-reveal="line-y" className="absolute bottom-0 left-[1.375rem] top-0 w-px bg-beige/25 lg:hidden" />
        <ol className="relative grid gap-3 lg:grid-cols-7 lg:gap-2" aria-label="Operations workflow">
          {operations.map((o, i) => {
            const on = i === sel;
            return (
              <li key={o.id} data-reveal="card">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(i)}
                  className="group flex w-full items-center gap-3 text-left lg:flex-col lg:items-start"
                >
                  <span
                    className={`relative z-10 grid size-11 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors ${
                      on ? "border-bronze bg-bronze text-forest" : "border-beige/30 bg-forest text-beige group-hover:border-bronze"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`text-sm font-semibold leading-snug transition-colors lg:mt-1 ${on ? "text-beige" : "text-beige/70 group-hover:text-beige"}`}>{o.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div data-reveal="card" className="mt-8">
        <div ref={detail} className="grid gap-6 rounded-[24px] border border-beige/12 bg-beige/[0.05] p-5 sm:p-7 md:grid-cols-[1.2fr_1fr]" aria-live="polite">
          <div>
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-bronze">
                Step {sel + 1} of {operations.length}
              </p>
              <span aria-hidden className="h-px w-full max-w-[8rem] overflow-hidden bg-beige/15">
                <span
                  className="block h-full origin-left bg-bronze transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `scaleX(${(sel + 1) / operations.length})` }}
                />
              </span>
            </div>
            <h3 className="mt-2 font-display-serif text-3xl text-beige sm:text-4xl">{op.title}</h3>
            <p className="mt-3 max-w-xl leading-relaxed text-beige/80">{op.text}</p>
          </div>
          <div className="space-y-4">
            <ul className="space-y-2">
              {op.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-beige">
                  <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-bronze" /> {p}
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-2" aria-label="Tools used">
              {op.tools.map((t) => (
                <li key={t} className="rounded-full border border-beige/20 px-3 py-1 text-xs text-beige/80">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
