"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projects, type Project } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Projects() {
  const [active, setActive] = useState<Project | null>(null);
  const featured = projects.find((p) => p.featured) ?? projects[0];
  const rest = projects.filter((p) => p !== featured);

  return (
    <section id="work" className="container-x py-24 md:py-36">
      <SectionHeading
        index="04"
        label="Selected Work"
        title="Projects I'm *proud* of."
        aside={<p className="label">{String(projects.length).padStart(2, "0")} projects</p>}
      />

      <Reveal>
        <ProjectCard project={featured} index={0} featured onOpen={() => setActive(featured)} />
      </Reveal>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((p, i) => (
          <Reveal key={p.title} delay={i * 0.08}>
            <ProjectCard project={p} index={i + 1} onOpen={() => setActive(p)} />
          </Reveal>
        ))}
      </div>

      <AnimatePresence>{active && <ProjectModal project={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </section>
  );
}

function Cover({ project, index, large }: { project: Project; index: number; large?: boolean }) {
  const [a, b] = project.cover;
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
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
              background: `radial-gradient(120% 90% at 20% 10%, ${a}cc, transparent 55%), radial-gradient(90% 90% at 90% 100%, ${b}, transparent 60%), #111`,
            }}
          >
            <span className="absolute -bottom-[0.18em] right-4 font-serif text-[10rem] italic leading-none text-white/10 md:text-[14rem]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:48px_100%] [mask-image:linear-gradient(to_bottom,#000,transparent)]" />
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  featured,
  onOpen,
}: {
  project: Project;
  index: number;
  featured?: boolean;
  onOpen: () => void;
}) {
  return (
    <article
      className={`group relative w-full overflow-hidden rounded-3xl border border-line bg-surface transition-colors duration-500 hover:border-fg/20 ${
        featured ? "flex flex-col md:grid md:grid-cols-5" : "flex h-full flex-col"
      }`}
    >
      <div className={`relative ${featured ? "aspect-[16/10] md:col-span-3 md:aspect-auto md:min-h-[26rem]" : "aspect-[4/3]"}`}>
        <Cover project={project} index={index} large={featured} />
        <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/30 px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-white/80 backdrop-blur">
          {featured ? "Featured · " : ""}
          {project.category}
        </span>
      </div>

      <div className={`flex flex-1 flex-col justify-between gap-6 p-6 md:p-8 ${featured ? "md:col-span-2" : ""}`}>
        <div>
          <p className="label mb-3">{project.year}</p>
          <h3 className={`font-serif leading-tight ${featured ? "text-4xl md:text-5xl" : "text-3xl"}`}>{project.title}</h3>
          <p className="mt-3 text-muted">{project.description}</p>
        </div>
        <div className="flex items-end justify-between gap-4">
          <ul className="flex flex-wrap gap-1.5">
            {project.stack.slice(0, featured ? 5 : 3).map((s) => (
              <li key={s} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[0.7rem] text-muted">
                {s}
              </li>
            ))}
          </ul>
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line transition-all duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
          </span>
        </div>
      </div>
      {/* Full-card click target (keeps valid HTML: no headings inside a button) */}
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-label={`Open case study: ${project.title}`}
        className="absolute inset-0 z-10 rounded-3xl"
      />
    </article>
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
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-md" onClick={onClose} aria-hidden />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.6, ease }}
        className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-line bg-surface md:rounded-3xl"
      >
        <div className="group relative aspect-[16/8]">
          <Cover project={project} index={idx} large />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition-colors hover:bg-white hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 md:p-10">
          <p className="label mb-3">
            {project.category} · {project.year}
          </p>
          <h3 id="project-title" className="font-serif text-4xl leading-tight md:text-5xl">
            {project.title}
          </h3>
          <p className="mt-4 text-lg text-fg/80">{project.description}</p>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <p className="label mb-2 text-accent">The problem</p>
              <p className="text-fg/80">{project.problem}</p>
            </div>
            <div>
              <p className="label mb-2 text-accent">What I built</p>
              <p className="text-fg/80">{project.solution}</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="label mb-3">Stack</p>
            <ul className="flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-fg/80">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {(project.links.live || project.links.code) && (
            <div className="mt-10 flex flex-wrap gap-3">
              {project.links.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full bg-fg px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent"
                >
                  Live site <ArrowUpRight className="size-4 transition-transform group-hover:rotate-45" />
                </a>
              )}
              {project.links.code && (
                <a
                  href={project.links.code}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm transition-colors hover:border-fg/40"
                >
                  Source code
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
