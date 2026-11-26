"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { operations, profile } from "@/lib/content";
import { useDeck, type SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

const LAST = operations.length - 1;
const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
/** Sideways scroll distance per step: continuous scrolling moves at half the earlier speed (a single notch still settles one step on). */
const STEP_PX = 240;
/** How quickly the track glides after the scroll (time constant, ms): larger = slower, smoother. */
const GLIDE_MS = 220;
/** Scrolling stopped for this long: settle on a step. */
const SETTLE_MS = 140;

/**
 * Slide 06: Business Operations in Action. The client lifecycle as a workflow of 7 steps, shown as
 * a horizontal track of cards. Scrolling sideways (trackpad swipe, shift + wheel) moves the track
 * continuously, left to right, and it settles on a step when scrolling stops; a sideways swipe on
 * a phone, ← / →, the arrow buttons and the step numbers move one step. Scrolling up / down changes
 * slide, as everywhere else. Each visit starts at step 1. Only responsibilities you listed.
 */
export function ExperienceSlide({ active }: SlideProps) {
  const { reduce, setStepper, setScrubber } = useDeck();
  const [sel, setSel] = useState(0);
  const cur = profile.current;
  const roleLine = [cur.role, cur.company].filter(Boolean).join(", ");

  // Track position in steps (0…LAST, fractional while scrolling) and where it is heading.
  const track = useRef<HTMLUListElement>(null);
  const pos = useRef(0);
  const target = useRef(0);
  const frame = useRef(0);
  const shownSel = useRef(0);
  const settleTimer = useRef(0);
  const lastDir = useRef(1);

  const paint = useCallback(() => {
    if (track.current) track.current.style.transform = `translateX(calc(${-pos.current} * (100% + 1rem)))`;
    const s = Math.round(pos.current);
    if (s !== shownSel.current) {
      shownSel.current = s;
      setSel(s);
    }
  }, []);

  // Glide towards the target (a smooth ease-out that follows the scroll as it happens).
  const run = useCallback(() => {
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const d = target.current - pos.current;
      if (reduce || Math.abs(d) < 0.001) pos.current = target.current;
      else pos.current += d * (1 - Math.exp(-dt / GLIDE_MS));
      paint();
      frame.current = pos.current === target.current ? 0 : requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [paint, reduce]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  /** Go to a step (buttons, keys, swipes, step numbers, settling after a scroll). */
  const pick = useCallback(
    (i: number) => {
      target.current = Math.max(0, Math.min(LAST, i));
      run();
    },
    [run],
  );

  // Each visit starts at step 1 (placed straight away, no glide).
  useLayoutEffect(() => {
    if (!active) return;
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    pos.current = target.current = 0;
    paint();
  }, [active, paint]);

  // While this slide is showing: sideways scrolling scrubs the track; swipes / ← → move one step.
  useEffect(() => {
    if (!active) return;
    setScrubber((delta) => {
      lastDir.current = Math.sign(delta);
      target.current = Math.max(0, Math.min(LAST, target.current + delta / STEP_PX));
      run();
      // Scrolling stopped: settle on a step, leaning the way it was going (small moves still count).
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => {
        const t = target.current;
        const f = t - Math.floor(t);
        pick(f < 0.001 ? t : lastDir.current > 0 ? (f > 0.2 ? Math.ceil(t) : Math.floor(t)) : f < 0.8 ? Math.floor(t) : Math.ceil(t));
      }, SETTLE_MS);
    });
    setStepper((dir) => {
      const next = Math.round(target.current) + dir;
      if (next < 0 || next > LAST) return false; // past either end (← / → only): the deck changes slide
      pick(next);
      return true;
    });
    return () => {
      setScrubber(null);
      setStepper(null);
      window.clearTimeout(settleTimer.current);
    };
  }, [active, pick, run, setScrubber, setStepper]);

  const motion = `duration-700 ${EASE}`;

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

      {/* Workflow: one row of numbered steps on every screen. On phones only the numbers show (the
          step's title is in the card below), so the card stays near the top. --r = circle radius. */}
      <div className="relative mt-6 [--r:1.125rem] sm:mt-10 lg:[--r:1.375rem]">
        <span aria-hidden data-reveal="line-x" className="absolute left-0 right-0 top-[var(--r)] h-px bg-beige/25" />
        {/* Progress along the workflow: runs to the centre of the current step */}
        <span
          aria-hidden
          className={`absolute left-0 top-[var(--r)] h-px bg-bronze transition-[width] ${motion}`}
          style={{ width: `calc((100% + 0.5rem) * ${sel / operations.length} + var(--r))` }}
        />
        <ol className="relative grid grid-cols-7 gap-2" aria-label="Operations workflow">
          {operations.map((o, i) => {
            const on = i === sel;
            return (
              <li key={o.id} data-reveal="card">
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`Step ${i + 1}: ${o.title}`}
                  onClick={() => pick(i)}
                  className="group flex w-full flex-col items-start text-left"
                >
                  <span
                    className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors lg:size-11 lg:text-sm ${
                      on ? "border-bronze bg-bronze text-forest" : "border-beige/30 bg-forest text-beige group-hover:border-bronze"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`mt-1 hidden text-sm font-semibold leading-snug transition-colors lg:block ${on ? "text-beige" : "text-beige/70 group-hover:text-beige"}`}>{o.title}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div data-reveal="card" className="mt-8">
        {/* The 7 steps as one horizontal track: each step slides in from the right as you scroll. */}
        <div className="overflow-hidden rounded-[24px]">
          {/* Positioned by the scroll (see `paint`), not by React state: it follows the wheel frame by frame. */}
          <ul ref={track} className="flex gap-4 will-change-transform">
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
                    <h3 className="mt-2 font-display-serif text-2xl text-beige sm:text-3xl lg:text-4xl">{o.title}</h3>
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
            <span className="hidden md:inline">Scroll sideways or use the arrows to move through the steps.</span>
            <span className="md:hidden">Swipe sideways to move through the steps.</span>
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
