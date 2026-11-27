"use client";

import { useEffect, useRef } from "react";
import { IsoIcon } from "@/components/blueprint/IsoIcon";
import type { IconName } from "@/components/blueprint/iso";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { DESKTOP, gsap, MOBILE, REDUCED, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { accounting } from "@/src/content";

/** Folder tab silhouette: rounded on the left, a sloped right shoulder. Fixed size, never scaled. */
function FolderTab({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`absolute h-10 w-[15.5rem] ${className}`}>
      <svg viewBox="0 0 248 40" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <path d="M0 41V9Q0 1 8 1H198Q205 1 209 7L229 35Q232 40 240 40H248V41Z" style={{ fill: "var(--color-panel)" }} />
        <path d="M0.5 40V9Q0.5 1.5 8 1.5H198Q204.5 1.5 208.5 7.5L228.5 35Q231.5 39.5 240 39.5H248" fill="none" stroke="var(--color-rule)" />
      </svg>
      <div className="relative flex h-full items-center gap-3 pl-4 pt-0.5">{children}</div>
    </div>
  );
}

/**
 * [03] Accounting, as a real file. A manila folder sits on the sheet: back flap with its tab,
 * the tops of the papers peeking out, and the front cover with a label window and an index.
 * Scrolling flips the cover open on its spine and deals the nine papers out into the grid.
 * The whole thing is tied to the scrollbar, so scrolling back up puts the papers away and
 * closes the cover again.
 */
export function Accounting() {
  const n = sectionNumber("accounting");
  const folder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const f = folder.current;
    if (!f) return;
    setupGsap();
    const q = gsap.utils.selector(f);
    const grid = q("[data-grid]")[0];
    const cover = q("[data-cover]")[0];
    const scale = q("[data-scale]")[0];
    const peek = q("[data-peek]");
    const cards = q<HTMLElement>("[data-card]");
    const mm = gsap.matchMedia();
    const drawn = (card: Element) => card.querySelectorAll("[data-draw]");
    const rise = (card: Element) => card.querySelectorAll("[data-rise]");

    // Offset from a card's home cell to the paper stack in the folder (layout values, so
    // they stay right after a refresh and are not affected by the card's own transform).
    const toStackX = (card: HTMLElement) => grid.clientWidth * 0.5 - (card.offsetLeft + card.offsetWidth / 2);
    const toStackY = (card: HTMLElement) => 150 - (card.offsetTop + card.offsetHeight / 2);

    // Desktop: the file arrives small and closed and is held on screen (pinned). Scroll a
    // little and it grows to full size, the cover flips open on its spine, and the papers
    // come out one by one. Everything is scrubbed, so scrolling back reverses it all.
    mm.add(DESKTOP, () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: f,
          start: "top 9%",
          end: "+=1700",
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      tl.to({}, { duration: 0.7 }, 0) // stays closed for a bit of scroll
        .fromTo(scale, { scale: 0.58 }, { scale: 1, duration: 0.9, ease: "power2.inOut" }, 0.7)
        .fromTo(cover, { rotateY: 0 }, { rotateY: -180, duration: 1.2, ease: "power2.inOut" }, 1.3)
        .fromTo(cover, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 2.3)
        .fromTo(peek, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: 30, duration: 0.3, stagger: 0.05 }, 2.25);

      cards.forEach((card, i) => {
        const at = 2.25 + i * 0.16;
        tl.fromTo(
          card,
          { x: () => toStackX(card), y: () => toStackY(card), scale: 0.4, rotation: (i % 2 ? 1 : -1) * (3 + (i % 4)), autoAlpha: 0 },
          { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" },
          at,
        )
          .fromTo(rise(card), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.4, stagger: 0.05, ease: "power3.out" }, at + 0.35)
          .fromTo(drawn(card), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.01, ease: "power2.inOut" }, at + 0.3);
      });
      tl.fromTo(grid, { backgroundColor: "rgba(0,0,0,0)" }, { backgroundColor: "var(--color-rule)", duration: 0.4 }, ">-0.2");
      return () => tl.scrollTrigger?.kill();
    });

    // Phones: the cover flip is scrubbed; each paper slides out as it scrolls in and goes
    // back in when you scroll above it.
    mm.add(MOBILE, () => {
      gsap.timeline({ scrollTrigger: { trigger: f, start: "top 60%", end: "top 5%", scrub: 0.6 } })
        .fromTo(scale, { scale: 0.82 }, { scale: 1, duration: 0.5, ease: "power2.inOut" }, 0)
        .fromTo(cover, { rotateY: 0 }, { rotateY: -180, duration: 1, ease: "power2.inOut" }, 0.35)
        .fromTo(cover, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 1.15)
        .fromTo(peek, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2 }, 1.15);
      cards.forEach((card) => {
        gsap
          .timeline({ scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none reverse" } })
          .fromTo(card, { y: -50, scale: 0.92, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: "expo.out" })
          .fromTo(drawn(card), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.02 }, 0.25)
          .fromTo(rise(card), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.06 }, 0.2);
      });
    });

    // Reduced motion: an open file, everything in place.
    mm.add(REDUCED, () => {
      gsap.set([cover, ...peek], { autoAlpha: 0 });
      cards.forEach((card) => gsap.set(drawn(card), { strokeDashoffset: 0 }));
    });

    return () => mm.revert();
  }, []);

  const count = accounting.areas.length;

  return (
    <Section id="accounting" labelledBy="accounting-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Accounting" id="accounting-title" title={accounting.headline} className="lg:col-span-8" titleClassName="max-w-[14ch]" />
        <p className="max-w-[28rem] text-[1rem] leading-relaxed text-ink/75 lg:col-span-4 lg:pb-3">{accounting.intro}</p>
      </div>

      {/* The file */}
      <div ref={folder} data-draw-skip className="relative mt-28 lg:mt-32">
      <div data-scale className="relative origin-top [perspective:2400px]">
        {/* Back flap and its tab */}
        <FolderTab className="-top-[39px] left-0 z-[11]">
          <span className="label text-signal">File {n}</span>
          <span className="label text-mute">{count} documents</span>
        </FolderTab>
        <div aria-hidden className="absolute inset-0 rounded-[10px] rounded-tl-none border border-rule bg-panel" />

        {/* Tops of the papers, peeking out between the back flap and the cover */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10">
          {[
            "left-[30%] right-[6%] -top-[14px] rotate-[0.6deg]",
            "left-[34%] right-[10%] -top-[22px] -rotate-[0.8deg]",
            "left-[40%] right-[4%] -top-[8px] rotate-[0.3deg]",
          ].map((c, i) => (
            <div key={i} data-peek className={`absolute h-10 rounded-t-[3px] border border-b-0 border-ink/20 bg-paper ${c}`}>
              <div className="mx-4 mt-2.5 h-px bg-ink/15" />
              <div className="mx-4 mt-1.5 h-px w-1/3 bg-ink/10" />
            </div>
          ))}
        </div>

        {/* The papers */}
        <div className="relative z-[5] p-2 sm:p-3">
          <ul data-grid className="relative grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
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
        </div>

        {/* Front cover: hinged on its left edge (the spine), cut a little lower than the back */}
        <div data-cover aria-hidden className="absolute inset-x-0 bottom-0 top-0 z-20 origin-left [transform-style:preserve-3d]">
          {/* outside */}
          <div className="absolute inset-0 overflow-hidden rounded-[10px] border border-ink/25 bg-panel [backface-visibility:hidden]">
            {/* spine crease */}
            <div className="absolute inset-y-0 left-3 border-l border-dashed border-ink/20 sm:left-4" />
            <div className="absolute inset-y-0 left-[22px] border-l border-ink/10 sm:left-[26px]" />

            <div className="relative py-8 pl-10 pr-6 sm:py-12 sm:pl-14 sm:pr-10 lg:py-14 lg:pl-20 lg:pr-14">
              <div className="flex flex-wrap items-start justify-between gap-6">
                {/* label window */}
                <div className="w-full max-w-[34rem] rounded-[4px] border border-ink/30 bg-paper p-5 sm:p-6">
                  <div className="flex items-center justify-between border-b border-dashed border-ink/25 pb-3">
                    <span className="label text-signal">File {n}</span>
                    <span className="label text-mute">{count} documents</span>
                  </div>
                  <p className="font-display mt-4 text-[clamp(1.9rem,4.2vw,3.6rem)] font-[700] text-ink">Accounting</p>
                  <p className="mt-2 max-w-[34ch] text-[0.92rem] leading-snug text-ink/70">{accounting.headline}</p>
                </div>
                {/* stamp */}
                <div className="rotate-[-4deg] rounded-[4px] border-2 border-signal px-4 py-2">
                  <p className="label text-signal">Filed &amp; verified</p>
                </div>
              </div>

              {/* index of what's inside */}
              <ol className="mt-10 grid max-w-[46rem] gap-x-10 border-t border-ink/25 pt-4 sm:grid-cols-2">
                {accounting.areas.map((a, i) => (
                  <li key={a.title} className="flex items-baseline gap-3 border-b border-dashed border-ink/15 py-2">
                    <span className="font-[family-name:var(--font-pixel)] text-[0.65rem] text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[0.9rem] text-ink/80">{a.title}</span>
                  </li>
                ))}
              </ol>
              <p className="label mt-8 text-mute">Scroll to open the file</p>
            </div>
          </div>
          {/* inside of the cover, seen while it swings */}
          <div className="absolute inset-0 rounded-[10px] border border-ink/25 bg-panel [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="absolute inset-y-0 right-3 border-l border-dashed border-ink/20 sm:right-4" />
            <div className="absolute right-12 top-10 space-y-3">
              <div className="h-px w-40 bg-ink/15" />
              <div className="h-px w-28 bg-ink/15" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </Section>
  );
}
