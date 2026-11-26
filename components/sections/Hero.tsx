"use client";

import { useEffect, useRef } from "react";
import { WorkspaceDrawing } from "@/components/blueprint/WorkspaceDrawing";
import { ANCHORS, SCREEN_BOX, SCREEN_CENTER, toUnit } from "@/components/blueprint/workspace";
import { Label, Plus } from "@/components/ui/Label";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { DESKTOP, gsap, MOBILE, REDUCED, setupGsap } from "@/lib/animations/gsap";
import { onLoaded } from "@/lib/animations/loader";
import { createPixelator } from "@/lib/animations/pixelate";
import { useSplitReveal } from "@/lib/animations/useSplitReveal";
import { hero } from "@/src/content";

/**
 * Where each callout card sits: offset from its anchor (fractions of the drawing) and which
 * edge of the card the connector meets.
 */
const CARD_OFFSET: Record<string, { at: [number, number]; align: "left" | "right" }> = {
  monitor: { at: [-0.2, -0.14], align: "right" },
  books: { at: [0.2, -0.33], align: "right" },
  documents: { at: [0.04, 0.17], align: "left" },
  lamp: { at: [-0.12, 0.2], align: "right" },
};

const STAGES = ["Line", "Shade", "Render"] as const;

/**
 * [01] Hero. Pinned for ~200vh on desktop: the workspace starts as line art, shades in like a
 * pencil render, resolves from pixels into the clean finish, then the camera moves into the
 * monitor. Phones get the same stages on a timer, without the pin.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const drawing = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const textCol = useRef<HTMLDivElement>(null);

  useSplitReveal(name, { onLoad: true, stagger: 0.1, delay: 0.05 });

  useEffect(() => {
    const el = root.current;
    const d = drawing.current;
    if (!el || !d) return;
    setupGsap();

    const q = gsap.utils.selector(el);
    const cam = camera.current!;
    const lineSvg = d.querySelector<SVGSVGElement>("[data-layer=lines]")!;
    const lines = d.querySelectorAll<SVGPathElement>("[data-draw]");
    const fills = d.querySelectorAll<SVGPathElement>("[data-fill]");
    const hatch = d.querySelectorAll<SVGPathElement>("[data-hatch]");
    const colorSvg = d.querySelector<SVGSVGElement>("[data-layer=color]")!;
    const canvas = d.querySelector<HTMLCanvasElement>("[data-layer=pixel]")!;
    const pix = createPixelator(colorSvg, canvas);
    const ticks = q("[data-stage]");
    const setStage = (i: number) => ticks.forEach((t, k) => t.toggleAttribute("data-on", k <= i));

    const ro = new ResizeObserver(() => pix.resize());
    ro.observe(canvas);

    /* Camera: scale the screen up to cover the viewport and slide it to the centre. */
    const camLayout = () => {
      let x = 0;
      let y = 0;
      let n: HTMLElement | null = cam;
      while (n && n !== stage.current) {
        x += n.offsetLeft;
        y += n.offsetTop;
        n = n.offsetParent as HTMLElement | null;
      }
      return { x, y, w: cam.offsetWidth, h: cam.offsetHeight };
    };
    const zoomScale = () => {
      const { w, h } = camLayout();
      const sw = (SCREEN_BOX.x1 - SCREEN_BOX.x0) * w;
      const sh = (SCREEN_BOX.y1 - SCREEN_BOX.y0) * h;
      return Math.max(innerWidth / sw, innerHeight / sh) * 1.08;
    };
    const zoomX = () => {
      const { x, w } = camLayout();
      return stage.current!.offsetWidth / 2 - (x + SCREEN_CENTER[0] * w);
    };
    const zoomY = () => {
      const { y, h } = camLayout();
      return stage.current!.offsetHeight / 2 - (y + SCREEN_CENTER[1] * h);
    };

    const intro = () => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.to(lines, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: "power2.inOut",
        stagger: { each: 0.01 },
        onComplete: () => gsap.set(lines, { strokeDasharray: "none" }),
      }, 0)
        // Once drawn, faces fill with paper so nearer objects hide the lines behind them.
        .to(fills, { fillOpacity: 1, duration: 0.6, ease: "power2.out" }, 1.75)
        .from(q("[data-intro]"), { y: 18, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.25)
        .from(q("[data-frame]"), { scaleY: 0, duration: 1.4, ease: "drawer", stagger: 0.06 }, 0)
        .from(q("[data-frame-x]"), { scaleX: 0, duration: 1.4, ease: "drawer" }, 0.1)
        .from(q("[data-plus]"), { scale: 0, autoAlpha: 0, duration: 0.6, stagger: 0.04 }, 0.4);
      // Connectors grow out of their anchor dot towards the card.
      q("[data-connector]").forEach((ln, i) => {
        tl.from(ln, { attr: { x2: Number(ln.getAttribute("x1")), y2: Number(ln.getAttribute("y1")) }, duration: 0.8, ease: "power2.out" }, 1.9 + i * 0.12);
      });
      tl.from(q("[data-anchor]"), { scale: 0, duration: 0.5, ease: "back.out(3)", stagger: 0.12 }, 1.9)
        .from(q("[data-card]"), { clipPath: "inset(0 100% 0 0)", duration: 0.7, ease: "power3.out", stagger: 0.12 }, 2.2);
      return tl;
    };

    const mm = gsap.matchMedia();
    let offLoad = () => {};

    // Desktop: pinned, scroll-scrubbed render.
    mm.add(DESKTOP, () => {
      offLoad = onLoaded(() => intro());
      const p = { cell: 40 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=200%",
          pin: stage.current,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            setStage(self.progress < 0.1 ? 0 : self.progress < 0.34 ? 1 : 2);
          },
        },
      });
      tl.to(hatch, { opacity: 1, duration: 0.24, stagger: { each: 0.004, from: "random" } }, 0.02)
        .to(q("[data-annot]"), { autoAlpha: 0, duration: 0.08 }, 0.4)
        .set(canvas, { opacity: 1 }, 0.34)
        .fromTo(p, { cell: 40 }, { cell: 1, duration: 0.24, ease: "power2.in", onUpdate: () => pix.draw(p.cell) }, 0.34)
        .to(lineSvg, { opacity: 0, duration: 0.1 }, 0.34)
        .set(colorSvg, { opacity: 1 }, 0.58)
        .set(canvas, { opacity: 0 }, 0.585)
        .to(textCol.current, { xPercent: -18, autoAlpha: 0, duration: 0.16, ease: "power2.in" }, 0.6)
        .to(q("[data-chrome]"), { autoAlpha: 0, duration: 0.1 }, 0.6)
        .to(cam, { scale: zoomScale, x: zoomX, y: zoomY, force3D: false, duration: 0.34, ease: "power2.inOut" }, 0.62)
        .to(cam, { autoAlpha: 0, duration: 0.05 }, 0.95);
      return () => setStage(0);
    });

    // Phones / tablets: no pin; the same three stages on a timer.
    mm.add(MOBILE, () => {
      offLoad = onLoaded(() => {
        const p = { cell: 28 };
        intro()
          .add(() => setStage(1), 2.3)
          .to(hatch, { opacity: 1, duration: 0.9, stagger: { each: 0.006, from: "random" } }, 2.3)
          .add(() => setStage(2), 3.5)
          .set(canvas, { opacity: 1 }, 3.5)
          .to(p, { cell: 1, duration: 1, ease: "power2.in", onUpdate: () => pix.draw(p.cell) }, 3.5)
          .to(lineSvg, { opacity: 0, duration: 0.3 }, 3.5)
          .set(colorSvg, { opacity: 1 }, 4.5)
          .set(canvas, { opacity: 0 }, 4.52);
      });
    });

    // Reduced motion: the finished drawing, no movement.
    mm.add(REDUCED, () => {
      gsap.set(lineSvg, { opacity: 0 });
      gsap.set(colorSvg, { opacity: 1 });
      setStage(2);
    });

    return () => {
      offLoad();
      mm.revert();
      ro.disconnect();
    };
  }, []);

  const [sx, sy] = SCREEN_CENTER;

  return (
    <section id="top" ref={root} aria-labelledby="hero-name" className="relative">
      <div ref={stage} className="relative min-h-svh overflow-hidden pb-14 pt-[var(--nav-h)] lg:h-svh lg:min-h-[640px] lg:pb-0">
        {/* Blueprint frame: column rules and registration marks */}
        <div aria-hidden className="pointer-events-none absolute inset-x-[var(--gutter)] bottom-0 top-[var(--nav-h)]">
          <div data-frame className="absolute inset-y-0 left-0 w-px origin-top bg-rule" />
          <div data-frame className="absolute inset-y-0 right-0 w-px origin-top bg-rule" />
          <div data-frame className="absolute inset-y-0 left-[41.666%] hidden w-px origin-top bg-rule lg:block" />
          <div data-frame-x className="absolute inset-x-0 bottom-14 h-px origin-left bg-rule" />
          <span data-plus className="absolute left-0 top-0"><Plus /></span>
          <span data-plus className="absolute right-0 top-0"><Plus className="translate-x-1/2" /></span>
          <span data-plus className="absolute bottom-14 left-0"><Plus className="translate-y-1/2" /></span>
          <span data-plus className="absolute bottom-14 right-0"><Plus className="translate-x-1/2 translate-y-1/2" /></span>
          <span data-plus className="absolute left-[41.666%] top-0 hidden lg:block"><Plus /></span>
          <span data-plus className="absolute bottom-14 left-[41.666%] hidden lg:block"><Plus className="translate-y-1/2" /></span>
        </div>

        <div className="relative mx-[var(--gutter)] grid lg:h-[calc(100%-3.5rem)] lg:grid-cols-12">
          {/* Text column */}
          <div ref={textCol} className="relative z-10 flex flex-col justify-center px-4 pt-8 sm:px-6 lg:col-span-5 lg:px-8 lg:pt-0">
            <div data-intro className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Label n="01">Workspace</Label>
              <span className="label flex items-center gap-2 text-mute">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-signal/60" />
                  <span className="relative size-1.5 rounded-full bg-signal" />
                </span>
                {hero.status}
              </span>
            </div>

            <h1 id="hero-name" ref={name} className="font-display mt-5 text-[clamp(4.2rem,17vw,7rem)] font-[800] leading-[0.84] text-ink lg:mt-7 lg:text-[clamp(5.5rem,9.6vw,10.5rem)]">
              <span className="block">Rao Ali</span>
              <span className="block">Badar</span>
            </h1>

            <p data-intro className="label mt-5 text-signal lg:mt-7">{hero.role}</p>
            <p data-intro className="mt-3 max-w-[30rem] text-[0.98rem] leading-relaxed text-ink/80 lg:text-[1.05rem]">
              {hero.intro}
            </p>
            <div data-intro className="mt-6 flex flex-wrap gap-3 lg:mt-8">
              {hero.ctas.map((c) => (
                <MagneticButton key={c.label} href={c.href} kind={c.kind}>
                  {c.label}
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* The drawing */}
          <div className="relative flex min-h-0 items-center justify-center px-1 pb-6 pt-10 sm:px-6 lg:col-span-7 lg:pb-0 lg:pt-0">
            <div
              ref={camera}
              className="relative w-full max-w-[880px]"
              style={{ transformOrigin: `${sx * 100}% ${sy * 100}%` }}
            >
              <WorkspaceDrawing ref={drawing} title="Isometric drawing of an accountant's workspace: desk, monitor with a finance dashboard, ledger books, a lamp and documents" />

              {/* Callouts */}
              <div data-annot className="absolute inset-0 hidden md:block" aria-hidden>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                  {hero.annotations.map((a) => {
                    const [ax, ay] = toUnit(ANCHORS[a.target]);
                    const [ox, oy] = CARD_OFFSET[a.target].at;
                    return (
                      <line
                        key={a.code}
                        data-connector
                        x1={ax * 100}
                        y1={ay * 100}
                        x2={(ax + ox) * 100}
                        y2={(ay + oy) * 100}
                        stroke="#2f6b4f"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray="3 3"
                      />
                    );
                  })}
                </svg>
                {hero.annotations.map((a) => {
                  const [ax, ay] = toUnit(ANCHORS[a.target]);
                  const { at: [ox, oy], align } = CARD_OFFSET[a.target];
                  const left = align === "right";
                  return (
                    <div key={a.code}>
                      <span
                        data-anchor
                        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-paper bg-signal"
                        style={{ left: `${ax * 100}%`, top: `${ay * 100}%` }}
                      />
                      <div
                        data-card
                        className={`absolute flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-[4px] border border-ink/15 bg-sheet px-2.5 py-1.5 ${left ? "-translate-x-full" : ""}`}
                        style={{ left: `${(ax + ox) * 100}%`, top: `${(ay + oy) * 100}%` }}
                      >
                        <span className="label text-signal">[{a.code}]</span>
                        <span className="label text-[0.66rem] text-ink">{a.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom rail: render stages + scroll cue */}
        <div data-chrome className="absolute inset-x-[var(--gutter)] bottom-0 flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <ol className="flex items-center gap-4 sm:gap-6" aria-label="Render stages">
            {STAGES.map((s, i) => (
              <li key={s} data-stage className="group label flex items-center gap-2 text-mute data-[on]:text-ink">
                <span className="size-1.5 border border-ink/40 transition-colors group-data-[on]:border-signal group-data-[on]:bg-signal" />
                <span className="text-signal/70">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
          <span className="label hidden items-center gap-3 text-mute sm:flex">
            Scroll to render
            <span className="relative block h-6 w-px overflow-hidden bg-rule">
              <span className="absolute inset-x-0 top-0 h-2 animate-[cue_1.6s_ease-in-out_infinite] bg-signal" />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
