import type { Metadata, Viewport } from "next";
import { Cursor } from "@/components/ui/Cursor";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { about, hero, identity } from "@/src/content";
// Self-hosted fonts (no runtime request to Google).
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/inter-tight/index.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "@fontsource/silkscreen/400.css";
import "./globals.css";

const title = `${identity.name} | ${identity.title}`;

export const metadata: Metadata = {
  metadataBase: new URL(identity.url),
  title,
  description: hero.intro,
  openGraph: { title, description: about.intro, url: identity.url, siteName: identity.name, type: "website" },
  twitter: { card: "summary_large_image", title: identity.name, description: hero.intro },
};

export const viewport: Viewport = {
  themeColor: "#f3f1ec",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main"
          className="label sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-[4px] focus:bg-signal focus:px-4 focus:py-3 focus:text-paper"
        >
          Skip to content
        </a>
        <SmoothScroll />
        <Cursor />
        {children}
      </body>
    </html>
  );
}
