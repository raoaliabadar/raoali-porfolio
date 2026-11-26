import { Hero } from "@/components/sections/Hero";
import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/ui/Preloader";

/** THE LEDGER BLUEPRINT. Sections are added one at a time. */
export default function Home() {
  return (
    <>
      <Preloader />
      <Nav />
      <main id="main">
        <Hero />
        {/* Next: [02] About. This spacer only gives the pinned hero room to finish while it is the last section. */}
        <div aria-hidden className="h-[60vh]" />
      </main>
    </>
  );
}
