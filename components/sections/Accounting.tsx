import { accounting } from "@/lib/content";
import { CapabilityGrid } from "@/components/ui/CapabilityGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Accounting() {
  return (
    <section id="accounting" className="container-x py-24 md:py-36">
      <SectionHeading
        label="Accounting & Financial Ops"
        title={accounting.heading}
        aside={<p className="max-w-xl text-fg/60">{accounting.intro}</p>}
      />

      <CapabilityGrid items={accounting.areas} />
    </section>
  );
}
