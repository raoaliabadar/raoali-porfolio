"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { about, aboutSlides, site, type AboutCard, type AboutSlide } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { PinnedServices } from "@/components/ui/PinnedServices";

/**
 * About — scroll-stepped story.
 *
 * The section is one viewport tall per slide. A full-screen panel sticks while you
 * scroll; the scroll position picks the active slide. Text slides cross-fade in
 * place (previous slides drift up, upcoming ones wait below), the floating cards
 * around the portrait pop in one after another, and a warm full-screen tint fades
 * in while the section is on screen.
 */

/** Text slide state: active, already passed (moves up) or upcoming (waits below). */
const slideState = (i: number, active: number) =>
  i === active
    ? "translate-y-0 opacity-100"
    : `pointer-events-none opacity-0 ${i < active ? "-translate-y-8" : "translate-y-8"}`;

const cardPosition: Record<AboutCard["at"], string> = {
  tl: "left-0 top-[4%]",
  tr: "right-0 top-[10%]",
  bl: "left-0 bottom-[10%]",
  br: "right-0 bottom-[4%]",
};

function FloatingCard({ card, shown, order }: { card: AboutCard; shown: boolean; order: number }) {
  const accent = card.tone === "accent";
  return (
    <div className={`absolute z-10 w-[46%] max-w-[230px] sm:w-[42%] ${cardPosition[card.at]}`}>
      <div
        className={`rounded-2xl border p-2.5 backdrop-blur transition-all duration-700 ease-out sm:p-3.5 ${
          accent
            ? "border-accent bg-accent shadow-[0_16px_40px_-12px_rgb(254_79_2/0.55)]"
            : "border-white/70 bg-white/80 shadow-[0_16px_40px_-16px_rgb(0_0_0/0.18)]"
        } ${shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}
        style={{ transitionDelay: shown ? `${150 + order * 110}ms` : "0ms" }}
      >
        <div className="flex items-center gap-2">
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-full sm:size-7 ${accent ? "bg-white/20" : "bg-[#fff0eb]"}`}
          >
            <Icon name={card.icon} className={`size-3.5 ${accent ? "text-white" : "text-accent"}`} />
          </span>
          <p className={`text-[0.8125rem] font-medium ${accent ? "text-white" : "text-fg"}`}>{card.title}</p>
        </div>
        {card.note && (
          <p className={`mt-1.5 hidden text-xs sm:block ${accent ? "text-white/85" : "text-muted"}`}>{card.note}</p>
        )}
      </div>
    </div>
  );
}

function SlideText({ slide }: { slide: AboutSlide }) {
  return (
    <>
      <div className="mb-4 flex items-center gap-3 lg:mb-6">
        <span className="size-1.5 shrink-0 rounded-full bg-accent lg:size-2" />
        <p className="text-[clamp(0.875rem,1.1vw,1rem)] font-medium text-fg">{slide.kicker}</p>
      </div>
      <h2 className="font-display text-[clamp(1.9rem,4vw,3.6rem)] font-light leading-[1.08] tracking-[-0.035em]">{slide.title}</h2>
      {slide.body?.map((p) => (
        <p key={p} className="mt-4 text-[clamp(1rem,1.45vw,1.375rem)] leading-[1.6] tracking-[-0.01em] text-fg/55 lg:mt-6">
          {p}
        </p>
      ))}
      {slide.items && (
        <ul className="mt-5 flex flex-col gap-3 lg:mt-8 lg:gap-4">
          {slide.items.map((t) => (
            <li key={t} className="flex items-center gap-3 text-[clamp(1rem,1.3vw,1.125rem)] leading-normal text-fg/80">
              <span aria-hidden className="h-px w-4 shrink-0 bg-accent" />
              {t}
            </li>
          ))}
        </ul>
      )}
      {slide.closing && (
        <div className="mt-4 hidden rounded-2xl border border-accent/30 bg-accent/10 p-4 sm:block lg:mt-6 lg:p-5">
          <p className="text-fg/85">{slide.closing}</p>
          <a
            href="#contact"
            className="group mt-4 inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            Let&apos;s talk
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
          </a>
        </div>
      )}
    </>
  );
}

/** Portrait with soft glow and slowly turning rings — the anchor for the floating cards. */
function PortraitVisual({ active }: { active: number }) {
  return (
    <>
      <div aria-hidden className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,#ffd2c0_0%,#ffe9dd_45%,transparent_70%)]" />
      <div aria-hidden className="absolute inset-[10%] animate-[spin_44s_linear_infinite] rounded-full border border-dashed border-accent/25" />
      <div aria-hidden className="absolute inset-[16%] animate-[spin_30s_linear_infinite_reverse] rounded-full border border-white/80" />
      <div className="absolute inset-[21%] overflow-hidden rounded-full border-4 border-white shadow-[0_30px_60px_-24px_rgb(80_60_40/0.45)]">
        {about.portrait ? (
          <Image
            src={about.portrait}
            alt={`Portrait of ${site.name}`}
            fill
            sizes="(min-width: 1024px) 360px, 40vw"
            className="object-cover object-[50%_30%]"
          />
        ) : (
          <div className="grid size-full place-items-center bg-surface">
            <Logo className="h-12 w-auto text-accent" />
          </div>
        )}
      </div>
      {/* Slide progress */}
      <div aria-hidden className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
        {aboutSlides.map((s, i) => (
          <span
            key={s.kicker}
            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${i === active ? "w-6 bg-accent" : "w-1.5 bg-fg/15"}`}
          />
        ))}
      </div>
    </>
  );
}

export function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = aboutSlides.length;

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = sectionRef.current;
      const tint = tintRef.current;
      if (!el || !tint) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const travel = r.height - vh;
      const progress = travel > 0 ? Math.min(Math.max(-r.top / travel, 0), 1) : 0;
      // Tint fades in as the section enters and out as it leaves.
      const visible = Math.min((vh - r.top) / (vh * 0.7), r.bottom / (vh * 0.7));
      tint.style.opacity = String(Math.min(Math.max(visible, 0), 1));
      setActive(Math.min(n - 1, Math.floor(progress * n)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [n]);

  return (
    <>
      {/* Full-screen warm tint while the About story is on screen */}
      <div
        ref={tintRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[19] bg-[radial-gradient(circle_at_72%_45%,#ffe2d1_0%,#fff3eb_42%,#fffaf6_100%)] opacity-0"
      />

      <section id="about" ref={sectionRef} className="relative z-[21]" style={{ height: `${n * 100}svh` }}>
        <div className="sticky top-0 flex h-svh items-center overflow-hidden pb-6 pt-20 lg:pb-10 lg:pt-24">
          <div className="container-x flex h-full flex-col justify-center gap-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Visual + floating cards */}
            <div className="relative order-2 mx-auto aspect-square h-[36svh] shrink-0 sm:h-[40svh] lg:h-auto lg:max-h-[74svh] lg:w-full lg:max-w-[600px]">
              <PortraitVisual active={active} />
              {aboutSlides.map((s, i) =>
                s.cards.map((c, j) => <FloatingCard key={`${s.kicker}-${c.title}`} card={c} shown={i === active} order={j} />),
              )}
            </div>

            {/* Text slides, stacked in one cell and cross-faded */}
            <div className="order-1 flex flex-col">
              <div className="grid">
                {aboutSlides.map((s, i) => (
                  <div
                    key={s.kicker}
                    aria-hidden={i !== active}
                    className={`col-start-1 row-start-1 transition-all duration-700 ease-out ${slideState(i, active)}`}
                  >
                    <SlideText slide={s} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services: pinned, cards advance with scroll */}
      <PinnedServices />
    </>
  );
}
