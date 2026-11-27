"use client";

import { useEffect, useRef } from "react";
import { IsoIcon } from "@/components/blueprint/IsoIcon";
import type { IconName } from "@/components/blueprint/iso";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { DESKTOP, gsap, MOBILE, REDUCED, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { accounting } from "@/src/content";

/**
 * [03] Accounting, as a file. When the section arrives a closed folder sits on the sheet; its
 * cover swings open and the nine areas come out of it one by one, landing in the ledger grid
 * as bordered cards [01]–[09]. Each card's wireframe icon draws itself as it lands.
 * Scrolling back above the folder closes it again, so it reopens on the next visit.
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
    const cards = q("[data-card]");
    const mm = gsap.matchMedia();

    const drawn = (card: Element) => card.querySelectorAll("[data-draw]");

    // Desktop: open the file, then deal the cards out of it.
    mm.add(DESKTOP, () => {
      const fr = f.getBoundingClientRect();
      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "expo.out" },
      });
      gsap.set(grid, { backgroundColor: "transparent" });
      tl.to(cover, { rotateY: -168, duration: 1.1, ease: "power3.inOut" }, 0)
        .to(cover, { autoAlpha: 0, duration: 0.25 }, 0.85)
        .add(() => cover.style.setProperty("pointer-events", "none"), 0.9);

      cards.forEach((card, i) => {
        const r = card.getBoundingClientRect();
        // Start tucked inside the folder: near its top-left pocket, small and tilted.
        const dx = fr.left + fr.width * 0.18 - (r.left + r.width / 2);
        const dy = fr.top + 160 - (r.top + r.height / 2);
        const at = 0.55 + i * 0.11;
        tl.fromTo(
          card,
          { x: dx, y: dy, scale: 0.42, rotation: gsap.utils.random(-7, 7), autoAlpha: 0 },
          { x: 0, y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 0.95 },
          at,
        )
          .fromTo(drawn(card), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.02 }, at + 0.45)
          .fromTo(card.querySelectorAll("[data-rise]"), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.06 }, at + 0.4);
      });
      tl.to(grid, { backgroundColor: "var(--color-rule)", duration: 0.4, ease: "none" }, ">-0.3");

      const st = ScrollTrigger.create({
        trigger: f,
        start: "top 62%",
        onEnter: () => tl.timeScale(1).play(),
        onLeaveBack: () => {
          cover.style.removeProperty("pointer-events");
          tl.timeScale(2.2).reverse();
        },
      });
      return () => {
        st.kill();
        tl.kill();
      };
    });

    // Phones: the cover opens, then each card slides out of the file as it scrolls in.
    mm.add(MOBILE, () => {
      gsap.to(cover, {
        rotateY: -168,
        autoAlpha: 0,
        duration: 1,
        ease: "power3.inOut",
        scrollTrigger: { trigger: f, start: "top 70%", toggleActions: "play none none reverse" },
        onComplete: () => cover.style.setProperty("pointer-events", "none"),
        onReverseComplete: () => cover.style.removeProperty("pointer-events"),
      });
      cards.forEach((card) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 85%", once: true } });
        tl.from(card, { y: -40, scale: 0.94, autoAlpha: 0, duration: 0.8, ease: "expo.out" })
          .to(drawn(card), { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.02 }, 0.3)
          .from(card.querySelectorAll("[data-rise]"), { yPercent: 100, autoAlpha: 0, duration: 0.7, ease: "expo.out", stagger: 0.06 }, 0.25);
      });
    });

    // Reduced motion: an open file, everything in place.
    mm.add(REDUCED, () => {
      gsap.set(cover, { autoAlpha: 0, pointerEvents: "none" });
      cards.forEach((card) => gsap.set(drawn(card), { strokeDashoffset: 0 }));
    });

    return () => mm.revert();
  }, []);

  return (
    <Section id="accounting" labelledBy="accounting-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Accounting" id="accounting-title" title={accounting.headline} className="lg:col-span-8" titleClassName="max-w-[14ch]" />
        <p className="max-w-[28rem] text-[1rem] leading-relaxed text-ink/75 lg:col-span-4 lg:pb-3">{accounting.intro}</p>
      </div>

      {/* The file */}
      <div ref={folder} data-draw-skip className="relative -mx-4 mt-24 [perspective:2200px] sm:-mx-6 lg:-mx-8 lg:mt-28">
        {/* Folder tab (back of the file, stays) */}
        <div className="absolute -top-9 left-4 flex h-9 items-center gap-3 rounded-t-[6px] border border-b-0 border-rule bg-panel px-4 sm:left-6 lg:left-8">
          <span className="label text-signal">File {n}</span>
          <span className="label text-mute">{accounting.areas.length} documents</span>
        </div>

        <ul data-grid className="relative grid gap-px border-y border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Folder cover: swings open on its left edge */}
        <div
          data-cover
          aria-hidden
          className="absolute -top-9 bottom-0 left-0 right-0 z-20 origin-left [backface-visibility:hidden] [transform-style:preserve-3d]"
        >
          {/* cover tab */}
          <div className="absolute left-4 top-0 flex h-9 items-center gap-3 rounded-t-[6px] border border-b-0 border-ink/25 bg-panel px-4 sm:left-6 lg:left-8">
            <span className="label text-signal">File {n}</span>
            <span className="label text-ink">Accounting</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-9 overflow-hidden rounded-[6px] rounded-tl-none border border-ink/25 bg-panel">
            <div className="p-6 sm:p-10 lg:p-14">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="label text-mute">Ledger file · {accounting.areas.length} documents</p>
                  <p className="font-display mt-4 max-w-[16ch] text-[clamp(2rem,4.6vw,4rem)] font-[700] text-ink">{accounting.headline}</p>
                </div>
                {/* label sticker */}
                <div className="rotate-[-3deg] rounded-[4px] border-2 border-signal px-4 py-2">
                  <p className="label text-signal">Filed &amp; verified</p>
                </div>
              </div>
              {/* index of what's inside */}
              <ol className="mt-10 grid max-w-[46rem] gap-x-10 border-t border-dashed border-ink/25 pt-5 sm:grid-cols-2">
                {accounting.areas.map((a, i) => (
                  <li key={a.title} className="flex items-baseline gap-3 border-b border-dashed border-ink/15 py-2">
                    <span className="font-[family-name:var(--font-pixel)] text-[0.65rem] text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-[0.9rem] text-ink/80">{a.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
