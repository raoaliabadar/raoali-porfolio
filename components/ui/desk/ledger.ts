/**
 * The bookkeeping data behind the desk monitor's accounting app: transactions (sample data on
 * first use, then whatever the visitor enters, kept in this browser) and the reports built from them.
 */
export type TxType = "income" | "expense";
export type Tx = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  category: string;
  type: TxType;
  amount: number;
  /** Unpaid income = receivable, unpaid expense = payable. */
  paid: boolean;
};

export const INCOME_CATEGORIES = ["Bookkeeping services", "Payroll services", "Tax filing", "Advisory", "Other income"];
export const EXPENSE_CATEGORIES = ["Salaries", "Rent", "Software", "Utilities", "Marketing", "Office supplies", "Travel", "Bank fees"];

/** Opening position (fictional sample business). Opening assets = liabilities + capital. */
export const OPENING = {
  cash: 25000,
  equipment: 18000,
  depreciation: 3600,
  loan: 12000,
  get capital() {
    return this.cash + this.equipment - this.depreciation - this.loan;
  },
};

const KEY = "desk-ledger-v1";
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => iso(new Date());
export const newId = () => Math.random().toString(36).slice(2, 10);

/** Six months of believable sample entries, ending this month (fixed amounts, so it's repeatable). */
export function sampleLedger(now = new Date()): Tx[] {
  const out: Tx[] = [];
  const add = (m: number, day: number, description: string, category: string, type: TxType, amount: number, paid = true) => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, Math.min(day, 28));
    if (d > now) d.setDate(Math.max(1, now.getDate()));
    out.push({ id: newId(), date: iso(d), description, category, type, amount, paid });
  };
  const growth = [0.86, 0.9, 0.95, 1, 1.04, 1.1]; // older → newer
  for (let m = 5; m >= 0; m--) {
    const g = growth[5 - m];
    add(m, 3, "Monthly bookkeeping retainer: Halden & Co.", "Bookkeeping services", "income", Math.round(4200 * g));
    add(m, 6, "Payroll processing: Orbit Studio", "Payroll services", "income", Math.round(1850 * g));
    add(m, 12, "Bookkeeping clean-up: Lumen Retail", "Bookkeeping services", "income", Math.round(2600 * g), m > 0);
    add(m, 18, "Advisory session: Atlas Logistics", "Advisory", "income", Math.round(1200 * g));
    if (m % 2 === 0) add(m, 22, "Tax filing package", "Tax filing", "income", Math.round(1500 * g), m > 1);
    add(m, 1, "Office rent", "Rent", "expense", 1800);
    add(m, 25, "Staff salaries", "Salaries", "expense", Math.round(3900 * (0.95 + g * 0.05)));
    add(m, 5, "Accounting & CRM software", "Software", "expense", 420);
    add(m, 9, "Electricity & internet", "Utilities", "expense", Math.round(260 + (m % 3) * 35));
    add(m, 14, "Online ads", "Marketing", "expense", Math.round(380 * g), m > 0);
    if (m % 2 === 1) add(m, 16, "Printer paper & supplies", "Office supplies", "expense", 145);
    if (m % 3 === 0) add(m, 20, "Client visit travel", "Travel", "expense", 310);
    add(m, 27, "Bank charges", "Bank fees", "expense", 38);
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function loadLedger(): Tx[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Tx[];
      if (Array.isArray(data)) return data;
    }
  } catch {
    /* storage unavailable or corrupt: fall back to the sample */
  }
  return sampleLedger();
}

export function saveLedger(txs: Tx[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(txs));
  } catch {
    /* private mode / full storage: the data stays for this visit only */
  }
}

export const money = (n: number, cents = false) =>
  `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`;

export const monthKey = (date: string) => date.slice(0, 7);
export const monthLabel = (key: string) =>
  new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1).toLocaleString("en-US", { month: "short" });

/** The last `n` month keys, oldest first, ending with the current month. */
export function lastMonths(n: number, now = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

export type Period = "month" | "quarter" | "half" | "all";
export const PERIODS: { id: Period; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "quarter", label: "Last 3 months" },
  { id: "half", label: "Last 6 months" },
  { id: "all", label: "All time" },
];
export function inPeriod(tx: Tx, p: Period) {
  if (p === "all") return true;
  const months = lastMonths(p === "month" ? 1 : p === "quarter" ? 3 : 6);
  return months.includes(monthKey(tx.date));
}

export function totals(txs: Tx[]) {
  let income = 0;
  let expense = 0;
  for (const t of txs) t.type === "income" ? (income += t.amount) : (expense += t.amount);
  return { income, expense, net: income - expense };
}

export function byCategory(txs: Tx[], type: TxType) {
  const map = new Map<string, number>();
  for (const t of txs) if (t.type === type) map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map.entries()].map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
}

export function monthly(txs: Tx[], months = lastMonths(6)) {
  return months.map((key) => {
    const t = totals(txs.filter((x) => monthKey(x.date) === key));
    return { key, label: monthLabel(key), ...t };
  });
}

/** Balance sheet as of today, built from the opening position plus every transaction. */
export function balanceSheet(txs: Tx[]) {
  let cash = OPENING.cash;
  let receivables = 0;
  let payables = 0;
  for (const t of txs) {
    if (t.type === "income") t.paid ? (cash += t.amount) : (receivables += t.amount);
    else t.paid ? (cash -= t.amount) : (payables += t.amount);
  }
  const equipmentNet = OPENING.equipment - OPENING.depreciation;
  const retained = totals(txs).net;
  const assets = cash + receivables + equipmentNet;
  const liabilities = payables + OPENING.loan;
  const equity = OPENING.capital + retained;
  return { cash, receivables, equipmentNet, assets, payables, loan: OPENING.loan, liabilities, capital: OPENING.capital, retained, equity };
}

export function toCsv(txs: Tx[]) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const rows = [["Date", "Description", "Category", "Type", "Amount", "Status"]];
  for (const t of [...txs].sort((a, b) => a.date.localeCompare(b.date)))
    rows.push([t.date, t.description, t.category, t.type, t.amount.toFixed(2), t.paid ? "Paid" : "Unpaid"]);
  return rows.map((r) => r.map(esc).join(",")).join("\n");
}
