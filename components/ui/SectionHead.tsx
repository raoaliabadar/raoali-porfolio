"use client";

import { useRef } from "react";
import { useSplitReveal } from "@/lib/animations/useSplitReveal";
import { Label } from "./Label";

type Props = {
  n: string;
  label: string;
  id: string;
  title: string;
  className?: string;
  titleClassName?: string;
};

/** "[0X] LABEL" over a condensed uppercase heading that reveals line by line from a mask. */
export function SectionHead({ n, label, id, title, className = "", titleClassName = "" }: Props) {
  const h = useRef<HTMLHeadingElement>(null);
  useSplitReveal(h, { stagger: 0.09 });
  return (
    <div className={className}>
      <Label n={n}>{label}</Label>
      <h2
        id={id}
        ref={h}
        className={`font-display mt-5 text-[clamp(2.15rem,5.48vw,4.75rem)] font-[700] leading-[0.86] text-ink ${titleClassName}`}
      >
        {title}
      </h2>
    </div>
  );
}
