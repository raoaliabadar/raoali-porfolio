import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Statement } from "@/components/sections/Statement";
import { Crm } from "@/components/sections/Crm";
import { Accounting } from "@/components/sections/Accounting";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main" className="flex flex-col gap-3">
        <Hero />
        <About />
        <Statement lines={["Accurate numbers.", "Not guesswork."]} sub="Financial records, billing and CRM data — handled carefully, every time." />
        <Crm />
        <Accounting />
        <Skills />
        <Experience />
        <Projects />
        <Achievements />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
