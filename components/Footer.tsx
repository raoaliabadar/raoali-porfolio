import { site } from "@/lib/content";
import { LocalClock } from "@/components/ui/LocalClock";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x grid grid-cols-2 gap-4 py-8 md:grid-cols-4">
        <p className="label flex items-center gap-3">
          <Logo className="h-4 w-auto text-fg" />© {new Date().getFullYear()} {site.name}
        </p>
        <p className="label hidden md:block">{site.location}</p>
        <p className="label hidden md:block">
          Local time <LocalClock timezone={site.timezone} className="text-fg" />
        </p>
        <a href="#top" className="label inline-flex min-h-11 items-center justify-self-end transition-colors hover:text-accent-ink">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
