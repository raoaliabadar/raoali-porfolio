import { siGoogle, siHubspot, siStripe, siTrello, siZoho } from "simple-icons";

type SimpleIcon = { title: string; path: string; hex: string };

/**
 * Only the logos the site uses are imported: importing the whole simple-icons
 * package adds ~5 MB of JavaScript to the page.
 * To use another logo (see https://simpleicons.org), import it above and add it here.
 */
const ICONS: Record<string, SimpleIcon> = { siGoogle, siHubspot, siStripe, siTrello, siZoho };

/** Renders a brand logo by simple-icons export name, e.g. "siHubspot". */
export function BrandIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const icon = ICONS[name];
  if (!icon) return null;
  return (
    <svg role="img" viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={icon.path} />
    </svg>
  );
}
