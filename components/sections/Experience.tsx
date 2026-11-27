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
 * [Experience] Ali's CV: roles as a timeline (newest first), then skills. (Education closes the page: Education.tsx.)
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

        <div className="mt-14 lg:mt-20">
          {/* Skills */}
          <div data-skills>
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
