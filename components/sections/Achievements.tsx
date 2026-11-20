import { ArrowUpRight } from "lucide-react";
import { achievements, sectionIndex } from "@/lib/content";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Achievements() {
  if (!achievements.metrics.length && !achievements.list.length) return null;

  return (
    <section id="achievements" className="container-x py-24 md:py-36">
      <SectionHeading index={sectionIndex("achievements")} label="Education & Certifications" title="Highlights *along* the way." />

      {achievements.metrics.length > 0 && (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
        {achievements.metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.06} className="bg-surface p-6 md:p-10">
            <p className="font-display font-light tracking-[-0.04em] text-5xl text-fg md:text-7xl">
              <CountUp value={m.value} suffix={m.suffix} />
            </p>
            <p className="label mt-3 normal-case tracking-normal md:text-sm">{m.label}</p>
          </Reveal>
        ))}
      </div>
      )}

      <ul className={`${achievements.metrics.length ? "mt-16 " : ""}border-t border-line`}>
        {achievements.list.map((a, i) => (
          <Reveal
            as="li"
            key={a.title}
            delay={i * 0.05}
            className="group relative isolate grid grid-cols-[4rem_1fr_auto] items-center gap-4 border-b border-line py-6 md:grid-cols-[8rem_1fr_10rem_auto] md:py-8"
          >
              <span
                aria-hidden
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-surface transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              />
              <span className="font-mono text-sm text-muted md:pl-4">{a.year}</span>
              <span className="font-display font-light tracking-[-0.03em] text-xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 md:text-3xl">
                {a.title}
              </span>
              <span className="label hidden md:block">{a.type}</span>
              <ArrowUpRight
                aria-hidden
                className="size-5 text-muted transition-all duration-500 group-hover:rotate-45 group-hover:text-accent md:mr-4"
              />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
