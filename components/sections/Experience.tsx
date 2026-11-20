"use client";

import { PinnedSection, usePin } from "@/components/ui/Pinned";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { useId, useRef, useState } from "react";
import { experience, type Experience as Exp } from "@/lib/content";
import { ease } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Experience() {
  const listRef = useRef<HTMLOListElement>(null);
  const [open, setOpen] = useState<number | null>(0);

  if (experience.length === 0) return null;

  return (
    <PinnedSection id="experience" className="container-x py-24 md:py-36">
      <SectionHeading
        label="Experience"
        title="Where I've *added* value."
        aside={
          <p className="max-w-xs text-sm text-muted">
            Roles across accounting, billing, CRM management and customer operations.
          </p>
        }
      />

      <ol ref={listRef} className="relative">
        {/* Track + animated progress line */}
        <span aria-hidden className="absolute left-[7px] top-2 bottom-2 w-px bg-line md:left-[calc(25%+7px)]" />
        <ProgressLine listRef={listRef} className="absolute left-[7px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-accent via-accent to-accent/0 md:left-[calc(25%+7px)]" />

        {experience.map((item, i) => (
          <TimelineItem
            key={`${item.company}-${i}`}
            item={item}
            index={i}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? null : i)}
          />
        ))}
      </ol>
    </PinnedSection>
  );
}

function TimelineItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: Exp;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();

  return (
    <Reveal
      as="li"
      className="relative grid gap-3 pb-14 pl-10 last:pb-0 md:grid-cols-4 md:gap-10 md:pl-0"
    >
      {/* Meta column */}
      <div className="md:pr-10 md:text-right">
        <p className="font-mono text-sm text-fg/90">{item.period}</p>
        <p className="label mt-1">{item.location}</p>
      </div>

      {/* Dot */}
      <span
        aria-hidden
        className={`absolute left-0 top-1 grid size-[15px] place-items-center rounded-full border transition-colors duration-500 md:left-[25%] ${
          isOpen ? "border-accent bg-accent/20" : "border-line bg-ink"
        }`}
      >
        <span className={`size-[5px] rounded-full transition-colors duration-500 ${isOpen ? "bg-accent" : "bg-muted"}`} />
      </span>

      {/* Content */}
      <div className="md:col-span-3 md:pl-10">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="group flex w-full items-start justify-between gap-6 text-left"
        >
          <span>
            <span className="block font-display font-light tracking-[-0.035em] text-3xl leading-tight transition-colors group-hover:text-accent md:text-4xl">
              {item.role}
            </span>
            <span className="mt-1 block text-muted">
              {item.company} — {item.summary}
            </span>
          </span>
          <span
            className={`mt-1 grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
              isOpen ? "rotate-45 border-accent text-accent" : "border-line text-muted group-hover:border-fg/40 group-hover:text-fg"
            }`}
          >
            <Plus className="size-4" />
            <span className="sr-only">{isOpen ? "Hide details" : "Show details"}</span>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={panelId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              className="overflow-hidden"
            >
              <ul className="mt-6 space-y-3">
                {item.highlights.map((h, j) => (
                  <motion.li
                    key={j}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.1 + j * 0.06 }}
                    className="flex gap-3 text-fg/80"
                  >
                    <span aria-hidden className="mt-2.5 h-px w-4 shrink-0 bg-accent" />
                    {h}
                  </motion.li>
                ))}
              </ul>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tools used">
                {item.tools.map((s) => (
                  <li key={s} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted">
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

/** Timeline progress line: follows the pinned section's progress (or plain scroll as a fallback). */
function ProgressLine({ listRef, className }: { listRef: React.RefObject<HTMLOListElement | null>; className: string }) {
  const pin = usePin();
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 75%", "end 55%"] });
  const source = pin?.enabled ? pin.progress : scrollYProgress;
  const mapped = useTransform(source, (v) => (pin?.enabled ? Math.min(1, v / pin.portion) : v));
  const scaleY = useSpring(mapped, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return <motion.span aria-hidden style={{ scaleY }} className={className} />;
}
