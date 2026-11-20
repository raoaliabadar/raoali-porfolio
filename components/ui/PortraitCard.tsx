"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { about, site } from "@/lib/content";
import { Logo } from "./Logo";

/** Portrait with scroll parallax, glass caption and a rotating name badge. */
export function PortraitCard() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-5%", "5%"]);
  const ring = `${site.name} • ${site.badge} • `.toUpperCase();

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[26rem] lg:mx-0">
      {/* Soft orange halo behind the card */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-accent/20 blur-[70px]" />

      <div className="group relative aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/10 bg-surface">
        {about.portrait ? (
          <motion.div className="absolute inset-[-8%]" style={{ y }}>
            <Image
              src={about.portrait}
              alt={`Portrait of ${site.name}`}
              fill
              priority={false}
              sizes="(min-width: 1024px) 26rem, 90vw"
              className="object-cover object-[50%_35%] brightness-[0.92] contrast-[1.05] transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <Logo className="h-24 w-auto text-accent" />
          </div>
        )}

        {/* Cinematic grading: darken edges + bottom for legibility */}
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,transparent_40%,rgb(5_6_8/0.55))]" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />

        {/* Availability pill */}
        <p className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-ink/40 px-3 py-1.5 text-[0.7rem] font-medium backdrop-blur-md">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          Available for work
        </p>

        {/* Caption */}
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 rounded-2xl border border-white/10 bg-ink/35 p-4 backdrop-blur-md">
          <div>
            <p className="font-display text-xl font-semibold tracking-[-0.03em]">{site.name}</p>
            <p className="label mt-1">{site.title}</p>
          </div>
          <Logo className="mb-1 h-5 w-auto shrink-0 text-accent" />
        </div>
      </div>

      {/* Rotating badge */}
      <div className="absolute -right-4 -top-8 grid size-28 place-items-center rounded-full border border-white/10 bg-ink/70 backdrop-blur-md md:-right-10 md:size-32">
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-[spin_22s_linear_infinite]" aria-hidden>
          <defs>
            <path id="badge-circle" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
          </defs>
          <text className="fill-fg/80 text-[15px] font-semibold tracking-[0.18em]">
            <textPath href="#badge-circle">{ring}</textPath>
          </text>
        </svg>
        <Logo className="h-6 w-auto text-accent" />
      </div>
    </div>
  );
}
