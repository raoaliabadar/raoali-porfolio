"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { workspace } from "@/lib/content";
import { PANDA_TASKS, type PandaTask } from "@/lib/panda";
import { goToSlide } from "@/lib/slides";
import { RichText } from "@/components/ui/RichText";
import { useDeck, type SlideProps } from "./SlideDeck";

// The 3D office (client-only). Mounted while this slide or its neighbour is on screen.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

/** Slide 01: the accountant's workspace. The panda works at the desk with its back to you. */
export function WorkspaceSlide({ active, near }: SlideProps) {
  const { setLock } = useDeck();
  const [task, setTask] = useState<PandaTask>("invoice");

  // The panda moves through its jobs while you're here.
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setTask((cur) => PANDA_TASKS[(PANDA_TASKS.findIndex((x) => x.id === cur) + 1) % PANDA_TASKS.length].id);
    }, 9000);
    return () => clearInterval(id);
  }, [active]);

  return (
    <div className="absolute inset-0 bg-ink">
      {/* Soft ledger grid behind everything */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--color-grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-grid-line)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]"
      />

      {/* The office */}
      <div
        data-reveal="zoom"
        className="absolute inset-x-3 bottom-20 top-[46%] overflow-hidden rounded-[24px] shadow-[0_40px_80px_-50px_rgb(20_39_31/0.65)] sm:inset-x-6 md:bottom-20 md:left-[40%] md:right-16 md:top-20 md:rounded-[28px] lg:left-[42%]"
      >
        <div className="absolute inset-0 bg-forest" />
        {near && (
          <DeskScene
            className="size-full"
            scrollTurn
            turn={0}
            active={active}
            task={task}
            onFocusChange={(f) => setLock("desk", !!f)}
          />
        )}
      </div>

      {/* Heading */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col px-5 pt-24 sm:px-8 md:w-[42%] md:justify-center md:pl-12 md:pt-0 lg:w-[44%] lg:pl-16">
        <p data-reveal className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
          <span className="text-bronze-ink">01</span> <span aria-hidden className="mx-2 inline-block h-px w-8 bg-fg/25 align-middle" />
          <span className="sm:hidden">{workspace.kicker.split(" · ")[0]}</span>
          <span className="hidden sm:inline">{workspace.kicker}</span>
        </p>
        <h1 data-reveal className="font-display-serif mt-4 text-[2.7rem] leading-[0.95] text-forest sm:text-6xl lg:text-[5.4rem]">
          <RichText text={workspace.headline} emClassName="!italic text-bronze-ink" />
        </h1>
        <p data-reveal className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted md:mt-6 md:text-lg">
          {workspace.subtitle}
        </p>
        <div data-reveal className="pointer-events-auto mt-5 flex flex-wrap gap-2 md:mt-8 md:gap-3">
          <button
            type="button"
            onClick={() => goToSlide("about")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-semibold text-beige sm:gap-2 sm:px-5 shadow-[0_14px_30px_-14px_rgb(20_39_31/0.8)] transition-colors hover:bg-accent-strong-hover md:min-h-12 md:px-6"
          >
            Explore My Journey <ArrowDown aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide("projects")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-fg/20 bg-surface/70 px-4 text-sm sm:gap-2 sm:px-5 font-semibold text-fg backdrop-blur transition-colors hover:border-fg/40 md:min-h-12 md:px-6"
          >
            View My Work <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
