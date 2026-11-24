"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { hero, site } from "@/lib/content";
import { MotionPauseButton } from "@/components/ui/MotionPauseButton";
import { ease } from "@/lib/motion";
import { LocalClock } from "@/components/ui/LocalClock";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Heading3D } from "@/components/ui/Heading3D";

// 3D "Ledger Orrery" around the headline: client-only, loaded lazily so it never blocks the first paint.
const LedgerOrrery = dynamic(() => import("@/components/three/LedgerOrrery"), { ssr: false });

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease, delay },
});

/**
 * Mount the 3D scene only once the page has loaded and the browser is idle,
 * so the hero copy (the LCP element) paints without competing with three.js.
 */
function useSceneWhenIdle() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => {
      if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(() => setShow(true), { timeout: 2500 });
      else timer = setTimeout(() => setShow(true), 1200);
    };
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      window.removeEventListener("load", start);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, []);
  return show;
}

export function Hero() {
  const showScene = useSceneWhenIdle();
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pb-20 pt-32 md:pb-24 md:pt-36">
      {/* Brass armillary sphere encircling the headline (decorative) */}
      {showScene && <LedgerOrrery anchorId="hero-heading" />}

      {/* Ledger-paper grid: the accounting motif behind the headline (see DESIGN.md) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_30%,#000_30%,transparent_80%)]" />
      </div>

      <div className="container-x relative z-10 text-center">
        <h1
          id="hero-heading"
          className="mx-auto max-w-4xl font-display text-[clamp(2.6rem,7vw,5.6rem)] font-light leading-[1.02] tracking-[-0.045em]"
        >
          <Heading3D text={hero.headline} srPrefix={`${site.name}, `} />
        </h1>

        <motion.p {...fadeUp(0.32)} className="mx-auto mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-fg/65 md:text-lg">
          {hero.tagline}
        </motion.p>

        <motion.div {...fadeUp(0.44)} className="mt-9 flex flex-wrap justify-center gap-3">
          <MagneticButton
            href="#contact"
            className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(201_58_0/0.6)] transition-colors hover:bg-accent-strong-hover"
          >
            Get in touch
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
          {/* Availability is a real status, so its dot stays (static, no pulse) */}
          <li className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full bg-emerald-600" />
            <span className="text-fg">Status</span> · {hero.badge}
          </li>
          {hero.meta.map((m) => (
            <li key={m.label}>
              <span className="text-fg">{m.label}</span> · {m.value}
            </li>
          ))}
          <li>
            <span className="text-fg">Local</span> · <LocalClock timezone={site.timezone} />
          </li>
        </motion.ul>
      </div>

      {/* Bottom-left: the bottom-right corner belongs to the chat launcher */}
      {showScene && <MotionPauseButton className="absolute bottom-6 left-4 z-10 sm:left-6" />}
    </section>
  );
}
