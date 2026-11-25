"use client";

import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DESK_BOOKS } from "./books";

/** The notes of the book that was taken off the desk, with its cover and browse controls. */
export function BookPanel({ index, onGo, onClose }: { index: number; onGo: (i: number) => void; onClose: () => void }) {
  const b = DESK_BOOKS[index];
  if (!b) return null;
  const n = DESK_BOOKS.length;
  const nav = "grid size-9 place-items-center rounded-full border border-line bg-surface text-fg transition-colors hover:border-fg/40";
  return (
    <div
      role="dialog"
      aria-label={`${b.title}: notes`}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[62%] overflow-y-auto rounded-[20px] border border-line bg-surface/95 p-4 shadow-[0_24px_60px_-24px_rgb(20_39_31/0.55)] backdrop-blur sm:inset-x-auto sm:left-4 sm:top-16 sm:bottom-auto sm:w-[340px] sm:max-h-[calc(100%-5.5rem)] sm:p-5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex gap-4">
        {/* Cover */}
        <div
          aria-hidden
          className="relative flex h-[132px] w-[92px] shrink-0 flex-col justify-between overflow-hidden rounded-[3px_8px_8px_3px] p-2.5 shadow-[inset_6px_0_0_rgb(0_0_0/0.18),0_10px_20px_-10px_rgb(0_0_0/0.5)]"
          style={{ background: b.color, color: b.ink }}
        >
          <span className="absolute inset-1.5 rounded-[2px] border opacity-60" style={{ borderColor: b.ink }} />
          <p className="relative font-display-serif text-[15px] leading-[1.05]">{b.title}</p>
          <p className="relative text-[7.5px] uppercase leading-tight tracking-[0.12em] opacity-80">{b.subtitle}</p>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">
            <BookOpen aria-hidden className="size-3.5" /> Book {index + 1} of {n}
          </p>
          <h3 className="mt-1 font-display-serif text-2xl leading-tight text-fg">{b.title}</h3>
          <p className="mt-1 text-sm text-muted">{b.subtitle}</p>
        </div>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-bronze-ink">Key notes</p>
      <ul className="mt-2 space-y-2">
        {b.notes.map((note) => (
          <li key={note} className="flex gap-2 text-sm leading-snug text-fg">
            <span aria-hidden className="mt-[0.45em] size-1.5 shrink-0 rounded-full" style={{ background: b.color === "#e6dfcf" ? "#14271f" : b.color }} />
            {note}
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="button" aria-label="Previous book" onClick={() => onGo((index - 1 + n) % n)} className={nav}>
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button type="button" aria-label="Next book" onClick={() => onGo((index + 1) % n)} className={nav}>
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
        <button type="button" onClick={onClose} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-semibold text-beige hover:bg-accent-strong-hover">
          <X aria-hidden className="size-4" /> Put it back
        </button>
      </div>
    </div>
  );
}
