"use client";

import { useEffect, useRef } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { useScrubText } from "@/lib/animations/useScrubText";
import { sectionNumber } from "@/lib/sections";
import { sections, tools } from "@/src/content";

const TITLE = sections.find((s) => s.id === "tools")!.title;
/** Three rows, split as evenly as the list allows. */
const per = Math.ceil(tools.items.length / 3);
const ROWS = [0, 1, 2].map((r) => tools.items.slice(r * per, (r + 1) * per));

/**
 * [06] Tools: Ali's exact list as outlined boxes in three marquees, alternating direction. Scrolling nudges their speed; hovering a row pauses it. The full list is also
 * in the markup for screen readers.
 */
export function Tools() {
  const n = sectionNumber("tools");
  const intro = useRef<HTMLParagraphElement>(null);
  const rows = useRef<HTMLDivElement>(null);
  useScrubText(intro);

  useEffect(() => {
    const el = rows.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const tracks = Array.from(el.querySelectorAll<HTMLElement>("[data-track]"));
    const loops = tracks.map((t, i) => {
      const dir = i % 2 ? 1 : -1;
      // Each track holds the row twice; moving by half its width loops seamlessly.
      return gsap.fromTo(t, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 40, ease: "none", repeat: -1 });
    });
    // Scroll velocity speeds the rows up briefly.
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate(self) {
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 600, 4);
        loops.forEach((l) => gsap.to(l, { timeScale: boost, duration: 0.2, overwrite: true, onComplete: () => void gsap.to(l, { timeScale: 1, duration: 1.2 }) }));
      },
    });
    const pause = (i: number, on: boolean) => gsap.to(loops[i], { timeScale: on ? 0 : 1, duration: 0.6, overwrite: true });
    const offs = tracks.map((t, i) => {
      const enter = () => pause(i, true);
      const leave = () => pause(i, false);
      t.parentElement!.addEventListener("pointerenter", enter);
      t.parentElement!.addEventListener("pointerleave", leave);
      return () => {
        t.parentElement!.removeEventListener("pointerenter", enter);
        t.parentElement!.removeEventListener("pointerleave", leave);
      };
    });
    return () => {
      st.kill();
      loops.forEach((l) => l.kill());
      offs.forEach((f) => f());
    };
  }, []);

  return (
    <Section id="tools" labelledBy="tools-title" pad="none">
      <div className="px-4 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <SectionHead n={n} label="Tools" id="tools-title" title={TITLE} className="lg:col-span-6" titleClassName="max-w-[12ch]" />
          <p ref={intro} className="self-end text-[clamp(1rem,1.6vw,1.35rem)] font-medium leading-[1.45] text-ink lg:col-span-6 lg:pb-2">
            {tools.intro}
          </p>
        </div>
      </div>

      <ul className="sr-only">
        {tools.items.map((t) => (
          <li key={t.name}>
            {t.name}: {t.use}
          </li>
        ))}
      </ul>

      <div ref={rows} aria-hidden className="mt-10 space-y-2.5 overflow-hidden border-t border-rule py-8 sm:mt-16 sm:space-y-3 sm:py-10 lg:mt-20 lg:py-14">
        {ROWS.map((row, i) => (
          <div key={i} className="overflow-hidden">
            <div data-track className="flex w-max gap-3">
              {/* Two identical halves (each the row three times), so moving by 50% loops seamlessly. */}
              {Array.from({ length: 6 }, () => row).flat().map((t, k) => (
                <div
                  key={k}
                  className="group flex h-[4.5rem] min-w-[11.5rem] shrink-0 flex-col justify-between rounded-[6px] border border-ink/20 px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors duration-300 hover:border-signal hover:bg-sheet sm:h-[6.5rem] sm:min-w-[18rem]"
                >
                  <div className="flex items-center justify-between">
                    <span className="label text-[0.62rem] text-mute">{t.group}</span>
                    <span className="size-1.5 border border-ink/40 transition-colors group-hover:border-signal group-hover:bg-signal" />
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <span className="font-display text-[1.15rem] font-[700] leading-none sm:text-[1.79rem]">{t.name}</span>
                    <span className="hidden max-w-[11rem] text-right text-[0.72rem] leading-snug text-ink/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block">
                      {t.use}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
