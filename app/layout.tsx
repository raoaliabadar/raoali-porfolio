import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { site } from "@/lib/content";
// Self-hosted fonts (no runtime request to Google, works offline & is GDPR-friendly)
import "@fontsource/instrument-serif/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — ${site.title}`,
  description: site.intro,
  openGraph: {
    title: `${site.name} — ${site.title}`,
    description: site.intro,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: site.name, description: site.intro },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
