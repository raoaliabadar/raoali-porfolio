"use client";

import gsap from "gsap";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from "react";
import { site } from "@/lib/content";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GO_EVENT, SLIDES, type SlideId } from "@/lib/slides";
import { AboutSlide } from "./AboutSlide";
import { AccountingSlide } from "./AccountingSlide";
import { ContactSlide } from "./ContactSlide";
import { DashboardSlide } from "./DashboardSlide";
import { ExperienceSlide } from "./ExperienceSlide";
import { ProjectsSlide } from "./ProjectsSlide";
import { ToolsSlide } from "./ToolsSlide";
import { WorkspaceSlide } from "./WorkspaceSlide";

/**
 * Full-screen, one-slide-at-a-time portfolio.
 *
 * Navigation: mouse wheel / trackpad (one slide per gesture, so momentum can't skip slides),
 * touch swipe, ↑ ↓ ← → / Page Up / Page Down / Space / Home / End, the dots, the
 * previous / next buttons and the header menu. The URL hash follows the slide (#about…).
 *
 * Areas marked `.slide-scroll` scroll on their own first; the deck only moves once they reach
 * their end (and only on a new gesture). Modals and the 3D desk close-up "lock" the deck.
 *
 * Transitions: GSAP. The outgoing slide drifts away, the new one settles in, then its
 * `[data-reveal]` elements enter in order (kinds: up, row, card, left, right, zoom, line-x, line-y, fade).
 * Reduced motion: a short crossfade, nothing moves.
 */

export type SlideProps = { active: boolean; near: boolean; visit: number };

const COMPONENTS: Record<SlideId, ComponentType<SlideProps>> = {
  workspace: WorkspaceSlide,
  about: AboutSlide,
  accounting: AccountingSlide,
  dashboard: DashboardSlide,
  tools: ToolsSlide,
  experience: ExperienceSlide,
  projects: ProjectsSlide,
  contact: ContactSlide,
};

/** Slides with a dark (forest) background: the header and controls switch to light ink. */
const DARK: Partial<Record<SlideId, true>> = { dashboard: true, experience: true };
/** Each slide's background, so the phone control bar can fade into it over scrolling content. */
const FADE: Record<SlideId, [string, string]> = {
  workspace: ["from-ink", "from-ink"],
  about: ["from-ink", "from-ink"],
  accounting: ["from-cream", "from-cream"],
  dashboard: ["from-forest", "from-forest"],
  tools: ["from-ink", "from-ink"],
  experience: ["from-forest", "from-forest"],
  projects: ["from-ink", "from-ink"],
  contact: ["from-ink", "from-ink"],
};

/**
 * The header's own solid bar, in the active slide's background colour, plus a short fade below it.
 * Slide content (and both slides while they cross during a change) always passes under the header,
 * never through it.
 */
const HEADER_BAR: Record<SlideId, string> = {
  workspace: "bg-ink after:from-ink",
  about: "bg-ink after:from-ink",
  accounting: "bg-cream after:from-cream",
  dashboard: "bg-forest after:from-forest",
  tools: "bg-ink after:from-ink",
  experience: "bg-forest after:from-forest",
  projects: "bg-ink after:from-ink",
  contact: "bg-ink after:from-ink",
};

/** A slide's own steps: return true when it used the step, false at either end (the deck then moves on). */
type Stepper = (dir: number) => boolean;
type Deck = {
  reduce: boolean;
  setLock: (key: string, on: boolean) => void;
  go: (i: number) => void;
  /**
   * The active slide can take sideways steps: a sideways swipe or ← / → moves one step
   * (← / → change slide past either end). Vertical scrolling always changes slide.
   */
  setStepper: (fn: Stepper | null) => void;
  /**
   * The active slide can take the raw sideways wheel distance (trackpad swipe, shift + wheel), so a
   * continuous sideways scroll keeps moving through its content. It never changes slide.
   */
  setScrubber: (fn: Scrubber | null) => void;
};
/** Takes a sideways wheel distance in px (positive = forward). */
type Scrubber = (deltaPx: number) => void;
const DeckContext = createContext<Deck>({
  reduce: false,
  setLock: () => {},
  go: () => {},
  setStepper: () => {},
  setScrubber: () => {},
});
export const useDeck = () => useContext(DeckContext);

const N = SLIDES.length;
const pad = (n: number) => String(n).padStart(2, "0");

/** The nearest scroll area under `el` that can still scroll in `dir` (1 = down, -1 = up). */
function scrollerFor(el: EventTarget | null, dir: number, root: HTMLElement | null) {
  let n = el instanceof Element ? el : null;
  while (n && n !== root) {
    if (n instanceof HTMLElement && n.classList.contains("slide-scroll") && n.scrollHeight > n.clientHeight + 1) {
      const canDown = n.scrollTop + n.clientHeight < n.scrollHeight - 1;
      const canUp = n.scrollTop > 0;
      if ((dir > 0 && canDown) || (dir < 0 && canUp)) return n;
    }
    n = n.parentElement;
  }
  return null;
}

function revealFrom(kind: string, dir: number): gsap.TweenVars {
  switch (kind) {
    case "row":
      return { x: -28 };
    case "card":
      return { y: 22 * dir, scale: 0.94 };
    case "left":
      return { x: -44 };
    case "right":
      return { x: 44 };
    case "zoom":
      return { scale: 1.06 };
    case "line-x":
      return { scaleX: 0, transformOrigin: "0% 50%" };
    case "line-y":
      return { scaleY: 0, transformOrigin: "50% 0%" };
    case "fade":
      return {};
    default:
      return { y: 26 * dir };
  }
}

export function SlideDeck() {
  const [active, setActive] = useState(0);
  const [visit, setVisit] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [announce, setAnnounce] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(0);
  const animating = useRef(false);
  const animEnd = useRef(0); // when the last transition finished (performance.now())
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const locks = useRef(new Set<string>());
  const reduceRef = useRef(false);
  const stepperRef = useRef<Stepper | null>(null);
  const scrubberRef = useRef<Scrubber | null>(null);

  const reveal = useCallback((tl: gsap.core.Timeline, slide: HTMLElement, dir: number, at: number) => {
    const els = [...slide.querySelectorAll<HTMLElement>("[data-reveal]")];
    if (!els.length) return;
    const stagger = Math.min(0.07, 0.9 / els.length);
    els.forEach((el, i) => {
      const from = revealFrom(el.dataset.reveal ?? "up", dir);
      tl.fromTo(
        el,
        { autoAlpha: 0, ...from },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, duration: 0.75, ease: "power3.out", clearProps: "transform,opacity,visibility" },
        at + i * stagger,
      );
    });
  }, []);

  const go = useCallback(
    (target: number) => {
      const from = activeRef.current;
      const to = Math.max(0, Math.min(N - 1, target));
      if (to === from) return;
      if (tlRef.current?.isActive()) tlRef.current.progress(1); // finish the current move cleanly first
      const out = slideRefs.current[from];
      const inn = slideRefs.current[to];
      if (!out || !inn) return;
      const dir = to > from ? 1 : -1;
      stepperRef.current = null; // the outgoing slide's steps no longer apply
      scrubberRef.current = null;
      activeRef.current = to;
      setActive(to);
      setVisit((v) => v + 1);
      setAnnounce(`Slide ${to + 1} of ${N}: ${SLIDES[to].title}`);
      try {
        history.replaceState(null, "", `#${SLIDES[to].id}`);
      } catch {
        /* ignore */
      }
      // Keep keyboard focus inside the visible slide (the old one becomes inert).
      if (out.contains(document.activeElement)) inn.focus({ preventScroll: true });

      animating.current = true;
      if (rootRef.current) rootRef.current.dataset.moving = "1";
      const tl = gsap.timeline({
        onComplete: () => {
          animating.current = false;
          animEnd.current = performance.now();
          if (rootRef.current) rootRef.current.dataset.moving = "0";
          gsap.set(out, { clearProps: "transform" });
        },
      });
      if (reduceRef.current) {
        tl.to(out, { autoAlpha: 0, duration: 0.2 }, 0).fromTo(inn, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0.05);
        gsap.set(inn.querySelectorAll("[data-reveal]"), { clearProps: "transform,opacity,visibility" });
      } else {
        tl.to(out, { autoAlpha: 0, yPercent: -7 * dir, scale: 0.965, duration: 0.7, ease: "power2.inOut" }, 0).fromTo(
          inn,
          { autoAlpha: 0, yPercent: 9 * dir, scale: 1.015 },
          { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.95, ease: "power3.out" },
          0.12,
        );
        reveal(tl, inn, dir, 0.32);
      }
      tlRef.current = tl;
    },
    [reveal],
  );

  // Start on the slide named in the URL (#contact…), without a transition.
  useLayoutEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduce(reduceRef.current);
    const fromHash = SLIDES.findIndex((s) => `#${s.id}` === window.location.hash);
    const start = fromHash >= 0 ? fromHash : 0;
    activeRef.current = start;
    setActive(start);
    slideRefs.current.forEach((el, i) => el && gsap.set(el, { autoAlpha: i === start ? 1 : 0 }));
    const first = slideRefs.current[start];
    const root = rootRef.current;
    if (first && !reduceRef.current) {
      tlRef.current?.kill();
      const done = () => {
        animating.current = false;
        if (root) root.dataset.moving = "0";
      };
      const tl = gsap.timeline({ delay: 0.15, onComplete: done });
      animating.current = true;
      if (root) root.dataset.moving = "1";
      reveal(tl, first, 1, 0);
      tlRef.current = tl;
      return () => {
        tl.progress(1).kill(); // never leave the deck "mid-transition" (React may re-run this in development)
        done();
      };
    }
  }, [reveal]);

  // Input: wheel, touch, keyboard, and goToSlide() events.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let lastWheel = 0;
    let used = false;
    let acc = 0;
    let navAt = -1e9; // when the wheel last moved the deck
    let prevAbs = 0;
    let lastDir = 0;
    // Sideways wheel input (trackpad swipe, shift + wheel) goes to the active slide: its scrubber if it has one
    // (continuous), else its stepper, one step per swipe (a ~220 ms pause ends a swipe, so momentum never skips).
    let xAcc = 0;
    let xLast = 0;
    let xUsed = false;
    const onWheelX = (e: WheelEvent) => {
      const scrub = scrubberRef.current;
      if (scrub) {
        // Sideways scrolling moves through the slide's content too, but never changes slide.
        e.preventDefault();
        const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaMode === 2 ? e.deltaX * window.innerWidth : e.deltaX;
        if (!animating.current && dx) scrub(dx);
        return;
      }
      const step = stepperRef.current;
      if (!step) return; // nothing moves sideways here: leave the event to the browser
      e.preventDefault(); // (also stops the browser's swipe-to-go-back while browsing the steps)
      const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaMode === 2 ? e.deltaX * window.innerWidth : e.deltaX;
      const now = e.timeStamp || performance.now();
      if (now - xLast > 220) {
        xUsed = false;
        xAcc = 0;
      }
      xLast = now;
      if (xUsed || animating.current || !dx) return;
      if (Math.sign(xAcc) !== Math.sign(dx)) xAcc = 0;
      xAcc += dx;
      if (Math.abs(xAcc) >= 40) {
        xUsed = true;
        xAcc = 0;
        step(Math.sign(dx));
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (locks.current.size) return; // a modal or the desk close-up has the wheel
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return onWheelX(e);
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!delta) return;
      // The event's own timestamp: events queued while the page was busy keep their real spacing,
      // so a stall (first-time chart / 3D setup) never looks like the user pausing.
      const now = e.timeStamp || performance.now();
      const gap = now - lastWheel;
      const abs = Math.abs(delta);
      // When does a gesture end? Only *after* the slide change has finished (pauses during it don't count):
      //  - after a long pause (600 ms), any wheel input is a new gesture;
      //  - after a short pause (200 ms), only a stronger push or a full mouse-wheel notch is: a momentum
      //    tail is small and fading by the time a slide change has finished; a new swipe ramps up.
      const quiet = now - Math.max(lastWheel, animEnd.current);
      if (!animating.current && (quiet > 600 || (quiet > 200 && (abs >= 50 || abs > prevAbs * 1.15)))) used = false;
      // A clearly stronger flick on top of a fading momentum tail is also a new gesture.
      if (used && !animating.current && now - animEnd.current > 300 && now - navAt > 600 && abs > Math.max(40, prevAbs * 1.6)) used = false;
      // Momentum never reverses: wheeling the other way is always a new gesture (once the move is done).
      if (used && !animating.current && Math.sign(delta) !== lastDir) used = false;
      if (gap > 600) acc = 0; // small steps a little apart (slow devices, fine-step mice) still add up
      lastWheel = now;
      lastDir = Math.sign(delta);
      prevAbs = abs;
      if (scrollerFor(e.target, Math.sign(delta), root)) {
        used = true; // this gesture belongs to the inner scroll area, even once it reaches its end
        return;
      }
      e.preventDefault();
      if (used) return;
      if (animating.current) {
        used = true; // ignore the rest of a gesture that started mid-transition (trackpad momentum)
        return;
      }
      if (Math.sign(acc) !== Math.sign(delta)) acc = 0; // changed direction: start counting again
      acc += delta;
      if (Math.abs(acc) >= 35) {
        used = true;
        navAt = now;
        const dir = Math.sign(acc);
        acc = 0;
        go(activeRef.current + dir);
      }
    };

    let touch: { x: number; y: number; t: number; target: EventTarget | null; down: boolean; up: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return (touch = null);
      const p = e.touches[0];
      touch = {
        x: p.clientX,
        y: p.clientY,
        t: performance.now(),
        target: e.target,
        down: !!scrollerFor(e.target, 1, root),
        up: !!scrollerFor(e.target, -1, root),
      };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touch || locks.current.size) return;
      const p = e.changedTouches[0];
      const dx = p.clientX - touch.x;
      const dy = touch.y - p.clientY; // > 0 = swipe up = next
      const quick = performance.now() - touch.t < 900;
      const start = touch;
      touch = null;
      if (!quick) return;
      // A sideways swipe: the active slide's own steps (swipe left = next), if it has any.
      if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (!animating.current) stepperRef.current?.(dx < 0 ? 1 : -1);
        return;
      }
      if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
      const dir = Math.sign(dy);
      if ((dir > 0 && start.down) || (dir < 0 && start.up)) return; // that swipe scrolled the content
      if (animating.current) return;
      go(activeRef.current + dir);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || locks.current.size || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true'], [role='tablist'], [data-keys]")) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") dir = -1;
      else if (e.key === " " && !t?.closest("button, a, summary")) dir = e.shiftKey ? -1 : 1;
      else if (e.key === "Home") return (e.preventDefault(), go(0));
      else if (e.key === "End") return (e.preventDefault(), go(N - 1));
      if (!dir) return;
      // ← / → go through the active slide's own steps first; past either end they change slide as before.
      if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && stepperRef.current?.(dir)) {
        e.preventDefault();
        return;
      }
      // Let a focused scroll area scroll first.
      if ((e.key.startsWith("Arrow") || e.key.startsWith("Page") || e.key === " ") && scrollerFor(t, dir, root)) return;
      e.preventDefault();
      if (!e.repeat || !animating.current) go(activeRef.current + dir);
    };

    const onGo = (e: Event) => {
      const d = (e as CustomEvent<SlideId | number>).detail;
      const i = typeof d === "number" ? d : SLIDES.findIndex((s) => s.id === d);
      if (i >= 0) go(i);
    };
    const onHash = () => {
      const i = SLIDES.findIndex((s) => `#${s.id}` === window.location.hash);
      if (i >= 0) go(i);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener(GO_EVENT, onGo);
    window.addEventListener("hashchange", onHash);
    return () => {
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(GO_EVENT, onGo);
      window.removeEventListener("hashchange", onHash);
      tlRef.current?.progress(1);
      animating.current = false;
    };
  }, [go]);

  const setLock = useCallback((key: string, on: boolean) => {
    if (on) locks.current.add(key);
    else locks.current.delete(key);
  }, []);

  const setStepper = useCallback((fn: Stepper | null) => {
    stepperRef.current = fn;
  }, []);
  const setScrubber = useCallback((fn: Scrubber | null) => {
    scrubberRef.current = fn;
  }, []);

  const dark = !!DARK[SLIDES[active].id];
  const chrome = dark ? "text-beige" : "text-fg";
  const ctl = dark
    ? "border-beige/25 bg-beige/10 text-beige hover:bg-beige/20"
    : "border-line bg-surface/90 text-fg hover:border-fg/30";
  const ctlBtn = `grid size-11 place-items-center rounded-full border backdrop-blur transition-colors disabled:opacity-35 ${ctl}`;

  return (
    <DeckContext.Provider value={{ reduce, setLock, go, setStepper, setScrubber }}>
      <div
        ref={rootRef}
        data-slide-deck
        className="fixed inset-0 overflow-hidden bg-ink"
        aria-roledescription="carousel"
        aria-label={`${site.name} portfolio`}
      >
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            go(N - 1);
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-beige"
        >
          Skip to contact
        </a>

        {/* Slides */}
        <main id="main" className="absolute inset-0">
          {SLIDES.map((s, i) => {
            const Comp = COMPONENTS[s.id];
            const isActive = i === active;
            return (
              <section
                key={s.id}
                id={s.id}
                ref={(el) => {
                  slideRefs.current[i] = el;
                }}
                tabIndex={-1}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${N}: ${s.title}`}
                inert={!isActive}
                data-initial={i === 0 ? "" : undefined}
                data-tone={DARK[s.id] ? "dark" : "light"}
                className="absolute inset-0 overflow-hidden outline-none [&:not([data-initial])]:invisible [&:not([data-initial])]:opacity-0"
              >
                <Comp active={isActive} near={Math.abs(i - active) <= 1} visit={isActive ? visit : -1} />
              </section>
            );
          })}
        </main>

        {/* Progress */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-40 h-[3px] bg-transparent">
          <div
            className="h-full origin-left bg-bronze transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `scaleX(${(active + 1) / N})` }}
          />
        </div>

        {/* Header */}
        <header
          data-tone={dark ? "dark" : "light"}
          className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-4 px-4 pb-3 pt-4 transition-colors duration-500 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-4 after:bg-gradient-to-b after:to-transparent after:content-[''] sm:px-6 md:px-8 md:pb-3 md:pt-5 ${HEADER_BAR[SLIDES[active].id]} ${chrome}`}
        >
          <button type="button" onClick={() => go(0)} className="pointer-events-auto flex items-center gap-2.5 rounded-full pr-2 text-left">
            <span className={`grid size-9 place-items-center rounded-full font-display-serif text-lg ${dark ? "bg-beige text-forest" : "bg-forest text-beige"}`}>
              {site.initials}
            </span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">{site.name}</span>
          </button>
          <nav aria-label="Slides" className="pointer-events-auto hidden items-center gap-1 lg:flex">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === active ? "true" : undefined}
                className={`rounded-full px-3 py-1.5 text-[0.8rem] font-medium transition-colors ${
                  i === active ? (dark ? "bg-beige/15" : "bg-cream") : "opacity-70 hover:opacity-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Light / dark theme (saved in this browser) */}
            <ThemeToggle className="!size-10" />
            <button
              type="button"
              onClick={() => go(N - 1)}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                dark ? "bg-beige text-forest hover:bg-white" : "bg-forest text-beige hover:bg-accent-strong-hover"
              }`}
            >
              Let&apos;s connect <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </header>

        {/* Dots (side on larger screens) */}
        <nav data-tone={dark ? "dark" : "light"} aria-label="Slide navigation" className={`absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 md:flex lg:right-6 ${chrome}`}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              aria-current={i === active ? "true" : undefined}
              className="group relative grid size-7 place-items-center"
            >
              <span
                className={`block rounded-full transition-all duration-500 ${
                  i === active ? "h-6 w-1.5 bg-bronze" : `size-1.5 ${dark ? "bg-beige/45" : "bg-fg/30"} group-hover:scale-150`
                }`}
              />
              <span
                className={`pointer-events-none absolute right-8 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
                  dark ? "bg-beige text-forest" : "bg-forest text-beige"
                }`}
              >
                {s.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Counter + previous / next */}
        <div data-tone={dark ? "dark" : "light"} className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between gap-3 bg-gradient-to-t via-60% to-transparent px-4 pb-4 pt-8 transition-colors duration-500 sm:px-6 md:bg-none md:px-8 md:pb-6 md:pt-0 ${FADE[SLIDES[active].id][1]} ${chrome}`}>
          <p className="pointer-events-auto flex items-baseline gap-2" aria-hidden>
            <span className="font-display-serif text-2xl leading-none md:text-3xl">{pad(active + 1)}</span>
            <span className="text-sm opacity-60">/ {pad(N)}</span>
            <span className="ml-2 hidden text-xs font-semibold uppercase tracking-[0.14em] opacity-70 sm:inline">{SLIDES[active].label}</span>
          </p>
          {/* Compact dots on phones */}
          <div className="pointer-events-auto flex items-center gap-1.5 pb-4 md:hidden" aria-hidden>
            {SLIDES.map((s, i) => (
              <span key={s.id} className={`block h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-5 bg-bronze" : `w-1.5 ${dark ? "bg-beige/45" : "bg-fg/30"}`}`} />
            ))}
          </div>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous slide" className={ctlBtn}>
              <ChevronUp aria-hidden className="size-5" />
            </button>
            <button type="button" onClick={() => go(active + 1)} disabled={active === N - 1} aria-label="Next slide" className={ctlBtn}>
              <ChevronDown aria-hidden className="size-5" />
            </button>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </DeckContext.Provider>
  );
}
