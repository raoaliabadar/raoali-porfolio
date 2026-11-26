"use client";

import { ArrowDownRight, ArrowUpRight, BarChart3, Download, FileSpreadsheet, LayoutDashboard, ListOrdered, Plus, RotateCcw, Scale, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  OPENING,
  PERIODS,
  balanceSheet,
  byCategory,
  inPeriod,
  loadLedger,
  monthly,
  money,
  newId,
  sampleLedger,
  saveLedger,
  toCsv,
  today,
  totals,
  type Period,
  type Tx,
  type TxType,
} from "./ledger";

type Tab = "dashboard" | "transactions" | "flows" | "pnl" | "balance";
const TABS: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", Icon: ListOrdered },
  { id: "flows", label: "Income & Expenses", Icon: BarChart3 },
  { id: "pnl", label: "Profit & Loss", Icon: FileSpreadsheet },
  { id: "balance", label: "Balance Sheet", Icon: Scale },
];

const INC = "#3f7d5a";
const EXP = "#b5543c";

/**
 * A small, working accounting app on the desk monitor: dashboard, transaction records (add, edit
 * status, delete, search, CSV export), income & expense breakdowns, a profit & loss report and a
 * balance sheet that always balances. Sample data on first use; changes stay in this browser.
 */
export function MonitorBooks({ width, height, onChange }: { width: number; height: number; onChange?: (txs: Tx[]) => void }) {
  const [txs, setTxs] = useState<Tx[]>(() => loadLedger());
  const [tab, setTab] = useState<Tab>("dashboard");
  const compact = width < 700;

  useEffect(() => {
    saveLedger(txs);
    onChange?.(txs);
  }, [txs, onChange]);

  const update = (fn: (t: Tx[]) => Tx[]) => setTxs((cur) => fn(cur).sort((a, b) => b.date.localeCompare(a.date)));

  return (
    <div
      className="flex size-full select-text overflow-hidden bg-[#f7f4ec] text-[#1b2620]"
      style={{ fontSize: compact ? 10 : 13, fontFamily: "Poppins, system-ui, sans-serif" }}
      // Clicks belong to the app, not to the 3D desk behind it.
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Sidebar */}
      <nav className="flex shrink-0 flex-col bg-[#14271f] text-[#e9e4d8]" style={{ width: compact ? 112 : 196, padding: compact ? 8 : 14 }} aria-label="Books sections">
        <div className="mb-[1.2em] flex items-center gap-[0.5em]">
          <span className="grid size-[2.1em] place-items-center rounded-[0.5em] bg-[#b18a55] font-bold text-[#14271f]">L</span>
          <div className="leading-tight">
            <p className="font-bold">Ledger Desk</p>
            <p className="text-[0.8em] text-[#e9e4d8]/60">Sample company books</p>
          </div>
        </div>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
            className={`mb-[0.25em] flex items-center gap-[0.6em] rounded-[0.5em] px-[0.7em] py-[0.55em] text-left transition-colors ${
              tab === id ? "bg-[#e9e4d8] font-semibold text-[#14271f]" : "text-[#e9e4d8]/80 hover:bg-white/10"
            }`}
          >
            <Icon aria-hidden style={{ width: "1.15em", height: "1.15em" }} />
            {label}
          </button>
        ))}
        <div className="mt-auto space-y-[0.4em] text-[0.85em]">
          <button
            type="button"
            onClick={() => download(txs)}
            className="flex w-full items-center gap-[0.5em] rounded-[0.5em] px-[0.7em] py-[0.45em] text-[#e9e4d8]/80 hover:bg-white/10"
          >
            <Download aria-hidden style={{ width: "1.1em", height: "1.1em" }} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.confirm("Reset the books to the sample data? Your entries will be removed.") && setTxs(sampleLedger())}
            className="flex w-full items-center gap-[0.5em] rounded-[0.5em] px-[0.7em] py-[0.45em] text-[#e9e4d8]/80 hover:bg-white/10"
          >
            <RotateCcw aria-hidden style={{ width: "1.1em", height: "1.1em" }} /> Reset sample data
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain" style={{ padding: compact ? 10 : 18, height }}>
        {tab === "dashboard" && <Dashboard txs={txs} go={setTab} />}
        {tab === "transactions" && <Transactions txs={txs} update={update} compact={compact} />}
        {tab === "flows" && <Flows txs={txs} />}
        {tab === "pnl" && <ProfitLoss txs={txs} />}
        {tab === "balance" && <Balance txs={txs} />}
      </main>
    </div>
  );
}

function download(txs: Tx[]) {
  const blob = new Blob([toCsv(txs)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `transactions-${today()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- shared bits ---------- */

function Head({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-[1em] flex flex-wrap items-end justify-between gap-[0.6em]">
      <div>
        <h2 className="text-[1.45em] font-bold leading-tight">{title}</h2>
        {sub && <p className="text-[0.88em] text-[#5d6a62]">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
const card = "rounded-[0.8em] border border-[#e2dccd] bg-white";

function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-[0.3em] rounded-[0.6em] bg-[#ebe5d6] p-[0.25em]" role="group" aria-label="Period">
      {PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={value === p.id}
          onClick={() => onChange(p.id)}
          className={`rounded-[0.45em] px-[0.7em] py-[0.3em] text-[0.88em] ${value === p.id ? "bg-white font-semibold shadow-sm" : "text-[#5d6a62] hover:text-[#1b2620]"}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ txs, go }: { txs: Tx[]; go: (t: Tab) => void }) {
  const months = useMemo(() => monthly(txs), [txs]);
  const all = useMemo(() => totals(txs.filter((t) => inPeriod(t, "half"))), [txs]);
  const bs = useMemo(() => balanceSheet(txs), [txs]);
  const cur = months.at(-1)!;
  const prev = months.at(-2)!;
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]));
  const change = (a: number, b: number) => (b ? Math.round(((a - b) / Math.abs(b)) * 100) : 0);
  const kpis = [
    { label: "Revenue (6 months)", value: money(all.income), tone: INC },
    { label: "Expenses (6 months)", value: money(all.expense), tone: EXP },
    { label: "Net profit (6 months)", value: money(all.net), tone: all.net >= 0 ? INC : EXP },
    { label: "Cash in bank", value: money(bs.cash), tone: "#1b2620" },
  ];
  return (
    <>
      <Head title="Dashboard" sub="Sample company · figures update as you add transactions" />
      <div className="grid grid-cols-4 gap-[0.7em]">
        {kpis.map((k) => (
          <div key={k.label} className={`${card} p-[0.8em]`}>
            <p className="text-[0.82em] text-[#5d6a62]">{k.label}</p>
            <p className="mt-[0.2em] text-[1.35em] font-bold tabular-nums" style={{ color: k.tone }}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-[0.8em] grid grid-cols-[1.6fr_1fr] gap-[0.7em]">
        <div className={`${card} p-[0.9em]`}>
          <div className="flex items-center justify-between">
            <p className="font-semibold">Income vs expenses</p>
            <p className="flex gap-[0.8em] text-[0.8em] text-[#5d6a62]">
              <span className="flex items-center gap-[0.3em]">
                <i className="inline-block size-[0.7em] rounded-sm" style={{ background: INC }} /> Income
              </span>
              <span className="flex items-center gap-[0.3em]">
                <i className="inline-block size-[0.7em] rounded-sm" style={{ background: EXP }} /> Expenses
              </span>
            </p>
          </div>
          <div className="mt-[0.8em] flex h-[9em] items-end gap-[0.9em] border-b border-[#e2dccd]">
            {months.map((m) => (
              <div key={m.key} className="flex flex-1 items-end justify-center gap-[0.2em]" title={`${m.label}: income ${money(m.income)}, expenses ${money(m.expense)}`}>
                <div className="w-[0.9em] rounded-t-[0.2em]" style={{ height: `${(m.income / max) * 8.6}em`, background: INC }} />
                <div className="w-[0.9em] rounded-t-[0.2em]" style={{ height: `${(m.expense / max) * 8.6}em`, background: EXP }} />
              </div>
            ))}
          </div>
          <div className="mt-[0.3em] flex gap-[0.9em] text-[0.8em] text-[#5d6a62]">
            {months.map((m) => (
              <span key={m.key} className="flex-1 text-center">
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className={`${card} p-[0.9em]`}>
          <p className="font-semibold">This month</p>
          {[
            { label: "Income", a: cur.income, b: prev.income, tone: INC },
            { label: "Expenses", a: cur.expense, b: prev.expense, tone: EXP },
            { label: "Net", a: cur.net, b: prev.net, tone: cur.net >= 0 ? INC : EXP },
          ].map((r) => {
            const c = change(r.a, r.b);
            const up = c >= 0;
            return (
              <div key={r.label} className="mt-[0.7em] flex items-center justify-between">
                <span className="text-[#5d6a62]">{r.label}</span>
                <span className="flex items-center gap-[0.5em]">
                  <b className="tabular-nums" style={{ color: r.tone }}>
                    {money(r.a)}
                  </b>
                  <span className={`flex items-center text-[0.8em] ${up ? "text-[#3f7d5a]" : "text-[#b5543c]"}`}>
                    {up ? <ArrowUpRight aria-hidden style={{ width: "1em", height: "1em" }} /> : <ArrowDownRight aria-hidden style={{ width: "1em", height: "1em" }} />}
                    {Math.abs(c)}%
                  </span>
                </span>
              </div>
            );
          })}
          <div className="mt-[0.9em] border-t border-[#e2dccd] pt-[0.6em] text-[0.85em] text-[#5d6a62]">
            Receivables <b className="float-right tabular-nums text-[#1b2620]">{money(bs.receivables)}</b>
            <br />
            Payables <b className="float-right tabular-nums text-[#1b2620]">{money(bs.payables)}</b>
          </div>
        </div>
      </div>

      <div className={`${card} mt-[0.8em] p-[0.9em]`}>
        <div className="flex items-center justify-between">
          <p className="font-semibold">Recent transactions</p>
          <button type="button" onClick={() => go("transactions")} className="text-[0.85em] font-semibold text-[#8a6534] hover:underline">
            View all
          </button>
        </div>
        <TxTable txs={txs.slice(0, 5)} />
      </div>
    </>
  );
}

/* ---------- Transactions ---------- */

function TxTable({ txs, onToggle, onDelete }: { txs: Tx[]; onToggle?: (id: string) => void; onDelete?: (id: string) => void }) {
  if (!txs.length) return <p className="py-[1.5em] text-center text-[#5d6a62]">No transactions match.</p>;
  return (
    <table className="mt-[0.5em] w-full border-collapse">
      <thead>
        <tr className="text-left text-[0.8em] uppercase tracking-wide text-[#5d6a62]">
          <th className="py-[0.4em] font-semibold">Date</th>
          <th className="font-semibold">Description</th>
          <th className="font-semibold">Category</th>
          <th className="font-semibold">Status</th>
          <th className="text-right font-semibold">Amount</th>
          {onDelete && <th aria-label="Actions" />}
        </tr>
      </thead>
      <tbody>
        {txs.map((t) => (
          <tr key={t.id} className="border-t border-[#efeadf]">
            <td className="whitespace-nowrap py-[0.45em] pr-[0.6em] tabular-nums text-[#5d6a62]">{t.date}</td>
            <td className="max-w-[18em] truncate pr-[0.6em]">{t.description}</td>
            <td className="whitespace-nowrap pr-[0.6em] text-[#5d6a62]">{t.category}</td>
            <td className="pr-[0.6em]">
              <button
                type="button"
                disabled={!onToggle}
                onClick={() => onToggle?.(t.id)}
                title={onToggle ? "Click to mark as " + (t.paid ? "unpaid" : "paid") : undefined}
                className={`rounded-full px-[0.6em] py-[0.1em] text-[0.8em] font-semibold ${
                  t.paid ? "bg-[#e3efe6] text-[#2f6a48]" : "bg-[#f6e4d6] text-[#9a4a2c]"
                } ${onToggle ? "cursor-pointer hover:ring-1 hover:ring-current" : "cursor-default"}`}
              >
                {t.paid ? "Paid" : t.type === "income" ? "Receivable" : "Payable"}
              </button>
            </td>
            <td className="whitespace-nowrap text-right font-semibold tabular-nums" style={{ color: t.type === "income" ? INC : EXP }}>
              {t.type === "income" ? "+" : "−"}
              {money(t.amount, true).replace("−", "")}
            </td>
            {onDelete && (
              <td className="pl-[0.4em] text-right">
                <button type="button" aria-label={`Delete ${t.description}`} onClick={() => onDelete(t.id)} className="rounded p-[0.2em] text-[#9aa39b] hover:bg-[#f6e4d6] hover:text-[#b5543c]">
                  <Trash2 aria-hidden style={{ width: "1em", height: "1em" }} />
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Transactions({ txs, update, compact }: { txs: Tx[]; update: (fn: (t: Tx[]) => Tx[]) => void; compact: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const [type, setType] = useState<TxType>("income");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [error, setError] = useState("");
  const shown = txs.filter(
    (t) => (filter === "all" || t.type === filter) && (!q || `${t.description} ${t.category}`.toLowerCase().includes(q.toLowerCase())),
  );
  const sum = totals(shown);

  const add = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const description = String(f.get("description") ?? "").trim();
    const amount = Math.round(Number(f.get("amount")) * 100) / 100;
    const date = String(f.get("date") || today());
    if (!description || !(amount > 0)) {
      setError("Add a description and an amount above 0.");
      return;
    }
    setError("");
    update((cur) => [{ id: newId(), date, description, category, type, amount, paid: f.get("paid") === "on" }, ...cur]);
    e.currentTarget.reset();
  };

  const input = "w-full min-w-0 rounded-[0.45em] border border-[#d9d2c1] bg-white px-[0.6em] py-[0.4em] outline-none focus:border-[#14271f]";
  return (
    <>
      <Head title="Transactions" sub={`${txs.length} records · click a status to mark it paid or unpaid`} />

      <form onSubmit={add} className={`${card} mb-[0.8em] grid items-end gap-[0.5em] p-[0.8em] ${compact ? "grid-cols-3" : "grid-cols-[7.5em_1fr_7em_10em_6.5em_auto_auto]"}`}>
        <label className="grid gap-[0.2em] text-[0.82em] text-[#5d6a62]">
          Date
          <input name="date" type="date" defaultValue={today()} className={input} />
        </label>
        <label className="grid gap-[0.2em] text-[0.82em] text-[#5d6a62]">
          Description
          <input name="description" placeholder="e.g. Invoice #1042" className={input} />
        </label>
        <label className="grid gap-[0.2em] text-[0.82em] text-[#5d6a62]">
          Type
          <select
            value={type}
            onChange={(e) => {
              const t = e.target.value as TxType;
              setType(t);
              setCategory((t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0]);
            }}
            className={input}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>
        <label className="grid gap-[0.2em] text-[0.82em] text-[#5d6a62]">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={input}>
            {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-[0.2em] text-[0.82em] text-[#5d6a62]">
          Amount ($)
          <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" className={input} />
        </label>
        <label className="flex items-center gap-[0.35em] pb-[0.5em] text-[0.88em] text-[#5d6a62]">
          <input name="paid" type="checkbox" defaultChecked /> Paid
        </label>
        <button type="submit" className="flex items-center justify-center gap-[0.3em] rounded-[0.5em] bg-[#14271f] px-[0.9em] py-[0.5em] font-semibold text-[#f4f1e9] hover:bg-[#1f3a2e]">
          <Plus aria-hidden style={{ width: "1.1em", height: "1.1em" }} /> Add
        </button>
        {error && <p className="col-span-full text-[0.85em] text-[#b5543c]">{error}</p>}
      </form>

      <div className={`${card} p-[0.8em]`}>
        <div className="flex flex-wrap items-center gap-[0.5em]">
          <label className="flex flex-1 items-center gap-[0.4em] rounded-[0.45em] border border-[#d9d2c1] bg-white px-[0.6em] py-[0.35em]">
            <Search aria-hidden className="text-[#9aa39b]" style={{ width: "1em", height: "1em" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description or category" className="w-full bg-transparent outline-none" aria-label="Search transactions" />
          </label>
          <div className="flex gap-[0.3em] rounded-[0.6em] bg-[#ebe5d6] p-[0.25em]" role="group" aria-label="Show">
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`rounded-[0.45em] px-[0.7em] py-[0.25em] text-[0.88em] capitalize ${filter === f ? "bg-white font-semibold shadow-sm" : "text-[#5d6a62]"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-[0.85em] text-[#5d6a62]">
            In: <b style={{ color: INC }}>{money(sum.income)}</b> · Out: <b style={{ color: EXP }}>{money(sum.expense)}</b>
          </p>
        </div>
        <TxTable
          txs={shown}
          onToggle={(id) => update((cur) => cur.map((t) => (t.id === id ? { ...t, paid: !t.paid } : t)))}
          onDelete={(id) => update((cur) => cur.filter((t) => t.id !== id))}
        />
      </div>
    </>
  );
}

/* ---------- Income & expenses ---------- */

function Flows({ txs }: { txs: Tx[] }) {
  const [period, setPeriod] = useState<Period>("half");
  const list = txs.filter((t) => inPeriod(t, period));
  const t = totals(list);
  const Breakdown = ({ type, total, tone }: { type: TxType; total: number; tone: string }) => {
    const rows = byCategory(list, type);
    return (
      <div className={`${card} p-[0.9em]`}>
        <div className="flex items-baseline justify-between">
          <p className="font-semibold">{type === "income" ? "Income" : "Expenses"} by category</p>
          <b className="tabular-nums" style={{ color: tone }}>
            {money(total)}
          </b>
        </div>
        {rows.length === 0 && <p className="py-[1em] text-[#5d6a62]">Nothing in this period.</p>}
        {rows.map((r) => (
          <div key={r.category} className="mt-[0.65em]">
            <div className="flex justify-between text-[0.9em]">
              <span>{r.category}</span>
              <span className="tabular-nums text-[#5d6a62]">
                {money(r.amount)} · {total ? Math.round((r.amount / total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-[0.25em] h-[0.5em] rounded-full bg-[#efeadf]">
              <div className="h-full rounded-full" style={{ width: `${total ? (r.amount / total) * 100 : 0}%`, background: tone }} />
            </div>
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
      <Head title="Income & Expenses" sub={`Net for the period: ${money(t.net)}`}>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Head>
      <div className="grid grid-cols-2 gap-[0.7em]">
        <Breakdown type="income" total={t.income} tone={INC} />
        <Breakdown type="expense" total={t.expense} tone={EXP} />
      </div>
    </>
  );
}

/* ---------- Profit & loss ---------- */

function ProfitLoss({ txs }: { txs: Tx[] }) {
  const [period, setPeriod] = useState<Period>("half");
  const list = txs.filter((t) => inPeriod(t, period));
  const t = totals(list);
  const margin = t.income ? (t.net / t.income) * 100 : 0;
  const Section = ({ title, type }: { title: string; type: TxType }) => (
    <>
      <tr>
        <td colSpan={2} className="pt-[0.9em] pb-[0.2em] text-[0.8em] font-bold uppercase tracking-wide text-[#5d6a62]">
          {title}
        </td>
      </tr>
      {byCategory(list, type).map((r) => (
        <tr key={r.category} className="border-t border-[#efeadf]">
          <td className="py-[0.35em] pl-[1em]">{r.category}</td>
          <td className="text-right tabular-nums">{money(r.amount, true)}</td>
        </tr>
      ))}
      <tr className="border-t border-[#d9d2c1] font-semibold">
        <td className="py-[0.4em]">Total {title.toLowerCase()}</td>
        <td className="text-right tabular-nums">{money(type === "income" ? t.income : t.expense, true)}</td>
      </tr>
    </>
  );
  return (
    <>
      <Head title="Profit & Loss" sub={`Income statement · ${PERIODS.find((p) => p.id === period)?.label}`}>
        <PeriodPicker value={period} onChange={setPeriod} />
      </Head>
      <div className={`${card} p-[1em]`}>
        <table className="w-full border-collapse">
          <tbody>
            <Section title="Revenue" type="income" />
            <Section title="Expenses" type="expense" />
            <tr className="border-t-2 border-[#14271f] text-[1.1em] font-bold">
              <td className="py-[0.5em]">Net {t.net >= 0 ? "profit" : "loss"}</td>
              <td className="text-right tabular-nums" style={{ color: t.net >= 0 ? INC : EXP }}>
                {money(t.net, true)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-[0.4em] text-[0.85em] text-[#5d6a62]">Net margin: {margin.toFixed(1)}%</p>
      </div>
    </>
  );
}

/* ---------- Balance sheet ---------- */

function Balance({ txs }: { txs: Tx[] }) {
  const b = balanceSheet(txs);
  const ok = Math.abs(b.assets - (b.liabilities + b.equity)) < 0.005;
  const Row = ({ label, value, strong = false, indent = false }: { label: string; value: number; strong?: boolean; indent?: boolean }) => (
    <div className={`flex justify-between border-t border-[#efeadf] py-[0.4em] ${strong ? "border-[#d9d2c1] font-semibold" : ""} ${indent ? "pl-[1em]" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{money(value, true)}</span>
    </div>
  );
  return (
    <>
      <Head title="Balance Sheet" sub={`As of ${today()}`}>
        <span className={`rounded-full px-[0.8em] py-[0.3em] text-[0.88em] font-semibold ${ok ? "bg-[#e3efe6] text-[#2f6a48]" : "bg-[#f6e4d6] text-[#9a4a2c]"}`}>
          {ok ? "✓ Assets = Liabilities + Equity" : "Out of balance"}
        </span>
      </Head>
      <div className="grid grid-cols-2 gap-[0.7em]">
        <div className={`${card} p-[1em]`}>
          <p className="mb-[0.3em] text-[0.8em] font-bold uppercase tracking-wide text-[#5d6a62]">Assets</p>
          <Row indent label="Cash at bank" value={b.cash} />
          <Row indent label="Accounts receivable" value={b.receivables} />
          <Row indent label={`Equipment (net of ${money(OPENING.depreciation)} depreciation)`} value={b.equipmentNet} />
          <Row strong label="Total assets" value={b.assets} />
        </div>
        <div className={`${card} p-[1em]`}>
          <p className="mb-[0.3em] text-[0.8em] font-bold uppercase tracking-wide text-[#5d6a62]">Liabilities</p>
          <Row indent label="Accounts payable" value={b.payables} />
          <Row indent label="Bank loan" value={b.loan} />
          <Row strong label="Total liabilities" value={b.liabilities} />
          <p className="mb-[0.3em] mt-[0.9em] text-[0.8em] font-bold uppercase tracking-wide text-[#5d6a62]">Equity</p>
          <Row indent label="Owner's capital" value={b.capital} />
          <Row indent label="Retained earnings (period)" value={b.retained} />
          <Row strong label="Total equity" value={b.equity} />
          <Row strong label="Liabilities + equity" value={b.liabilities + b.equity} />
        </div>
      </div>
    </>
  );
}
