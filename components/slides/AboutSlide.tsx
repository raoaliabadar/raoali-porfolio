"use client";

import Image from "next/image";
import { Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { about, profile, site } from "@/lib/content";
import type { SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

/** Slide 02: Behind the Numbers. An editorial introduction: education, current role, interests. */
export function AboutSlide(_: SlideProps) {
  const edu = profile.education;
  const cur = profile.current;
  const roleLine = [cur.role, cur.company].filter(Boolean).join(", ");
  return (
    <SlideFrame>
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-7">
          <Kicker n={2}>About me</Kicker>
          <SlideTitle className="text-forest">
            Behind the <em className="text-bronze-ink">Numbers</em>
          </SlideTitle>
          <p data-reveal className="mt-6 max-w-2xl text-lg leading-relaxed text-fg md:text-xl">
            {profile.intro}
          </p>
          {profile.body.map((p) => (
            <p key={p} data-reveal className="mt-4 max-w-2xl leading-relaxed text-muted">
              {p}
            </p>
          ))}

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article data-reveal="card" className="rounded-[16px] border border-line bg-surface p-4">
              <GraduationCap aria-hidden className="size-5 text-bronze-ink" />
              <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Education</h3>
              {edu.map((e) => (
                <div key={e.field} className="mt-1.5">
                  <p className="font-semibold leading-snug">{e.degree || e.field}</p>
                  {e.degree && <p className="text-sm text-muted">{e.field}</p>}
                  {(e.institution || e.years) && <p className="text-sm text-muted">{[e.institution, e.years].filter(Boolean).join(" · ")}</p>}
                </div>
              ))}
            </article>
            <article data-reveal="card" className="rounded-[16px] border border-line bg-surface p-4">
              <Briefcase aria-hidden className="size-5 text-bronze-ink" />
              <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Current role</h3>
              <p className="mt-1.5 font-semibold leading-snug">{roleLine || "Business operations"}</p>
              <p className="text-sm text-muted">
                {cur.setting} · {cur.period}
              </p>
            </article>
            <article data-reveal="card" className="rounded-[16px] border border-line bg-forest p-4 text-beige">
              <Sparkles aria-hidden className="size-5 text-bronze" />
              <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-beige/70">Interest</h3>
              <p className="mt-1.5 font-semibold leading-snug">Where financial operations meet technology</p>
            </article>
          </div>

          <ul data-reveal className="mt-6 flex flex-wrap gap-2" aria-label="Focus areas">
            {profile.focus.map((f) => (
              <li key={f} className="rounded-full border border-fg/15 px-3.5 py-1.5 text-sm text-fg">
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Portrait */}
        <div className="relative mx-auto hidden w-full max-w-sm lg:col-span-5 lg:block">
          <div data-reveal="zoom" className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[28px] border border-bronze/50 bg-cream p-2">
            <div className="relative size-full overflow-hidden rounded-t-[999px] rounded-b-[22px]">
              <Image src={about.portrait} alt={`Portrait of ${site.name}`} fill sizes="(min-width: 1024px) 380px, 0px" className="object-cover" />
            </div>
          </div>
          <div data-reveal="card" className="absolute -bottom-5 -left-8 rounded-[16px] bg-forest px-5 py-4 text-beige shadow-[0_24px_50px_-24px_rgb(20_39_31/0.8)]">
            <p className="font-display-serif text-2xl leading-none">{site.name}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-beige/70">Accounting & Finance</p>
          </div>
        </div>
      </div>
    </SlideFrame>
  );
}
