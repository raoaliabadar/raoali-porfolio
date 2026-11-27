"use client";

import { useEffect, useRef } from "react";
import { DESKTOP, gsap, MOBILE, setupGsap, SplitText } from "@/lib/animations/gsap";
import { statement } from "@/src/content";

/* The ledger the line sits in: row rules, column rules, row numbers. Units: a 1200 × 720 sheet. */
const ROWS = [70, 150, 225, 500, 580, 655];
const COLS = [120, 360, 840, 1080];

/**
 * One line of Ali's own text, centred. As it scrolls, a ledger assembles around it: row rules
 * slide in from alternating sides, column rules drop, row numbers tick on, the words fill with
 * ink, and the line is closed with an accountant's double underline (the "total" rule).
 */
export function Statement() {
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !line.current) return;
    setupGsap();
    const q = gsap.utils.selector(el);
    let split: SplitText | null = null;

    const build = (tl: gsap.core.Timeline) => {
      split = SplitText.create(line.current!, { type: "words" });
      tl.from(q("[data-row]"), {
        attr: { x2: (_: number, t: Element) => Number(t.getAttribute("x1")) },
        duration: 0.35,
        stagger: 0.04,
        ease: "power2.out",
      } as gsap.TweenVars, 0)
        .from(q("[data-col]"), { attr: { y2: 0 }, duration: 0.35, stagger: 0.05, ease: "power2.out" }, 0.08)
        .from(q("[data-num]"), { autoAlpha: 0, duration: 0.05, stagger: 0.04 }, 0.15)
        .fromTo(split.words, { opacity: 0.2 }, { opacity: 1, duration: 0.45, stagger: 0.04, ease: "none" }, 0.2)
        .from(q("[data-total]"), { scaleX: 0, transformOrigin: "50% 50%", duration: 0.2, stagger: 0.06, ease: "power2.out" }, 0.75);
    };

    const mm = gsap.matchMedia();
    mm.add(DESKTOP, () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: el, start: "top top", end: "+=130%", pin: pin.current, scrub: 1 },
      });
      build(tl);
      return () => split?.revert();
    });
    mm.add(MOBILE, () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 60%", scrub: 1 } });
      build(tl);
      return () => split?.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <section id="statement" ref={root} aria-label="Statement" className="relative">
      <div ref={pin} className="relative flex min-h-[80svh] items-center overflow-hidden lg:h-svh">
        <div aria-hidden className="absolute inset-x-[var(--gutter)] inset-y-0 border-x border-rule">
          <svg viewBox="0 0 1200 720" preserveAspectRatio="none" className="absolute inset-0 size-full">
            {ROWS.map((y, i) => (
              <line
                key={y}
                data-row
                x1={i % 2 ? 1200 : 0}
                x2={i % 2 ? 0 : 1200}
                y1={y}
                y2={y}
                className="stroke-rule"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {COLS.map((x) => (
              <line key={x} data-col x1={x} x2={x} y1={0} y2={720} className="stroke-rule" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {/* Row numbers in the first column */}
          {ROWS.map((y, i) => (
            <span
              key={y}
              data-num
              className="absolute left-3 -translate-y-[130%] font-[family-name:var(--font-pixel)] text-[0.65rem] text-mute sm:left-5"
              style={{ top: `${(y / 720) * 100}%` }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          ))}
        </div>

        <div className="relative mx-auto max-w-[min(92vw,1100px)] px-6 text-center">
          <p ref={line} className="font-display text-[clamp(1.78rem,4.74vw,4.32rem)] font-[700] leading-[0.92] text-ink">
            {statement.line}
          </p>
          {/* Double underline: the accountant's mark for a final total. */}
          <div aria-hidden className="mx-auto mt-8 w-[min(60%,420px)] space-y-1.5">
            <span data-total className="block h-[2px] bg-signal" />
            <span data-total className="block h-[2px] bg-signal" />
          </div>
        </div>
      </div>
    </section>
  );
}
