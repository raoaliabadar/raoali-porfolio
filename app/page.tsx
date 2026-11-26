import { About } from "@/components/sections/About";
import { Accounting } from "@/components/sections/Accounting";
import { Hero } from "@/components/sections/Hero";
import { Statement } from "@/components/sections/Statement";
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
        <About />
        <Accounting />
        <Statement />
      </main>
    </>
  );
}
