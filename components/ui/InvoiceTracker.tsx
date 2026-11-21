"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ArrowUpDown, BellRing, Check, ChevronRight, Download, RotateCcw, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ease } from "@/lib/motion";
import { pandaReact } from "@/lib/panda";

/**
 * Working billing tracker demo (sample data, kept in local state).
 * Search, status filter, sortable columns, clickable summary cards, CSV export,
 * and a details dialog with real actions (mark as paid / send reminder / mark as sent).
 */

type Status = "Paid" | "Sent" | "Overdue" | "Draft";
type Invoice = {
  id: string;
  client: string;
  issued: string; // ISO date
  due: string; // ISO date
  amount: number;
  status: Status;
  items: { label: string; amount: number }[];
  history: string[];
};

const SEED: Invoice[] = [
  ["INV-1041", "Client A", "2026-10-01", "2026-10-15", 1250, "Paid"],
  ["INV-1042", "Client B", "2026-10-03", "2026-10-17", 860, "Overdue"],
  ["INV-1043", "Client C", "2026-10-06", "2026-10-20", 2100, "Sent"],
  ["INV-1044", "Client D", "2026-10-09", "2026-10-23", 540, "Paid"],
  ["INV-1045", "Client E", "2026-10-12", "2026-10-26", 1780, "Overdue"],
  ["INV-1046", "Client F", "2026-10-15", "2026-10-29", 990, "Sent"],
  ["INV-1047", "Client G", "2026-10-20", "2026-11-03", 3200, "Draft"],
  ["INV-1048", "Client H", "2026-10-24", "2026-11-07", 675, "Sent"],
].map(([id, client, issued, due, amount, status]) => {
  const a = amount as number;
  const first = Math.round(a * 0.6);
  return {
    id: id as string,
    client: client as string,
    issued: issued as string,
    due: due as string,
    amount: a,
    status: status as Status,
    items: [
      { label: "Monthly bookkeeping", amount: first },
      { label: "CRM data maintenance", amount: a - first },
    ],
    history: [`Created ${fmtDate(issued as string)}`, ...(status === "Draft" ? [] : [`Sent ${fmtDate(issued as string)}`])].concat(
      status === "Paid" ? [`Payment received ${fmtDate(due as string)}`] : [],
    ),
  };
});

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}
const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const STATUS_STYLE: Record<Status, string> = {
  Paid: "border-emerald-600/25 bg-emerald-50 text-emerald-700",
  Sent: "border-sky-600/25 bg-sky-50 text-sky-700",
  Overdue: "border-accent/30 bg-tint text-warn",
  Draft: "border-line bg-surface-2 text-muted",
};

type SortKey = "id" | "client" | "due" | "amount" | "status";
const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "id", label: "Invoice" },
  { key: "client", label: "Client" },
  { key: "due", label: "Due" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status", align: "right" },
];

export function InvoiceTracker() {
  const [invoices, setInvoices] = useState<Invoice[]>(SEED);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "due", dir: 1 });
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices
      .filter((i) => (status === "All" ? true : i.status === status))
      .filter((i) => !q || i.id.toLowerCase().includes(q) || i.client.toLowerCase().includes(q))
      .sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
      });
  }, [invoices, query, status, sort]);

  const totals = useMemo(() => {
    const sum = (s: Status[]) => invoices.filter((i) => s.includes(i.status)).reduce((n, i) => n + i.amount, 0);
    return {
      billed: sum(["Paid", "Sent", "Overdue"]),
      collected: sum(["Paid"]),
      outstanding: sum(["Sent", "Overdue"]),
      overdue: invoices.filter((i) => i.status === "Overdue").length,
    };
  }, [invoices]);

  // Panda looks surprised when a search/filter returns nothing.
  const empty = rows.length === 0;
  useEffect(() => {
    if (empty) pandaReact("surprised", "No matching invoices");
  }, [empty]);

  const onSearch = (v: string) => {
    setQuery(v);
    if (thinkTimer.current) clearTimeout(thinkTimer.current);
    thinkTimer.current = setTimeout(() => v && pandaReact("think"), 250);
  };

  const applyStatus = (s: "All" | Status) => {
    setStatus(s);
    pandaReact("nod", s === "All" ? "Showing all invoices" : `Filtered: ${s}`);
  };

  const toggleSort = (key: SortKey) => {
    setSort((cur) => ({ key, dir: cur.key === key ? ((cur.dir * -1) as 1 | -1) : 1 }));
    pandaReact("nod");
  };

  const update = (id: string, patch: (i: Invoice) => Partial<Invoice>) =>
    setInvoices((list) => list.map((i) => (i.id === id ? { ...i, ...patch(i) } : i)));

  const markPaid = (inv: Invoice) => {
    update(inv.id, (i) => ({ status: "Paid", history: [...i.history, `Payment received ${today()}`] }));
    notify(`${inv.id} marked as paid`);
    pandaReact("cheer", "Payment recorded ✓");
  };
  const sendReminder = (inv: Invoice) => {
    update(inv.id, (i) => ({ history: [...i.history, `Reminder sent ${today()}`] }));
    notify(`Reminder sent to ${inv.client}`);
    pandaReact("nod", "Reminder sent ✓");
  };
  const markSent = (inv: Invoice) => {
    update(inv.id, (i) => ({ status: "Sent", history: [...i.history, `Sent ${today()}`] }));
    notify(`${inv.id} sent to ${inv.client}`);
    pandaReact("cheer", "Invoice sent ✓");
  };

  const exportCsv = () => {
    const header = ["Invoice", "Client", "Issued", "Due", "Amount", "Status"];
    const lines = rows.map((i) => [i.id, i.client, i.issued, i.due, i.amount.toFixed(2), i.status].join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported ${rows.length} invoice${rows.length === 1 ? "" : "s"} to CSV`);
    pandaReact("cheer", "CSV exported ✓");
  };

  const reset = () => {
    setInvoices(SEED);
    setQuery("");
    setStatus("All");
    setSort({ key: "due", dir: 1 });
    notify("Demo data reset");
    pandaReact("nod", "Fresh start");
  };

  const open = invoices.find((i) => i.id === openId) ?? null;

  const summary: { label: string; value: string; filter: "All" | Status; hint: string }[] = [
    { label: "Billed", value: money(totals.billed), filter: "All", hint: "Show all invoices" },
    { label: "Collected", value: money(totals.collected), filter: "Paid", hint: "Show paid invoices" },
    { label: "Outstanding", value: money(totals.outstanding), filter: "Sent", hint: "Show sent invoices" },
    { label: "Overdue", value: String(totals.overdue), filter: "Overdue", hint: "Show overdue invoices" },
  ];

  return (
    <div className="shadow-soft relative overflow-hidden rounded-[28px] border border-line bg-surface p-5 md:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-xl font-medium tracking-[-0.03em]">Monthly billing tracker</p>
          <p className="text-xs text-muted">Interactive demo · sample data, nothing is saved</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={empty}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium transition-colors hover:border-fg/30 active:scale-[0.97] disabled:opacity-40"
          >
            <Download className="size-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-medium transition-colors hover:border-fg/30 active:scale-[0.97]"
          >
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Summary cards (click to filter) */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {summary.map((s) => {
          const on = status === s.filter;
          return (
            <button
              key={s.label}
              type="button"
              title={s.hint}
              onClick={() => applyStatus(s.filter)}
              aria-pressed={on}
              className={`rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                on ? "border-accent/50 bg-tint" : "border-line bg-surface hover:border-fg/20"
              }`}
            >
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</p>
              <p className="mt-1 font-display text-lg font-light tabular-nums md:text-xl">{s.value}</p>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Search invoices</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search invoice or client…"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted focus:border-accent/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => onSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>
        <label className="relative">
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(e) => applyStatus(e.target.value as "All" | Status)}
            className="cursor-pointer appearance-none rounded-full border border-line bg-surface py-2.5 pl-4 pr-9 text-sm outline-none transition-colors focus:border-accent/50"
          >
            {["All", "Paid", "Sent", "Overdue", "Draft"].map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted" />
        </label>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={c.key}
                    aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                    className={`py-2 font-normal ${c.align === "right" ? "text-right" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex items-center gap-1 rounded-md px-1 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-fg ${
                        active ? "text-fg" : "text-muted"
                      }`}
                    >
                      {c.label}
                      <Icon className="size-3" />
                    </button>
                  </th>
                );
              })}
              <th className="w-24 py-2 text-right text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr
                key={i.id}
                tabIndex={0}
                onClick={() => {
                  setOpenId(i.id);
                  pandaReact("nod");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(i.id);
                  }
                }}
                aria-label={`Open ${i.id} for ${i.client}`}
                className="cursor-pointer border-b border-line/70 outline-none transition-colors last:border-0 hover:bg-surface-2 focus-visible:bg-surface-2 active:bg-tint"
              >
                <td className="py-3 pl-1 font-medium tabular-nums">{i.id}</td>
                <td className="py-3 text-fg/75">{i.client}</td>
                <td className="py-3 tabular-nums text-fg/75">{fmtDate(i.due)}</td>
                <td className="py-3 text-right tabular-nums">{money(i.amount)}</td>
                <td className="py-3 text-right">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_STYLE[i.status]}`}>{i.status}</span>
                </td>
                <td className="py-3 pr-1 text-right">
                  {i.status === "Overdue" || i.status === "Sent" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sendReminder(i);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs transition-colors hover:border-accent/50 hover:text-warn active:scale-[0.96]"
                    >
                      <BellRing className="size-3" /> Remind
                    </button>
                  ) : i.status === "Draft" ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markSent(i);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs transition-colors hover:border-sky-600/40 hover:text-sky-700 active:scale-[0.96]"
                    >
                      <Send className="size-3" /> Send
                    </button>
                  ) : (
                    <Check className="ml-auto size-4 text-emerald-600" aria-label="Paid" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {empty && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted">No invoices match your search.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                applyStatus("All");
              }}
              className="mt-3 rounded-full border border-line px-4 py-2 text-xs font-medium transition-colors hover:border-fg/30"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <AnimatePresence>
          {toast && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease }}
              className="rounded-full bg-fg px-4 py-2 text-xs font-medium text-ink shadow-lg"
            >
              {toast}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
      <AnimatePresence>
        {open && (
          <InvoiceDialog
            invoice={open}
            onClose={() => setOpenId(null)}
            onPaid={() => markPaid(open)}
            onRemind={() => sendReminder(open)}
            onSend={() => markSent(open)}
          />
        )}
      </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function InvoiceDialog({
  invoice,
  onClose,
  onPaid,
  onRemind,
  onSend,
}: {
  invoice: Invoice;
  onClose: () => void;
  onPaid: () => void;
  onRemind: () => void;
  onSend: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);

  const canPay = invoice.status === "Sent" || invoice.status === "Overdue";

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-surface-2/80 backdrop-blur-md" onClick={onClose} aria-hidden />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-title"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.45, ease }}
        className="shadow-soft relative w-full max-w-lg rounded-t-[28px] border border-line bg-surface p-6 md:rounded-[28px] md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Sample invoice</p>
            <h3 id="invoice-title" className="font-display text-3xl font-light tracking-[-0.04em]">
              {invoice.id}
            </h3>
            <p className="mt-1 text-sm text-fg/70">{invoice.client}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close invoice"
            className="grid size-9 place-items-center rounded-full border border-line transition-colors hover:bg-fg hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted">Issued</dt>
            <dd className="tabular-nums">{fmtDate(invoice.issued)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Due</dt>
            <dd className="tabular-nums">{fmtDate(invoice.due)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Status</dt>
            <dd>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_STYLE[invoice.status]}`}>{invoice.status}</span>
            </dd>
          </div>
        </dl>

        <table className="mt-6 w-full text-sm">
          <tbody>
            {invoice.items.map((it) => (
              <tr key={it.label} className="border-b border-line/70">
                <td className="py-2.5 text-fg/80">{it.label}</td>
                <td className="py-2.5 text-right tabular-nums">{money(it.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-2.5 font-medium">Total</td>
              <td className="py-2.5 text-right font-medium tabular-nums">{money(invoice.amount)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-5">
          <p className="text-xs text-muted">Activity</p>
          <ul className="mt-2 space-y-1.5">
            {invoice.history.map((h, k) => (
              <li key={`${h}-${k}`} className="flex items-center gap-2 text-sm text-fg/75">
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {canPay && (
            <button
              type="button"
              onClick={onPaid}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan active:scale-[0.97]"
            >
              <Check className="size-4" /> Mark as paid
            </button>
          )}
          {canPay && (
            <button
              type="button"
              onClick={onRemind}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 text-sm font-medium transition-colors hover:border-fg/30 active:scale-[0.97]"
            >
              <BellRing className="size-4" /> Send reminder
            </button>
          )}
          {invoice.status === "Draft" && (
            <button
              type="button"
              onClick={onSend}
              className="inline-flex items-center gap-1.5 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent active:scale-[0.97]"
            >
              <Send className="size-4" /> Mark as sent
            </button>
          )}
          {invoice.status === "Paid" && (
            <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <Check className="size-4" /> Paid in full
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
