"use client";

import type { Chart as ChartType } from "chart.js";
import { ArrowDownRight, ArrowUpRight, Banknote, Landmark, Receipt, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { monthlyCash, monthlyExpenses, monthlyIncome, months, OPENING_BALANCE, SAMPLE_COMPANY, sum } from "@/lib/sample-data";
import { useDeck, type SlideProps } from "./SlideDeck";
import { CountUp, Kicker, SampleTag, SlideFrame, SlideTitle } from "./ui";

const RANGES = { 6: "Last 6 months", 12: "Last 12 months" } as const;
type Range = keyof typeof RANGES;

const BEIGE = "#f4f1e9";
const SAGE = "#78917c";
const BRONZE = "#b18a55";
const GRID = "rgba(244,241,233,0.08)";
const TICK = "rgba(244,241,233,0.62)";

/** Slide 04: Numbers in Motion. KPI counters and two Chart.js charts (fictional data). */
export function DashboardSlide({ active, near, visit }: SlideProps) {
  const { reduce } = useDeck();
  const [range, setRange] = useState<Range>(12);
  const barRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLCanvasElement>(null);
  const charts = useRef<{ bar?: ChartType; line?: ChartType }>({});
  const [ready, setReady] = useState(false);

  const from = 12 - range;
  const inc = monthlyIncome.slice(from);
  const exp = monthlyExpenses.slice(from);
  const labels = months.slice(from);
  const profit = inc.map((v, i) => v - exp[i]);
  const cashStart = from === 0 ? OPENING_BALANCE : monthlyCash[from - 1];
  const kpis = {
    revenue: sum(inc),
    expenses: sum(exp),
    profit: sum(profit),
    cash: monthlyCash[11] - cashStart,
  };

  // Build the charts once the slide is close (Chart.js is loaded on demand).
  useEffect(() => {
    if (!near || charts.current.bar) return;
    let dead = false;
    (async () => {
      const C = await import("chart.js");
      if (dead || !barRef.current || !lineRef.current) return;
      C.Chart.register(C.BarController, C.BarElement, C.LineController, C.LineElement, C.PointElement, C.CategoryScale, C.LinearScale, C.Tooltip, C.Legend, C.Filler);
      C.Chart.defaults.font.family = "'Manrope Variable', system-ui, sans-serif";
      C.Chart.defaults.color = TICK;
      const scales = {
        x: { grid: { display: false }, ticks: { color: TICK } },
        y: { grid: { color: GRID }, border: { display: false }, ticks: { color: TICK, callback: (v: string | number) => `${Number(v) / 1000}k` } },
      };
      const legend = { labels: { color: BEIGE, usePointStyle: true, pointStyle: "rectRounded" as const, boxWidth: 10, padding: 14 } };
      charts.current.bar = new C.Chart(barRef.current, {
        type: "bar",
        data: {
          labels: months,
          datasets: [
            { label: "Income", data: monthlyIncome, backgroundColor: SAGE, borderRadius: 5, maxBarThickness: 18 },
            { label: "Expenses", data: monthlyExpenses, backgroundColor: BRONZE, borderRadius: 5, maxBarThickness: 18 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: reduce ? false : { duration: 1100, easing: "easeOutQuart" },
          plugins: { legend },
          scales,
        },
      });
      charts.current.line = new C.Chart(lineRef.current, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            {
              label: "Net profit",
              data: monthlyIncome.map((v, i) => v - monthlyExpenses[i]),
              borderColor: BEIGE,
              backgroundColor: "rgba(177,138,85,0.22)",
              fill: true,
              tension: 0.35,
              pointRadius: 3,
              pointBackgroundColor: BRONZE,
              borderWidth: 2.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: reduce ? false : { duration: 1300, easing: "easeOutQuart" },
          plugins: { legend },
          scales,
        },
      });
      setReady(true);
    })();
    return () => {
      dead = true;
    };
  }, [near, reduce]);

  useEffect(
    () => () => {
      charts.current.bar?.destroy();
      charts.current.line?.destroy();
    },
    [],
  );

  // Range change: update the data (Chart.js animates between the two states).
  useEffect(() => {
    const { bar, line } = charts.current;
    if (!bar || !line) return;
    bar.data.labels = labels;
    bar.data.datasets[0].data = inc;
    bar.data.datasets[1].data = exp;
    line.data.labels = labels;
    line.data.datasets[0].data = profit;
    bar.update();
    line.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, ready]);

  // Each time the slide is shown, the charts draw in again from zero.
  useEffect(() => {
    if (!active || !ready || reduce) return;
    const { bar, line } = charts.current;
    const t = setTimeout(() => {
      bar?.reset();
      bar?.update();
      line?.reset();
      line?.update();
    }, 350);
    return () => clearTimeout(t);
  }, [active, visit, ready, reduce]);

  const cards = [
    { label: "Total revenue", value: kpis.revenue, icon: Banknote, trend: "up" },
    { label: "Total expenses", value: kpis.expenses, icon: Receipt, trend: "down" },
    { label: "Net profit", value: kpis.profit, icon: TrendingUp, trend: "up", hi: true },
    { label: "Net cash flow", value: kpis.cash, icon: Landmark, trend: "up" },
  ];

  return (
    <SlideFrame tone="dark">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Kicker n={4} dark>
            Financial dashboard
          </Kicker>
          <SlideTitle className="text-beige">
            Numbers in <em className="text-bronze">Motion</em>
          </SlideTitle>
        </div>
        <div data-reveal className="flex flex-col items-start gap-2 sm:items-end">
          <SampleTag dark />
          <div role="group" aria-label="Period" className="flex rounded-full border border-beige/20 p-1">
            {([6, 12] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${range === r ? "bg-beige text-forest" : "text-beige/75 hover:text-beige"}`}
              >
                {RANGES[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <article
            key={c.label}
            data-reveal="card"
            className={`rounded-[18px] border p-4 sm:p-5 ${c.hi ? "border-bronze/50 bg-bronze/15" : "border-beige/12 bg-beige/[0.04]"}`}
          >
            <div className="flex items-center justify-between text-beige/70">
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">{c.label}</span>
              <c.icon aria-hidden className="size-4 text-bronze" />
            </div>
            <p className="mt-3 font-display-serif text-3xl text-beige sm:text-4xl">
              <CountUp value={c.value} run={`${visit}-${range}`} />
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-beige/60">
              {c.trend === "up" ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />}
              {RANGES[range].toLowerCase()}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        <figure data-reveal="card" className="rounded-[18px] border border-beige/12 bg-beige/[0.04] p-4 lg:col-span-3">
          <figcaption className="text-sm font-semibold text-beige">Income vs expenses</figcaption>
          <div className="relative mt-2 h-52 sm:h-60">
            <canvas ref={barRef} role="img" aria-label={`Bar chart of monthly income and expenses, ${RANGES[range].toLowerCase()}.`} />
          </div>
        </figure>
        <figure data-reveal="card" className="rounded-[18px] border border-beige/12 bg-beige/[0.04] p-4 lg:col-span-2">
          <figcaption className="text-sm font-semibold text-beige">Monthly performance (net profit)</figcaption>
          <div className="relative mt-2 h-52 sm:h-60">
            <canvas ref={lineRef} role="img" aria-label={`Line chart of monthly net profit, ${RANGES[range].toLowerCase()}.`} />
          </div>
        </figure>
      </div>
      <p data-reveal className="mt-3 text-xs text-beige/55">
        {SAMPLE_COMPANY}. Figures are invented for demonstration.
      </p>
    </SlideFrame>
  );
}
