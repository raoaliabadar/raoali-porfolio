"use client";

import { useState } from "react";
import { ICONS, type IconName } from "@/components/blueprint/iso";
import { openBooks, openNote } from "@/lib/desk";
import { CALC_OPS, calcPress, closeComputer, navigate, setNotes, setQuery, useComputer, type AppId } from "@/lib/computer";
import { accounting, computer as copy, dashboard, desk } from "@/src/content";

/* ---------------- Shared figures (the dashboard's fictional sample) ---------------- */

const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);
export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const M = dashboard.months;
const INC = dashboard.income;
const EXP = dashboard.expenses;
const REVENUE = sum(INC);
const EXPENSES = sum(EXP);
const NET = REVENUE - EXPENSES;
const CLOSING_CASH = dashboard.cash[dashboard.cash.length - 1];
const NET_CASH = CLOSING_CASH - dashboard.openingBalance;
/** Equity at year end = opening capital + the year's profit; the part not in the bank is still owed by clients. */
const EQUITY = dashboard.openingBalance + NET;
const RECEIVABLE = EQUITY - CLOSING_CASH;
const LEDGER = (() => {
  let bal = dashboard.openingBalance;
  return dashboard.rows.map((r, i) => {
    bal += r.credit - r.debit;
    return { ...r, i, balance: bal };
  });
})();

export const APP_ICON: Record<AppId, IconName> = {
  dashboard: "chart",
  reports: "ledger",
  flows: "transfer",
  balance: "check",
  transactions: "reconcile",
  calculator: "calculator",
  documents: "invoice",
  notes: "notes",
};

/** A wireframe icon drawn in the screen's ink (no draw-in animation). */
export function AppIcon({ id, className = "" }: { id: AppId; className?: string }) {
  const icon = ICONS[APP_ICON[id]];
  return (
    <svg viewBox={icon.viewBox} className={className} aria-hidden>
      {icon.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.face === "line" ? "none" : p.accent ? "#2f6b4f" : "rgba(255,255,255,0.04)"}
          stroke={p.accent ? "#8db39e" : "currentColor"}
          strokeWidth={0.9}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/* ---------------- Small building blocks ---------------- */

const Tile = ({ k, v, hi }: { k: string; v: string; hi?: boolean }) => (
  <div className={`rounded-[3px] border px-3 py-2.5 ${hi ? "border-[#8db39e]/50 bg-[#2f6b4f]/30" : "border-white/10 bg-white/[0.03]"}`}>
    <p className="text-[0.62rem] uppercase tracking-[0.08em] text-white/55">{k}</p>
    <p className="mt-1.5 flex items-center gap-1.5 text-[1.05rem] tabular-nums text-white sm:text-[1.2rem]">
      <span aria-hidden className="size-[6px] shrink-0 bg-[#c9a24a]" />
      {v}
    </p>
  </div>
);

const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={on}
    className={`rounded-[3px] border px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.06em] transition-colors ${
      on ? "border-[#8db39e] bg-[#2f6b4f] text-white" : "border-white/15 text-white/70 hover:border-white/40 hover:text-white"
    }`}
  >
    {children}
  </button>
);

const Row = ({ k, v, strong, sub }: { k: string; v: string; strong?: boolean; sub?: boolean }) => (
  <div className={`flex items-baseline justify-between gap-4 border-b border-white/[0.07] py-2 ${strong ? "text-white" : "text-white/80"} ${sub ? "pl-4" : ""}`}>
    <span className={strong ? "font-semibold" : ""}>{k}</span>
    <span className={`tabular-nums ${strong ? "font-semibold" : ""}`}>{v}</span>
  </div>
);

/* ---------------- Apps ---------------- */

function Dashboard() {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...INC);
  const shown = hover ?? INC.length - 1;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Tile k={dashboard.kpiLabels[0]} v={fmt(REVENUE)} />
        <Tile k={dashboard.kpiLabels[1]} v={fmt(EXPENSES)} />
        <Tile k={dashboard.kpiLabels[2]} v={fmt(NET)} hi />
        <Tile k={dashboard.kpiLabels[3]} v={fmt(NET_CASH)} />
      </div>
      <div className="rounded-[3px] border border-white/10 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.68rem] uppercase tracking-[0.08em] text-white/55">
          <span>{dashboard.charts.bars}</span>
          <span className="tabular-nums text-white/80">
            {M[shown]} · in {fmt(INC[shown])} · out {fmt(EXP[shown])}
          </span>
        </div>
        <div className="mt-3 flex h-32 items-end gap-1 sm:h-40" onPointerLeave={() => setHover(null)}>
          {INC.map((v, i) => (
            <button
              key={i}
              type="button"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onClick={() => setHover(i)}
              aria-label={`${M[i]}: income ${fmt(v)}, expenses ${fmt(EXP[i])}`}
              className={`flex h-full flex-1 items-end justify-center gap-[2px] rounded-[2px] ${hover === i ? "bg-white/[0.06]" : ""}`}
            >
              <span className="w-[38%] bg-[#8db39e]" style={{ height: `${(v / max) * 100}%` }} />
              <span className="w-[38%] bg-white/30" style={{ height: `${(EXP[i] / max) * 100}%` }} />
            </button>
          ))}
        </div>
        <div className="mt-1 flex gap-1 text-[0.56rem] uppercase text-white/45">
          {M.map((m) => (
            <span key={m} className="flex-1 text-center">
              {m.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const PERIODS: [number, number][] = [
  [0, 12],
  [0, 3],
  [3, 6],
  [6, 9],
  [9, 12],
];
function Reports() {
  const [p, setP] = useState(0);
  const [a, b] = PERIODS[p];
  const inc = sum(INC.slice(a, b));
  const exp = sum(EXP.slice(a, b));
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {copy.periods.map((l, i) => (
          <Chip key={l} on={p === i} onClick={() => setP(i)}>
            {l}
          </Chip>
        ))}
      </div>
      <h3 className="mt-4 text-[0.95rem] font-semibold text-white">Income statement · {copy.periods[p]}</h3>
      <div className="mt-2 text-[0.85rem]">
        <Row k="Revenue" v={fmt(inc)} />
        <Row k="Operating expenses" v={`(${fmt(exp)})`} />
        <Row k="Net profit" v={fmt(inc - exp)} strong />
        <Row k="Net margin" v={`${((100 * (inc - exp)) / inc).toFixed(1)}%`} />
        <Row k="Average monthly revenue" v={fmt(inc / (b - a))} />
      </div>
      <table className="mt-4 w-full text-left text-[0.78rem] tabular-nums">
        <thead className="text-[0.62rem] uppercase tracking-[0.08em] text-white/50">
          <tr>
            <th className="py-1.5 font-normal">Month</th>
            <th className="py-1.5 text-right font-normal">Revenue</th>
            <th className="py-1.5 text-right font-normal">Expenses</th>
            <th className="py-1.5 text-right font-normal">Profit</th>
          </tr>
        </thead>
        <tbody>
          {M.slice(a, b).map((m, k) => (
            <tr key={m} className="border-t border-white/[0.07] text-white/80">
              <td className="py-1.5">{m}</td>
              <td className="py-1.5 text-right">{fmt(INC[a + k])}</td>
              <td className="py-1.5 text-right">{fmt(EXP[a + k])}</td>
              <td className="py-1.5 text-right text-[#8db39e]">{fmt(INC[a + k] - EXP[a + k])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Flows({ path }: { path: string[] }) {
  const [mode, setMode] = useState<"both" | "in" | "out">("both");
  const max = Math.max(...INC);
  const month = path[0]?.startsWith("m:") ? Number(path[0].slice(2)) : null;
  if (month !== null) {
    const prevCash = month ? dashboard.cash[month - 1] : dashboard.openingBalance;
    return (
      <div className="text-[0.85rem]">
        <h3 className="text-[0.95rem] font-semibold text-white">{M[month]} · month detail</h3>
        <div className="mt-2">
          <Row k="Income" v={fmt(INC[month])} />
          <Row k="Expenses" v={`(${fmt(EXP[month])})`} />
          <Row k="Net for the month" v={fmt(INC[month] - EXP[month])} strong />
          <Row k="Cash at start" v={fmt(prevCash)} />
          <Row k="Cash at end" v={fmt(dashboard.cash[month])} />
          <Row k="Expense ratio" v={`${((100 * EXP[month]) / INC[month]).toFixed(1)}%`} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Chip on={mode === "both"} onClick={() => setMode("both")}>Both</Chip>
        <Chip on={mode === "in"} onClick={() => setMode("in")}>Income</Chip>
        <Chip on={mode === "out"} onClick={() => setMode("out")}>Expenses</Chip>
      </div>
      <ul className="mt-3 space-y-1">
        {M.map((m, i) => (
          <li key={m}>
            <button
              type="button"
              onClick={() => navigate("flows", `m:${i}`)}
              className="grid w-full grid-cols-[2.4rem_1fr_auto] items-center gap-2 rounded-[2px] px-1 py-1 text-left text-[0.75rem] hover:bg-white/[0.06]"
            >
              <span className="uppercase text-white/60">{m}</span>
              <span className="flex flex-col gap-[2px]">
                {mode !== "out" && <span className="h-[6px] bg-[#8db39e]" style={{ width: `${(INC[i] / max) * 100}%` }} />}
                {mode !== "in" && <span className="h-[6px] bg-white/35" style={{ width: `${(EXP[i] / max) * 100}%` }} />}
              </span>
              <span className="tabular-nums text-white/80">{fmt(mode === "out" ? EXP[i] : mode === "in" ? INC[i] : INC[i] - EXP[i])}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.7rem] text-white/45">{mode === "both" ? "Net per month. " : ""}Tap a month for its detail.</p>
    </div>
  );
}

function Balance() {
  return (
    <div className="text-[0.85rem]">
      <h3 className="text-[0.95rem] font-semibold text-white">Balance sheet · as at 31 Dec</h3>
      <p className="mt-3 text-[0.62rem] uppercase tracking-[0.08em] text-white/50">Assets</p>
      <Row k="Cash at bank" v={fmt(CLOSING_CASH)} sub />
      <Row k="Accounts receivable" v={fmt(RECEIVABLE)} sub />
      <Row k="Total assets" v={fmt(CLOSING_CASH + RECEIVABLE)} strong />
      <p className="mt-4 text-[0.62rem] uppercase tracking-[0.08em] text-white/50">Liabilities</p>
      <Row k="None recorded in the sample" v="0" sub />
      <p className="mt-4 text-[0.62rem] uppercase tracking-[0.08em] text-white/50">Equity</p>
      <Row k="Opening capital" v={fmt(dashboard.openingBalance)} sub />
      <Row k="Profit for the year" v={fmt(NET)} sub />
      <Row k="Total liabilities & equity" v={fmt(EQUITY)} strong />
      <p className="mt-3 flex items-center gap-2 text-[0.75rem] text-[#8db39e]">
        <span aria-hidden className="grid size-4 place-items-center rounded-[2px] bg-[#2f6b4f] text-[0.6rem] text-white">✓</span>
        Balanced: assets equal liabilities + equity.
      </p>
      <p className="mt-2 text-[0.7rem] leading-relaxed text-white/45">{copy.balanceNote}</p>
    </div>
  );
}

const CATS = ["All", ...Array.from(new Set(dashboard.rows.map((r) => r.category)))];
function Transactions({ path }: { path: string[] }) {
  const { query } = useComputer();
  const [cat, setCat] = useState("All");
  const t = path[0]?.startsWith("t:") ? LEDGER[Number(path[0].slice(2))] : null;
  if (t) {
    return (
      <div className="text-[0.85rem]">
        <h3 className="text-[0.95rem] font-semibold text-white">{t.description}</h3>
        <div className="mt-2">
          <Row k="Date" v={t.date} />
          <Row k="Category" v={t.category} />
          <Row k="Debit (money out)" v={t.debit ? fmt(t.debit) : "—"} />
          <Row k="Credit (money in)" v={t.credit ? fmt(t.credit) : "—"} />
          <Row k="Balance after" v={fmt(t.balance)} strong />
        </div>
        <p className="mt-3 flex items-center gap-2 text-[0.75rem] text-[#8db39e]">
          <span aria-hidden className="grid size-4 place-items-center rounded-[2px] bg-[#2f6b4f] text-[0.6rem] text-white">✓</span>
          Matched to the bank statement.
        </p>
      </div>
    );
  }
  const q = query.trim().toLowerCase();
  const rows = LEDGER.filter((r) => (cat === "All" || r.category === cat) && (!q || `${r.date} ${r.description} ${r.category}`.toLowerCase().includes(q)));
  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.searchPlaceholder}
        className="w-full rounded-[3px] border border-white/15 bg-black/20 px-3 py-2 text-[0.85rem] text-white outline-none placeholder:text-white/35 focus:border-[#8db39e]"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <Chip key={c} on={cat === c} onClick={() => setCat(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <ul className="mt-3 text-[0.78rem] tabular-nums">
        {rows.map((r) => (
          <li key={r.i}>
            <button
              type="button"
              onClick={() => navigate("transactions", `t:${r.i}`)}
              className="grid w-full grid-cols-[3.4rem_1fr_auto] items-center gap-2 border-t border-white/[0.07] px-1 py-2 text-left hover:bg-white/[0.05]"
            >
              <span className="text-white/50">{r.date}</span>
              <span className="truncate text-white/90">{r.description}</span>
              <span className={r.credit ? "text-[#8db39e]" : "text-white/80"}>{r.credit ? `+${fmt(r.credit)}` : `−${fmt(r.debit)}`}</span>
            </button>
          </li>
        ))}
        {!rows.length && <li className="border-t border-white/[0.07] px-1 py-3 text-white/50">No matching transactions.</li>}
      </ul>
      <p className="mt-2 flex justify-between border-t border-white/10 pt-2 text-[0.75rem] text-white/60">
        <span>Closing balance</span>
        <span className="tabular-nums text-white">{fmt(LEDGER[LEDGER.length - 1].balance)}</span>
      </p>
    </div>
  );
}

const PAD = ["C", "±", "%", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "Backspace", "="];
function Calculator() {
  const { calc } = useComputer();
  const n = Number(calc.display);
  const shown = calc.display === "Error" ? "Error" : calc.display.endsWith(".") || /\.\d*0$/.test(calc.display) ? calc.display : Number.isFinite(n) ? n.toLocaleString("en-US", { maximumFractionDigits: 10 }) : calc.display;
  return (
    <div className="mx-auto grid max-w-[26rem] gap-3 sm:grid-cols-[1fr_9rem] sm:max-w-none">
      <div>
        <div className="rounded-[3px] border border-white/10 bg-black/25 px-3 py-3 text-right">
          <p className="h-4 text-[0.7rem] text-white/45">{calc.op && calc.acc !== null ? `${Number(calc.acc).toLocaleString("en-US")} ${CALC_OPS[calc.op]}` : ""}</p>
          <p className="truncate font-[family-name:var(--font-pixel)] text-[1.8rem] leading-tight text-white" aria-live="polite">
            {shown}
          </p>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {PAD.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => calcPress(k)}
              aria-label={k === "Backspace" ? "Delete" : k === "*" ? "Times" : k === "/" ? "Divide" : k}
              className={`h-10 rounded-[3px] border text-[0.95rem] transition-colors active:translate-y-px ${
                k === "="
                  ? "border-[#8db39e] bg-[#2f6b4f] text-white hover:bg-[#357a5a]"
                  : k in CALC_OPS || k === "C"
                    ? "border-white/15 bg-white/[0.07] text-[#c9a24a] hover:bg-white/[0.12]"
                    : "border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
              }`}
            >
              {k === "Backspace" ? "⌫" : CALC_OPS[k] ?? k}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-[3px] border border-dashed border-white/15 p-2.5">
        <p className="text-[0.62rem] uppercase tracking-[0.08em] text-white/50">Tape</p>
        <ul className="mt-2 space-y-1.5 text-[0.72rem] tabular-nums text-white/75">
          {calc.tape.length ? calc.tape.map((l, i) => <li key={i}>{l}</li>) : <li className="text-white/40">Results print here.</li>}
        </ul>
      </div>
    </div>
  );
}

function Documents({ path }: { path: string[] }) {
  const [folder, doc] = path;
  if (!folder) {
    return (
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {(["areas", "books"] as const).map((f) => (
          <li key={f}>
            <button
              type="button"
              onClick={() => navigate("documents", f)}
              className="flex w-full flex-col items-start gap-2 rounded-[3px] border border-white/10 p-3 text-left hover:border-[#8db39e]/60 hover:bg-white/[0.04]"
            >
              <span aria-hidden className="relative h-8 w-11 rounded-[2px] bg-[#c9a24a]/80 before:absolute before:-top-1.5 before:left-0 before:h-2 before:w-5 before:rounded-t-[2px] before:bg-[#c9a24a]/80" />
              <span className="text-[0.85rem] text-white">{copy.folders[f]}</span>
              <span className="text-[0.68rem] text-white/50">{f === "areas" ? accounting.areas.length : desk.books.length} documents</span>
            </button>
          </li>
        ))}
      </ul>
    );
  }
  if (folder === "areas" && doc !== undefined) {
    const a = accounting.areas[Number(doc)];
    return (
      <article className="text-[0.85rem] leading-relaxed text-white/80">
        <p className="text-[0.62rem] uppercase tracking-[0.08em] text-[#8db39e]">Document {String(Number(doc) + 1).padStart(2, "0")}</p>
        <h3 className="mt-1 text-[1.05rem] font-semibold text-white">{a.title}</h3>
        <p className="mt-2">{a.details.summary}</p>
        <ul className="mt-3 space-y-1.5">
          {a.details.covers.map((c) => (
            <li key={c} className="flex gap-2">
              <span aria-hidden className="text-[#8db39e]">✓</span>
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-3 flex flex-wrap gap-1.5">
          {a.details.tools.map((t) => (
            <span key={t} className="rounded-[2px] border border-white/15 px-1.5 py-0.5 text-[0.65rem] uppercase text-white/60">
              {t}
            </span>
          ))}
        </p>
      </article>
    );
  }
  if (folder === "books" && doc !== undefined) {
    const b = desk.books[Number(doc)];
    return (
      <article className="text-[0.85rem] leading-relaxed text-white/80">
        <p className="text-[0.62rem] uppercase tracking-[0.08em] text-[#8db39e]">{b.subtitle}</p>
        <h3 className="mt-1 text-[1.05rem] font-semibold text-white">{b.title}</h3>
        <ol className="mt-3 space-y-2">
          {b.notes.map((n, i) => (
            <li key={n} className="flex gap-2.5">
              <span className="font-[family-name:var(--font-pixel)] text-[0.7rem] leading-[1.9] text-[#8db39e]">{i + 1}</span>
              {n}
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => {
            closeComputer();
            openBooks(Number(doc));
          }}
          className="mt-4 rounded-[3px] border border-white/20 px-3 py-1.5 text-[0.7rem] uppercase tracking-[0.06em] text-white/80 hover:border-white/50"
        >
          Open the book on the desk
        </button>
      </article>
    );
  }
  const list = folder === "areas" ? accounting.areas.map((a) => a.title) : desk.books.map((b) => b.title);
  return (
    <ul className="text-[0.82rem]">
      {list.map((t, i) => (
        <li key={t}>
          <button
            type="button"
            onClick={() => navigate("documents", String(i))}
            className="grid w-full grid-cols-[1.6rem_1fr] items-center gap-2 border-t border-white/[0.07] px-1 py-2 text-left text-white/85 hover:bg-white/[0.05]"
          >
            <span aria-hidden className="h-4 w-3.5 rounded-[1px] border border-white/40 bg-white/10" />
            {t}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Notes() {
  const { notes } = useComputer();
  return (
    <div className="flex h-full flex-col">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        aria-label={copy.apps.notes}
        placeholder={copy.notesPlaceholder}
        spellCheck={false}
        className="min-h-[9rem] w-full flex-1 resize-none rounded-[3px] border border-white/10 bg-black/20 p-3 text-[0.95rem] leading-relaxed text-white caret-[#8db39e] outline-none placeholder:text-white/35 focus:border-[#8db39e]/60"
      />
      <p className="mt-2 flex items-center justify-between gap-3 text-[0.68rem] text-white/45">
        <span>{copy.notesHint}</span>
        <span className="flex items-center gap-3">
          <span className="tabular-nums">{notes.length} / 4000</span>
          <button type="button" onClick={() => setNotes("")} disabled={!notes} className="uppercase tracking-[0.06em] text-white/70 hover:text-white disabled:opacity-40">
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              closeComputer();
              openNote();
            }}
            className="uppercase tracking-[0.06em] text-white/70 hover:text-white"
          >
            Paper
          </button>
        </span>
      </p>
    </div>
  );
}

export function AppBody({ id }: { id: AppId }) {
  const { paths } = useComputer();
  const path = paths[id] ?? [];
  switch (id) {
    case "dashboard":
      return <Dashboard />;
    case "reports":
      return <Reports />;
    case "flows":
      return <Flows path={path} />;
    case "balance":
      return <Balance />;
    case "transactions":
      return <Transactions path={path} />;
    case "calculator":
      return <Calculator />;
    case "documents":
      return <Documents path={path} />;
    case "notes":
      return <Notes />;
  }
}

/** A line for the window title: where you are inside the app. */
export function appCrumb(id: AppId, path: string[]) {
  if (id === "documents" && path[0]) {
    const f = path[0] as "areas" | "books";
    if (path[1] === undefined) return copy.folders[f];
    return f === "areas" ? accounting.areas[Number(path[1])].title : desk.books[Number(path[1])].title;
  }
  if (id === "flows" && path[0]) return M[Number(path[0].slice(2))];
  if (id === "transactions" && path[0]) return LEDGER[Number(path[0].slice(2))].description;
  return null;
}

/** A one-line summary per app, for the small screen on the desk. */
export function appGlance(id: AppId) {
  switch (id) {
    case "dashboard":
      return `Net profit ${fmt(NET)}`;
    case "reports":
      return `Revenue ${fmt(REVENUE)}`;
    case "flows":
      return `In ${fmt(REVENUE)} · Out ${fmt(EXPENSES)}`;
    case "balance":
      return `Assets ${fmt(CLOSING_CASH + RECEIVABLE)} ✓`;
    case "transactions":
      return `${LEDGER.length} entries · balance ${fmt(LEDGER[LEDGER.length - 1].balance)}`;
    case "documents":
      return `${accounting.areas.length + desk.books.length} documents`;
    default:
      return "";
  }
}
