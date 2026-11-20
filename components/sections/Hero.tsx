"use client";

import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { hero, site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { LocalClock } from "@/components/ui/LocalClock";

/* ───────── Headline (rendered twice: base + magnified lens copy) ───────── */

function Line({
  children,
  delay,
  animated,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  animated: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-block overflow-hidden pb-[0.06em] align-bottom ${className}`}>
      {animated ? (
        <motion.span
          className="inline-block"
          initial={{ y: "115%", rotate: 4 }}
          animate={{ y: "0%", rotate: 0 }}
          transition={{ duration: 1.2, ease, delay }}
        >
          {children}
        </motion.span>
      ) : (
        <span className="inline-block">{children}</span>
      )}
    </span>
  );
}

function Headline({ animated = true }: { animated?: boolean }) {
  const Tag = animated ? "h1" : "div";
  return (
    <Tag
      aria-hidden={animated ? undefined : true}
      className="select-none font-display text-[20vw] md:text-[clamp(4.1rem,14.2vw,15.5rem)] font-medium leading-[0.86] tracking-[-0.06em]"
    >
      {animated && <span className="sr-only">{`${site.name} — ${site.title}. `}</span>}
      <span className="flex items-end justify-between gap-4" aria-hidden={animated ? true : undefined}>
        <Line animated={animated} delay={0.25}>
          {hero.lineOne}
        </Line>
        <Line
          animated={animated}
          delay={0.55}
          className="mb-[0.12em] font-serif text-[0.4em] font-normal italic tracking-normal text-accent max-sm:hidden"
        >
          {hero.accent}
        </Line>
      </span>
      <span className="block pl-[4%] md:pl-[24%]" aria-hidden={animated ? true : undefined}>
        <Line animated={animated} delay={0.38}>
          {hero.lineTwo}
        </Line>
      </span>
      <span className="mt-3 block sm:hidden" aria-hidden={animated ? true : undefined}>
        <Line animated={animated} delay={0.55} className="font-serif text-[0.45em] font-normal italic tracking-normal text-accent">
          {hero.accent}
        </Line>
      </span>
    </Tag>
  );
}

/* ───────── Glass lens that magnifies the headline under the cursor ───────── */

function LensHeadline() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [r, setR] = useState(90);
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const sx = useSpring(mx, { stiffness: 140, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 140, damping: 20, mass: 0.6 });
  const wander = useRef<AnimationPlaybackControls[]>([]);

  const clipPath = useMotionTemplate`circle(${r}px at ${sx}px ${sy}px)`;
  const origin = useMotionTemplate`${sx}px ${sy}px`;
  const ringX = useTransform(sx, (v) => v - r);
  const ringY = useTransform(sy, (v) => v - r);

  const stopWander = () => {
    wander.current.forEach((c) => c.stop());
    wander.current = [];
  };

  // Idle state: lens rests on the headline and drifts slowly (static if reduced motion).
  const startWander = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    stopWander();
    const { width: w, height: h } = el.getBoundingClientRect();
    const xs = [w * 0.3, w * 0.52, w * 0.72, w * 0.45];
    const ys = [h * 0.3, h * 0.7, h * 0.62, h * 0.28];
    if (reduce) {
      mx.set(xs[0]);
      my.set(ys[0]);
      return;
    }
    wander.current = [
      animate(mx, xs, { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(my, ys, { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
    ];
  }, [mx, my, reduce]);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      setR(Math.round(Math.min(130, Math.max(52, w * 0.075))));
    };
    measure();
    // Snap to the start position without the spring flying in.
    const el = ref.current;
    if (el) {
      const { width: w, height: h } = el.getBoundingClientRect();
      sx.jump(w * 0.3);
      sy.jump(h * 0.3);
      mx.jump(w * 0.3);
      my.jump(h * 0.3);
    }
    startWander();
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      stopWander();
    };
  }, [startWander, mx, my, sx, sy]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || reduce || !ref.current) return;
    stopWander();
    const b = ref.current.getBoundingClientRect();
    mx.set(e.clientX - b.left);
    my.set(e.clientY - b.top);
  };

  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={startWander} className="relative">
      <Headline />

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="pointer-events-none absolute inset-0"
      >
        {/* Magnified + chromatic copy, clipped to a circle */}
        <motion.div className="absolute inset-0" style={{ clipPath }}>
          <motion.div className="lens-copy" style={{ scale: 1.22, transformOrigin: origin }}>
            <Headline animated={false} />
          </motion.div>
        </motion.div>

        {/* Glass ring */}
        <motion.span
          className="absolute left-0 top-0 rounded-full border border-white/25 bg-white/[0.025] shadow-[inset_0_0_40px_rgb(255_255_255/0.12),inset_0_-10px_30px_rgb(0_255_224/0.08),0_20px_60px_rgb(0_0_0/0.5)]"
          style={{ x: ringX, y: ringY, width: r * 2, height: r * 2 }}
        />
      </motion.div>
    </div>
  );
}

/* ───────── Section ───────── */

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-svh flex-col overflow-hidden">
      {/* Grainy blue glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-slow absolute left-[30%] top-[5%] h-[70%] w-[75%] rounded-full bg-glow/45 blur-[140px]" />
        <div
          className="animate-float absolute left-[55%] top-[30%] h-[45%] w-[35%] rounded-full bg-[#4f7dff]/30 blur-[120px]"
          style={{ animationDelay: "-5s" }}
        />
        <div className="absolute -left-[10%] bottom-[-30%] h-[60%] w-[50%] rounded-full bg-[#0b1d5c]/60 blur-[120px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      <div className="container-x flex flex-1 flex-col justify-center pb-10 pt-32">
        <LensHeadline />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease, delay: 1.1 }}
        className="container-x grid grid-cols-2 gap-x-6 gap-y-6 pb-10 md:grid-cols-12 md:items-end"
      >
        <p className="col-span-2 max-w-sm text-sm leading-relaxed text-fg/75 md:col-span-4">
          <span className="font-semibold text-fg">{site.name}</span> — {site.title.toLowerCase()} crafting fast, beautiful and
          meaningful digital products.
        </p>
        {hero.meta.map((m) => (
          <div key={m.label} className="md:col-span-2">
            <p className="label mb-1.5 text-fg">{m.label}</p>
            <p className="text-[0.72rem] uppercase leading-snug tracking-[0.08em] text-muted">{m.value}</p>
          </div>
        ))}
        <div className="md:col-span-1">
          <p className="label mb-1.5 text-fg">Local</p>
          <LocalClock timezone={site.timezone} className="text-[0.72rem] uppercase tracking-[0.08em] text-muted" />
        </div>
        <a
          href="#about"
          aria-label="Scroll to About"
          className="relative hidden h-16 w-px justify-self-end overflow-hidden bg-line md:col-span-1 md:block"
        >
          <span className="animate-drop absolute inset-0 bg-fg" />
        </a>
      </motion.div>
    </section>
  );
}
