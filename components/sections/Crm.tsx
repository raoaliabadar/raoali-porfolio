"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { crm } from "@/lib/content";
import { ease } from "@/lib/motion";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

const plain = (s: string) => s.replace(/\*/g, "");

export function Crm() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="crm" className="panel bg-[#07080d] py-24 md:py-32">
      {/* Red-orange glow from the top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,rgb(220_70_20/0.55),rgb(120_30_10/0.25)_45%,transparent_75%)]"
      />

      <div className="container-x relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.045em]">{plain(crm.heading)}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[#a8b5d6] md:text-lg">{crm.intro}</p>
        </Reveal>

        {/* Capabilities */}
        <ul className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {crm.capabilities.map((c, i) => (
            <Reveal as="li" key={c.title} delay={(i % 3) * 0.06} className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#1b2a52] to-[#0d1426] text-[#b9cbf2] shadow-[0_0_40px_-8px_rgb(80_130_255/0.45)]">
                <Icon name={c.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-medium tracking-[-0.02em]">{c.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-[0.95rem] leading-relaxed text-[#8e9ab8]">{c.description}</p>
            </Reveal>
          ))}
        </ul>

        {/* Platforms */}
        {crm.platforms.length > 0 && (
          <div className="mt-24">
            <Reveal>
              <h3 className="text-center text-2xl font-medium tracking-[-0.03em] md:text-3xl">Platforms I&apos;ve worked with</h3>
            </Reveal>
            <ul className="mx-auto mt-12 grid max-w-3xl gap-12 sm:grid-cols-2">
              {crm.platforms.map((p, i) => {
                const isOpen = open === i;
                return (
                  <Reveal as="li" key={p.name} delay={i * 0.06} className="text-center">
                    <span className="mx-auto grid size-16 place-items-center rounded-full bg-white/5 text-white shadow-[0_0_50px_-6px_rgb(255_106_26/0.55)] ring-1 ring-white/10">
                      {p.icon ? <BrandIcon name={p.icon} className="size-7" /> : <span className="text-xl font-semibold">{p.name[0]}</span>}
                    </span>
                    <p className="mt-5 text-lg font-medium">{p.name}</p>
                    <p className="mt-1 text-[#8e9ab8]">{p.summary}</p>
                    {p.details.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : i)}
                          aria-expanded={isOpen}
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent"
                        >
                          {isOpen ? "Hide details" : "What I did"}
                          <ChevronRight className={`size-4 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.ul
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.4, ease }}
                              className="overflow-hidden"
                            >
                              {p.details.map((d) => (
                                <li key={d} className="mt-2 text-sm text-[#a8b5d6] first:mt-4">
                                  {d}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </>
                    )}
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
