"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { about, sectionIndex, site } from "@/lib/content";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceDeck } from "@/components/ui/ServiceDeck";
import { PortraitCard } from "@/components/ui/PortraitCard";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Eyebrow } from "@/components/ui/SectionHeading";

type Token = { word: string; em: boolean };

function tokenize(text: string): Token[] {
  const out: Token[] = [];
  text.split(/(\*[^*]+\*)/g).forEach((chunk) => {
    const em = chunk.startsWith("*") && chunk.endsWith("*");
    (em ? chunk.slice(1, -1) : chunk)
      .split(" ")
      .filter(Boolean)
      .forEach((word) => out.push({ word, em }));
  });
  return out;
}

function Word({ token, progress, range }: { token: Token; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span
      style={{ opacity }}
      className={token.em ? "text-accent" : undefined}
    >
      {token.word}{" "}
    </motion.span>
  );
}

/** Statement that lights up word-by-word as it scrolls through the viewport. */
function ScrollStatement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 50%"] });
  const tokens = tokenize(text);
  return (
    <p
      ref={ref}
      className="font-display text-[clamp(1.9rem,4vw,3.6rem)] font-light leading-[1.12] tracking-[-0.035em]"
    >
      <span className="sr-only">{text.replace(/\*/g, "")}</span>
      <span aria-hidden>
        {tokens.map((t, i) => (
          <Word key={i} token={t} progress={scrollYProgress} range={[i / tokens.length, (i + 1) / tokens.length]} />
        ))}
      </span>
    </p>
  );
}

export function About() {
  return (
    <section id="about" className="relative overflow-hidden py-28 md:py-40">
      {/* Soft warm glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-[10%] top-[10%] h-[35%] w-[40%] rounded-full bg-glow/40 blur-[140px]" />
        <div className="absolute right-[-5%] bottom-[10%] h-[30%] w-[35%] rounded-full bg-[#efe3d8]/70 blur-[130px]" />
      </div>

      <div className="container-x">
        {/* Row A — statement */}
        <div className="grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <div className="pt-3">
              <Eyebrow index={sectionIndex("about")}>About me</Eyebrow>
            </div>
          </Reveal>
          <div className="lg:col-span-9">
            <ScrollStatement text={about.statement} />
          </div>
        </div>

        {/* Row B — portrait + details */}
        <div className="mt-24 grid items-center gap-16 lg:mt-32 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-5">
            <PortraitCard />
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="text-lg leading-relaxed text-fg/70 md:text-xl md:leading-relaxed">{about.bio}</p>
            </Reveal>

            <Reveal delay={0.08}>
              <dl className="mt-10 grid grid-cols-2 border-t border-line">
                {about.facts.map((f, i) => (
                  <div
                    key={f.label}
                    className={`border-b border-line py-5 ${i % 2 === 0 ? "pr-4" : "border-l pl-5"}`}
                  >
                    <dt className="label mb-1.5">{f.label}</dt>
                    <dd className="text-[0.95rem] text-fg/90">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            {about.stats.length > 0 && (
              <Reveal delay={0.14} className="mt-10 grid grid-cols-3 gap-6">
                {about.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-4xl font-light tracking-[-0.04em] md:text-5xl">
                      <CountUp value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="label mt-2">{s.label}</p>
                  </div>
                ))}
              </Reveal>
            )}

            <Reveal delay={0.2} className="mt-12 flex flex-wrap gap-3">
              <MagneticButton
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
              >
                Let&apos;s talk
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </MagneticButton>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="inline-flex items-center rounded-full border border-line bg-surface px-6 py-3.5 text-sm transition-colors hover:border-fg/50"
                >
                  Download CV
                </a>
              )}
            </Reveal>
          </div>
        </div>

        {/* Row C — services deck */}
        <div className="mt-32 grid items-center gap-12 lg:mt-40 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <div className="mb-6">
                <Eyebrow>What I do</Eyebrow>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <h3 className="font-display text-[clamp(2.2rem,4.5vw,3.9rem)] font-light leading-[1.05] tracking-[-0.035em]">
                How I can <em className="not-italic text-accent">help</em> you.
              </h3>
            </Reveal>
            <Reveal delay={0.14}>
              <p className="mt-6 max-w-sm leading-relaxed text-fg/65">
                Swipe or use the arrows to explore how I support finance and customer operations — from invoicing to clean,
                reliable CRM data.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="lg:col-span-7">
            <ServiceDeck />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
