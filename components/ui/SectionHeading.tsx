import { Reveal } from "./Reveal";
import { RichText } from "./RichText";

/** Small pill label with an accent dot, e.g. "02 · CRM Specialist". */
export function Eyebrow({ index, children }: { index?: string; children: React.ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      {index && <span className="text-fg">{index}</span>}
      {children}
    </p>
  );
}

export function SectionHeading({
  index,
  label,
  title,
  aside,
  emClassName,
}: {
  index: string;
  label: string;
  title: string;
  aside?: React.ReactNode;
  emClassName?: string;
}) {
  return (
    <div className="mb-14 grid gap-6 md:mb-20 md:grid-cols-12 md:items-end">
      <div className="md:col-span-7">
        <Reveal>
          <Eyebrow index={index}>{label}</Eyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 font-display text-[clamp(2.2rem,4.5vw,3.9rem)] font-light leading-[1.05] tracking-[-0.035em]">
            <RichText text={title} emClassName={emClassName} />
          </h2>
        </Reveal>
      </div>
      {aside && (
        <Reveal delay={0.16} className="text-[1.0625rem] leading-relaxed md:col-span-5">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
