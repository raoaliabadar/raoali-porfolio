"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { hero, site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { LocalClock } from "@/components/ui/LocalClock";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { RichText } from "@/components/ui/RichText";

// 3D desk scene — client-only and loaded lazily so it never blocks the first paint.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), {
  ssr: false,
  loading: () => <div className="mx-auto aspect-[4/3.2] w-full max-w-5xl sm:aspect-[16/10]" />,
});

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease, delay },
});

/* ───────── Section ───────── */

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      {/* Grid + warm glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_30%,#000_30%,transparent_80%)]" />
        <div className="animate-float-slow absolute left-1/2 top-[30%] h-[50%] w-[60%] -translate-x-1/2 rounded-full bg-glow/50 blur-[140px]" />
      </div>

      <div className="container-x text-center">
        <motion.div {...fadeUp(0.1)} className="flex justify-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-medium text-fg/80 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            {hero.badge}
          </p>
        </motion.div>

        <motion.h1
          {...fadeUp(0.2)}
          className="mx-auto mt-7 max-w-4xl font-display text-[clamp(2.6rem,7vw,5.6rem)] font-light leading-[1.02] tracking-[-0.045em]"
        >
          <span className="sr-only">{site.name} — </span>
          <RichText text={hero.headline} />
        </motion.h1>

        <motion.p {...fadeUp(0.32)} className="mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-fg/65 md:text-lg">
          {hero.tagline}
        </motion.p>

        <motion.div {...fadeUp(0.44)} className="mt-9 flex flex-wrap justify-center gap-3">
          <MagneticButton
            href="#contact"
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(254_79_2/0.6)] transition-colors hover:bg-cyan"
          >
            Get in touch
            <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
          </MagneticButton>
          <a
            href="#work"
            className="inline-flex items-center rounded-full border border-line bg-surface px-6 py-3.5 text-sm font-medium transition-colors hover:border-fg/30"
          >
            View case studies
          </a>
        </motion.div>

        <motion.ul
          {...fadeUp(0.56)}
          className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted"
        >
          {hero.meta.map((m) => (
            <li key={m.label}>
              <span className="text-fg">{m.label}</span> · {m.value}
            </li>
          ))}
          <li>
            <span className="text-fg">Local</span> · <LocalClock timezone={site.timezone} />
          </li>
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease, delay: 0.7 }}
          className="mt-16 md:mt-20"
        >
          <DeskScene className="mx-auto aspect-[4/3.2] w-full max-w-5xl sm:aspect-[16/10]" />
        </motion.div>
      </div>
    </section>
  );
}
