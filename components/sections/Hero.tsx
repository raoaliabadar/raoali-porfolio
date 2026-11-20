"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { LocalClock } from "@/components/ui/LocalClock";
import { MagneticButton } from "@/components/ui/MagneticButton";

/** Splits the headline into words, keeping *italic* markers per word. */
function useHeadlineWords(text: string) {
  const words: { word: string; em: boolean }[] = [];
  text.split(/(\*[^*]+\*)/g).forEach((chunk) => {
    const em = chunk.startsWith("*") && chunk.endsWith("*");
    const clean = em ? chunk.slice(1, -1) : chunk;
    clean
      .split(" ")
      .filter(Boolean)
      .forEach((w) => words.push({ word: w, em }));
  });
  return words;
}

export function Hero() {
  const words = useHeadlineWords(site.headline);
  const base = 0.25;

  return (
    <section id="top" className="relative flex min-h-svh flex-col justify-end overflow-hidden pb-14 pt-32 md:pb-20">
      {/* Floating ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float absolute -right-[10%] top-[8%] size-[42rem] rounded-full bg-accent/20 blur-[140px] max-md:size-[24rem]" />
        <div
          className="animate-float absolute -left-[15%] bottom-[-20%] size-[34rem] rounded-full bg-[#7a3b12]/30 blur-[120px]"
          style={{ animationDelay: "-6s" }}
        />
        {/* Faint editorial grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.035)_1px,transparent_1px)] bg-[size:calc(100%/6)_100%] [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]" />
      </div>

      {/* Orbit visual */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease, delay: 0.6 }}
        className="pointer-events-none absolute right-[6%] top-[18%] hidden size-72 lg:block xl:size-80"
      >
        <div className="absolute inset-0 rounded-full border border-line" />
        <div className="absolute inset-10 rounded-full border border-line/70" />
        <div className="absolute inset-[34%] rounded-full bg-gradient-to-br from-accent/80 to-[#7a3b12] blur-[2px]" />
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent shadow-[0_0_16px_4px_rgb(232_165_75/0.5)]" />
        </motion.div>
        <motion.div
          className="absolute inset-10"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
          <span className="absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-fg/70" />
        </motion.div>
      </motion.div>

      <div className="container-x">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/60 px-3.5 py-1.5 text-xs text-muted backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          {site.availability}
        </motion.p>

        <h1 className="max-w-[14ch] font-serif text-[clamp(3.2rem,9.5vw,9rem)] leading-[0.92] tracking-[-0.02em]">
          <span className="sr-only">{site.name} — </span>
          {words.map(({ word, em }, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span
                className={`inline-block ${em ? "italic text-accent" : ""}`}
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, ease, delay: base + i * 0.07 }}
              >
                {word}
                {i < words.length - 1 && " "}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: base + words.length * 0.07 + 0.1 }}
            className="md:col-span-6 lg:col-span-5"
          >
            <p className="label mb-4">
              {site.name} <span className="text-accent">/</span> {site.title}
            </p>
            <p className="text-lg leading-relaxed text-fg/80">{site.intro}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                href="#work"
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-accent"
              >
                View my work
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </MagneticButton>
              <a
                href="#contact"
                className="inline-flex items-center rounded-full border border-line px-6 py-3.5 text-sm transition-colors hover:border-fg/40"
              >
                Get in touch
              </a>
            </div>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: base + words.length * 0.07 + 0.3 }}
            className="grid grid-cols-2 gap-6 border-t border-line pt-6 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9"
          >
            <div>
              <dt className="label mb-1.5">Based in</dt>
              <dd className="text-sm">{site.location}</dd>
            </div>
            <div>
              <dt className="label mb-1.5">Local time</dt>
              <dd className="text-sm">
                <LocalClock timezone={site.timezone} />
              </dd>
            </div>
          </motion.dl>
        </div>
      </div>

      <motion.a
        href="#about"
        aria-label="Scroll to About section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-muted transition-colors hover:text-fg md:flex"
      >
        <span className="label text-[0.65rem]">Scroll</span>
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown className="size-4" />
        </motion.span>
      </motion.a>
    </section>
  );
}
