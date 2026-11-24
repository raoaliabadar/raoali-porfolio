"use client";

import gsap from "gsap";
import { Calculator, FileSpreadsheet, FileText, Landmark, Scale } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { CalculatorDemo, IncomeExpenseDemo, InvoiceDemo, ReconciliationDemo, SpreadsheetDemo } from "./AccountingDemos";
import { useDeck, type SlideProps } from "./SlideDeck";
import { Kicker, SampleTag, SlideFrame, SlideTitle } from "./ui";

const TABS = [
  { id: "sheet", label: "Spreadsheet", icon: FileSpreadsheet, note: "Transactions and a running balance" },
  { id: "pl", label: "Income & expenses", icon: Scale, note: "Net profit and margin" },
  { id: "calc", label: "Calculator", icon: Calculator, note: "Quick financial checks" },
  { id: "invoice", label: "Invoice", icon: FileText, note: "Line items, tax and status" },
  { id: "recon", label: "Reconciliation", icon: Landmark, note: "Bank statement vs ledger" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/** Slide 03: Understanding the Numbers. Five working accounting demonstrations. */
export function AccountingSlide({ visit }: SlideProps) {
  const { reduce } = useDeck();
  const [tab, setTab] = useState<Tab>("sheet");
  const panel = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (t: Tab) => {
    if (t === tab) return;
    setTab(t);
    // Rows of the new demo slide in.
    requestAnimationFrame(() => {
      const els = panel.current?.querySelectorAll("[data-reveal]");
      if (els?.length && !reduce) gsap.fromTo(els, { autoAlpha: 0, x: -18 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.045, ease: "power3.out", clearProps: "transform,opacity,visibility" });
    });
  };
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const n = (i + d + TABS.length) % TABS.length;
    select(TABS[n].id);
    tabRefs.current[n]?.focus();
  };

  return (
    <SlideFrame tone="cream">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-4">
          <Kicker n={3}>Accounting & Finance</Kicker>
          <SlideTitle className="text-forest">
            Understanding the <em className="text-bronze-ink">Numbers</em>
          </SlideTitle>
          <p data-reveal className="mt-5 max-w-md leading-relaxed text-muted">
            Five small, working demonstrations of everyday accounting: try them. All figures are invented sample data.
          </p>
          <div role="tablist" aria-label="Accounting demonstrations" aria-orientation="vertical" className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {TABS.map((t, i) => {
              const on = t.id === tab;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  data-reveal="row"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={on}
                  aria-controls="acc-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => select(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                  className={`flex shrink-0 items-center gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors ${
                    on ? "border-forest bg-forest text-beige" : "border-line bg-surface/70 text-fg hover:border-fg/25"
                  }`}
                >
                  <t.icon aria-hidden className={`size-5 shrink-0 ${on ? "text-bronze" : "text-bronze-ink"}`} />
                  <span>
                    <span className="block text-sm font-semibold">{t.label}</span>
                    <span className={`hidden text-xs lg:block ${on ? "text-beige/70" : "text-muted"}`}>{t.note}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          ref={panel}
          id="acc-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          data-reveal="card"
          className="min-w-0 rounded-[28px] border border-line bg-ink p-4 shadow-[0_30px_70px_-45px_rgb(20_39_31/0.6)] sm:p-6 lg:col-span-8"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">{TABS.find((t) => t.id === tab)?.label}</h3>
            <SampleTag />
          </div>
          {tab === "sheet" && <SpreadsheetDemo run={visit} />}
          {tab === "pl" && <IncomeExpenseDemo run={visit} />}
          {tab === "calc" && <CalculatorDemo />}
          {tab === "invoice" && <InvoiceDemo run={visit} />}
          {tab === "recon" && <ReconciliationDemo />}
        </div>
      </div>
    </SlideFrame>
  );
}
