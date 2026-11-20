import { Reveal } from "./Reveal";
import { RichText } from "./RichText";

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
    <div className="mb-14 grid gap-8 md:mb-20 md:grid-cols-12 md:items-end">
      <Reveal className="md:col-span-3">
        <p className="label flex items-center gap-3">
          <span className="text-fg">({index})</span>
          {label}
        </p>
      </Reveal>
      <Reveal delay={0.08} className="md:col-span-9">
        <h2 className="font-display text-[2.6rem] font-medium leading-[1] tracking-[-0.04em] md:text-6xl lg:text-[5.2rem]">
          <RichText text={title} emClassName={emClassName} />
        </h2>
      </Reveal>
      {aside && (
        <Reveal delay={0.16} className="md:col-span-9 md:col-start-4">
          {aside}
        </Reveal>
      )}
    </div>
  );
}
