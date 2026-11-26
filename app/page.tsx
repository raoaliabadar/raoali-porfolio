import { About } from "@/components/sections/About";
import { Accounting } from "@/components/sections/Accounting";
import { Ask } from "@/components/sections/Ask";
import { Contact } from "@/components/sections/Contact";
import { Dashboard } from "@/components/sections/Dashboard";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Statement } from "@/components/sections/Statement";
import { Tools } from "@/components/sections/Tools";
import { Workflow } from "@/components/sections/Workflow";
import { ContactPanel } from "@/components/ui/ContactPanel";
import { Nav } from "@/components/ui/Nav";
import { Preloader } from "@/components/ui/Preloader";

/**
 * THE LEDGER BLUEPRINT. Every word comes from src/content.ts.
 * Experience is left out until there is real experience data (see content.ts).
 */
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
        <Workflow />
        <Dashboard />
        <Tools />
        <Projects />
        <Ask />
      </main>
      <Contact />
      <ContactPanel />
    </>
  );
}
