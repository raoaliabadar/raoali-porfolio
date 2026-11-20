import { sectionIndex, tools } from "@/lib/content";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

/** Tools grouped by category. Empty groups (and an all-empty section) are hidden. */
export function Tools() {
  const groups = tools.filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <section id="tools" className="container-x py-24 md:py-36">
      <SectionHeading index={sectionIndex("tools")} label="Tools & Software" title="My everyday *toolkit*." />

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((g, i) => (
          <Reveal key={g.group} delay={i * 0.06}>
            <SpotlightCard as="article" className="group h-full p-7 md:p-8">
              <div className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-2xl border border-line bg-surface-2 text-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110">
                  <Icon name={g.icon} className="size-5" />
                </span>
                <h3 className="font-display text-2xl font-medium tracking-[-0.03em]">{g.group}</h3>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2">
                {g.items.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-center gap-2.5 rounded-2xl border border-line bg-ink/40 px-4 py-2.5 text-sm text-fg/75 transition-colors duration-300 hover:border-accent/40 hover:text-accent"
                  >
                    {t.icon && <BrandIcon name={t.icon} className="size-4" />}
                    {t.name}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
