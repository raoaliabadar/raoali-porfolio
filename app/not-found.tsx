import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-svh flex-col items-start justify-center gap-6">
      <p className="label">Error 404</p>
      <h1 className="font-serif text-6xl md:text-8xl">
        Lost in <em className="text-accent">transit</em>.
      </h1>
      <Link href="/" className="rounded-full border border-line px-5 py-2.5 text-sm hover:border-accent hover:text-accent transition-colors">
        ← Back home
      </Link>
    </main>
  );
}
