"use client";

import { motion, useMotionValueEvent, useTransform } from "motion/react";
import { useState } from "react";
import { services } from "@/lib/content";
import { Icon } from "./Icon";
import { PinnedSection, usePin } from "./Pinned";
import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";
import { ServiceDeck } from "./ServiceDeck";

/** Share of the section's progress used to slide the elements in; the rest steps through the cards. */
const INTRO = 0.3;

/**
 * "How I can help" block. Pins in place; scrolling first slides the elements in
 * (alternating left/right), then advances the service cards one by one.
 * A side menu (desktop) shows and jumps to the active card.
 */
export function PinnedServices() {
  return (
    <PinnedSection as="div" className="container-x py-20 md:py-28" extraSvh={services.length * 45} portion={INTRO}>
      <ServicesBody />
    </PinnedSection>
  );
}

function ServicesBody() {
  const n = services.length;
  const pin = usePin();
  const [active, setActive] = useState(0);

  const cards = useTransform(pin!.progress, [INTRO + 0.02, 1], [0, 1]);

  useMotionValueEvent(pin!.progress, "change", (p) => {
    if (!pin?.enabled) return;
    const q = (p - (INTRO + 0.02)) / (1 - INTRO - 0.02);
    const i = Math.min(n - 1, Math.max(0, Math.floor(q * n)));
    setActive((cur) => (cur === i ? cur : i));
  });

  /** Scroll the page to the card's position (or just switch cards when pinning is off). */
  const goTo = (i: number) => {
    if (!pin?.enabled) return setActive(i);
    pin.scrollToProgress(INTRO + 0.02 + ((1 - INTRO - 0.02) * (i + 0.5)) / n);
  };

  return (
    <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-5">
        <Reveal>
          <div className="mb-6">
            <Eyebrow>What I do</Eyebrow>
          </div>
        </Reveal>
        <Reveal>
          <h3 className="font-display text-[clamp(2.2rem,4.5vw,3.9rem)] font-light leading-[1.05] tracking-[-0.035em]">
            How I can <em className="not-italic text-accent">help</em> you.
          </h3>
        </Reveal>
        <Reveal>
          <p className="mt-6 max-w-sm leading-relaxed text-fg/65">
            Keep scrolling — or swipe the cards — to explore how I support finance and customer operations, from invoicing to
            clean, reliable CRM data.
          </p>
        </Reveal>

        {/* Side menu: shows + jumps to the active card */}
        <Reveal className="hidden lg:block">
          <ol className="relative mt-10 max-w-sm" aria-label="Services">
            <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-line" />
            <motion.span
              aria-hidden
              style={{ scaleY: cards }}
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
                    <Icon name={s.icon} className={`size-4 shrink-0 transition-colors duration-500 ${on ? "text-accent" : "text-muted"}`} />
                    <span className={`text-sm transition-colors duration-500 ${on ? "font-medium text-fg" : "text-muted group-hover:text-fg"}`}>
                      {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </div>

      <Reveal className="lg:col-span-7">
        <ServiceDeck active={active} onSelect={goTo} />
      </Reveal>
    </div>
  );
}
