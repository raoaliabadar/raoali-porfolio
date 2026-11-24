"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/content";
import { pandaReact } from "@/lib/panda";

// The site's existing 3D panda, in its "intro" view (panda + chair only), loaded once the page is idle.
const DeskScene = dynamic(() => import("@/components/ui/DeskScene").then((m) => m.DeskScene), { ssr: false });

/**
 * Scroll intro: a night-time desk scene (adapted from companion-widget/portfolio.html).
 * The panda sits at the desk; scrolling zooms the camera into the monitor, where
 * "Hi, I'm Rao Ali" fills the screen, and then the rest of the site scrolls in.
 *
 * Layers (back to front): wall/window/shelf SVG · 3D panda canvas · desk/monitor/cup SVG.
 * All three share one 1000×600 coordinate system, so the panda sits where the drawing expects it.
 */
const VBW = 1000;
const VBH = 600;
const SCR = { x: 500, y: 273, w: 212, h: 138 }; // monitor screen centre + size (viewBox units)
// Where the panda canvas sits (viewBox units). Tall enough for the legs and chair under the desk;
// DeskScene's "intro" camera is framed to this box so the desk top lines up with y = 430.
const PANDA_BOX = { x: -75, y: 120, w: 530, h: 530 };
const CUP = { x: 320, y: 415 }; // cup pivot
const SIP = { x: -92, y: -100 }; // cup offset that brings it to the panda's mouth
const ACCENT = "#fe4f02";
const FULL_VB = { x: 0, y: 0, w: VBW, h: VBH };
const PORTRAIT_VB = { x: 30, y: 50, w: 820, h: 550 };

export function ScrollIntro() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pandaRef = useRef<HTMLDivElement>(null);
  const cupRef = useRef<SVGGElement>(null);
  const ahhRef = useRef<SVGGElement>(null);
  const screenTextRef = useRef<SVGTextElement>(null);
  const codeRef = useRef<SVGGElement>(null);
  const screenUIRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [portrait, setPortrait] = useState(false);
  const [showPanda, setShowPanda] = useState(false);
  const sipRef = useRef<() => void>(() => {});

  // Load the 3D panda once the browser is idle, so the drawing paints first.
  useEffect(() => {
    const go = () => setShowPanda(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(go, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Same mapping as the SVGs: "slice" fills landscape screens; portrait screens show a tighter crop
    // (panda to plant) with "meet", so the scene isn't tiny on a phone.
    const mapping = () => {
      const vw = section.clientWidth;
      const vh = section.clientHeight;
      const isPortrait = vw / vh < 1;
      const vb = isPortrait ? PORTRAIT_VB : FULL_VB;
      const k = isPortrait ? Math.min(vw / vb.w, vh / vb.h) : Math.max(vw / vb.w, vh / vb.h);
      return { vw, vh, k, ox: (vw - vb.w * k) / 2 - vb.x * k, oy: (vh - vb.h * k) / 2 - vb.y * k, isPortrait };
    };
    const layout = () => {
      const m = mapping();
      setPortrait(m.isPortrait);
      const p = pandaRef.current;
      if (p) {
        p.style.left = `${m.ox + PANDA_BOX.x * m.k}px`;
        p.style.top = `${m.oy + PANDA_BOX.y * m.k}px`;
        p.style.width = `${PANDA_BOX.w * m.k}px`;
        p.style.height = `${PANDA_BOX.h * m.k}px`;
      }
      // Letterbox colours continue the drawing: the wall gradient above the floor line, the floor below it.
      const top = ((m.oy + 0) / m.vh) * 100;
      const floor = ((m.oy + 470 * m.k) / m.vh) * 100;
      section.style.background = `linear-gradient(#25365a ${top}%, #1c2a4a ${floor}%, #141e36 ${floor}%)`;
    };
    layout();

    let cleanup = () => {};
    let cancelled = false;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // Coffee: the cup rises to the panda's mouth, the panda sips, "ahh", the cup goes back.
      const cup = cupRef.current;
      const ahh = ahhRef.current;
      const cp = { x: 0, y: 0, r: 0 };
      const draw = () => cup?.setAttribute("transform", `translate(${cp.x} ${cp.y}) rotate(${cp.r} ${CUP.x} ${CUP.y})`);
      let sipping = false;
      sipRef.current = () => {
        if (sipping || !cup || !ahh) return;
        sipping = true;
        if (reduce) {
          pandaReact("sip");
          gsap.fromTo(ahh, { opacity: 1 }, { opacity: 0, delay: 1.4, duration: 0.3, onComplete: () => void (sipping = false) });
          return;
        }
        const t = gsap.timeline({ onComplete: () => void (sipping = false) });
        t.to(cp, { x: SIP.x, y: SIP.y, r: -14, duration: 0.75, ease: "power2.inOut", onUpdate: draw })
          .call(() => pandaReact("sip"), [], "-=0.25")
          .to(cp, { r: -30, duration: 0.4, ease: "sine.inOut", onUpdate: draw })
          .to(ahh, { opacity: 1, y: -6, duration: 0.25 }, "+=0.25")
          .to(cp, { r: -14, duration: 0.25, onUpdate: draw })
          .to(ahh, { opacity: 0, duration: 0.3 }, "+=0.6")
          .to(cp, { x: 0, y: 0, r: 0, duration: 0.7, ease: "power2.inOut", onUpdate: draw });
      };

      if (reduce) return; // no pinned zoom: the scene stays still and the greeting is on the monitor

      // Scroll: pin the scene and fly the camera into the monitor.
      const screenCentre = () => {
        const m = mapping();
        return { x: m.ox + SCR.x * m.k, y: m.oy + SCR.y * m.k, m };
      };
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.round(window.innerHeight * 1.8)}`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: layout,
        },
      });
      tl.to(hintRef.current, { opacity: 0, duration: 0.08 }, 0)
        .to(screenTextRef.current, { opacity: 0, duration: 0.25 }, 0)
        .to(
          stage,
          {
            transformOrigin: () => {
              const c = screenCentre();
              return `${c.x}px ${c.y}px`;
            },
            x: () => {
              const c = screenCentre();
              return c.m.vw / 2 - c.x;
            },
            y: () => {
              const c = screenCentre();
              return c.m.vh / 2 - c.y;
            },
            scale: () => {
              const { m } = screenCentre();
              return Math.max(m.vw / (SCR.w * m.k), m.vh / (SCR.h * m.k)) * 1.04;
            },
            duration: 1,
            ease: "power2.inOut",
          },
          0,
        )
        .to(codeRef.current, { opacity: 0, duration: 0.2 }, 0.78)
        .to(screenUIRef.current, { opacity: 1, duration: 0.2 }, 0.82);

      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      cleanup = () => {
        window.removeEventListener("resize", onResize);
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set(stage, { clearProps: "all" });
      };
    })();

    const ro = new ResizeObserver(layout);
    ro.observe(section);
    return () => {
      cancelled = true;
      ro.disconnect();
      cleanup();
    };
  }, []);

  const ratio = portrait ? "xMidYMid meet" : "xMidYMid slice";
  const vb = portrait ? PORTRAIT_VB : FULL_VB;
  const viewBox = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;

  return (
    <section
      id="intro"
      ref={sectionRef}
      aria-label={`Intro: ${site.shortName}'s panda at its desk`}
      className="relative h-[100svh] overflow-hidden"
      style={{ background: "#1a2744" }}
    >
      <div ref={stageRef} className="absolute inset-0 will-change-transform">
        {/* Back layer: wall, window, shelf */}
        <svg viewBox={viewBox} preserveAspectRatio={ratio} className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <linearGradient id="intro-wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#25365a" />
              <stop offset="1" stopColor="#1a2744" />
            </linearGradient>
          </defs>
          <rect width={VBW} height={VBH} fill="url(#intro-wall)" />
          <rect y="470" width={VBW} height="130" fill="#141e36" />
          {/* window with moon */}
          <rect x="690" y="70" width="210" height="150" rx="10" fill="#0e1830" stroke="#3a4b74" strokeWidth="6" />
          <line x1="795" y1="70" x2="795" y2="220" stroke="#3a4b74" strokeWidth="4" />
          <circle cx="740" cy="120" r="22" fill="#fff6d6" />
          <circle cx="750" cy="113" r="20" fill="#0e1830" />
          <circle cx="840" cy="105" r="2" fill="#fff" />
          <circle cx="860" cy="150" r="2" fill="#fff" />
          <circle cx="820" cy="180" r="1.6" fill="#fff" />
          {/* shelf */}
          <rect x="90" y="110" width="200" height="8" rx="3" fill="#6a4328" />
          <rect x="110" y="72" width="16" height="38" fill="#e86a5c" />
          <rect x="130" y="64" width="14" height="46" fill="#5ca7e8" />
          <rect x="148" y="78" width="18" height="32" fill="#8fd16a" />
          <circle cx="240" cy="96" r="14" fill="#f4c542" />
          <rect x="236" y="104" width="8" height="6" fill="#6a4328" />
        </svg>

        {/* The panda (positioned in viewBox space by layout()) */}
        <div ref={pandaRef} className="absolute">
          {showPanda && <DeskScene variant="intro" showChip={false} className="size-full" />}
        </div>

        {/* Front layer: monitor, keyboard, plant, desk, cup. Only the cup takes clicks. */}
        <svg
          viewBox={viewBox}
          preserveAspectRatio={ratio}
          className="pointer-events-none absolute inset-0 size-full"
          role="img"
          aria-label="A desk at night with a monitor, keyboard, plant and a cup of coffee"
        >
          {/* monitor */}
          <rect x="485" y="352" width="30" height="48" fill="#222733" />
          <rect x="450" y="396" width="100" height="10" rx="4" fill="#2b3040" />
          <rect x="380" y="190" width="240" height="170" rx="14" fill="#2b3040" />
          {/* the screen uses the site's own background colour, so the zoom lands on the page */}
          <rect x="394" y="204" width="212" height="138" rx="4" style={{ fill: "var(--color-ink)" }} />
          <g ref={codeRef}>
            <rect x="406" y="218" width="60" height="5" rx="2" fill="#56b6c2" />
            <rect x="472" y="218" width="40" height="5" rx="2" fill={ACCENT} />
            <rect x="414" y="232" width="90" height="5" rx="2" fill="#98c379" />
            <rect x="414" y="246" width="50" height="5" rx="2" fill="#56b6c2" />
            <rect x="470" y="246" width="70" height="5" rx="2" fill={ACCENT} />
            <rect x="406" y="260" width="110" height="5" rx="2" fill="#98c379" />
            <rect x="414" y="274" width="76" height="5" rx="2" fill="#56b6c2" />
            <rect x="496" y="274" width="34" height="5" rx="2" fill={ACCENT} />
          </g>
          <text
            ref={screenTextRef}
            x="500"
            y="318"
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontWeight="700"
            fontSize="15"
            style={{ fill: "var(--color-fg)" }}
          >
            Hi, I&apos;m <tspan fill={ACCENT}>{site.shortName}</tspan>
          </text>
          {/* keyboard */}
          <rect x="425" y="414" width="130" height="10" rx="4" fill="#3b4258" />
          {/* plant */}
          <path d="M735 430 L742 385 L778 385 L785 430Z" fill="#c4633a" />
          <path d="M760 385 C735 340 725 330 705 325 C722 350 740 366 760 385Z" fill="#6fc26a" />
          <path d="M760 385 C760 335 775 318 790 305 C790 340 780 362 760 385Z" fill="#58b05a" />
          <path d="M760 385 C790 360 815 355 835 358 C815 376 790 384 760 385Z" fill="#7fd079" />
          {/* desk */}
          <rect x="40" y="430" width="920" height="26" rx="6" fill="#7a4b2a" />
          <rect x="40" y="430" width="920" height="6" rx="3" fill="#92603a" />
          <rect x="90" y="456" width="22" height="130" fill="#5e3a21" />
          <rect x="888" y="456" width="22" height="130" fill="#5e3a21" />

          {/* coffee cup */}
          <ellipse cx="320" cy="430" rx="36" ry="6" fill="#00000033" />
          <g
            ref={cupRef}
            className="intro-cup pointer-events-auto cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label="Give the panda a sip of coffee"
            onClick={() => sipRef.current()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                sipRef.current();
              }
            }}
          >
            <ellipse cx="320" cy="424" rx="32" ry="6" fill="#e9e4da" />
            <path d="M298 388 L342 388 L336 420 Q320 428 304 420Z" className="intro-cup-body" fill="#f4f0e8" />
            <path d="M341 396 Q362 396 358 410 Q354 420 337 416" fill="none" stroke="#f4f0e8" strokeWidth="5" />
            <ellipse cx="320" cy="388" rx="22" ry="5" fill="#5a3320" />
            <rect x="304" y="398" width="32" height="6" rx="3" fill={ACCENT} />
            <path className="intro-steam" d="M312 380 q-6 -10 0 -18 q6 -8 0 -16" />
            <path className="intro-steam intro-steam-2" d="M328 380 q-6 -10 0 -18 q6 -8 0 -16" />
            <rect x="290" y="340" width="76" height="92" fill="transparent" />
          </g>
          <g className="intro-tip">
            <rect x="268" y="318" width="104" height="26" rx="13" fill="#0f1b2d" opacity=".9" />
            <text x="320" y="335" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fill="#fff">
              Click the cup
            </text>
          </g>
          <g ref={ahhRef} opacity="0">
            <rect x="238" y="164" width="62" height="26" rx="13" fill="#fff" />
            <path d="M252 190 l-4 10 l14 -10Z" fill="#fff" />
            <text x="269" y="182" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="700" fontSize="13" fill="#2a1a12">
              ahh
            </text>
          </g>
        </svg>
      </div>

      {/* What the monitor shows once the camera is inside it */}
      <div
        ref={screenUIRef}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-ink px-6 text-center opacity-0"
      >
        <p className="font-display text-[clamp(2.4rem,7vw,5.2rem)] font-light leading-[1.05] tracking-[-0.04em] text-fg">
          Hi, I&apos;m <span className="text-accent">{site.shortName}</span>
        </p>
        <p className="mt-4 text-[clamp(1rem,2vw,1.3rem)] text-muted">{site.title}. Keep scrolling to see my work.</p>
      </div>

      <p
        ref={hintRef}
        className="intro-hint pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-[#cdd8f0]"
      >
        Scroll
      </p>
    </section>
  );
}
