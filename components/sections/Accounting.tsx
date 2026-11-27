"use client";

import { useEffect, useRef } from "react";
import { IsoIcon } from "@/components/blueprint/IsoIcon";
import type { IconName } from "@/components/blueprint/iso";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { DESKTOP, gsap, MOBILE, REDUCED, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { accounting } from "@/src/content";

const pad = (i: number) => String(i + 1).padStart(2, "0");

/**
 * [03] Accounting, as a file on the desk.
 *
 * A small closed manila folder sits in the middle of the stage. Scroll and it opens like a
 * book: the cover swings over to the left (its inside carries the index) and the stack of
 * papers shows on the right. Then the papers are taken out one at a time and laid out as the
 * nine cards. Desktop pins the stage and scrubs it all, so scrolling back up puts every paper
 * back and closes the file. Phones get the same folder opening, with the cards below it.
 */
export function Accounting() {
  const n = sectionNumber("accounting");
  const stage = useRef<HTMLDivElement>(null);
  const count = accounting.areas.length;

  useEffect(() => {
    const s = stage.current;
    if (!s) return;
    setupGsap();
    const q = gsap.utils.selector(s);
    const file = q<HTMLElement>("[data-file]")[0];
    const back = q("[data-back]")[0];
    const cover = q("[data-cover]")[0];
    const sheets = q("[data-sheet]");
    const hint = q("[data-hint]");
    const grid = q<HTMLElement>("[data-grid]")[0];
    const cards = q<HTMLElement>("[data-card]");
    const drawn = (c: Element) => c.querySelectorAll("[data-draw]");
    const rise = (c: Element) => c.querySelectorAll("[data-rise]");
    const mm = gsap.matchMedia();

    // The open file is centred: the closed folder slides right by half its width while
    // the cover swings over its spine to the left.
    const half = () => file.offsetWidth / 2;
    const persp = { transformPerspective: 2200 };

    mm.add(DESKTOP, () => {
      // Where the paper stack sits once the file is open (stage coordinates, layout values).
      const stackX = () => file.offsetLeft + file.offsetWidth;
      const stackY = () => file.offsetTop + file.offsetHeight / 2;
      const fromX = (c: HTMLElement) => stackX() - (grid.offsetLeft + c.offsetLeft + c.offsetWidth / 2);
      const fromY = (c: HTMLElement) => stackY() - (grid.offsetTop + c.offsetTop + c.offsetHeight / 2);

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: s,
          start: "top top+=56",
          end: "+=2200",
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      gsap.set(cover, persp);
      tl.to({}, { duration: 0.5 }, 0) // the closed file, held for a moment
        .to(hint, { autoAlpha: 0, duration: 0.3 }, 0.45)
        .fromTo([back, cover], { x: 0 }, { x: () => half(), duration: 1.1, ease: "power2.inOut" }, 0.5)
        .fromTo(cover, { rotateY: 0 }, { rotateY: -180, duration: 1.1, ease: "power2.inOut" }, 0.5)
        // once it lies open, the cover goes under the papers that will cross it
        .set(cover, { zIndex: 5 }, 1.6);

      cards.forEach((c, i) => {
        const at = 1.8 + i * 0.24;
        tl.set(sheets[count - 1 - i], { autoAlpha: 0 }, at)
          .fromTo(
            c,
            { x: () => fromX(c), y: () => fromY(c), scale: 0.62, rotation: (i % 2 ? 1 : -1) * (2 + (i % 3)) },
            { x: 0, y: 0, scale: 1, rotation: 0, duration: 0.85, ease: "power3.inOut" },
            at,
          )
          // picked up off the stack: solid straight away
          .fromTo(c, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, at)
          .fromTo(drawn(c), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, stagger: 0.01, ease: "power2.inOut" }, at + 0.35)
          .fromTo(rise(c), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: "power3.out" }, at + 0.3);
      });

      // The empty file is put away under the laid-out papers.
      const last = 1.8 + (count - 1) * 0.24 + 0.85;
      tl.to([back, cover], { autoAlpha: 0, scale: 0.9, duration: 0.5 }, last - 0.4).fromTo(
        grid,
        { backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(0,0,0,0)" },
        { backgroundColor: "var(--color-rule)", borderColor: "var(--color-rule)", duration: 0.3 },
        last - 0.1,
      );
      return () => tl.scrollTrigger?.kill();
    });

    // Phones: the folder opens as it scrolls through; each card then comes out as it enters.
    mm.add(MOBILE, () => {
      gsap.set(cover, persp);
      gsap
        .timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: file, start: "top 70%", end: "top 25%", scrub: 0.6, invalidateOnRefresh: true } })
        .to(hint, { autoAlpha: 0, duration: 0.2 }, 0)
        .fromTo([back, cover], { x: 0 }, { x: () => half(), duration: 1, ease: "power2.inOut" }, 0)
        .fromTo(cover, { rotateY: 0 }, { rotateY: -180, duration: 1, ease: "power2.inOut" }, 0);
      cards.forEach((c) => {
        gsap
          .timeline({ scrollTrigger: { trigger: c, start: "top 88%", toggleActions: "play none none reverse" } })
          .fromTo(c, { y: -40, scale: 0.94, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.7, ease: "expo.out" })
          .fromTo(drawn(c), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.02 }, 0.25)
          .fromTo(rise(c), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: "expo.out", stagger: 0.06 }, 0.2);
      });
    });

    // Reduced motion: the cards, laid out; the folder stays closed above them on phones.
    mm.add(REDUCED, () => {
      cards.forEach((c) => gsap.set(drawn(c), { strokeDashoffset: 0 }));
    });

    return () => mm.revert();
  }, [count]);

  return (
    <Section id="accounting" labelledBy="accounting-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Accounting" id="accounting-title" title={accounting.headline} className="lg:col-span-8" titleClassName="max-w-[14ch]" />
        <p className="max-w-[28rem] text-[1rem] leading-relaxed text-ink/75 lg:col-span-4 lg:pb-3">{accounting.intro}</p>
      </div>

      {/* The desk: folder and papers */}
      <div ref={stage} data-draw-skip className="relative mt-16 lg:mt-20 lg:flex lg:h-[calc(100svh-5.5rem)] lg:items-center">
        {/* The folder. Not transformed itself, so its back and cover can sit under and over the papers. */}
        <div
          data-file
          aria-hidden
          className="relative mx-auto mb-14 mt-6 aspect-[10/7] w-[46%] max-w-[20rem] lg:absolute lg:inset-0 lg:m-auto lg:h-[19.5rem] lg:w-[28rem] lg:max-w-none"
        >
          {/* back flap, tab and the stack of papers */}
          <div data-back className="absolute inset-0 z-0">
            <div className="absolute -top-[22px] left-0 flex h-[23px] w-[46%] items-center gap-2 rounded-t-[6px] border border-b-0 border-ink/25 bg-panel px-2.5 lg:-top-[30px] lg:h-[31px] lg:px-3.5">
              <span className="label truncate text-[0.5rem]! text-signal lg:text-[0.68rem]!">File {n}</span>
            </div>
            <div className="absolute inset-0 rounded-[8px] rounded-tl-none border border-ink/25 bg-panel" />
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                data-sheet
                className="absolute inset-x-[8%] inset-y-[9%] rounded-[2px] border border-ink/20 bg-paper"
                style={{ transform: `translate(${(i % 3) - 1}px, ${-i * 0.6}px) rotate(${((i * 37) % 7) - 3}deg)` }}
              >
                <div className="mx-[10%] mt-[12%] h-[3px] w-1/3 bg-ink/25" />
                {[80, 70, 76, 55, 72].map((w, k) => (
                  <div key={k} className="mx-[10%] mt-[6%] h-px bg-ink/15" style={{ width: `${w}%` }} />
                ))}
              </div>
            ))}
          </div>

          {/* front cover, hinged on its left edge */}
          <div data-cover className="absolute inset-0 z-20 origin-left [transform-style:preserve-3d]">
            {/* outside */}
            <div className="absolute inset-0 rounded-[8px] border border-ink/30 bg-panel [backface-visibility:hidden]">
              <div className="absolute inset-y-0 left-[6%] border-l border-dashed border-ink/20" />
              <div className="absolute left-[14%] right-[10%] top-[16%] rounded-[3px] border border-ink/30 bg-paper px-[6%] py-[5%]">
                <p className="label whitespace-nowrap text-[0.42rem]! text-mute lg:text-[0.62rem]!">
                  File {n} · {count} documents
                </p>
                <p className="font-display mt-1 text-[1rem] font-[700] leading-none text-ink lg:mt-2 lg:text-[2rem]">Accounting</p>
              </div>
              <div className="absolute bottom-[14%] right-[9%] rotate-[-5deg] rounded-[3px] border border-signal px-1.5 py-0.5 lg:border-2 lg:px-3 lg:py-1.5">
                <p className="label whitespace-nowrap text-[0.4rem]! text-signal lg:text-[0.62rem]!">Filed &amp; verified</p>
              </div>
            </div>
            {/* inside: the index */}
            <div className="absolute inset-0 rounded-[8px] border border-ink/30 bg-panel [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="absolute inset-y-0 right-[6%] border-l border-dashed border-ink/20" />
              <div className="absolute inset-y-[8%] left-[8%] right-[14%] overflow-hidden">
                <p className="label border-b border-ink/25 pb-1 text-[0.42rem]! text-mute lg:pb-2 lg:text-[0.6rem]!">Index</p>
                <ol className="mt-1 lg:mt-1.5">
                  {accounting.areas.map((a, i) => (
                    <li key={a.title} className="flex items-baseline gap-1.5 border-b border-dashed border-ink/15 py-[1px] lg:gap-2 lg:py-[3px]">
                      <span className="font-[family-name:var(--font-pixel)] text-[0.38rem] text-signal lg:text-[0.5rem]">{pad(i)}</span>
                      <span className="truncate text-[0.45rem] text-ink/75 lg:text-[0.72rem]">{a.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
          <p data-hint className="label absolute -bottom-9 left-1/2 w-max -translate-x-1/2 text-center text-mute">
            Scroll to open the file
          </p>
        </div>

        {/* The papers, laid out */}
        <ul data-grid className="relative z-10 grid w-full sm:grid-cols-2 lg:grid-cols-3 lg:gap-px lg:border lg:border-rule lg:bg-transparent">
          {accounting.areas.map((a, i) => (
            <li
              key={a.title}
              data-card
              data-draw-group
              style={{ zIndex: count - i }}
              className="group relative -mt-px grid grid-cols-[1fr_auto] gap-x-4 border border-rule bg-paper sm:-ml-px lg:m-0 lg:border-0 px-5 py-5 transition-colors duration-500 hover:bg-panel sm:last:odd:col-span-2 lg:px-6 lg:last:odd:col-span-1 xl:py-6"
            >
              <div className="flex min-w-0 flex-col">
                <span className="label text-signal">[{pad(i)}]</span>
                <div className="mt-4 overflow-hidden">
                  <h3 data-rise className="font-display text-[1.2rem] font-[700] leading-[1] text-ink xl:text-[1.3rem]">{a.title}</h3>
                </div>
                <div className="overflow-hidden">
                  <p data-rise className="mt-2 max-w-[30ch] text-[0.9rem] leading-snug text-ink/70">{a.text}</p>
                </div>
              </div>
              <IsoIcon name={a.icon as IconName} className="h-20 w-20 self-center transition-transform duration-700 ease-[var(--ease-expo)] group-hover:-translate-y-1 xl:h-24 xl:w-24" />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
