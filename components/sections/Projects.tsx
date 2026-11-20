"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";

export function Projects() {
  const [active, setActive] = useState<Project | null>(null);
  return (
    <section id="work" className="panel bg-mission py-20 md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Left: heading + glass visual */}
        <div className="lg:col-span-5">
          <Reveal>
            <h2 className="text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[0.98] tracking-[-0.05em]">
              How I approach
              <br />
              the work
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="mt-6 max-w-sm text-white/75">
              Practical scenarios showing how I handle billing, CRM data and operations. “Client projects” reflects my real work;
              items marked “Demonstration” use sample data.
            </p>
          </Reveal>
          <Reveal delay={0.14} className="mt-12 hidden lg:block">
            <div className="glass-ice relative w-[85%] rounded-[18px] p-3">
              <div className="grid grid-cols-6 gap-1.5">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} className="h-4 rounded-[4px] border border-white/60 bg-white/35" />
                ))}
              </div>
              <span aria-hidden className="plasma absolute left-[55%] top-1/2 size-12 -translate-y-1/2 rounded-full" />
            </div>
          </Reveal>
        </div>

        {/* Right: list of case studies */}
        <ul className="lg:col-span-7">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.05} className="border-b border-white/15 first:border-t">
              <button
                type="button"
                onClick={() => setActive(p)}
                aria-haspopup="dialog"
                className="group flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span>
                  <span className="block text-xs font-medium uppercase tracking-[0.14em] text-white/60">{p.label}</span>
                  <span className="mt-1.5 block text-lg font-medium tracking-[-0.02em] md:text-xl">{p.title}</span>
                  <span className="mt-1 block max-w-md text-sm leading-relaxed text-white/70">{p.description}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-white/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <AnimatePresence>{active && <ProjectModal project={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </section>
  );
}

function Cover({ project, large }: { project: Project; index?: number; large?: boolean }) {
  const [a] = project.cover;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {project.image ? (
        <Image
          src={project.image}
          alt=""
          fill
          sizes={large ? "(min-width: 768px) 60vw, 100vw" : "100vw"}
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(90% 80% at 50% 110%, ${a}aa, transparent 60%), radial-gradient(60% 60% at 50% 60%, rgb(255 106 26 / 0.35), transparent 70%), linear-gradient(180deg, #000 0%, #0b1430 55%, #2a4382 100%)`,
          }}
        >
          <span aria-hidden className="plasma absolute left-1/2 top-[58%] size-14 -translate-x-1/2 -translate-y-1/2 rounded-full" />
        </div>
      )}
    </div>
  );
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // Simple focus trap
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("a[href], button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const idx = projects.indexOf(project);

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center p-0 md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} aria-hidden />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.6, ease }}
        className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-line bg-surface shadow-soft md:rounded-[28px]"
      >
        <div className="group relative aspect-[16/8]">
          <Cover project={project} index={idx} large />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur transition-colors hover:bg-white hover:text-black"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <p className="label">{project.category}</p>
            <span className="rounded-full border border-accent/40 px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-accent">
              {project.label}
            </span>
          </div>
          <h3 id="project-title" className="text-4xl font-medium leading-tight tracking-[-0.045em] md:text-5xl">
            {project.title}
          </h3>
          <p className="mt-4 text-lg text-fg/80">{project.description}</p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div>
              <p className="label mb-2 text-accent">The scenario</p>
              <p className="text-fg/80">{project.problem}</p>
            </div>
            <div>
              <p className="label mb-2 text-cyan">My approach</p>
              <p className="text-fg/80">{project.solution}</p>
            </div>
            <div>
              <p className="label mb-2 text-fg">What it demonstrates</p>
              <p className="text-fg/80">{project.outcome}</p>
            </div>
          </div>

          {project.sample && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-line">
              <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
                <p className="label">Sample data</p>
                <p className="text-[0.68rem] uppercase tracking-[0.1em] text-muted">For demonstration only</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[24rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {project.sample.columns.map((c) => (
                        <th key={c} className="label px-4 py-3 font-normal">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {project.sample.rows.map((r, i) => (
                      <tr key={i} className="border-b border-line/60 last:border-0">
                        {r.map((cell, j) => (
                          <td key={j} className="px-4 py-3 tabular-nums text-fg/80">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-10">
            <p className="label mb-3">Skills applied</p>
            <ul className="flex flex-wrap gap-2">
              {project.skills.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 text-xs text-fg/80">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
