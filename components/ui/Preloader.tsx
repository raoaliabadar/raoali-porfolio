"use client";

import { useEffect, useRef, useState } from "react";
import { WorkspaceDrawing } from "@/components/blueprint/WorkspaceDrawing";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { markLoaded } from "@/lib/animations/loader";
import { hero, identity } from "@/src/content";

/**
 * ~2 s: the workspace blueprint draws itself, a 0 → 100 counter runs along an accent line and a
 * terminal log types in the corner. Exits with a pixel-grid dissolve that uncovers the page.
 */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const drawing = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    document.documentElement.classList.add("is-loading");
    const finish = () => {
      document.documentElement.classList.remove("is-loading");
      setGone(true);
    };

    if (prefersReducedMotion()) {
      gsap.set(drawing.current!.querySelectorAll("[data-draw]"), { strokeDashoffset: 0 });
      for (const li of Array.from(log.current!.children) as HTMLElement[]) {
        (li.querySelector("span[data-type]") as HTMLElement).textContent = li.dataset.text ?? "";
        gsap.set(li, { autoAlpha: 1 });
      }
      if (count.current) count.current.textContent = "100";
      gsap.set(bar.current, { scaleX: 1 });
      const t = gsap.to(el, { autoAlpha: 0, duration: 0.3, delay: 0.4, onStart: markLoaded, onComplete: finish });
      return () => {
        t.kill();
        document.documentElement.classList.remove("is-loading");
      };
    }

    const paths = drawing.current!.querySelectorAll<SVGPathElement>("[data-draw]");
    const lines = Array.from(log.current!.children) as HTMLElement[];
    const counter = { v: 0 };
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(paths, { strokeDashoffset: 0, duration: 1.1, stagger: { each: 0.012, from: "start" }, ease: "power2.inOut" }, 0)
      .to(drawing.current!.querySelectorAll("[data-fill]"), { fillOpacity: 1, duration: 0.4 }, 1.45)
      .to(counter, {
        v: 100,
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: () => {
          if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
        },
      }, 0)
      .fromTo(bar.current, { scaleX: 0 }, { scaleX: 1, duration: 1.8, ease: "power2.inOut" }, 0);

    // Terminal log: each line types itself, char by char.
    lines.forEach((li, i) => {
      const text = li.dataset.text ?? "";
      const span = li.querySelector("span[data-type]") as HTMLElement;
      const o = { n: 0 };
      tl.set(li, { autoAlpha: 1 }, i * 0.42)
        .to(o, {
          n: text.length,
          duration: 0.32,
          ease: "none",
          onUpdate: () => {
            span.textContent = text.slice(0, Math.round(o.n));
          },
        }, i * 0.42);
    });

    tl.add(() => dissolve(), 2.0);

    // Pixel-grid dissolve: paper-coloured cells clear in a random order.
    function dissolve() {
      const c = canvas.current!;
      const ctx = c.getContext("2d")!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = innerWidth * dpr;
      c.height = innerHeight * dpr;
      ctx.scale(dpr, dpr);
      const size = innerWidth < 640 ? 36 : 56;
      const cols = Math.ceil(innerWidth / size);
      const rows = Math.ceil(innerHeight / size);
      const cells = Array.from({ length: cols * rows }, (_, i) => i).sort(() => Math.random() - 0.5);
      ctx.fillStyle = "#f3f1ec";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      gsap.set(el!.querySelector("[data-pre-ui]"), { autoAlpha: 0 });
      gsap.set(el, { backgroundColor: "transparent" });
      markLoaded();
      const p = { k: 0 };
      let done = 0;
      gsap.to(p, {
        k: cells.length,
        duration: 0.75,
        ease: "power2.in",
        onUpdate: () => {
          const to = Math.round(p.k);
          for (; done < to; done++) {
            const i = cells[done];
            ctx.clearRect((i % cols) * size, Math.floor(i / cols) * size, size, size);
          }
        },
        onComplete: finish,
      });
    }

    return () => {
      tl.kill();
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[200] bg-paper" role="status" aria-label={`Loading ${identity.name}`}>
      <canvas ref={canvas} className="pointer-events-none absolute inset-0 size-full" aria-hidden />
      <div data-pre-ui className="absolute inset-0">
        {/* Fine blueprint grid behind the drawing */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--color-rule)_1px,transparent_1px),linear-gradient(90deg,var(--color-rule)_1px,transparent_1px)] [background-size:32px_32px]"
        />
        <div className="absolute left-[var(--gutter)] top-6 flex items-center gap-3">
          <span className="label text-ink">{identity.initials}</span>
          <span className="label text-mute">{hero.role}</span>
        </div>

        <div className="absolute inset-x-0 top-1/2 mx-auto w-[min(78vw,640px)] -translate-y-[58%]">
          <WorkspaceDrawing ref={drawing} variant="lines" title="Blueprint of a workspace being drawn" />
        </div>

        {/* Counter on the accent line */}
        <div className="absolute inset-x-[var(--gutter)] bottom-[14vh] sm:bottom-[16vh]">
          <div className="flex items-end justify-between">
            <span className="label text-mute">Drawing the ledger</span>
            <span className="font-[family-name:var(--font-pixel)] text-3xl leading-none text-ink sm:text-5xl">
              <span ref={count}>000</span>%
            </span>
          </div>
          <div className="mt-3 h-px w-full bg-rule">
            <div ref={bar} className="h-px origin-left scale-x-0 bg-signal" />
          </div>
        </div>

        {/* Terminal log */}
        <ol ref={log} className="absolute bottom-6 left-[var(--gutter)] space-y-1 font-mono text-[0.7rem] uppercase tracking-[0.06em] text-mute sm:left-auto sm:right-[var(--gutter)] sm:text-right">
          {hero.loadingLog.map((l, i) => (
            <li key={l} data-text={l} className="invisible">
              <span className="text-signal">{`> `}</span>
              <span data-type>{""}</span>
              {i === hero.loadingLog.length - 1 && <span className="ml-1 inline-block size-2 bg-signal align-middle" />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
