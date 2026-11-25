"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { operations, profile } from "@/lib/content";
import { useDeck, type SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

const LAST = operations.length - 1;
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Slide 06: Business Operations in Action. The client lifecycle as a workflow of 7 steps, shown as
 * a horizontal track of cards. Scrolling (wheel, swipe, arrow keys) moves one step per gesture,
 * left to right; past step 7 the deck moves on to the next slide, and before step 1 it goes back.
 * Arriving from below starts at step 7, so scrolling back up retraces the same path.
 * Steps can also be clicked, or moved with the arrow buttons. Only responsibilities you listed.
 */
export function ExperienceSlide({ active }: SlideProps) {
  const { setStepper, entryDir } = useDeck();
  const [sel, setSel] = useState(0);
  // Jump without the slide animation (on arrival, while the deck fades this slide in).
  const [instant, setInstant] = useState(false);
  const selRef = useRef(0);
  const cur = profile.current;
  const roleLine = [cur.role, cur.company].filter(Boolean).join(", ");

  const pick = useCallback((i: number) => {
    const next = Math.max(0, Math.min(LAST, i));
    selRef.current = next;
    setSel(next);
  }, []);

  // On arrival: step 1 when scrolling down into the slide, step 7 when coming back up.
  useLayoutEffect(() => {
    if (!active) return;
    const start = entryDir() < 0 ? LAST : 0;
    if (start === selRef.current) return;
    setInstant(true);
    pick(start);
  }, [active, entryDir, pick]);
  useEffect(() => {
    if (!instant) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setInstant(false)));
    return () => cancelAnimationFrame(id);
  }, [instant]);

  // While this slide is showing, every scroll step moves through the workflow first.
  useEffect(() => {
    if (!active) return;
    setStepper((dir) => {
      const next = selRef.current + dir;
      if (next < 0 || next > LAST) return false; // past either end: the deck changes slide
      pick(next);
      return true;
    });
    return () => setStepper(null);
  }, [active, pick, setStepper]);

  const motion = instant ? "transition-none" : `duration-700 ${EASE}`;

  return (
    // pan-y: the browser keeps vertical scrolling but leaves sideways swipes to the step navigation
    // (otherwise a swipe to the right can trigger the browser's swipe-back and leave the site).
    <SlideFrame tone="dark" className="touch-pan-y">
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
          className={`absolute left-0 top-[1.375rem] hidden h-px bg-bronze transition-[width] lg:block ${motion}`}
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
        {/* The 7 steps as one horizontal track: each step slides in from the right as you scroll. */}
        <div className="overflow-hidden rounded-[24px]">
          <ul
            className={`flex gap-4 transition-transform will-change-transform ${motion}`}
            style={{ transform: `translateX(calc(${-sel} * (100% + 1rem)))` }}
          >
            {operations.map((o, i) => {
              const on = i === sel;
              return (
                <li
                  key={o.id}
                  aria-hidden={!on}
                  inert={!on}
                  className={`grid w-full shrink-0 gap-6 rounded-[24px] border border-beige/12 bg-beige/[0.05] p-5 transition-opacity sm:p-7 md:grid-cols-[1.2fr_1fr] ${motion} ${
                    on ? "opacity-100" : "opacity-30"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-bronze">
                        Step {i + 1} of {operations.length}
                      </p>
                      <span aria-hidden className="h-px w-full max-w-[8rem] overflow-hidden bg-beige/15">
                        <span className="block h-full origin-left bg-bronze" style={{ transform: `scaleX(${(i + 1) / operations.length})` }} />
                      </span>
                    </div>
                    <h3 className="mt-2 font-display-serif text-3xl text-beige sm:text-4xl">{o.title}</h3>
                    <p className="mt-3 max-w-xl leading-relaxed text-beige/80">{o.text}</p>
                  </div>
                  <div className="space-y-4">
                    <ul className="space-y-2">
                      {o.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-beige">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-bronze" /> {p}
                        </li>
                      ))}
                    </ul>
                    <ul className="flex flex-wrap gap-2" aria-label="Tools used">
                      {o.tools.map((t) => (
                        <li key={t} className="rounded-full border border-beige/20 px-3 py-1 text-xs text-beige/80">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="sr-only" aria-live="polite">
          Step {sel + 1} of {operations.length}: {operations[sel].title}
        </p>

        {/* Previous / next step */}
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-xs text-beige/55">
            <span className="hidden md:inline">Scroll to move through the steps, or use the arrows.</span>
            <span className="md:hidden">Swipe to move through the steps.</span>
          </p>
          <div className="flex gap-2">
            {[
              { d: -1, label: "Previous step", Icon: ChevronLeft },
              { d: 1, label: "Next step", Icon: ChevronRight },
            ].map(({ d, label, Icon }) => (
              <button
                key={d}
                type="button"
                aria-label={label}
                disabled={d < 0 ? sel === 0 : sel === LAST}
                onClick={() => pick(sel + d)}
                className="grid size-10 place-items-center rounded-full border border-beige/25 text-beige transition-colors hover:border-bronze hover:text-bronze disabled:pointer-events-none disabled:opacity-30"
              >
                <Icon aria-hidden className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
