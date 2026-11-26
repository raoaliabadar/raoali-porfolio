"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { workspace } from "@/lib/content";
import { PANDA_TASKS, type PandaTask } from "@/lib/panda";
import { goToSlide } from "@/lib/slides";
import { RichText } from "@/components/ui/RichText";
import { useKeepMounted } from "@/lib/useKeepMounted";
import { useDeck, type SlideProps } from "./SlideDeck";

// The 3D office (client-only). Mounted while this slide or its neighbour is on screen.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

/** Slide 01: the accountant's workspace. The panda works at the desk with its back to you. */
export function WorkspaceSlide({ active, near }: SlideProps) {
  const { setLock } = useDeck();
  const [task, setTask] = useState<PandaTask>("invoice");
  // Built once, then kept (paused while away), so returning never rebuilds the 3D office.
  // Waits for the first idle moment after load, so the heading and buttons paint and respond
  // before the (heavy) 3D setup and its texture downloads start.
  const idle = useIdleAfterLoad();
  const showDesk = useKeepMounted(near && idle);

  // Start fetching the photographed textures and studio light alongside the 3D code.
  useEffect(() => {
    // (dynamic import: three.js stays out of the first page load)
    if (near && idle) void import("@/components/ui/desk/realism").then((m) => m.prefetchDeskAssets());
  }, [near, idle]);

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
        className="absolute inset-x-3 bottom-20 top-[max(50%,22rem)] overflow-hidden rounded-[24px] shadow-[0_40px_80px_-50px_rgb(20_39_31/0.65)] sm:inset-x-6 md:bottom-20 md:left-[40%] md:right-16 md:top-20 md:rounded-[28px] lg:left-[42%]"
      >
        {/* Follows the room lighting (night green ↔ day cream), set by the desk scene. */}
        <div className="absolute inset-0 bg-forest" style={{ background: "var(--room-bg, var(--color-forest))" }} />
        {showDesk && (
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
        {/* Sized to the column (vw-based), so the name never runs into the room card on smaller laptops. */}
        <h1 data-reveal className="font-display-serif mt-3 text-[2.6rem] leading-[0.95] text-forest sm:mt-4 sm:text-6xl md:text-[clamp(3rem,6.2vw,5.4rem)]">
          <RichText text={workspace.headline} emClassName="!italic text-bronze-ink" />
        </h1>
        <p data-reveal className="mt-3 max-w-md text-[0.86rem] leading-relaxed text-muted sm:mt-4 sm:text-[0.95rem] md:mt-6 md:text-lg">
          {workspace.subtitle}
        </p>
        <div data-reveal className="pointer-events-auto mt-5 flex flex-wrap gap-2 md:mt-8 md:gap-3">
          <button
            type="button"
            onClick={() => goToSlide("about")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-forest px-3.5 text-[0.8rem] font-semibold text-beige sm:gap-2 sm:px-5 sm:text-sm shadow-[0_14px_30px_-14px_rgb(20_39_31/0.8)] transition-colors hover:bg-accent-strong-hover md:min-h-12 md:px-6"
          >
            Explore My Journey <ArrowDown aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => goToSlide("projects")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-fg/20 bg-surface/70 px-3.5 text-[0.8rem] sm:gap-2 sm:px-5 sm:text-sm font-semibold text-fg backdrop-blur transition-colors hover:border-fg/40 md:min-h-12 md:px-6"
          >
            View My Work <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** False on the first render, true once the browser has had an idle moment (at most ~1.2 s later). */
function useIdleAfterLoad() {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => setIdle(true), 300);
    return () => window.clearTimeout(t);
  }, []);
  return idle;
}
