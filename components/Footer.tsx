import { site } from "@/lib/content";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col items-start justify-between gap-4 py-8 text-sm text-muted md:flex-row md:items-center">
        <p>
          © {new Date().getFullYear()} {site.name}. Designed &amp; built with care.
        </p>
        <a href="#top" className="transition-colors hover:text-accent">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
