"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { hero, site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { LocalClock } from "@/components/ui/LocalClock";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { RichText } from "@/components/ui/RichText";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, ease, delay },
});

/* ───────── Illustrative product-style dashboard (sample data) ───────── */

const pipeline = [
  { step: "New client", done: true },
  { step: "Record verified", done: true },
  { step: "Invoice sent", done: true },
  { step: "Payment follow-up", done: false, active: true },
  { step: "Reconciled", done: false },
];

const activity = [
  { text: "Workflow: welcome email sent", tag: "Automated" },
  { text: "INV-1043 marked overdue", tag: "Billing" },
  { text: "Duplicate contact merged", tag: "CRM" },
];

function DashboardMock() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Window */}
      <div className="shadow-soft overflow-hidden rounded-[28px] border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#e8e2dc]" />
            <span className="size-2.5 rounded-full bg-[#e8e2dc]" />
            <span className="size-2.5 rounded-full bg-[#e8e2dc]" />
          </div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">Operations overview</p>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-muted">
            Illustration
          </span>
        </div>

        <div className="grid gap-4 bg-[#fbf8f4] p-4 md:grid-cols-12 md:p-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 md:col-span-12">
            {[
              ["Billed this month", "19,250"],
              ["Collected", "18,100"],
              ["Open follow-ups", "6"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-line bg-surface p-4 text-left">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted md:text-[0.68rem]">{k}</p>
                <p className="mt-2 font-display text-xl font-light tabular-nums tracking-[-0.02em] md:text-3xl">{v}</p>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div className="rounded-2xl border border-line bg-surface p-5 text-left md:col-span-7">
            <p className="text-sm font-medium">Client workflow</p>
            <ol className="mt-4 space-y-2.5">
              {pipeline.map((p, i) => (
                <motion.li
                  key={p.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, ease, delay: 1 + i * 0.12 }}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    p.active ? "border-accent/40 bg-[#fff6f1]" : "border-line"
                  }`}
                >
                  <span
                    className={`grid size-5 shrink-0 place-items-center rounded-full ${
                      p.done ? "bg-fg text-ink" : p.active ? "bg-accent text-white" : "border border-line"
                    }`}
                  >
                    {p.done && <Check className="size-3" strokeWidth={3} />}
                    {p.active && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
                  </span>
                  <span className={p.done ? "text-fg/60" : "text-fg"}>{p.step}</span>
                  {p.active && <span className="ml-auto text-xs font-medium text-accent">In progress</span>}
                </motion.li>
              ))}
            </ol>
          </div>

          {/* Activity */}
          <div className="rounded-2xl border border-line bg-surface p-5 text-left md:col-span-5">
            <p className="text-sm font-medium">Recent activity</p>
            <ul className="mt-4 space-y-3">
              {activity.map((a, i) => (
                <motion.li
                  key={a.text}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease, delay: 1.3 + i * 0.12 }}
                  className="flex items-start justify-between gap-3 border-b border-line pb-3 text-sm last:border-0 last:pb-0"
                >
                  <span className="text-fg/80">{a.text}</span>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[0.65rem] font-medium text-muted">
                    {a.tag}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Floating chip */}
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease, delay: 1.7 }}
        className="shadow-soft absolute -bottom-5 -left-3 hidden items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm md:flex"
      >
        <span className="size-2 rounded-full bg-emerald-500" />
        Data verified
      </motion.div>
    </div>
  );
}

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
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
