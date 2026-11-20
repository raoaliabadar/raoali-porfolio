"use client";

import { PinnedSection } from "@/components/ui/Pinned";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Projects() {
  const [active, setActive] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Floating preview that follows the cursor (desktop only).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 160, damping: 22, mass: 0.6 });
  const py = useSpring(my, { stiffness: 160, damping: 22, mass: 0.6 });

  const onMove = (e: React.PointerEvent) => {
    if (!listRef.current) return;
    const b = listRef.current.getBoundingClientRect();
    mx.set(e.clientX - b.left);
    my.set(e.clientY - b.top);
  };

  return (
    <PinnedSection id="work" className="container-x py-24 md:py-36">
      <SectionHeading
        label="Case studies"
        title="How I *approach* the work."
        aside={<p className="max-w-md text-fg/60">Practical scenarios showing how I handle billing, CRM data and operations. “Client projects” reflects my real work; items marked “Demonstration” use sample data.</p>}
      />

      <div ref={listRef} onPointerMove={onMove} onPointerLeave={() => setHovered(null)} className="relative">
        <ul className="border-t border-line">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06} className="border-b border-line">
              <button
                type="button"
                onClick={() => setActive(p)}
                onPointerEnter={() => setHovered(i)}
                onFocus={() => setHovered(i)}
                aria-haspopup="dialog"
                className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 py-7 text-left md:grid-cols-[1fr_13rem_9rem_3rem] md:py-10"
              >
                <span
                  className={`font-display text-3xl font-light tracking-[-0.04em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-5xl ${
                    hovered !== null && hovered !== i ? "md:text-fg/25" : "text-fg"
                  } md:group-hover:translate-x-4`}
                >
                  {p.title}
                </span>
                <span className="hidden text-sm text-muted md:block">{p.category}</span>
                <span className="label hidden md:block">{p.label}</span>
                <span className="grid size-11 place-items-center justify-self-end rounded-full border border-line transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-white">
                  <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
                </span>
                {/* Mobile: inline cover */}
                <span className="relative col-span-2 mt-2 block aspect-[16/10] overflow-hidden rounded-2xl md:hidden">
                  <Cover project={p} index={i} />
                </span>
              </button>
            </Reveal>
          ))}
        </ul>

        {/* Desktop floating preview */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-10 hidden md:block"
          style={{ x: reduce ? undefined : px, y: reduce ? undefined : py }}
        >
          <motion.div
            className="-translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={{ opacity: hovered === null ? 0 : 1 }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="relative h-[15rem] w-[22rem] overflow-hidden rounded-2xl border border-line shadow-soft">
              {projects.map((p, i) => (
                <motion.div
                  key={p.title}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ y: hovered === i ? "0%" : hovered !== null && i < hovered ? "-100%" : "100%" }}
                  transition={{ duration: 0.6, ease }}
                >
                  <Cover project={p} index={i} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>{active && <ProjectModal project={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </PinnedSection>
  );
}

function Cover({ project, index, large }: { project: Project; index: number; large?: boolean }) {
  const [a, b] = project.cover;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        {project.image ? (
          <Image
            src={project.image}
            alt=""
            fill
            sizes={large ? "(min-width: 768px) 60vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(110% 90% at 15% 10%, ${a}33, transparent 60%), radial-gradient(90% 90% at 95% 100%, #fe4f0222, transparent 60%), #f6f2ee`,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/0.04)_1px,transparent_1px)] bg-[size:48px_100%] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
          </div>
        )}
      </div>
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
      <div className="absolute inset-0 bg-[#f4f1ee]/80 backdrop-blur-md" onClick={onClose} aria-hidden />
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
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-line bg-white/90 text-fg backdrop-blur transition-colors hover:bg-fg hover:text-white"
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
          <h3 id="project-title" className="font-display text-4xl font-light leading-tight tracking-[-0.04em] md:text-5xl">
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
