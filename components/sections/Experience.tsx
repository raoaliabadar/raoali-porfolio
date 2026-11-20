"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { experience } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

/** "Journey" timeline: glowing vertical line with orange light points. */
export function Experience() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  if (experience.length === 0) return null;

  return (
    <section id="experience" className="panel bg-[linear-gradient(180deg,#000_0%,#03050c_60%,#1a2a55_100%)] py-24 md:py-32">
      <div className="container-x grid gap-12 md:grid-cols-12">
        <Reveal className="md:col-span-4">
          <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.045em]">
            My journey
            <br />
            so far
          </h2>
        </Reveal>

        <ol ref={listRef} className="relative md:col-span-8">
          <span aria-hidden className="absolute bottom-0 left-[9px] top-0 w-px bg-white/10" />
          <motion.span
            aria-hidden
            style={{ scaleY: progress }}
            className="absolute bottom-0 left-[9px] top-0 w-px origin-top bg-gradient-to-b from-white via-white/80 to-white/0 shadow-[0_0_12px_rgb(255_255_255/0.6)]"
          />
          {experience.map((item, i) => (
            <Reveal as="li" key={`${item.company}-${i}`} delay={i * 0.05} className="relative pb-14 pl-12 last:pb-0">
              <span aria-hidden className="plasma absolute left-0 top-1 size-[19px] rounded-full" />
              <p className="text-white">{item.period}</p>
              <p className="mt-3 text-lg font-medium">
                {item.role} · <span className="text-white/80">{item.company}</span>
              </p>
              <p className="mt-1 text-[#8e9ab8]">{item.summary}</p>
              <ul className="mt-4 space-y-1.5">
                {item.highlights.map((h) => (
                  <li key={h} className="text-[0.95rem] text-[#a8b5d6]">
                    {h}
                  </li>
                ))}
              </ul>
              {item.tools.length > 0 && (
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-white/50">{item.tools.join(" · ")}</p>
              )}
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
