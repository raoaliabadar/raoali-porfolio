"use client";

import { Section } from "@/components/ui/Section";
import { career } from "@/src/content";

/**
 * Education, kept simple at the end of the page (just before Contact): one line per
 * qualification with the school and the years. No big heading, not in the nav.
 */
export function Education() {
  return (
    <Section id="education" labelledBy="education-title" pad="none">
      <div className="grid gap-6 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-16">
        <h2 id="education-title" className="label text-ink lg:col-span-3 lg:pt-1">
          <span className="text-signal">[E]</span> Education
        </h2>
        <ul className="divide-y divide-rule border-y border-rule lg:col-span-9">
          {career.education.map((e) => (
            <li key={e.title} className="grid gap-1 py-4 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6">
              <p className="text-[1rem] font-medium text-ink">
                {e.title}
                <span className="font-normal text-ink/60"> · {e.school}</span>
              </p>
              <span className="label text-mute">{e.period}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
