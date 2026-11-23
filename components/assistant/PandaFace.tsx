"use client";

import { useEffect, useState } from "react";
import { PANDA_MOOD_EVENT, getPandaMood, type PandaMood, type PandaMoodEvent } from "@/lib/panda";

/** Subscribe to the shared panda mood. */
export function usePandaMood() {
  const [mood, setMood] = useState<PandaMood>("idle");
  useEffect(() => {
    setMood(getPandaMood());
    const on = (e: Event) => setMood((e as CustomEvent<PandaMoodEvent>).detail.mood);
    window.addEventListener(PANDA_MOOD_EVENT, on);
    return () => window.removeEventListener(PANDA_MOOD_EVENT, on);
  }, []);
  return mood;
}

/**
 * Lightweight 2D panda face for the floating button (no WebGL), animated with CSS:
 * blinks when idle, closes its eyes + "z" when sleeping, pulse ring when listening,
 * thought dots when thinking, moving mouth when talking.
 */
export function PandaFace({ mood, className = "" }: { mood: PandaMood; className?: string }) {
  const asleep = mood === "sleeping";
  return (
    <span className={`panda-face relative block ${className}`} data-mood={mood} aria-hidden>
      <svg viewBox="0 0 64 64" className="size-full overflow-visible">
        {/* ears */}
        <circle cx="15" cy="15" r="9" fill="#1d1c22" />
        <circle cx="49" cy="15" r="9" fill="#1d1c22" />
        {/* head */}
        <ellipse cx="32" cy="34" rx="24" ry="22" fill="#f7f5f1" />
        {/* eye patches */}
        <ellipse cx="22" cy="32" rx="7" ry="9" transform="rotate(25 22 32)" fill="#1d1c22" />
        <ellipse cx="42" cy="32" rx="7" ry="9" transform="rotate(-25 42 32)" fill="#1d1c22" />
        {/* eyes */}
        {asleep ? (
          <g stroke="#f7f5f1" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M18.5 32.5q3.5 2.5 7 0" />
            <path d="M38.5 32.5q3.5 2.5 7 0" />
          </g>
        ) : (
          <g className="panda-face-eyes">
            <circle cx="22.5" cy="31.5" r="3.2" fill="#fff" />
            <circle cx="41.5" cy="31.5" r="3.2" fill="#fff" />
            <circle cx="23" cy="31.8" r="1.9" fill="#0d0c10" />
            <circle cx="42" cy="31.8" r="1.9" fill="#0d0c10" />
          </g>
        )}
        {/* blush */}
        <circle cx="15" cy="41" r="3.2" fill="#f2968c" opacity=".45" />
        <circle cx="49" cy="41" r="3.2" fill="#f2968c" opacity=".45" />
        {/* nose + mouth */}
        <ellipse cx="32" cy="40" rx="3.6" ry="2.4" fill="#16151a" />
        {mood === "talking" ? (
          <ellipse className="panda-face-talk" cx="32" cy="46" rx="3" ry="2.4" fill="#5a2a2a" />
        ) : (
          <path d="M28.5 44.5q3.5 3.2 7 0" stroke="#2a2228" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        )}
      </svg>
      {asleep && <span className="panda-face-z absolute -right-1 -top-2 text-xs font-bold text-muted">z</span>}
      {mood === "thinking" && (
        <span className="absolute -right-1 -top-1 flex gap-0.5">
          <span className="panda-dot size-1.5 rounded-full bg-accent" />
          <span className="panda-dot size-1.5 rounded-full bg-accent [animation-delay:.15s]" />
          <span className="panda-dot size-1.5 rounded-full bg-accent [animation-delay:.3s]" />
        </span>
      )}
    </span>
  );
}
