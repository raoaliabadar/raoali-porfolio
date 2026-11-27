"use client";

import { useEffect, useRef } from "react";
import { Label, Plus } from "@/components/ui/Label";
import { gsap, MOTION, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { useSplitReveal } from "@/lib/animations/useSplitReveal";
import { sectionNumber } from "@/lib/sections";
import { sections, workflow } from "@/src/content";

const TITLE = sections.find((s) => s.id === "workflow")!.title;

/**
 * [04] Workflow. Ali's seven operations as a blueprint flow diagram. On desktop the section
 * pins and the diagram slides sideways: an accent "bus" line fills as you go, each node lights
 * when its step arrives, and accent dots keep travelling along the connector. Phones get a
 * vertical version of the same diagram.
 */
export function Workflow() {
  const n = sectionNumber("workflow");
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useSplitReveal(title);

  useEffect(() => {
    const el = root.current;
    const t = track.current;
    if (!el || !t) return;
    setupGsap();
    const q = gsap.utils.selector(el);
    const mm = gsap.matchMedia();

    // Horizontal, pinned and scrubbed on every screen size (cards are narrower on phones).
    mm.add(MOTION, () => {
      const distance = () => t.scrollWidth - t.parentElement!.clientWidth;
      const slide = gsap.to(t, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: pin.current,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      // The bus fills with the scroll; nodes and cards activate as they reach the reading line.
      gsap.fromTo(q("[data-bus-fill]"), { scaleX: 0 }, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top top", end: () => `+=${distance()}`, scrub: 1, invalidateOnRefresh: true },
      });
      // Card contents rise in as the section arrives (cards still off to the right are ready when they slide in).
      gsap.from(q("[data-step] [data-rise]"), {
        y: 24,
        autoAlpha: 0,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.03,
        scrollTrigger: { trigger: el, start: "top 55%", once: true },
      });
      q("[data-step]").forEach((step) => {
        ScrollTrigger.create({ trigger: step, containerAnimation: slide, start: "left 70%", toggleClass: { targets: step, className: "is-on" } });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="workflow" ref={root} aria-labelledby="workflow-title" className="relative">
      <div ref={pin} className="relative flex h-svh flex-col overflow-hidden max-lg:justify-center max-lg:pb-6">
        {/* frame */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[var(--gutter)] inset-y-0 border-x border-rule">
          <div className="absolute inset-x-0 top-0 h-px bg-rule" />
          <span className="absolute left-0 top-0"><Plus /></span>
          <span className="absolute right-0 top-0"><Plus className="translate-x-1/2" /></span>
        </div>

        <div className="relative mx-[var(--gutter)] flex flex-col gap-3 px-4 pt-[calc(var(--nav-h)+1.25rem)] sm:px-6 lg:flex-row lg:gap-6 lg:items-end lg:justify-between lg:px-8 lg:pt-[calc(var(--nav-h)+3rem)]">
          <div>
            <Label n={n}>Workflow</Label>
            <h2 id="workflow-title" ref={title} className="font-display mt-3 max-w-[16ch] text-[clamp(1.85rem,7.4vw,4.18rem)] max-lg:[@media(max-height:700px)]:text-[1.6rem] lg:mt-5 font-[700] leading-[0.86] lg:max-w-[20ch] lg:text-[clamp(1.92rem,3.26vw,3.31rem)]">
              {TITLE}
            </h2>
          </div>
          <p className="label hidden max-w-[22rem] leading-[1.6] text-mute sm:block lg:text-right">
            {workflow.steps.length} steps · {workflow.steps[0].title} → {workflow.steps[workflow.steps.length - 1].title}
          </p>
        </div>

        {/* The diagram */}
        <div className="relative mx-[var(--gutter)] mt-8 overflow-hidden lg:my-auto lg:mb-12 lg:mt-auto">
          <ol ref={track} className="relative flex w-max flex-row px-4 sm:px-6 lg:px-8">
            {/* Horizontal bus (desktop) */}
            <span aria-hidden className="absolute left-8 right-8 top-[1.5rem] h-px bg-rule lg:top-[2.1rem]">
              <span data-bus-fill className="absolute inset-0 origin-left bg-signal" />
              <span className="absolute inset-0 overflow-hidden">
                {[0, 1, 2].map((k) => (
                  <span key={k} className="absolute -top-[2px] size-[5px] bg-signal" style={{ animation: `travel 9s linear ${k * 3}s infinite` }} />
                ))}
              </span>
            </span>

            {workflow.steps.map((s, i) => (
              <li key={s.id} data-step className="group relative w-[80vw] max-w-[22rem] shrink-0 pr-5 lg:w-[23rem] lg:max-w-none lg:pr-10 xl:w-[26rem]">
                {/* Node */}
                <div className="mb-3 flex h-12 items-center gap-3 lg:mb-7 lg:h-[4.2rem]">
                  <span className="relative grid size-[11px] place-items-center border border-ink bg-paper transition-colors duration-500 group-[.is-on]:border-signal group-[.is-on]:bg-signal lg:size-[13px]">
                    <span className="size-[3px] bg-ink group-[.is-on]:bg-paper" />
                  </span>
                  <span className="label bg-paper pr-2 text-mute">Step {String(i + 1).padStart(2, "0")}</span>
                </div>

                <article className="rounded-[6px] border border-ink/15 bg-sheet p-4 transition-colors duration-500 group-[.is-on]:border-ink/35 lg:p-6">
                  <div data-rise className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-pixel)] text-2xl leading-none text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="label text-mute">{s.id}</span>
                  </div>
                  <h3 data-rise className="font-display mt-4 text-[1.4rem] font-[700] leading-[0.92] lg:mt-5 lg:text-[1.62rem]">{s.title}</h3>
                  <p data-rise className="mt-2.5 text-[0.9rem] leading-relaxed text-ink/75 lg:mt-3 lg:text-[0.94rem]">{s.text}</p>
                  <ul data-rise className="mt-4 space-y-2 border-t max-lg:[@media(max-height:700px)]:hidden lg:mt-5 border-dashed border-ink/20 pt-4">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[0.88rem] text-ink">
                        <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 shrink-0 text-signal">
                          <path d="M1.5 5.2 4 7.5 8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <ul data-rise className="mt-4 flex flex-wrap gap-1.5 lg:mt-5" aria-label="Tools">
                    {s.tools.map((tool) => (
                      <li key={tool} className="label rounded-[4px] border border-ink/15 px-2 py-1 text-[0.64rem] text-ink/80">
                        {tool}
                      </li>
                    ))}
                  </ul>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
