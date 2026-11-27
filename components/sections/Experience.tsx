"use client";

import { useEffect, useRef } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { career, experience, sections } from "@/src/content";

const TITLE = sections.find((s) => s.id === "experience")!.title;
const pad = (i: number) => String(i + 1).padStart(2, "0");

/**
 * [Experience] Ali's CV: roles as a timeline (newest first), then education, then skills.
 * Same sheet language as Projects: bordered rows numbered [0X] whose rule draws across and
 * whose content rises in as they scroll into view.
 */
export function Experience() {
  const n = sectionNumber("experience");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 88%", once: true } });
        tl.from(row.querySelector("[data-rule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1, ease: "drawer" })
          .from(row.querySelectorAll("[data-dot]"), { scale: 0, duration: 0.5, ease: "back.out(3)" }, 0.2)
          .from(row.querySelectorAll("[data-rise]"), { y: 18, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 0.15);
      });
      gsap.from(el.querySelectorAll("[data-skill]"), {
        y: 12,
        autoAlpha: 0,
        duration: 0.6,
        ease: "expo.out",
        stagger: 0.035,
        scrollTrigger: { trigger: el.querySelector("[data-skills]"), start: "top 90%", once: true },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section id="experience" labelledBy="experience-title">
      <div ref={root}>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHead n={n} label="Experience" id="experience-title" title={TITLE} className="lg:col-span-6" />
          <p className="max-w-[38rem] text-[clamp(1rem,1.5vw,1.2rem)] font-medium leading-[1.5] text-ink lg:col-span-6 lg:pb-2">{career.summary}</p>
        </div>

        {/* Work timeline */}
        <ol className="-mx-4 mt-14 border-b border-rule sm:-mx-6 lg:-mx-8 lg:mt-20" aria-label="Work experience">
          {experience.map((e, i) => (
            <li key={e.role + e.period} data-row className="relative">
              <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
              <div className="grid gap-x-6 gap-y-4 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-10">
                <div data-rise className="flex items-center gap-3 lg:col-span-3 lg:flex-col lg:items-start lg:gap-4">
                  <span className="label text-signal">[{pad(i)}]</span>
                  <span className="label inline-flex items-center gap-2 rounded-[4px] border border-ink/20 px-2 py-1.5 text-ink">
                    <span data-dot className={`size-1.5 rounded-full ${i === 0 ? "bg-signal" : "bg-ink/40"}`} />
                    {e.period}
                  </span>
                </div>
                <div data-rise className="lg:col-span-4">
                  <h3 className="font-display text-[clamp(1.5rem,2.6vw,2.3rem)] font-[700] leading-[0.95] text-ink">{e.role}</h3>
                  {(e.company || e.location) && (
                    <p className="label mt-3 text-mute">{[e.company, e.location].filter(Boolean).join(" · ")}</p>
                  )}
                </div>
                <ul data-rise className="space-y-2.5 lg:col-span-5">
                  {e.highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/80">
                      <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 bg-signal" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          {/* Education timeline */}
          <div className="lg:col-span-7">
            <p className="label text-ink">
              <span className="text-signal">[E]</span> Education
            </p>
            <ol className="mt-5 border-b border-rule" aria-label="Education">
              {career.education.map((ed, i) => (
                <li key={ed.title} data-row className="relative">
                  <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
                  <div className="grid grid-cols-[1.25rem_1fr] gap-x-3 py-5 sm:grid-cols-[1.25rem_1fr_auto] sm:items-baseline sm:gap-x-5">
                    <span data-dot aria-hidden className={`mt-[0.45em] size-2 rounded-full border ${i === 0 ? "border-signal bg-signal" : "border-ink/40"}`} />
                    <div data-rise>
                      <h3 className="font-display text-[1.15rem] font-[700] leading-tight text-ink sm:text-[1.3rem]">{ed.title}</h3>
                      <p className="mt-1.5 text-[0.92rem] text-ink/70">{ed.school}</p>
                    </div>
                    <span data-rise className="label col-start-2 mt-2.5 text-mute sm:col-start-auto sm:mt-0">
                      {ed.period}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Skills */}
          <div data-skills className="lg:col-span-5">
            <p className="label text-ink">
              <span className="text-signal">[S]</span> Skills
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Skills">
              {career.skills.map((s) => (
                <li
                  key={s}
                  data-skill
                  className="rounded-[4px] border border-ink/20 px-3 py-2 text-[0.88rem] text-ink transition-colors duration-300 hover:border-signal hover:bg-sheet"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
