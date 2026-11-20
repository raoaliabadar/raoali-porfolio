"use client";

import { motion, type PanInfo } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Icon as NamedIcon } from "./Icon";

/** Stacked, swipeable card deck (inspired by "playbook" card stacks). */
export function ServiceDeck() {
  const n = services.length;
  const [order, setOrder] = useState(() => services.map((_, i) => i));
  const lastAction = useRef<"next" | "prev" | null>(null);

  const next = () => {
    lastAction.current = "next";
    setOrder((o) => [...o.slice(1), o[0]]);
  };
  const prev = () => {
    lastAction.current = "prev";
    setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500) next();
  };

  const current = services[order[0]];

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
      <div className="relative mx-auto mt-24 aspect-[4/5] w-full max-w-[32rem] sm:mt-[7.5rem] sm:aspect-[5/4]">
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
              {/* colour glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full opacity-20 blur-[70px]"
                style={{ background: s.color }}
              />

              <div className="flex items-center gap-4">
                <h3 className="whitespace-nowrap font-display text-xl font-medium tracking-[-0.02em] md:text-2xl">
                  {s.title}
                </h3>
                <span className="h-px flex-1 bg-line" />
                <span className="label">
                  0{id + 1}/0{n}
                </span>
              </div>

              <div className="relative mt-6 flex flex-1 items-center">
                <span
                  className="grid size-20 place-items-center rounded-full border md:size-24"
                  style={{ borderColor: `${s.color}55`, color: s.color, boxShadow: `0 0 60px -10px ${s.color}66` }}
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
      <div className="mx-auto mt-8 flex max-w-[32rem] items-center justify-between">
        <p className="label" aria-live="polite">
          <span className="text-fg">{current.title}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous service"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-fg hover:bg-fg hover:text-white"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next service"
            className="grid size-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-fg hover:bg-fg hover:text-white"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
