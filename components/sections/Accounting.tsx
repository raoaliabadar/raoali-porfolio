import { accounting, sectionIndex } from "@/lib/content";
import { CapabilityGrid } from "@/components/ui/CapabilityGrid";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const sampleRows = [
  { ref: "INV-2031", party: "Client A", amount: "1,250.00", status: "Paid" },
  { ref: "INV-2032", party: "Client B", amount: "860.00", status: "Overdue" },
  { ref: "INV-2033", party: "Client C", amount: "2,100.00", status: "Sent" },
  { ref: "INV-2034", party: "Client D", amount: "540.00", status: "Paid" },
];

const statusClass: Record<string, string> = {
  Paid: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  Overdue: "border-accent/30 bg-[#fff6f1] text-cyan",
  Sent: "border-sky-600/25 bg-sky-50 text-sky-700",
};

/** Illustrative billing tracker — clearly labelled as sample data. */
function SampleTracker() {
  return (
    <div className="shadow-soft relative overflow-hidden rounded-[28px] border border-line bg-surface p-6 md:p-8">
      <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-accent/10 blur-[80px]" />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl font-medium tracking-[-0.03em]">Monthly billing tracker</p>
        <span className="rounded-full border border-line px-3 py-1 text-[0.68rem] font-medium uppercase tracking-[0.1em] text-muted">
          Illustration · sample data
        </span>
      </div>
      <div className="relative mt-6 overflow-x-auto">
        <table className="w-full min-w-[26rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="label py-3 font-normal">Invoice</th>
              <th className="label py-3 font-normal">Client</th>
              <th className="label py-3 text-right font-normal">Amount</th>
              <th className="label py-3 text-right font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((r) => (
              <tr key={r.ref} className="border-b border-line/60 transition-colors hover:bg-surface-2">
                <td className="py-3 tabular-nums text-fg/90">{r.ref}</td>
                <td className="py-3 text-fg/70">{r.party}</td>
                <td className="py-3 text-right tabular-nums text-fg/90">{r.amount}</td>
                <td className="py-3 text-right">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${statusClass[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="relative mt-6 grid grid-cols-3 gap-4 text-sm">
        {[
          ["Billed", "4,750.00"],
          ["Collected", "1,790.00"],
          ["Outstanding", "2,960.00"],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="label">{k}</p>
            <p className="mt-1 font-display text-lg font-light tabular-nums md:text-2xl">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Accounting() {
  return (
    <section id="accounting" className="container-x py-24 md:py-36">
      <SectionHeading
        index={sectionIndex("accounting")}
        label="Accounting & Financial Ops"
        title={accounting.heading}
        aside={<p className="max-w-xl text-fg/60">{accounting.intro}</p>}
      />

      <CapabilityGrid items={accounting.areas} />

      <Reveal className="mt-4">
        <SampleTracker />
      </Reveal>
    </section>
  );
}
