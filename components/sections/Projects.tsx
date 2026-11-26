"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { projects, sections } from "@/src/content";

const TITLE = sections.find((s) => s.id === "projects")!.title;

/**
 * [07] Projects: bordered rows numbered [0X] with their label and tools. Hovering a row
 * (fine pointers) shows a case-sheet preview that follows the cursor with a clip-path reveal;
 * clicking opens the full case (problem → approach → outcome), wiped open line by line.
 */
export function Projects() {
  const n = sectionNumber("projects");
  const list = useRef<HTMLUListElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  // Rows draw in: rule across, then the row content.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>("[data-proj]").forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } });
        tl.from(row.querySelector("[data-rule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1, ease: "drawer" }).from(
          row.querySelectorAll("[data-rise]"),
          { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.05 },
          0.15,
        );
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Cursor-following preview.
  useEffect(() => {
    const p = preview.current;
    if (!p || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setupGsap();
    const xTo = gsap.quickTo(p, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(p, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 80);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    const p = preview.current;
    if (!p) return;
    setupGsap();
    gsap.to(p, {
      clipPath: hover !== null && open === null ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
      duration: 0.55,
      ease: "power3.out",
    });
  }, [hover, open]);

  // Opening a case: the details wipe down and their lines rise.
  useEffect(() => {
    if (open === null || !list.current) return;
    const d = list.current.querySelector<HTMLElement>(`[data-detail="${open}"]`);
    if (!d || prefersReducedMotion()) return;
    gsap.fromTo(d, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "drawer" });
    gsap.from(d.querySelectorAll("[data-line]"), { y: 16, autoAlpha: 0, duration: 0.7, ease: "expo.out", stagger: 0.05, delay: 0.15 });
  }, [open]);

  const hp = hover !== null ? projects[hover] : null;

  return (
    <Section id="projects" labelledBy="projects-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Projects" id="projects-title" title={TITLE} className="lg:col-span-8" titleClassName="max-w-[13ch]" />
        <p className="label leading-[1.7] text-mute lg:col-span-4 lg:pb-3">
          <span className="text-signal">Client projects</span> = real work · <span className="text-ink">Demonstration</span> = a sample scenario
        </p>
      </div>

      <ul ref={list} className="-mx-4 mt-14 border-b border-rule sm:-mx-6 lg:-mx-8" onPointerLeave={() => setHover(null)}>
        {projects.map((p, i) => {
          const isOpen = open === i;
          return (
            <li key={p.id} data-proj className="relative">
              <span data-rule aria-hidden className="absolute inset-x-0 top-0 h-px bg-rule" />
              <button
                type="button"
                data-cursor={isOpen ? undefined : "view"}
                aria-expanded={isOpen}
                aria-controls={`case-${p.id}`}
                onClick={() => setOpen(isOpen ? null : i)}
                onPointerEnter={() => setHover(i)}
                className="group grid w-full grid-cols-[3.2rem_1fr_auto] items-center gap-3 px-4 py-6 text-left transition-colors duration-300 hover:bg-panel sm:px-6 lg:grid-cols-[5rem_1.4fr_1fr_auto] lg:px-8 lg:py-8"
              >
                <span className="overflow-hidden"><span data-rise className="label block text-signal">[{String(i + 1).padStart(2, "0")}]</span></span>
                <span className="overflow-hidden">
                  <span data-rise className="block">
                    <span className="font-display block text-[clamp(1.9rem,4vw,3.6rem)] font-[800] leading-[0.9] transition-[translate] duration-500 ease-[var(--ease-expo)] group-hover:translate-x-2">
                      {p.title}
                    </span>
                  </span>
                </span>
                <span className="hidden overflow-hidden lg:block">
                  <span data-rise className="flex flex-wrap gap-1.5">
                    <span className={`label rounded-[4px] border px-2 py-1 text-[0.62rem] ${p.label === "Client projects" ? "border-signal text-signal" : "border-ink/25 text-ink/70"}`}>
                      {p.label}
                    </span>
                    {p.tools.map((t) => (
                      <span key={t} className="label rounded-[4px] border border-ink/12 px-2 py-1 text-[0.62rem] text-ink/60">
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span aria-hidden className="grid size-9 place-items-center rounded-[4px] border border-ink/20 transition-colors duration-300 group-hover:border-ink">
                  <svg viewBox="0 0 10 10" className={`size-2.5 transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M5 1v8M1 5h8" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div id={`case-${p.id}`} data-detail={i} className="border-t border-dashed border-ink/20 bg-sheet px-4 pb-10 pt-8 sm:px-6 lg:px-8">
                  <span data-line className={`label inline-block rounded-[4px] border px-2 py-1 text-[0.62rem] lg:hidden ${p.label === "Client projects" ? "border-signal text-signal" : "border-ink/25 text-ink/70"}`}>
                    {p.label}
                  </span>
                  <p data-line className="mt-4 max-w-[46rem] text-[1.15rem] font-medium leading-snug lg:mt-0 lg:pl-[5rem]">{p.summary}</p>
                  <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:pl-[5rem]">
                    <div data-line>
                      <p className="label text-mute">Problem</p>
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{p.problem}</p>
                    </div>
                    <div data-line>
                      <p className="label text-mute">Approach</p>
                      <ol className="mt-3 space-y-2">
                        {p.approach.map((a, k) => (
                          <li key={a} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/80">
                            <span className="font-[family-name:var(--font-pixel)] text-[0.7rem] leading-[1.9] text-signal">{k + 1}</span>
                            {a}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div data-line>
                      <p className="label text-mute">Outcome</p>
                      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">{p.outcome}</p>
                      <ul className="mt-5 flex flex-wrap gap-1.5 lg:hidden" aria-label="Tools">
                        {p.tools.map((t) => (
                          <li key={t} className="label rounded-[4px] border border-ink/12 px-2 py-1 text-[0.62rem] text-ink/60">{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Hover preview: a small case sheet that follows the cursor */}
      <div
        ref={preview}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-40 hidden w-[19rem] rounded-[6px] border border-ink/20 bg-sheet p-4 [clip-path:inset(0_0_100%_0)] lg:block"
      >
        {hp && (
          <>
            <div className="flex items-center justify-between border-b border-dashed border-ink/20 pb-2">
              <span className="label text-signal">Case [{String((hover ?? 0) + 1).padStart(2, "0")}]</span>
              <span className="label text-[0.62rem] text-mute">{hp.label}</span>
            </div>
            <p className="mt-3 text-[0.9rem] leading-snug text-ink">{hp.summary}</p>
            <p className="label mt-4 text-[0.62rem] text-mute">Click to open the case</p>
          </>
        )}
      </div>
    </Section>
  );
}
