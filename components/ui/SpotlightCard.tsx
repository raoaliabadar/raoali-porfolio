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
      className={`spotlight rounded-3xl border border-line bg-surface ${className}`}
    >
      {children}
    </Tag>
  );
}
