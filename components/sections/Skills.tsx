import { Cloud, Code2, Database, Layers, Server, Sparkles } from "lucide-react";
import { skills } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const icons = { code: Code2, server: Server, cloud: Cloud, layers: Layers, database: Database, sparkles: Sparkles };

export function Skills() {
  return (
    <section id="skills" className="container-x py-24 md:py-36">
      <SectionHeading index="03" label="Skills & Expertise" title="What I *bring* to the table." />

      <div className="grid gap-4 md:grid-flow-dense md:grid-cols-3">
        {skills.map((group, i) => {
          const Icon = icons[group.icon];
          return (
            <Reveal
              key={group.title}
              delay={i * 0.06}
              className={group.span === "wide" ? "md:col-span-2" : ""}
            >
              <SpotlightCard as="article" className="group flex h-full flex-col justify-between gap-10 p-7 md:p-8">
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl border border-line bg-surface-2 text-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110">
                    <Icon className="size-5" />
                  </span>
                  <span className="label">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-serif text-3xl md:text-4xl">{group.title}</h3>
                  <p className="mt-2 text-muted">{group.description}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {group.items.map((s, j) => (
                      <li
                        key={s}
                        style={{ transitionDelay: `${j * 30}ms` }}
                        className="rounded-full border border-line bg-ink/40 px-3 py-1 font-mono text-xs text-fg/75 transition-colors duration-300 group-hover:border-accent/30 group-hover:text-fg"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
