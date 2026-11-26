/** "[01] SECTION" label: mono, the number in the signal colour. */
export function Label({ n, children, className = "" }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`label flex items-center gap-2 text-ink ${className}`}>
      <span className="text-signal">[{n}]</span>
      <span>{children}</span>
    </p>
  );
}

/** A "+" registration mark, centred on its position. */
export function Plus({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 11 11" className={`pointer-events-none absolute size-[11px] -translate-x-1/2 -translate-y-1/2 text-ink/60 ${className}`}>
      <path d="M5.5 0v11M0 5.5h11" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}
