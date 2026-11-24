"use client";

import { motion, type PanInfo } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Icon as NamedIcon } from "./Icon";

/**
 * Stacked, swipeable card deck.
 * Uncontrolled by default; pass `active` + `onSelect` to drive it from outside
 * (e.g. from page scroll position).
 */
export function ServiceDeck({ active, onSelect }: { active?: number; onSelect?: (index: number) => void } = {}) {
  const n = services.length;
  const [internal, setInternal] = useState(0);
  const activeIdx = active ?? internal;

  // Work out the direction of the latest change so the front card can fly to the back.
  const prevIdx = useRef(activeIdx);
  const lastAction = useRef<"next" | "prev" | null>(null);
  if (prevIdx.current !== activeIdx) {
    const d = (activeIdx - prevIdx.current + n) % n;
    lastAction.current = d === 1 ? "next" : d === n - 1 ? "prev" : null;
    prevIdx.current = activeIdx;
  }

  const select = (i: number) => (onSelect ? onSelect((i + n) % n) : setInternal((i + n) % n));
  const next = () => select(activeIdx + 1);
  const prev = () => select(activeIdx - 1);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) next();
  };

  // order[pos] = card id; front card first.
  const order = services.map((_, k) => (activeIdx + k) % n);
  const current = services[activeIdx];

  return (
    <div
      className="relative"
      role="region"
      aria-roledescription="carousel"
      aria-label="Services"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
    >
      <div className="relative mx-auto mt-24 aspect-[4/5] w-full max-w-[32rem] sm:mt-[7.5rem] sm:aspect-[5/4] lg:max-w-[min(32rem,calc((100svh_-_18rem)_*_1.25))]">
        {services.map((s, id) => {
          const pos = order.indexOf(id);
          const isFront = pos === 0;
          const goingBack = lastAction.current === "next" && pos === n - 1;
          const target = {
            x: pos * 26,
            y: pos * -42,
            scale: 1 - pos * 0.06,
            opacity: pos > 2 ? 0 : 1 - pos * 0.18,
          };

          return (
            <motion.article
              key={s.title}
              aria-hidden={!isFront}
              drag={isFront ? "x" : false}
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={isFront ? onDragEnd : undefined}
              initial={false}
              animate={
                goingBack
                  ? {
                      x: [0, 340, target.x],
                      y: [0, 40, target.y],
                      scale: [1, 0.95, target.scale],
                      rotate: [0, 8, 0],
                      opacity: [1, 1, target.opacity],
                      zIndex: [n, n, 0],
                    }
                  : { ...target, rotate: 0, zIndex: n - pos }
              }
              transition={{ duration: goingBack ? 0.9 : 0.7, ease, times: goingBack ? [0, 0.45, 1] : undefined }}
              style={{ transformOrigin: "50% 100%" }}
              className={`absolute inset-0 flex flex-col overflow-hidden rounded-[28px] border border-line bg-surface p-6 shadow-[0_30px_60px_-30px_rgb(80_60_40/0.35)] md:p-8 ${
                isFront ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"
              }`}
            >
              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap font-display text-xl font-medium tracking-[-0.02em] md:text-2xl">
                  {s.title}
                </h3>
                <span className="h-px flex-1 bg-line" />
              </div>

              <div className="relative mt-6 flex flex-1 items-center">
                <span
                  className="grid size-20 place-items-center rounded-full border md:size-24"
                  style={{ borderColor: `${s.color}55`, color: s.color }}
                >
                  <NamedIcon name={s.icon} className="size-8 md:size-10" strokeWidth={1.25} />
                </span>
              </div>

              <div className="relative">
                <p className="max-w-sm text-[0.95rem] leading-relaxed text-fg/75">{s.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {s.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[0.7rem] font-medium text-fg/70">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mx-auto mt-8 flex max-w-[32rem] items-center justify-between lg:max-w-[min(32rem,calc((100svh_-_18rem)_*_1.25))]">
        <p className="label" aria-live="polite">
          <span className="text-fg">{current.title}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous service"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-fg hover:bg-fg hover:text-ink"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next service"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-fg hover:bg-fg hover:text-ink"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
