import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-[var(--gutter)] flex min-h-svh flex-col items-start justify-center gap-6 border-x border-rule px-6">
      <p className="label text-mute">
        <span className="text-signal">[404]</span> Entry not found
      </p>
      <h1 className="font-display text-[clamp(4rem,14vw,10rem)] font-[800] leading-[0.85]">Not in the ledger.</h1>
      <Link href="/" className="label rounded-[6px] border border-ink/25 px-5 py-3 transition-colors hover:border-ink">
        Back to the start
      </Link>
    </main>
  );
}
