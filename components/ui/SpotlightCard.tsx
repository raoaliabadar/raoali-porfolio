"use client";

import { useRef } from "react";

/** Card whose border + soft glow follow the cursor (CSS vars, no re-renders). */
export function SpotlightCard({
  className = "",
  children,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      onPointerMove={onPointerMove}
      className={`spotlight rounded-[24px] border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.04),0_20px_40px_-30px_rgb(80_60_40/0.3)] transition-shadow duration-500 hover:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_30px_60px_-30px_rgb(80_60_40/0.45)] ${className}`}
    >
      {children}
    </Tag>
  );
}
