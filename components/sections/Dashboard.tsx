"use client";

import { useEffect, useRef } from "react";
import { Section } from "@/components/ui/Section";
import { SectionHead } from "@/components/ui/SectionHead";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { sectionNumber } from "@/lib/sections";
import { dashboard, sections } from "@/src/content";

const TITLE = sections.find((s) => s.id === "dashboard")!.title;
const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

const revenue = sum(dashboard.income);
const expenses = sum(dashboard.expenses);
const KPIS = [
  { label: dashboard.kpiLabels[0], value: revenue },
  { label: dashboard.kpiLabels[1], value: expenses },
  { label: dashboard.kpiLabels[2], value: revenue - expenses, hi: true },
  { label: dashboard.kpiLabels[3], value: dashboard.cash[dashboard.cash.length - 1] - dashboard.openingBalance },
];
const profit = dashboard.income.map((v, i) => v - dashboard.expenses[i]);

/* Chart geometry (SVG units). The line chart sits in a narrower column, so it gets its own width. */
const W = 600;
const LW = 380;
const H = 240;
const PAD = { l: 44, r: 8, t: 12, b: 26 };
const max = Math.ceil(Math.max(...dashboard.income) / 4000) * 4000;
const y = (v: number, top = max) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
const band = (W - PAD.l - PAD.r) / 12;

const pMax = Math.ceil(Math.max(...profit) / 2000) * 2000;
const pMin = Math.floor(Math.min(...profit) / 2000) * 2000;
const py = (v: number) => PAD.t + (1 - (v - pMin) / (pMax - pMin)) * (H - PAD.t - PAD.b);
const px = (i: number) => PAD.l + band * i + band / 2;
const lband = (LW - PAD.l - PAD.r) / 12;
const lx = (i: number) => PAD.l + lband * i + lband / 2;
const profitPath = profit.map((v, i) => `${i ? "L" : "M"}${lx(i).toFixed(1)} ${py(v).toFixed(1)}`).join("");

/**
 * [05] Dashboard: a technical sheet. On entry the KPI figures count up, bars rise from the
 * baseline, the profit line draws itself and the ledger rows slide in. The data is the
 * fictional sample from the old site and is labelled as such on the sheet.
 */
export function Dashboard() {
  const n = sectionNumber("dashboard");
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    setupGsap();
    const q = gsap.utils.selector(el);
    const nums = q("[data-count]");
    const setFinal = () => nums.forEach((nEl) => (nEl.textContent = fmt(Number(nEl.dataset.count))));
    if (prefersReducedMotion()) {
      setFinal();
      gsap.set(q("[data-line]"), { strokeDashoffset: 0 });
      return;
    }
    // Figures render final for no-JS / crawlers; the animation counts them up from zero.
    nums.forEach((nEl) => (nEl.textContent = "0"));
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 72%", once: true } });
      nums.forEach((nEl, i) => {
        const o = { v: 0 };
        tl.to(o, { v: Number(nEl.dataset.count), duration: 1.6, ease: "power3.out", onUpdate: () => (nEl.textContent = fmt(o.v)) }, i * 0.08);
      });
      tl.from(q("[data-bar]"), { scaleY: 0, transformOrigin: "50% 100%", duration: 0.9, ease: "expo.out", stagger: 0.025 }, 0.1)
        .from(q("[data-grid]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, ease: "drawer", stagger: 0.04 }, 0)
        .to(q("[data-line]"), { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.3)
        .from(q("[data-dot]"), { scale: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(3)", stagger: 0.06 }, 0.6)
        .from(q("[data-row]"), { x: -24, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.07 }, 0.5);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <Section id="dashboard" labelledBy="dashboard-title">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <SectionHead n={n} label="Dashboard" id="dashboard-title" title={TITLE} className="lg:col-span-8" titleClassName="max-w-[11ch]" />
        <div className="rounded-[6px] border border-dashed border-ink/30 p-4 lg:col-span-4">
          <p className="label flex items-center gap-2 text-ink">
            <span className="size-1.5 bg-money" />
            Fictional sample data
          </p>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink/75">
            {dashboard.company}. {dashboard.note}
          </p>
        </div>
      </div>

      <div ref={sheet} className="mt-14 overflow-hidden rounded-[6px] border border-ink/15 bg-sheet lg:mt-16">
        {/* Title block */}
        <div className="grid grid-cols-2 border-b border-ink/15 sm:grid-cols-4">
          {[
            ["Sheet", n],
            ["Entity", dashboard.company],
            ["Period", `${dashboard.months[0]}–${dashboard.months[11]}`],
            ["Status", "Sample"],
          ].map(([k, v], i) => (
            <div key={k} className={`px-4 py-3 ${i % 2 ? "" : "border-r"} border-ink/15 sm:border-r sm:last:border-r-0 ${i < 2 ? "border-b sm:border-b-0" : ""}`}>
              <p className="label text-[0.62rem] text-mute">{k}</p>
              <p className="label mt-1.5 truncate text-ink">{v}</p>
            </div>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-px bg-ink/10 lg:grid-cols-4">
          {KPIS.map((k) => (
            <div key={k.label} className={`min-w-0 px-3 py-5 sm:px-6 ${k.hi ? "bg-panel" : "bg-sheet"}`}>
              <p className="label leading-[1.3] text-mute">{k.label}</p>
              <p className="mt-4 flex items-baseline gap-1.5 sm:gap-2">
                <span aria-hidden className="size-2 shrink-0 bg-money" />
                <span data-count={k.value} className="font-[family-name:var(--font-pixel)] text-[clamp(1.4rem,2.6vw,2.2rem)] leading-none text-ink max-sm:text-[clamp(0.95rem,5vw,1.4rem)]">
                  {fmt(k.value)}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid border-t border-ink/15 lg:grid-cols-5">
          <figure className="border-b border-ink/15 p-4 sm:p-6 lg:col-span-3 lg:border-b-0 lg:border-r">
            <figcaption className="flex flex-wrap items-center justify-between gap-3">
              <span className="label text-ink">{dashboard.charts.bars}</span>
              <span className="label flex items-center gap-4 text-mute">
                <span className="flex items-center gap-1.5"><span className="size-2 bg-signal" />Income</span>
                <span className="flex items-center gap-1.5"><span className="size-2 bg-ink/25" />Expenses</span>
              </span>
            </figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={`Bar chart of monthly income and expenses, ${dashboard.months[0]} to ${dashboard.months[11]} (fictional).`}>
              {[0, 0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line data-grid x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} className="stroke-rule" strokeDasharray={f ? "3 3" : undefined} />
                  <text x={PAD.l - 8} y={y(max * f) + 3} textAnchor="end" className="fill-mute font-mono text-[11px]">
                    {fmt((max * f) / 1000)}k
                  </text>
                </g>
              ))}
              {dashboard.income.map((v, i) => (
                <g key={i}>
                  <rect data-bar x={PAD.l + band * i + band * 0.16} y={y(v)} width={band * 0.32} height={y(0) - y(v)} className="fill-signal" />
                  <rect data-bar x={PAD.l + band * i + band * 0.52} y={y(dashboard.expenses[i])} width={band * 0.32} height={y(0) - y(dashboard.expenses[i])} className="fill-ink/25" />
                  <text x={px(i)} y={H - 8} textAnchor="middle" className="fill-mute font-mono text-[11px] uppercase">
                    {dashboard.months[i]}
                  </text>
                </g>
              ))}
            </svg>
          </figure>

          <figure className="p-4 sm:p-6 lg:col-span-2">
            <figcaption className="label text-ink">{dashboard.charts.line}</figcaption>
            <svg viewBox={`0 0 ${LW} ${H}`} className="mt-4 w-full" role="img" aria-label={`Line chart of monthly net profit, ${dashboard.months[0]} to ${dashboard.months[11]} (fictional).`}>
              {[pMin, (pMin + pMax) / 2, pMax].map((v) => (
                <g key={v}>
                  <line data-grid x1={PAD.l} x2={LW - PAD.r} y1={py(v)} y2={py(v)} className="stroke-rule" strokeDasharray="3 3" />
                  <text x={PAD.l - 8} y={py(v) + 3} textAnchor="end" className="fill-mute font-mono text-[11px]">
                    {fmt(v / 1000)}k
                  </text>
                </g>
              ))}
              <path data-line d={profitPath} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} fill="none" className="stroke-ink" strokeWidth="2" strokeLinejoin="round" />
              {profit.map((v, i) => (
                <rect key={i} data-dot x={lx(i) - 3} y={py(v) - 3} width="6" height="6" className={i === profit.length - 1 ? "fill-signal" : "fill-sheet stroke-ink"} strokeWidth="1.5" />
              ))}
              {dashboard.months.map((m, i) =>
                i % 2 === 0 ? (
                  <text key={m} x={lx(i)} y={H - 8} textAnchor="middle" className="fill-mute font-mono text-[11px] uppercase">
                    {m}
                  </text>
                ) : null,
              )}
            </svg>
          </figure>
        </div>

        {/* Ledger rows */}
        <div className="overflow-x-auto border-t border-ink/15">
          <table className="w-full text-left sm:min-w-[640px]">
            <caption className="sr-only">Sample ledger entries (fictional)</caption>
            <thead>
              <tr className="border-b border-ink/15">
                {["Date", "Description", "Category", "Debit", "Credit"].map((h, i) => (
                  <th key={h} scope="col" className={`label px-3 py-3 font-normal text-mute sm:px-6 ${i > 2 ? "text-right" : ""} ${i === 0 || i === 2 ? "hidden sm:table-cell" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboard.rows.map((r) => (
                <tr key={r.date + r.description} data-row className="border-b border-ink/10 last:border-b-0">
                  <td className="hidden whitespace-nowrap px-4 py-3 font-mono text-[0.78rem] text-mute sm:table-cell sm:px-6">{r.date}</td>
                  <td className="w-full px-3 py-3 text-[0.92rem] leading-snug text-ink sm:w-auto sm:px-6">
                    {/* Phones: the date sits over the description instead of its own column */}
                    <span className="mb-1 block font-mono text-[0.72rem] text-mute sm:hidden">{r.date}</span>
                    {r.description}
                    <span className="label mt-1.5 block text-[0.62rem] text-ink/60 sm:hidden">{r.category}</span>
                  </td>
                  <td className="label hidden px-4 py-3 text-[0.66rem] text-ink/70 sm:table-cell sm:px-6">{r.category}</td>
                  <td className="px-3 py-3 text-right align-top font-mono text-[0.84rem] tabular-nums text-ink sm:px-6 sm:align-middle">{r.debit ? fmt(r.debit) : "—"}</td>
                  <td className="px-3 py-3 text-right align-top font-mono text-[0.84rem] tabular-nums text-signal sm:px-6 sm:align-middle">{r.credit ? fmt(r.credit) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
