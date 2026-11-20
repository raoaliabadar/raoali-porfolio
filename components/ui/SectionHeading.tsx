import { Reveal } from "./Reveal";
import { RichText } from "./RichText";

export function SectionHeading({
  index,
  label,
  title,
  aside,
}: {
  index: string;
  label: string;
  title: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
      <div>
        <Reveal>
          <p className="label mb-5 flex items-center gap-3">
            <span className="text-accent">{index}</span>
            <span className="h-px w-8 bg-line" aria-hidden />
            {label}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="max-w-3xl font-serif text-[2.6rem] leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            <RichText text={title} />
          </h2>
        </Reveal>
      </div>
      {aside && <Reveal delay={0.16}>{aside}</Reveal>}
    </div>
  );
}
