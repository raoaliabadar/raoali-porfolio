"use client";

import { useRef } from "react";
import { useDrawLines } from "@/lib/animations/useDrawLines";
import { Plus } from "./Label";

type Props = {
  id: string;
  labelledBy?: string;
  children: React.ReactNode;
  className?: string;
  /** Inner padding; sections that manage their own layout pass "none". */
  pad?: "default" | "none";
  /** Optional extra column rule, as a % from the left of the frame (desktop only). */
  column?: number;
};

/**
 * A blueprint sheet: framed by column rules with "+" registration marks at the corners.
 * The rules and marks draw themselves when the section enters.
 */
export function Section({ id, labelledBy, children, className = "", pad = "default", column }: Props) {
  const ref = useRef<HTMLElement>(null);
  useDrawLines(ref);
  return (
    <section id={id} ref={ref} aria-labelledby={labelledBy} className={`relative ${className}`}>
      <div aria-hidden className="pointer-events-none absolute inset-x-[var(--gutter)] inset-y-0">
        <div data-frame className="absolute inset-y-0 left-0 w-px bg-rule" />
        <div data-frame className="absolute inset-y-0 right-0 w-px bg-rule" />
        <div data-frame-x className="absolute inset-x-0 top-0 h-px bg-rule" />
        {column !== undefined && <div data-frame className="absolute inset-y-0 hidden w-px bg-rule lg:block" style={{ left: `${column}%` }} />}
        <span data-plus className="absolute left-0 top-0"><Plus /></span>
        <span data-plus className="absolute right-0 top-0"><Plus className="translate-x-1/2" /></span>
        {column !== undefined && (
          <span data-plus className="absolute top-0 hidden lg:block" style={{ left: `${column}%` }}><Plus /></span>
        )}
      </div>
      <div className={`relative mx-[var(--gutter)] ${pad === "default" ? "px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32" : ""}`}>{children}</div>
    </section>
  );
}
