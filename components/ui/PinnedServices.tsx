"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";
import { ServiceDeck } from "./ServiceDeck";

const DESKTOP = "(min-width: 1024px)";
const isDesktop = () => typeof window !== "undefined" && window.matchMedia(DESKTOP).matches;

/**
 * "How I can help" block.
 * Desktop/laptop (lg+): the block pins in place while the page scrolls, and the
 * scroll position steps through the service cards automatically. A side menu
 * shows (and jumps to) the active card.
 * Mobile/tablet: regular swipeable deck, no pinning.
 */
export function PinnedServices() {
  const n = services.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (!isDesktop()) return;
    const i = Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    setActive((cur) => (cur === i ? cur : i));
  });

  /** Desktop: scroll the page to the card's segment. Mobile: just switch cards. */
  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el || !isDesktop()) {
      setActive(i);
      return;
    }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (travel * (i + 0.5)) / n, behavior: "smooth" });
  };

  return (
    // Tall track gives the pinned block room to scroll through every card (desktop only).
    <div ref={trackRef} className="container-x relative py-20 md:py-28" style={{ ["--cards" as string]: n }}>
      <div className="lg:h-[calc(var(--cards)_*_70svh_+_30svh)]">
        <div className="grid items-center gap-12 lg:sticky lg:top-20 lg:h-[calc(100svh_-_5rem)] lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="mb-6">
                <Eyebrow>What I do</Eyebrow>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h3 className="font-display text-[clamp(2.2rem,4.5vw,3.9rem)] font-light leading-[1.05] tracking-[-0.035em]">
                How I can <em className="not-italic text-accent">help</em> you.
              </h3>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-6 max-w-sm leading-relaxed text-fg/65">
                <span className="lg:hidden">Swipe or use the arrows to explore </span>
                <span className="hidden lg:inline">Keep scrolling to explore </span>
                how I support finance and customer operations — from invoicing to clean, reliable CRM data.
              </p>
            </Reveal>

            {/* Side menu: shows + jumps to the active card */}
            <Reveal delay={0.2}>
              <ol className="relative mt-10 hidden max-w-sm lg:block" aria-label="Services">
                <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-line" />
                <motion.span
                  aria-hidden
                  style={{ scaleY: scrollYProgress }}
                  className="absolute bottom-2 left-[7px] top-2 w-px origin-top bg-accent"
                />
                {services.map((s, i) => {
                  const on = i === active;
                  return (
                    <li key={s.title}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-current={on ? "step" : undefined}
                        className="group flex w-full items-center gap-4 py-2.5 text-left"
                      >
                        <span
                          className={`relative z-10 grid size-[15px] shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                            on ? "border-accent bg-[#fff6f1]" : "border-line bg-ink"
                          }`}
                        >
                          <span className={`size-[5px] rounded-full transition-colors duration-500 ${on ? "bg-accent" : "bg-muted/50"}`} />
                        </span>
                        <Icon
                          name={s.icon}
                          className={`size-4 shrink-0 transition-colors duration-500 ${on ? "text-accent" : "text-muted"}`}
                        />
                        <span
                          className={`text-sm transition-colors duration-500 ${
                            on ? "font-medium text-fg" : "text-muted group-hover:text-fg"
                          }`}
                        >
                          {s.title}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-7">
            <ServiceDeck active={active} onSelect={goTo} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
