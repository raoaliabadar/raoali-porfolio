"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { crm } from "@/lib/content";
import { ease } from "@/lib/motion";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { CapabilityGrid } from "@/components/ui/CapabilityGrid";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Crm() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="crm" className="relative py-24 md:py-36">

      <div className="container-x">
        <SectionHeading
          label="CRM Specialist"
          title={crm.heading}
          emClassName="text-cyan"
          aside={<p className="max-w-xl text-fg/60">{crm.intro}</p>}
        />

        <CapabilityGrid items={crm.capabilities} accent="text-cyan" />

        {crm.platforms.length > 0 && (
          <div className="mt-20">
            <Reveal>
              <p className="label mb-6">
                <span className="text-fg">✦</span> Platforms I&apos;ve worked with
              </p>
            </Reveal>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {crm.platforms.map((p, i) => {
                const expandable = p.details.length > 0;
                const isOpen = expandable && open === i;
                return (
                  <Reveal as="li" key={p.name} delay={(i % 3) * 0.06}>
                    <button
                      type="button"
                      onClick={expandable ? () => setOpen(isOpen ? null : i) : undefined}
                      disabled={!expandable}
                      aria-expanded={expandable ? isOpen : undefined}
                      className={`group w-full rounded-3xl border bg-surface p-6 text-left transition-colors duration-500 disabled:cursor-default ${
                        isOpen ? "border-cyan/50" : "border-line hover:border-cyan/30"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface-2 text-fg/80 transition-colors group-hover:text-cyan">
                          {p.icon ? (
                            <BrandIcon name={p.icon} className="size-5" />
                          ) : (
                            <span className="font-display text-lg font-semibold">{p.name.charAt(0)}</span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-xl font-medium tracking-[-0.03em]">{p.name}</span>
                          <span className="block truncate text-sm text-muted">{p.summary}</span>
                        </span>
                        {expandable && (
                          <span
                            className={`grid size-8 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                              isOpen ? "rotate-45 border-cyan text-cyan" : "border-line text-muted"
                            }`}
                          >
                            <Plus className="size-4" />
                          </span>
                        )}
                      </span>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.45, ease }}
                            className="overflow-hidden"
                          >
                            {p.details.map((d) => (
                              <li key={d} className="mt-3 flex gap-3 text-sm text-fg/75 first:mt-5">
                                <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-cyan" />
                                {d}
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </button>
                  </Reveal>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
