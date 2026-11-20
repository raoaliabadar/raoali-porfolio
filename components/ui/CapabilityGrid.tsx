import type { Capability } from "@/lib/content";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";
import { SpotlightCard } from "./SpotlightCard";

/** Bento grid of capability cards ("wide" spans two columns on desktop). */
export function CapabilityGrid({ items, accent = "text-accent" }: { items: Capability[]; accent?: string }) {
  // On the 2-column (tablet) layout, stretch the last card if it would leave a gap.
  const cells = items.reduce((n, c) => n + (c.span === "wide" ? 2 : 1), 0);
  const fillLast = cells % 2 === 1;
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-flow-dense md:grid-cols-3">
      {items.map((c, i) => (
        <Reveal
          key={c.title}
          delay={(i % 3) * 0.06}
          className={
            c.span === "wide"
              ? "sm:col-span-2"
              : fillLast && i === items.length - 1
                ? "sm:col-span-2 md:col-span-1"
                : ""
          }
        >
          <SpotlightCard as="article" className="group flex h-full flex-col justify-between gap-8 p-6 md:p-7">
            <div className="flex items-start justify-between">
              <span
                className={`grid size-11 place-items-center rounded-2xl border border-line bg-surface-2 ${accent} transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-110`}
              >
                <Icon name={c.icon} className="size-5" />
              </span>
            </div>
            <div>
              <h3 className="font-display text-xl font-medium tracking-[-0.03em] md:text-2xl">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{c.description}</p>
            </div>
          </SpotlightCard>
        </Reveal>
      ))}
    </div>
  );
}
