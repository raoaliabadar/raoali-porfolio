"use client";

import { useState } from "react";
import { platformGroups, platforms, type PlatformGroup } from "@/lib/content";
import { BrandIcon } from "@/components/ui/BrandIcon";
import type { SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

/** Slide 05: The Tools Behind My Work. Platform cards, filterable by what they're used for. */
export function ToolsSlide({ active, visit }: SlideProps) {
  const [group, setGroup] = useState<PlatformGroup | "all">("all");
  const current = platformGroups.find((g) => g.id === group);
  const tag = (id: PlatformGroup) => platformGroups.find((g) => g.id === id)?.tag ?? "";

  return (
    <SlideFrame>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-4">
          <Kicker n={5}>Tools & technology</Kicker>
          <SlideTitle className="text-forest">
            The Tools Behind <em className="text-bronze-ink">My Work</em>
          </SlideTitle>
          <p data-reveal className="mt-5 max-w-md leading-relaxed text-muted">
            The platforms I use across CRM management, billing, client operations, project management and business workflows.
          </p>
          <div data-reveal role="group" aria-label="Filter platforms by use" className="mt-6 flex flex-wrap gap-2">
            {[{ id: "all" as const, label: "All" }, ...platformGroups].map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
                className={`min-h-9 rounded-full border px-3 text-[0.8rem] font-medium transition-colors sm:min-h-10 sm:px-3.5 sm:text-sm ${
                  group === g.id ? "border-forest bg-forest text-beige" : "border-line bg-surface text-fg hover:border-fg/30"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p data-reveal className="mt-4 min-h-[3.25rem] max-w-md border-l-2 sm:mt-5 sm:min-h-[4.5rem] border-bronze pl-4 text-sm leading-relaxed text-fg" aria-live="polite">
            {current ? current.text : "Pick a category to see how those tools fit into the work."}
          </p>
        </div>

        {/* Phones: a compact list (logo · name + tag · one line of use). Larger screens: cards. */}
        <ul className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:col-span-8 xl:grid-cols-4">
          {platforms.map((p, i) => {
            const dim = group !== "all" && p.group !== group;
            return (
              <li
                key={p.name}
                data-reveal="card"
                className={`group relative grid grid-cols-[auto_1fr] items-center gap-x-3 rounded-[16px] border border-line bg-surface px-3.5 py-3 transition-[transform,opacity,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-bronze hover:shadow-[0_22px_40px_-26px_rgb(20_39_31/0.55)] sm:block sm:rounded-[18px] sm:p-5 lg:p-4 ${
                  dim ? "opacity-35" : "opacity-100"
                }`}
              >
                <div className="row-span-2 flex items-center justify-between gap-2 sm:row-auto">
                  {/* Fixed 1:1 tile holding a fixed 1:1 logo box, so every logo renders at the same size. */}
                  <span className="grid aspect-square size-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-cream text-forest transition-colors duration-300 group-hover:bg-forest group-hover:text-beige">
                    <span className="tool-logo grid aspect-square size-4 place-items-center">
                      {p.icon ? (
                        <BrandIcon name={p.icon} className="block size-full" />
                      ) : (
                        <span className="text-[0.62rem] font-bold leading-none tracking-tight">{p.mono}</span>
                      )}
                    </span>
                  </span>
                  <span className="hidden truncate text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted sm:inline">{tag(p.group)}</span>
                </div>
                <h3 className="flex min-w-0 items-baseline justify-between gap-2 overflow-hidden font-semibold sm:mt-3 sm:block">
                  {/* Re-keyed per visit so the names replay one by one each time the slide is shown. */}
                  <span
                    key={visit}
                    className={`block ${active ? "tool-name-in" : ""}`}
                    style={{ animationDelay: `${0.75 + i * 0.08}s` }}
                  >
                    {p.name}
                  </span>
                  <span className="shrink-0 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-muted sm:hidden">{tag(p.group)}</span>
                </h3>
                <p className="text-[0.8rem] leading-snug text-muted sm:mt-1 sm:text-sm lg:text-[0.8rem]">{p.use}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </SlideFrame>
  );
}
