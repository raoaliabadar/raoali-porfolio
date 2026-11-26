"use client";

import { useEffect, useRef } from "react";
import { Label, Plus } from "@/components/ui/Label";
import { DESKTOP, gsap, MOBILE, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
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

    mm.add(DESKTOP, () => {
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

    mm.add(MOBILE, () => {
      gsap.fromTo(q("[data-bus-fill-v]"), { scaleY: 0 }, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: t, start: "top 70%", end: "bottom 70%", scrub: true },
      });
      q("[data-step]").forEach((step) => {
        gsap.from(step.querySelectorAll("[data-rise]"), {
          y: 20,
          autoAlpha: 0,
          duration: 0.8,
          ease: "expo.out",
          stagger: 0.05,
          scrollTrigger: { trigger: step, start: "top 85%", once: true },
        });
        ScrollTrigger.create({ trigger: step, start: "top 70%", toggleClass: { targets: step, className: "is-on" } });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <section id="workflow" ref={root} aria-labelledby="workflow-title" className="relative">
      <div ref={pin} className="relative overflow-hidden lg:flex lg:h-svh lg:flex-col">
        {/* frame */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[var(--gutter)] inset-y-0 border-x border-rule">
          <div className="absolute inset-x-0 top-0 h-px bg-rule" />
          <span className="absolute left-0 top-0"><Plus /></span>
          <span className="absolute right-0 top-0"><Plus className="translate-x-1/2" /></span>
        </div>

        <div className="relative mx-[var(--gutter)] flex flex-col gap-6 px-4 pt-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:pt-[calc(var(--nav-h)+3rem)]">
          <div>
            <Label n={n}>Workflow</Label>
            <h2 id="workflow-title" ref={title} className="font-display mt-5 max-w-[12ch] text-[clamp(2.9rem,6.4vw,5.8rem)] font-[800] leading-[0.86] lg:max-w-[20ch] lg:text-[clamp(2.6rem,4.4vw,4.6rem)]">
              {TITLE}
            </h2>
          </div>
          <p className="label max-w-[22rem] leading-[1.6] text-mute lg:text-right">
            {workflow.steps.length} steps · {workflow.steps[0].title} → {workflow.steps[workflow.steps.length - 1].title}
          </p>
        </div>

        {/* The diagram */}
        <div className="relative mx-[var(--gutter)] mt-12 overflow-visible lg:mb-12 lg:mt-auto lg:overflow-hidden">
          <ol ref={track} className="relative flex flex-col gap-0 px-4 sm:px-6 lg:w-max lg:flex-row lg:gap-0 lg:px-8">
            {/* Horizontal bus (desktop) */}
            <span aria-hidden className="absolute left-8 right-8 top-[2.1rem] hidden h-px bg-rule lg:block">
              <span data-bus-fill className="absolute inset-0 origin-left bg-signal" />
              <span className="absolute inset-0 overflow-hidden">
                {[0, 1, 2].map((k) => (
                  <span key={k} className="absolute -top-[2px] size-[5px] bg-signal" style={{ animation: `travel 9s linear ${k * 3}s infinite` }} />
                ))}
              </span>
            </span>
            {/* Vertical bus (phones) */}
            <span aria-hidden className="absolute bottom-10 left-[calc(1rem+5px)] top-2 w-px bg-rule sm:left-[calc(1.5rem+5px)] lg:hidden">
              <span data-bus-fill-v className="absolute inset-0 origin-top bg-signal" />
            </span>

            {workflow.steps.map((s, i) => (
              <li key={s.id} data-step className="group relative pb-12 pl-9 lg:w-[23rem] lg:shrink-0 lg:pb-0 lg:pl-0 lg:pr-10 xl:w-[26rem]">
                {/* Node */}
                <div className="absolute left-0 top-1 flex items-center gap-3 lg:static lg:mb-7 lg:h-[4.2rem]">
                  <span className="relative grid size-[11px] place-items-center border border-ink bg-paper transition-colors duration-500 group-[.is-on]:border-signal group-[.is-on]:bg-signal lg:size-[13px]">
                    <span className="size-[3px] bg-ink group-[.is-on]:bg-paper" />
                  </span>
                  <span className="label hidden text-mute lg:inline">Step {String(i + 1).padStart(2, "0")}</span>
                </div>

                <article className="rounded-[6px] border border-ink/15 bg-sheet p-5 transition-colors duration-500 group-[.is-on]:border-ink/35 lg:p-6">
                  <div data-rise className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-pixel)] text-2xl leading-none text-signal">{String(i + 1).padStart(2, "0")}</span>
                    <span className="label text-mute">{s.id}</span>
                  </div>
                  <h3 data-rise className="font-display mt-5 text-[1.9rem] font-[780] leading-[0.92]">{s.title}</h3>
                  <p data-rise className="mt-3 text-[0.94rem] leading-relaxed text-ink/75">{s.text}</p>
                  <ul data-rise className="mt-5 space-y-2 border-t border-dashed border-ink/20 pt-4">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-[0.88rem] text-ink">
                        <svg aria-hidden viewBox="0 0 10 10" className="size-2.5 shrink-0 text-signal">
                          <path d="M1.5 5.2 4 7.5 8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                  <ul data-rise className="mt-5 flex flex-wrap gap-1.5" aria-label="Tools">
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
