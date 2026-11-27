"use client";

import { useEffect, useRef } from "react";
import { IsoIcon } from "@/components/blueprint/IsoIcon";
import type { IconName } from "@/components/blueprint/iso";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { accounting } from "@/src/content";

/**
 * [03] Accounting. Each area is a bordered column on the drawing sheet, numbered [01]–[09],
 * with an isometric wireframe that draws itself as the card scrolls in. Hover shades it in.
 */
export function Accounting() {
  const n = sectionNumber("accounting");
  const grid = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const g = grid.current;
    if (!g) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      // Card text rises out of a mask, row by row, as each card enters.
      g.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
        gsap.from(card.querySelectorAll("[data-rise]"), {
          yPercent: 100,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: card, start: "top 88%", once: true },
        });
      });
    }, g);
    return () => ctx.revert();
  }, []);

  return (
    <Section id="accounting" labelledBy="accounting-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Accounting" id="accounting-title" title={accounting.headline} className="lg:col-span-8" titleClassName="max-w-[14ch]" />
        <p className="max-w-[28rem] text-[1rem] leading-relaxed text-ink/75 lg:col-span-4 lg:pb-3">{accounting.intro}</p>
      </div>

      <ul ref={grid} className="-mx-4 mt-16 grid gap-px border-y border-rule bg-rule sm:-mx-6 sm:grid-cols-2 lg:-mx-8 lg:mt-20 lg:grid-cols-3">
        {accounting.areas.map((a, i) => (
          <li
            key={a.title}
            data-card
            data-draw-group
            className="group relative flex min-h-[19rem] flex-col bg-paper px-4 pb-7 pt-5 transition-colors duration-500 hover:bg-panel sm:px-6 sm:last:odd:col-span-2 lg:px-8 lg:last:odd:col-span-1"
          >
            <div className="flex items-start justify-between">
              <span className="label text-signal">[{String(i + 1).padStart(2, "0")}]</span>
              <span aria-hidden className="size-1.5 border border-ink/40 transition-colors duration-300 group-hover:border-signal group-hover:bg-signal" />
            </div>
            <IsoIcon name={a.icon as IconName} className="mx-auto my-6 h-28 w-28 transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-1.5" />
            <div className="mt-auto overflow-hidden">
              <h3 data-rise className="font-display text-[1.4rem] font-[700] leading-[0.95] text-ink">{a.title}</h3>
            </div>
            <div className="overflow-hidden">
              <p data-rise className="mt-3 max-w-[30ch] text-[0.94rem] leading-relaxed text-ink/70">{a.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
