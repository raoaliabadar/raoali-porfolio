"use client";

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { hero, site } from "@/lib/content";
import { ease } from "@/lib/motion";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease, delay },
});

/** Translucent "ice" record — rows of glass blocks, like stacked ledger entries. */
function IceRecord({ rows = 3, cols = 9, core = false, className = "" }: { rows?: number; cols?: number; core?: boolean; className?: string }) {
  return (
    <div className={`glass-ice relative rounded-[18px] p-2.5 md:p-3 ${className}`}>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <span key={i} className="h-3 rounded-[4px] border border-white/60 bg-white/35 md:h-4" />
        ))}
      </div>
      {core && (
        <>
          <span aria-hidden className="plasma absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full md:size-14" />
          <span aria-hidden className="absolute left-1/2 top-full h-16 w-px -translate-x-1/2 bg-gradient-to-b from-white/70 to-white/0 md:h-20" />
        </>
      )}
    </div>
  );
}

/** Phrases that cycle: the active one is bright, the next ones fade below. */
function Rotating() {
  const [i, setI] = useState(0);
  const n = hero.rotating.length;
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % n), 2400);
    return () => clearInterval(t);
  }, [n]);
  return (
    <ul className="relative h-[3.9rem] text-center text-xs md:text-sm" aria-live="polite">
      {hero.rotating.map((w, k) => {
        const pos = (k - i + n) % n; // 0 = active, 1 = next, 2 = after
        return (
          <li
            key={w}
            className="absolute inset-x-0 transition-all duration-700 ease-out"
            style={{ transform: `translateY(${pos * 1.3}rem)`, opacity: pos === 0 ? 1 : pos === 1 ? 0.55 : 0.25 }}
          >
            <span className={pos === 0 ? "text-white" : "text-white/80"}>{w}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Hero() {
  return (
    <section id="top" className="panel bg-ice mt-2 flex min-h-[calc(100svh-1rem)] flex-col md:mt-3.5">
      <div className="container-x flex flex-1 flex-col items-center pt-36 text-center md:pt-44">
        <motion.h1 {...fadeUp(0.15)} className="text-[clamp(2.6rem,6.4vw,5rem)] font-medium leading-[0.98] tracking-[-0.05em]">
          <span className="sr-only">{site.name} — </span>
          {hero.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </motion.h1>
        <motion.p {...fadeUp(0.3)} className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-[#a8b5d6] md:text-base">
          {hero.tagline}
        </motion.p>

        {/* Visual: glass records with a glowing core */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.3, ease, delay: 0.45 }}
          className="relative mt-auto w-full pb-6 pt-16"
        >
          <div className="relative mx-auto flex max-w-[64rem] items-end justify-center gap-4 md:gap-8">
            <IceRecord rows={2} cols={5} className="-ml-24 hidden w-[22%] opacity-80 sm:block md:-ml-32" />
            <IceRecord rows={3} cols={10} core className="w-[78%] sm:w-[56%]" />
            <IceRecord rows={2} cols={5} className="-mr-24 hidden w-[22%] opacity-80 sm:block md:-mr-32" />
          </div>
          <div className="mx-auto mt-[4.5rem] max-w-xs md:mt-[5.5rem]">
            <Rotating />
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeUp(0.9)} className="flex items-center justify-between px-5 pb-5 text-xs text-black/55 md:px-8 md:pb-6">
        <p>
          Based in <span className="rounded bg-white px-1.5 py-0.5 font-medium text-black">{site.location}</span>
        </p>
        <a href="#about" className="inline-flex items-center gap-1 transition-colors hover:text-black">
          Scroll down <ChevronDown className="size-3.5" />
        </a>
      </motion.div>
    </section>
  );
}
