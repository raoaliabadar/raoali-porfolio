"use client";

import { useRef } from "react";
import { useMagnetic } from "@/lib/animations/useMagnetic";

type Props = {
  href: string;
  children: React.ReactNode;
  kind?: "primary" | "secondary";
  className?: string;
};

/** A link styled as a bordered blueprint button, pulled towards the pointer. */
export function MagneticButton({ href, children, kind = "primary", className = "" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref, 0.25);
  const base =
    "group relative inline-flex h-12 items-center gap-3 overflow-hidden rounded-[6px] border px-5 font-mono text-[0.78rem] uppercase tracking-[0.08em] transition-colors duration-300";
  const look =
    kind === "primary"
      ? "border-signal bg-signal text-paper hover:bg-signal-deep"
      : "border-ink/25 bg-transparent text-ink hover:border-ink";
  return (
    <a ref={ref} href={href} className={`${base} ${look} ${className}`}>
      <span>{children}</span>
      <span aria-hidden className={`grid size-5 place-items-center border ${kind === "primary" ? "border-paper/40" : "border-ink/25"} transition-transform duration-300 group-hover:translate-x-0.5`}>
        <svg viewBox="0 0 10 10" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d={kind === "primary" ? "M5 1v8M1.5 5.5 5 9l3.5-3.5" : "M1 5h8M5.5 1.5 9 5 5.5 8.5"} />
        </svg>
      </span>
    </a>
  );
}
