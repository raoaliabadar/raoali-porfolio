import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-svh flex-col items-start justify-center gap-6">
      <p className="label">Error 404</p>
      <h1 className="font-display text-6xl font-medium tracking-[-0.05em] md:text-8xl">
        Lost in <em className="font-serif italic text-accent">space</em>.
      </h1>
      <Link href="/" className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-accent hover:text-accent transition-colors">
        ← Back home
      </Link>
    </main>
  );
}
