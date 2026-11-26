"use client";

import { Check, CircleDot, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator, keyFromKeyboard, type CalcKey } from "@/components/ui/desk/calculator";
import { expenseLines, incomeLines, invoiceSample, money, OPENING_BALANCE, reconciliation, transactions } from "@/lib/sample-data";
import { CountUp } from "./ui";

/*
 * Interactive accounting demonstrations for slide 03. Every figure is fictional sample data
 * (lib/sample-data.ts) and every result is plain arithmetic in the browser.
 */

const num = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 9_999_999) : 0;
};
const cell = "px-1.5 py-2 text-left sm:px-3 sm:py-2.5";
const input =
  "rounded-md border border-transparent bg-transparent px-1.5 py-1 text-right tabular-nums outline-none transition-colors hover:border-line focus:border-forest focus:bg-surface";

/* 1. Spreadsheet: a month of transactions with a running balance. Amounts are editable. */
export function SpreadsheetDemo({ run }: { run: unknown }) {
  const [rows, setRows] = useState(transactions);
  const withBal = useMemo(() => {
    let bal = OPENING_BALANCE;
    return rows.map((r) => ((bal += r.credit - r.debit), { ...r, bal }));
  }, [rows]);
  const totalD = rows.reduce((s, r) => s + r.debit, 0);
  const totalC = rows.reduce((s, r) => s + r.credit, 0);
  const set = (i: number, k: "debit" | "credit", v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: num(v) } : r)));
  return (
    <div>
      <p className="text-sm text-muted">Edit any debit or credit: the running balance and totals recalculate.</p>
      <div className="slide-scroll-x mt-4 rounded-[16px] border border-line">
        <table className="w-full text-xs sm:min-w-[640px] sm:text-sm">
          <caption className="sr-only">Sample transactions for November, with a running balance</caption>
          <thead className="bg-cream text-xs uppercase tracking-[0.08em] text-muted">
            <tr>
              <th scope="col" className={`${cell} hidden sm:table-cell`}>Date</th>
              <th scope="col" className={cell}>Description</th>
              <th scope="col" className={`${cell} hidden sm:table-cell`}>Category</th>
              <th scope="col" className={`${cell} text-right`}>Debit</th>
              <th scope="col" className={`${cell} text-right`}>Credit</th>
              <th scope="col" className={`${cell} text-right`}>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-line text-muted">
              <td className={`${cell} hidden sm:table-cell`}>01 Nov</td>
              <td className={`${cell} hidden sm:table-cell`} colSpan={4}>Opening balance</td>
              <td className={`${cell} sm:hidden`} colSpan={3}>Opening balance</td>
              <td className={`${cell} text-right tabular-nums`}>{money(OPENING_BALANCE)}</td>
            </tr>
            {withBal.map((r, i) => (
              <tr key={r.description} data-reveal="row" className="border-t border-line odd:bg-ink/60">
                <td className={`${cell} hidden whitespace-nowrap text-muted sm:table-cell`}>{r.date}</td>
                <td className={cell}>
                  {r.description}
                  {/* Phones: the date sits under the description (no date column) */}
                  <span className="block text-[0.7rem] text-muted sm:hidden">{r.date}</span>
                </td>
                <td className={`${cell} hidden sm:table-cell`}>
                  <span className="rounded-full bg-cream px-2 py-0.5 text-xs">{r.category}</span>
                </td>
                <td className="px-2 text-right">
                  <input aria-label={`Debit, ${r.description}`} inputMode="decimal" className={`${input} w-11 text-warn sm:w-24`} value={r.debit || ""} placeholder="–" onChange={(e) => set(i, "debit", e.target.value)} />
                </td>
                <td className="px-2 text-right">
                  <input aria-label={`Credit, ${r.description}`} inputMode="decimal" className={`${input} w-11 text-forest sm:w-24`} value={r.credit || ""} placeholder="–" onChange={(e) => set(i, "credit", e.target.value)} />
                </td>
                <td className={`${cell} text-right font-medium tabular-nums`}>{money(r.bal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-forest bg-forest text-beige">
            <tr>
              <th scope="row" colSpan={3} className={`${cell} hidden sm:table-cell`}>Totals and closing balance</th>
              <th scope="row" className={`${cell} sm:hidden`}>Totals</th>
              <td className={`${cell} text-right tabular-nums`}><CountUp value={totalD} run={run} /></td>
              <td className={`${cell} text-right tabular-nums`}><CountUp value={totalC} run={run} /></td>
              <td className={`${cell} text-right font-semibold tabular-nums text-bronze`}><CountUp value={OPENING_BALANCE + totalC - totalD} run={run} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <button type="button" onClick={() => setRows(transactions)} className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <RotateCcw aria-hidden className="size-3.5" /> Reset figures
      </button>
    </div>
  );
}

/* 2. Income vs expenses: net profit and margin. */
type Line = { label: string; amount: number };
function AmountList({ title, lines, setLines, tone }: { title: string; lines: Line[]; setLines: (f: (l: Line[]) => Line[]) => void; tone: string }) {
  return (
    <div className="rounded-[16px] border border-line p-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h4>
      <ul className="mt-2 divide-y divide-line">
        {lines.map((l, i) => (
          <li key={l.label} data-reveal="row" className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>{l.label}</span>
            <input
              aria-label={`${title}: ${l.label}`}
              inputMode="decimal"
              className={`${input} w-24 ${tone}`}
              value={l.amount || ""}
              onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount: num(e.target.value) } : x)))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncomeExpenseDemo({ run }: { run: unknown }) {
  const [inc, setInc] = useState<Line[]>(incomeLines);
  const [exp, setExp] = useState<Line[]>(expenseLines);
  const ti = inc.reduce((s, l) => s + l.amount, 0);
  const te = exp.reduce((s, l) => s + l.amount, 0);
  const net = ti - te;
  const margin = ti ? (net / ti) * 100 : 0;
  const max = Math.max(ti, te, 1);
  return (
    <div>
      <p className="text-sm text-muted">Change any line to see net profit and margin update.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <AmountList title="Income" lines={inc} setLines={setInc} tone="text-forest" />
        <AmountList title="Expenses" lines={exp} setLines={setExp} tone="text-warn" />
      </div>
      <div className="mt-4 rounded-[16px] bg-forest p-5 text-beige">
        <div className="space-y-2.5" aria-hidden>
          {[
            ["Income", ti, "bg-sage"],
            ["Expenses", te, "bg-bronze"],
          ].map(([k, v, c]) => (
            <div key={k as string} className="flex items-center gap-3 text-xs">
              <span className="w-16 text-beige/70">{k}</span>
              <span className="h-2.5 flex-1 rounded-full bg-beige/10">
                <span className={`block h-full rounded-full ${c} transition-[width] duration-700`} style={{ width: `${((v as number) / max) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-beige/70">Total income</dt>
            <dd className="text-lg font-semibold"><CountUp value={ti} run={run} /></dd>
          </div>
          <div>
            <dt className="text-beige/70">Net profit</dt>
            <dd className={`text-lg font-semibold ${net < 0 ? "text-[#e3a07a]" : "text-bronze"}`}><CountUp value={net} run={run} /></dd>
          </div>
          <div>
            <dt className="text-beige/70">Margin</dt>
            <dd className="text-lg font-semibold"><CountUp value={margin} run={run} decimals={1} suffix="%" /></dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* 3. Financial calculator (same engine as the desk calculator in the 3D office). */
const KEYS: [CalcKey, string][][] = [
  [["C", "C"], ["DEL", "⌫"], ["NEG", "±"], ["/", "÷"]],
  [["7", "7"], ["8", "8"], ["9", "9"], ["*", "×"]],
  [["4", "4"], ["5", "5"], ["6", "6"], ["-", "−"]],
  [["1", "1"], ["2", "2"], ["3", "3"], ["+", "+"]],
  [["0", "0"], ["00", "00"], [".", "."], ["=", "="]],
];
export function CalculatorDemo() {
  const calc = useRef(new Calculator());
  const [, force] = useState(0);
  const [pressed, setPressed] = useState<CalcKey | null>(null);
  const press = (k: CalcKey) => {
    calc.current.press(k);
    setPressed(k);
    setTimeout(() => setPressed(null), 120);
    force((n) => n + 1);
  };
  const c = calc.current;
  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
      <div
        data-keys
        tabIndex={0}
        aria-label="Calculator. Type numbers and operators, Enter for equals, Escape to clear."
        onKeyDown={(e) => {
          const k = keyFromKeyboard(e.nativeEvent);
          if (!k) return;
          e.preventDefault();
          e.stopPropagation();
          press(k);
        }}
        className="rounded-[22px] bg-forest p-4 text-beige shadow-[0_24px_50px_-28px_rgb(20_39_31/0.9)] outline-none focus-visible:ring-2 focus-visible:ring-bronze"
      >
        <div className="rounded-[12px] bg-[#c9d6c3] px-4 py-3 text-right font-mono text-[#14271f]" aria-live="polite">
          <div className="h-5 truncate text-xs opacity-70">{c.expression}</div>
          <div className="truncate text-3xl font-semibold tabular-nums">{c.display}</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {KEYS.flat().map(([k, label]) => {
            const op = ["/", "*", "-", "+", "="].includes(k);
            return (
              <button
                key={k}
                type="button"
                tabIndex={-1}
                onClick={() => press(k)}
                aria-label={label === "⌫" ? "Delete" : label === "±" ? "Change sign" : label}
                className={`h-12 rounded-[10px] text-lg font-semibold transition-transform ${pressed === k ? "scale-95" : ""} ${
                  op ? "bg-bronze text-forest hover:brightness-105" : ["C", "DEL", "NEG"].includes(k) ? "bg-sage/60 hover:bg-sage/75" : "bg-beige/10 hover:bg-beige/20"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-sm leading-relaxed text-muted">
        <p>A working calculator for quick checks: totals, tax, discounts and differences.</p>
        <p className="mt-3">Click the keys, or focus the calculator and use your keyboard (Enter for equals, Esc to clear).</p>
        <p className="mt-3">Try: 1250 + 860 + 2100 = to total three sample invoices.</p>
      </div>
    </div>
  );
}

/* 4. Invoice processing: line items → subtotal, tax, total; status from draft to paid. */
const STATUSES = ["Draft", "Sent", "Paid"] as const;
export function InvoiceDemo({ run }: { run: unknown }) {
  const [lines, setLines] = useState(invoiceSample.lines);
  const [tax, setTax] = useState(invoiceSample.taxRate);
  const [status, setStatus] = useState(0);
  const sub = lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const taxAmt = (sub * tax) / 100;
  const total = sub + taxAmt;
  const upd = (i: number, k: "qty" | "rate" | "item", v: string) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: k === "item" ? v.slice(0, 40) : num(v) } : l)));
  return (
    <div className="rounded-[16px] border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display-serif text-2xl text-forest">Invoice {invoiceSample.number}</p>
          <p className="text-sm text-muted">
            {invoiceSample.client} · Issued {invoiceSample.issued} · Due {invoiceSample.due}
          </p>
        </div>
        <ol className="flex items-center gap-1.5 text-xs font-semibold" aria-label="Invoice status">
          {STATUSES.map((s, i) => (
            <li key={s} className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${i <= status ? "bg-forest text-beige" : "bg-cream text-muted"}`} aria-current={i === status ? "step" : undefined}>
              {i < status ? <Check aria-hidden className="size-3" /> : <CircleDot aria-hidden className="size-3" />}
              {s}
            </li>
          ))}
        </ol>
      </div>
      <div className="slide-scroll-x mt-4">
        <table className="w-full text-xs sm:min-w-[520px] sm:text-sm">
          <caption className="sr-only">Invoice line items</caption>
          <thead className="text-xs uppercase tracking-[0.08em] text-muted">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 text-left">Item</th>
              <th scope="col" className="py-2 text-right">Qty</th>
              <th scope="col" className="py-2 text-right">Rate</th>
              <th scope="col" className="py-2 text-right">Amount</th>
              <th scope="col"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} data-reveal="row" className="border-b border-line">
                <td className="py-1">
                  <input aria-label={`Line ${i + 1} item`} className={`${input} w-full min-w-0 text-left`} size={8} value={l.item} onChange={(e) => upd(i, "item", e.target.value)} />
                </td>
                <td className="py-1 text-right">
                  <input aria-label={`Line ${i + 1} quantity`} inputMode="decimal" className={`${input} w-10 sm:w-14`} value={l.qty} onChange={(e) => upd(i, "qty", e.target.value)} />
                </td>
                <td className="py-1 text-right">
                  <input aria-label={`Line ${i + 1} rate`} inputMode="decimal" className={`${input} w-14 sm:w-20`} value={l.rate} onChange={(e) => upd(i, "rate", e.target.value)} />
                </td>
                <td className="py-1 text-right tabular-nums">{money(l.qty * l.rate, 2)}</td>
                <td className="py-1 text-right">
                  <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} disabled={lines.length === 1} className="grid size-7 place-items-center rounded-full text-muted hover:bg-cream hover:text-fg sm:size-8">
                    <Trash2 aria-hidden className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <button type="button" onClick={() => lines.length < 8 && setLines((ls) => [...ls, { item: "New service", qty: 1, rate: 100 }])} className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
          <Plus aria-hidden className="size-4" /> Add line
        </button>
        <dl className="w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{money(sub, 2)}</dd></div>
          <div className="flex items-center justify-between">
            <dt className="text-muted">
              Tax{" "}
              <input aria-label="Tax rate percent" inputMode="decimal" className={`${input} w-12`} value={tax} onChange={(e) => setTax(Math.min(30, num(e.target.value)))} />%
            </dt>
            <dd className="tabular-nums">{money(taxAmt, 2)}</dd>
          </div>
          <div className="flex justify-between border-t border-forest pt-2 text-base font-semibold text-forest">
            <dt>Total due</dt>
            <dd><CountUp value={total} run={run} decimals={2} /></dd>
          </div>
        </dl>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus((s) => Math.min(2, s + 1))}
          disabled={status === 2}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-semibold text-beige disabled:opacity-50"
        >
          {status === 0 ? "Send invoice" : status === 1 ? "Record payment" : "Paid in full"}
        </button>
        <button type="button" onClick={() => setStatus(0)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-muted hover:text-fg">
          <RotateCcw aria-hidden className="size-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

/* 5. Bank reconciliation: match the statement to the ledger, then explain the difference. */
export function ReconciliationDemo() {
  const R = reconciliation;
  const [step, setStep] = useState(0); // 0 idle, 1..3 matching pairs, 4 differences found, 5 reconciled
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const run = () => {
    setStep(1);
    const next = (s: number) => {
      timer.current = setTimeout(() => {
        setStep(s);
        if (s < 5) next(s + 1);
      }, 650);
    };
    next(2);
  };
  const matched = (id: string) => {
    const order = ["b1", "b2", "b3", "l1", "l2", "l3"];
    const i = order.indexOf(id) % 3;
    return i >= 0 && order.includes(id) && step > i;
  };
  const adjBank = R.statementBalance - 610;
  const adjLedger = R.ledgerBalance - 35;
  const Row = ({ id, date, description, amount, flag }: { id: string; date: string; description: string; amount: number; flag?: string }) => (
    <li className={`flex items-center justify-between gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors duration-500 ${matched(id) ? "bg-sage/20" : flag && step >= 4 ? "bg-bronze/20" : ""}`}>
      <span className="min-w-0">
        <span className="text-muted">{date}</span> <span className="truncate">{description}</span>
        {flag && step >= 4 && <span className="ml-2 text-xs font-semibold text-bronze-ink">{flag}</span>}
      </span>
      <span className={`flex items-center gap-1.5 tabular-nums ${amount < 0 ? "text-warn" : "text-forest"}`}>
        {money(amount, 2)}
        {matched(id) && <Check aria-label="matched" className="size-4 text-forest" />}
      </span>
    </li>
  );
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[16px] border border-line p-3">
          <h4 className="flex justify-between px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Bank statement <span className="tabular-nums text-fg">{money(R.statementBalance, 2)}</span>
          </h4>
          <ul className="mt-2 space-y-1">
            {R.bank.map((b) => (
              <Row key={b.id} {...b} flag={b.id === "b4" ? "Not in ledger" : undefined} />
            ))}
          </ul>
        </div>
        <div className="rounded-[16px] border border-line p-3">
          <h4 className="flex justify-between px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Company ledger <span className="tabular-nums text-fg">{money(R.ledgerBalance, 2)}</span>
          </h4>
          <ul className="mt-2 space-y-1">
            {R.ledger.map((l) => (
              <Row key={l.id} {...l} flag={l.match ? undefined : "Not yet cleared"} />
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-4 grid gap-3 rounded-[16px] bg-forest p-4 text-sm text-beige sm:grid-cols-[1fr_auto] sm:items-center" aria-live="polite">
        <div>
          {step < 4 && <p>{step === 0 ? "Match each bank line to the ledger, then explain what's left." : `Matching… ${Math.min(step, 3)} of 3`}</p>}
          {step >= 4 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
              <dt className="text-beige/70">Bank 18,740.00 − cheque not cleared 610.00</dt>
              <dd className="text-right tabular-nums">{money(adjBank, 2)}</dd>
              <dt className="text-beige/70">Ledger 18,165.00 − bank charges 35.00</dt>
              <dd className="text-right tabular-nums">{money(adjLedger, 2)}</dd>
            </dl>
          )}
          {step >= 5 && (
            <p className="mt-2 flex items-center gap-1.5 font-semibold text-bronze">
              <Check aria-hidden className="size-4" /> Reconciled: both adjusted balances are {money(adjBank, 2)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={step === 0 ? run : () => setStep(0)}
          disabled={step > 0 && step < 5}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-beige px-4 font-semibold text-forest disabled:opacity-60"
        >
          {step === 0 ? "Run reconciliation" : step < 5 ? "Working…" : (<><RotateCcw aria-hidden className="size-3.5" /> Start again</>)}
        </button>
      </div>
    </div>
  );
}
