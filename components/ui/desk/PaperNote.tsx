"use client";

import { forwardRef, useEffect } from "react";
import { playSound } from "./sound";

/**
 * Editable note glued onto the 3D paper (DeskScene positions it in perspective).
 * Transparent, so the visitor's handwriting-style text sits on the actual paper.
 */
export const PAPER_W = 440;
export const PAPER_H = 580;
export const NOTE_FONT = `"Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive`;
export const NOTE_LINE = 34;
export const NOTE_PAD_X = 34;
export const NOTE_PAD_TOP = 64;

export const PaperNote = forwardRef<HTMLTextAreaElement, { value: string; onChange: (v: string) => void }>(function PaperNote(
  { value, onChange },
  ref,
) {
  useEffect(() => {
    const t = setTimeout(() => (ref as React.RefObject<HTMLTextAreaElement | null>)?.current?.focus({ preventScroll: true }), 650);
    return () => clearTimeout(t);
  }, [ref]);

  return (
    <textarea
      ref={ref}
      value={value}
      maxLength={600}
      spellCheck={false}
      aria-label="Write on the paper"
      placeholder="Write something…"
      data-lenis-prevent
      onChange={(e) => {
        playSound("write");
        onChange(e.target.value);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="size-full resize-none overflow-hidden bg-transparent text-[#1f3a8a] caret-[#fe4f02] outline-none placeholder:text-[#1f3a8a]/35"
      style={{
        fontFamily: NOTE_FONT,
        fontSize: 22,
        lineHeight: `${NOTE_LINE}px`,
        padding: `${NOTE_PAD_TOP - NOTE_LINE + 8}px ${NOTE_PAD_X}px 24px`,
      }}
    />
  );
});
