import { accounting } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";

const plain = (s: string) => s.replace(/\*/g, "");
const pick = (idx: number[]) => idx.map((i) => accounting.areas[i]).filter(Boolean);

// Group the accounting areas into the three bento cards.
const billing = pick([0, 1, 7, 8]);
const records = pick([2, 3, 4]);
const reporting = pick([5, 6]);

const sampleRows = [
  ["INV-2031", "Client A", "1,250.00", "Paid"],
  ["INV-2032", "Client B", "860.00", "Overdue"],
  ["INV-2033", "Client C", "2,100.00", "Sent"],
];

function Items({ items }: { items: { title: string; description: string }[] }) {
  return (
    <ul className="mt-5 space-y-3">
      {items.map((a) => (
        <li key={a.title}>
          <p className="font-medium text-white">{a.title}</p>
          <p className="text-sm leading-relaxed text-white/70">{a.description}</p>
        </li>
      ))}
    </ul>
  );
}

export function Accounting() {
  return (
    <section id="accounting" className="panel bg-black py-24 md:py-32">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-medium leading-[1.02] tracking-[-0.045em]">{plain(accounting.heading)}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[#a8b5d6] md:text-lg">{accounting.intro}</p>
        </Reveal>

        <div className="mt-16 grid gap-3 md:grid-cols-2">
          <div className="grid gap-3">
            {/* Billing — warm gradient card */}
            <Reveal className="relative overflow-hidden rounded-[24px] bg-[radial-gradient(120%_90%_at_70%_100%,#ffd36b_0%,#ff8a1f_30%,#c83a06_62%,#3a1004_100%)] p-6 md:p-8">
              <p className="text-lg font-medium">Invoicing & billing</p>
              <Items items={billing} />
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 rounded-2xl border border-white/20 bg-black/80 px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-white/80">
                <li>Invoices</li>
                <li>Payments</li>
                <li>Follow-ups</li>
                <li>Reconciliation</li>
              </ul>
            </Reveal>

            {/* Records — blue card with sample tracker */}
            <Reveal className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#1a2748_0%,#2b4687_60%,#5f7dc2_100%)] p-6 md:p-8">
              <p className="text-lg font-medium">Financial records</p>
              <Items items={records} />
              <div className="mt-8 overflow-hidden rounded-2xl border border-white/25 bg-white/10 backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/15 px-4 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-white/70">
                  <span>Billing tracker</span>
                  <span>Illustration · sample data</span>
                </div>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {sampleRows.map(([ref, who, amt, st]) => (
                      <tr key={ref} className="border-b border-white/10 last:border-0">
                        <td className="px-4 py-2.5 tabular-nums">{ref}</td>
                        <td className="px-4 py-2.5 text-white/70">{who}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums">{amt}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              st === "Paid" ? "bg-emerald-400/20 text-emerald-200" : st === "Overdue" ? "bg-accent/25 text-orange-200" : "bg-white/15 text-white/80"
                            }`}
                          >
                            {st}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-3">
            {/* Statement — tall sunburst */}
            <Reveal className="sunburst relative grid min-h-[26rem] place-items-center overflow-hidden rounded-[24px] p-8">
              <div aria-hidden className="sunburst-core absolute left-1/2 top-1/2 aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
              <p className="relative text-center text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[0.95] tracking-[-0.05em] text-[#fff6c8] [text-shadow:0_2px_30px_rgb(255_140_0/0.6)]">
                Accurate records.
                <br />
                Clear reporting.
              </p>
            </Reveal>

            {/* Reporting — light-stripe card */}
            <Reveal className="stripes relative overflow-hidden rounded-[24px] p-6 text-center md:p-8">
              <p className="pt-6 text-[clamp(2.6rem,6vw,4.2rem)] font-medium leading-none tracking-[-0.05em]">Reports</p>
              <p className="mt-6 text-lg font-medium">Spreadsheets & reporting</p>
              <div className="mx-auto max-w-sm text-left">
                <Items items={reporting} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
