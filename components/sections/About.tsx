"use client";

import { useEffect, useRef } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { createImagePixelator } from "@/lib/animations/pixelate";
import { useScrubText } from "@/lib/animations/useScrubText";
import { sectionNumber } from "@/lib/sections";
import { about, identity } from "@/src/content";

/** Rows of the record card: only fields that have a value. */
const record = [
  ...about.facts.map((f) => ({ k: f.label, v: f.value })),
  { k: "Education", v: about.education.field },
  { k: "Current", v: about.current.setting },
].filter((r) => r.v);

/**
 * [02] About. The portrait resolves from pixels as it scrolls into view (messy data → clean
 * picture); the intro fills with ink word by word; the facts sit in a ledger-style record.
 * A mono "currently" marquee runs along the bottom rule.
 */
export function About() {
  const n = sectionNumber("about");
  const intro = useRef<HTMLParagraphElement>(null);
  const fig = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const rows = useRef<HTMLDListElement>(null);

  useScrubText(intro);

  useEffect(() => {
    const c = canvas.current;
    const f = fig.current;
    if (!c || !f) return;
    setupGsap();
    if (prefersReducedMotion()) {
      gsap.set(img.current, { autoAlpha: 1 });
      gsap.set(c, { autoAlpha: 0 });
      return;
    }
    const pix = createImagePixelator(identity.portrait.src, c, "grayscale(1) contrast(1.05)");
    const ro = new ResizeObserver(() => pix.resize());
    ro.observe(c);
    const p = { cell: 56 };
    pix.draw(p.cell);
    const ctx = gsap.context(() => {
      gsap.to(p, {
        cell: 1,
        ease: "power2.in",
        onUpdate: () => pix.draw(p.cell),
        scrollTrigger: {
          trigger: f,
          start: "top 85%",
          end: "center 45%",
          scrub: true,
          onLeave: () => {
            gsap.set(img.current, { autoAlpha: 1 });
            gsap.set(c, { autoAlpha: 0 });
          },
          onEnterBack: () => {
            gsap.set(img.current, { autoAlpha: 0 });
            gsap.set(c, { autoAlpha: 1 });
          },
        },
      });
      // Record rows: a rule draws, then the row's text slides out from under it.
      gsap.from(rows.current!.querySelectorAll("[data-row]"), {
        yPercent: 100,
        autoAlpha: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.07,
        scrollTrigger: { trigger: rows.current, start: "top 85%", once: true },
      });
      gsap.from(rows.current!.querySelectorAll("[data-rule]"), {
        scaleX: 0,
        transformOrigin: "0% 50%",
        duration: 1,
        ease: "drawer",
        stagger: 0.07,
        scrollTrigger: { trigger: rows.current, start: "top 85%", once: true },
      });
    });
    return () => {
      ctx.revert();
      ro.disconnect();
    };
  }, []);

  return (
    <Section id="about" labelledBy="about-title" column={41.666}>
      <div className="grid gap-10 sm:gap-14 lg:grid-cols-12 lg:gap-0">
        {/* Figure: portrait on a drafting sheet */}
        <div className="lg:col-span-5 lg:pr-12">
          <div ref={fig} className="relative mx-auto max-w-[260px] sm:max-w-[420px] lg:mx-0 lg:mt-3">
            <div className="flex items-center justify-between border-x border-t border-ink/15 px-3 py-2">
              <span className="label text-mute">Fig. {n}</span>
              <span className="label text-ink">{identity.name}</span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden border border-ink/15 bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element -- drawn onto the pixel canvas too */}
              <img
                ref={img}
                src={identity.portrait.src}
                alt={identity.portrait.alt}
                className="invisible absolute inset-0 size-full object-cover object-[50%_30%] opacity-0 grayscale-[1] contrast-[1.05]"
                loading="lazy"
              />
              <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
              {/* Crop marks */}
              <span aria-hidden className="absolute left-2 top-2 size-3 border-l border-t border-paper/80" />
              <span aria-hidden className="absolute right-2 top-2 size-3 border-r border-t border-paper/80" />
              <span aria-hidden className="absolute bottom-2 left-2 size-3 border-b border-l border-paper/80" />
              <span aria-hidden className="absolute bottom-2 right-2 size-3 border-b border-r border-paper/80" />
            </div>
            <div className="grid gap-2 border-x border-b border-ink/15 px-3 py-3">
              <span className="label text-mute">{identity.location}</span>
              <span className="label flex items-start gap-2 leading-[1.4] text-signal">
                <span className="mt-[0.3em] size-1.5 shrink-0 rounded-full bg-signal" />
                {about.interest}
              </span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="lg:col-span-7 lg:pl-12">
          <SectionHead n={n} label="About" id="about-title" title={about.headline} titleClassName="max-w-[13ch]" />

          <p ref={intro} className="mt-6 max-w-[38rem] text-[clamp(1.1rem,2vw,1.6rem)] sm:mt-10 font-medium leading-[1.35] tracking-[-0.01em] text-ink">
            {about.intro}
          </p>
          <div className="mt-6 grid max-w-[38rem] gap-4 text-[0.95rem] leading-relaxed text-ink/75 sm:mt-8 sm:text-[1rem]">
            {about.body.map((b) => (
              <p key={b}>{b}</p>
            ))}
          </div>

          <dl ref={rows} className="mt-8 max-w-[38rem] sm:mt-12">
            {record.map((r, i) => (
              <div key={r.k} className="relative overflow-hidden">
                <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
                <div data-row className="grid grid-cols-[2rem_6.5rem_1fr] items-baseline gap-2 py-3 sm:grid-cols-[3rem_9rem_1fr]">
                  <span className="font-[family-name:var(--font-pixel)] text-[0.7rem] text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <dt className="label text-mute">{r.k}</dt>
                  <dd className="text-[0.9rem] text-ink sm:text-[0.95rem]">{r.v}</dd>
                </div>
              </div>
            ))}
            <span aria-hidden className="block h-px bg-rule" />
          </dl>
        </div>
      </div>

      <Currently />
    </Section>
  );
}

/** "Currently" marquee: Ali's own focus list, looping along a rule. */
function Currently() {
  const items = [...about.currently, ...about.currently];
  return (
    <div className="relative -mx-4 mt-14 border-y border-rule sm:-mx-6 sm:mt-24 lg:-mx-8">
      <div className="flex items-stretch">
        <span className="label z-10 flex shrink-0 items-center gap-2 border-r border-rule bg-paper px-4 text-ink sm:px-6">
          <span className="size-1.5 animate-pulse bg-signal" />
          Currently
        </span>
        <p className="sr-only">Currently: {about.currently.join(", ")}</p>
        <div className="relative flex overflow-hidden py-4">
          <ul aria-hidden className="flex shrink-0 animate-[marquee_38s_linear_infinite] items-center gap-10 pr-10">
            {items.map((t, i) => (
              <li key={i} className="label flex items-center gap-10 whitespace-nowrap text-ink">
                {t}
                <span className="text-signal">+</span>
              </li>
            ))}
          </ul>
          <ul aria-hidden className="flex shrink-0 animate-[marquee_38s_linear_infinite] items-center gap-10 pr-10">
            {items.map((t, i) => (
              <li key={i} className="label flex items-center gap-10 whitespace-nowrap text-ink">
                {t}
                <span className="text-signal">+</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
