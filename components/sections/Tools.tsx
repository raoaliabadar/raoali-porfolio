import { tools } from "@/lib/content";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

function Chip({ name, icon }: { name: string; icon?: string }) {
  return (
    <li className="flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-4 text-fg/70 transition-colors duration-300 hover:border-accent/40 hover:text-accent">
      {icon && <BrandIcon name={icon} className="size-5" />}
      <span className="whitespace-nowrap text-sm">{name}</span>
    </li>
  );
}

function Row({ items, reverse }: { items: typeof tools; reverse?: boolean }) {
  // Duplicated once so the -50% translate loops seamlessly.
  return (
    <div className="group mask-fade-x flex overflow-hidden">
      <ul
        className={`flex w-max gap-3 pr-3 group-hover:[animation-play-state:paused] ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        }`}
      >
        {[...items, ...items].map((t, i) => (
          <Chip key={`${t.name}-${i}`} {...t} />
        ))}
      </ul>
    </div>
  );
}

export function Tools() {
  const half = Math.ceil(tools.length / 2);
  return (
    <section id="tools" className="py-24 md:py-36">
      <div className="container-x">
        <SectionHeading index="05" label="Tools & Technologies" title="My everyday *toolkit*." />
      </div>

      {/* Animated marquee (hidden for reduced motion) */}
      <Reveal className="space-y-3 motion-reduce:hidden" aria-hidden>
        <Row items={tools.slice(0, half)} />
        <Row items={tools.slice(half)} reverse />
      </Reveal>

      {/* Static grid: shown for reduced motion + always available to screen readers */}
      <div className="container-x">
        <ul className="sr-only flex-wrap gap-3 motion-reduce:not-sr-only motion-reduce:flex" aria-label="Tools and technologies">
          {tools.map((t) => (
            <Chip key={t.name} {...t} />
          ))}
        </ul>
      </div>
    </section>
  );
}
