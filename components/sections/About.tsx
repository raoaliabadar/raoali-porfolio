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
      className={token.em ? "font-serif font-normal italic tracking-normal text-cyan" : undefined}
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
      className="font-display text-[clamp(2rem,4.6vw,4.4rem)] font-medium leading-[1.08] tracking-[-0.04em]"
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
      {/* Multicolour blurred gradient field */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-slow absolute -left-[10%] top-[5%] h-[40%] w-[45%] rounded-full bg-[#7b1b74]/30 blur-[140px]" />
        <div
          className="animate-float absolute -left-[5%] top-[45%] h-[30%] w-[35%] rounded-full bg-[#b07a0a]/25 blur-[130px]"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="animate-float-slow absolute right-[-5%] top-[0%] h-[40%] w-[45%] rounded-full bg-[#0d7f74]/30 blur-[140px]"
          style={{ animationDelay: "-9s" }}
        />
        <div className="absolute bottom-[5%] right-[5%] h-[30%] w-[35%] rounded-full bg-[#1f4fd6]/25 blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="container-x">
        {/* Row A — statement */}
        <div className="grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <p className="label pt-4">
              <span className="text-fg">({sectionIndex("about")})</span> About me
            </p>
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
              <p className="text-xl leading-relaxed text-fg/80 md:text-2xl md:leading-relaxed">{about.bio}</p>
            </Reveal>

            <Reveal delay={0.08}>
              <dl className="mt-10 grid grid-cols-2 border-t border-white/10">
                {about.facts.map((f, i) => (
                  <div
                    key={f.label}
                    className={`border-b border-white/10 py-5 ${i % 2 === 0 ? "pr-4" : "border-l pl-5"}`}
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
                    <p className="font-display text-4xl font-medium tracking-[-0.04em] md:text-5xl">
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
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-accent"
              >
                Let&apos;s talk
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </MagneticButton>
              {site.resumeUrl && (
                <a
                  href={site.resumeUrl}
                  className="inline-flex items-center rounded-full border border-white/15 px-6 py-3.5 text-sm transition-colors hover:border-fg/50"
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
              <p className="label mb-6">
                <span className="text-fg">✦</span> What I do
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <h3 className="font-display text-4xl font-medium leading-[1.02] tracking-[-0.045em] md:text-6xl">
                How I can <em className="font-serif font-normal italic tracking-normal text-accent">help</em> you.
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
