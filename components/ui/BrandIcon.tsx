import * as icons from "simple-icons";

type SimpleIcon = { title: string; path: string; hex: string };

/** Renders a brand logo from the simple-icons package by export name, e.g. "siReact". */
export function BrandIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const icon = (icons as unknown as Record<string, SimpleIcon | undefined>)[name];
  if (!icon) return null;
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}
