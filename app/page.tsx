import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { PandaDesk } from "@/components/sections/PandaDesk";
import { About } from "@/components/sections/About";
import { Crm } from "@/components/sections/Crm";
import { Accounting } from "@/components/sections/Accounting";
import { Experience } from "@/components/sections/Experience";
import { Skills } from "@/components/sections/Skills";
import { Projects } from "@/components/sections/Projects";
import { Tools } from "@/components/sections/Tools";
import { Achievements } from "@/components/sections/Achievements";
import { Contact } from "@/components/sections/Contact";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <PandaDesk />
        <About />
        <Crm />
        <Accounting />
        <Experience />
        <Skills />
        <Projects />
        <Tools />
        <Achievements />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
