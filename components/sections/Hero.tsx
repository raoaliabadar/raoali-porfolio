"use client";

import { useEffect, useRef, useState } from "react";
import { DeskControls, LampLight } from "@/components/blueprint/DeskControls";
import { SCREEN_H, SCREEN_W, ScreenApp } from "@/components/blueprint/ScreenApp";
import { WorkspaceDrawing } from "@/components/blueprint/WorkspaceDrawing";
import { ANCHORS, SCREEN_BOX, SCREEN_CENTER, SCREEN_QUAD, toUnit } from "@/components/blueprint/workspace";
import { Label, Plus } from "@/components/ui/Label";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { gsap, MOTION, REDUCED, setupGsap } from "@/lib/animations/gsap";
import { onLoaded } from "@/lib/animations/loader";
import { createPixelator } from "@/lib/animations/pixelate";
import { useSplitReveal } from "@/lib/animations/useSplitReveal";
import { desk, hero } from "@/src/content";

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
 * [01] Hero. Pinned for ~240vh: the workspace starts as line art, shades in like a pencil
 * render, resolves from pixels into the clean finish, then the camera moves into the monitor.
 * Same on phones; there the stage is taller than the screen, so it pins once its bottom (the
 * drawing) is in view.
 */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const camera = useRef<HTMLDivElement>(null);
  const drawing = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLHeadingElement>(null);
  const textCol = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const [screenOn, setScreenOn] = useState(false);

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

    const scr = screen.current!;
    /* Lay the app's rectangle onto the screen parallelogram with an affine matrix. */
    const placeScreen = () => {
      const w = cam.offsetWidth;
      const h = cam.offsetHeight;
      const { tl: a, tr: b, bl: c } = SCREEN_QUAD;
      const m = [((b[0] - a[0]) * w) / SCREEN_W, ((b[1] - a[1]) * h) / SCREEN_W, ((c[0] - a[0]) * w) / SCREEN_H, ((c[1] - a[1]) * h) / SCREEN_H];
      scr.style.transform = `translate(${a[0] * w}px, ${a[1] * h}px) matrix(${m.join(",")}, 0, 0)`;
    };
    placeScreen();
    gsap.set(scr, { opacity: 0 });
    let on = false;
    const setOn = (v: boolean) => {
      if (v !== on) {
        on = v;
        setScreenOn(v);
      }
    };

    const ro = new ResizeObserver(() => {
      pix.resize();
      placeScreen();
    });
    ro.observe(canvas);
    ro.observe(cam);

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
      // Fit the whole screen (with a sliver of bezel) so the app on it can be read.
      // Phones/tablets leave room for the monitor's bezel and side so the whole monitor stays in frame.
      return Math.min(innerWidth / sw, innerHeight / sh) * (innerWidth < 640 ? 0.74 : innerWidth < 1024 || innerHeight > innerWidth ? 0.76 : 0.94);
    };
    const zoomX = () => {
      const { x, w } = camLayout();
      return stage.current!.offsetWidth / 2 - (x + SCREEN_CENTER[0] * w);
    };
    // How far the stage has scrolled when it pins: 0 when it fits the screen, otherwise
    // enough that its bottom (where the drawing sits on phones) is on screen.
    const pinOffset = () => Math.max(0, stage.current!.offsetHeight - innerHeight);
    const zoomY = () => {
      const { y, h } = camLayout();
      return pinOffset() + innerHeight / 2 - (y + SCREEN_CENTER[1] * h);
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

    // Pinned, scroll-scrubbed render, on every screen size.
    mm.add(MOTION, () => {
      // Below lg the text sits above the drawing, so it lifts away before the camera moves up through it.
      const stacked = innerWidth < 1024;
      offLoad = onLoaded(() => intro());
      const p = { cell: 40 };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: () => pinOffset(),
          end: () => `+=${innerHeight * 2.4}`,
          pin: stage.current,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            setStage(self.progress < 0.1 ? 0 : self.progress < 0.34 ? 1 : 2);
            setOn(self.progress > 0.55 && self.progress < 0.995);
          },
          onLeave: () => setOn(false),
        },
      });
      tl.to(hatch, { opacity: 1, duration: 0.24, stagger: { each: 0.004, from: "random" } }, 0.02)
        .to(q("[data-annot]"), { autoAlpha: 0, duration: 0.08 }, 0.4)
        .set(canvas, { opacity: 1 }, 0.34)
        .fromTo(p, { cell: 40 }, { cell: 1, duration: 0.24, ease: "power2.in", onUpdate: () => pix.draw(p.cell) }, 0.34)
        .to(lineSvg, { opacity: 0, duration: 0.1 }, 0.34)
        .set(colorSvg, { opacity: 1 }, 0.58)
        .set(canvas, { opacity: 0 }, 0.585)
        .to(scr, { opacity: 1, duration: 0.03 }, 0.58)
        .to(textCol.current, stacked ? { y: -48, autoAlpha: 0, duration: 0.07, ease: "power2.in" } : { xPercent: -18, autoAlpha: 0, duration: 0.16, ease: "power2.in" }, stacked ? 0.585 : 0.6)
        .to(q("[data-chrome]"), { autoAlpha: 0, duration: 0.1 }, 0.6)
        // Into the monitor, then hold so the work on screen can be watched.
        .to(cam, { scale: zoomScale, x: zoomX, y: zoomY, force3D: false, duration: 0.24, ease: "power2.inOut" }, 0.62)
        .to(cam, { autoAlpha: 0, duration: 0.04 }, 0.96);
      return () => {
        setStage(0);
        setOn(false);
      };
    });

    // Reduced motion: the finished drawing, no movement.
    mm.add(REDUCED, () => {
      gsap.set(lineSvg, { opacity: 0 });
      gsap.set(colorSvg, { opacity: 1 });
      gsap.set(scr, { opacity: 1 });
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
      <div ref={stage} className="relative flex h-svh min-h-[540px] flex-col overflow-hidden pb-14 pt-[var(--nav-h)] lg:block lg:min-h-[640px] lg:pb-0">
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

        {/* Phones: text and drawing share one screen, so the scene pins from the very top. */}
        <div className="relative mx-[var(--gutter)] flex min-h-0 flex-1 flex-col lg:grid lg:h-[calc(100%-3.5rem)] lg:grid-cols-12">
          {/* Text column */}
          <div ref={textCol} className="relative z-10 flex shrink-0 flex-col justify-center px-4 pt-5 sm:px-6 sm:pt-8 lg:col-span-5 lg:px-8 lg:pt-0">
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

            <h1 id="hero-name" ref={name} className="font-display mt-3 text-[clamp(2.4rem,10.5vw,5.04rem)] font-[700] leading-[0.86] text-ink sm:mt-5 lg:mt-7 lg:text-[clamp(4.07rem,7.1vw,7.56rem)]">
              <span className="block">Rao Ali</span>
              <span className="block">Badar</span>
            </h1>

            <p data-intro className="label mt-3 text-signal sm:mt-5 lg:mt-7">{hero.role}</p>
            <p data-intro className="mt-2.5 max-w-[30rem] text-[0.9rem] leading-snug text-ink/80 max-lg:[@media(max-height:720px)]:hidden sm:text-[0.98rem] sm:leading-relaxed lg:mt-3 lg:text-[1.05rem]">
              {hero.intro}
            </p>
            <div data-intro className="mt-4 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3 lg:mt-8">
              {hero.ctas.map((c) => (
                <MagneticButton key={c.label} href={c.href} kind={c.kind}>
                  {c.label}
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* The drawing */}
          {/* Below lg the drawing is sized from the height left under the text, so it never rides up over the buttons. */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-1 py-2 max-lg:[container-type:size] sm:px-6 lg:col-span-7 lg:py-0">
            <div
              ref={camera}
              className="relative w-full max-w-[880px] max-lg:max-w-[min(100%,calc(100cqh*1.15))]"
              style={{ transformOrigin: `${sx * 100}% ${sy * 100}%` }}
            >
              <WorkspaceDrawing ref={drawing} title="Isometric drawing of an accountant's workspace: desk, monitor with a finance dashboard, ledger books, a lamp and documents" />
              <LampLight />
              {/* The accounting app on the monitor (shown from the render stage on) */}
              <ScreenApp ref={screen} active={screenOn} />

              {/* Callouts */}
              <div data-annot className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
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
                        className="stroke-signal"
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
              <DeskControls />
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
          <span className="label hidden text-mute xl:inline">{desk.hint}</span>
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
