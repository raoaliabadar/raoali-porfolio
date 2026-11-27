"use client";

import { forwardRef, useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { dashboard } from "@/src/content";

/** Design size of the app; Hero maps this rectangle onto the monitor's (isometric) screen. */
export const SCREEN_W = 630;
export const SCREEN_H = 350;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const ROWS = (() => {
  let bal = dashboard.openingBalance;
  return dashboard.rows.map((r) => {
    bal += r.credit - r.debit;
    return { ...r, balance: bal };
  });
})();
const income = ROWS.reduce((s, r) => s + r.credit, 0);
const spend = ROWS.reduce((s, r) => s + r.debit, 0);
const closing = ROWS[ROWS.length - 1].balance;

/**
 * The accounting app on the hero monitor. While `active`, it loops through a month's work:
 * entries are posted one by one (descriptions type out, the running balance and totals
 * update), then each line is reconciled and ticked. Data is the site's fictional sample and
 * the title bar says so. Purely decorative (aria-hidden); the static markup shows the end state.
 */
export const ScreenApp = forwardRef<HTMLDivElement, { active: boolean }>(function ScreenApp({ active }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    setupGsap();
    if (prefersReducedMotion()) return;
    const q = gsap.utils.selector(el);
    const rows = q("[data-row]");
    const status = q("[data-status]")[0];
    const kpi = q("[data-kpi]");
    const close = q("[data-close]")[0];
    const setStatus = (t: string) => () => (status.textContent = t);
    const totals = { inc: 0, exp: 0, bal: dashboard.openingBalance };
    const paint = () => {
      kpi[0].textContent = fmt(totals.inc);
      kpi[1].textContent = fmt(totals.exp);
      kpi[2].textContent = fmt(totals.bal);
      close.textContent = fmt(totals.bal);
    };

    const t = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
    t.add(() => {
      totals.inc = 0;
      totals.exp = 0;
      totals.bal = dashboard.openingBalance;
      paint();
    })
      .set(rows, { autoAlpha: 0 })
      .add(() => q("[data-desc]").forEach((d) => (d.textContent = "")))
      .set(q("[data-tick]"), { autoAlpha: 0, scale: 0.4 })
      .add(setStatus("Posting entries…"));

    ROWS.forEach((r, i) => {
      const row = rows[i];
      const desc = row.querySelector<HTMLElement>("[data-desc]")!;
      const typed = { n: 0 };
      t.set(row, { autoAlpha: 1, backgroundColor: "rgba(141,179,158,0.16)" })
        .to(typed, { n: r.description.length, duration: 0.55, ease: "none", onUpdate: () => (desc.textContent = r.description.slice(0, Math.round(typed.n))) })
        .fromTo(row.querySelectorAll("[data-amt]"), { autoAlpha: 0, x: 6 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.08, immediateRender: false })
        .add(() => {
          // Running totals after this entry.
          const upto = ROWS.slice(0, i + 1);
          gsap.to(totals, {
            inc: upto.reduce((s, x) => s + x.credit, 0),
            exp: upto.reduce((s, x) => s + x.debit, 0),
            bal: r.balance,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: paint,
          });
        })
        .to(row, { backgroundColor: "rgba(141,179,158,0)", duration: 0.5 }, "+=0.15");
    });

    t.add(setStatus("Reconciling with bank statement…"), "+=0.3");
    rows.forEach((row) => {
      t.to(row.querySelector("[data-tick]"), { autoAlpha: 1, scale: 1, duration: 0.25, ease: "back.out(3)" }, "+=0.18");
    });
    t.add(setStatus(`Reconciled ${ROWS.length}/${ROWS.length} · balance agrees`), "+=0.2").to({}, { duration: 2.6 });

    tl.current = t;
    return () => {
      t.kill();
      tl.current = null;
    };
  }, []);

  useEffect(() => {
    const t = tl.current;
    if (!t) return;
    if (active) t.play();
    else t.pause();
  }, [active]);

  return (
    <div ref={ref} className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: SCREEN_W, height: SCREEN_H }} aria-hidden>
      <div ref={root} className="flex size-full flex-col overflow-hidden bg-[#1c2b24] font-mono text-[10px] leading-none text-[#e9efe9]">
        {/* Title bar */}
        <div className="flex h-[24px] shrink-0 items-center justify-between border-b border-white/10 bg-[#16221c] px-3">
          <span className="flex gap-1">
            <span className="size-[6px] rounded-full bg-white/25" />
            <span className="size-[6px] rounded-full bg-white/25" />
            <span className="size-[6px] rounded-full bg-[#8db39e]" />
          </span>
          <span className="tracking-[0.04em] text-white/70">Ledger · {dashboard.company}</span>
          <span className="rounded-[2px] border border-[#c9a24a]/60 px-1.5 py-[3px] text-[8px] uppercase tracking-[0.08em] text-[#c9a24a]">Sample data</span>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <div className="flex w-[104px] shrink-0 flex-col gap-1 border-r border-white/10 bg-[#18261f] p-2.5">
            {["Ledger", "Invoices", "Reconcile", "Reports"].map((s, i) => (
              <span key={s} className={`rounded-[2px] px-2 py-[6px] ${i === 0 ? "bg-[#2f6b4f] text-white" : "text-white/55"}`}>
                {s}
              </span>
            ))}
            <span className="mt-auto px-2 text-[8px] uppercase tracking-[0.08em] text-white/40">{dashboard.months[10]} · Month end</span>
          </div>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Income", income],
                ["Expenses", spend],
                ["Balance", closing],
              ].map(([k, v], i) => (
                <div key={k} className={`rounded-[3px] border px-2.5 py-2 ${i === 2 ? "border-[#8db39e]/50 bg-[#2f6b4f]/30" : "border-white/10 bg-white/[0.03]"}`}>
                  <p className="text-[8px] uppercase tracking-[0.08em] text-white/50">{k}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[15px] tabular-nums">
                    <span className="size-[5px] bg-[#c9a24a]" />
                    <span data-kpi>{fmt(Number(v))}</span>
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2.5 min-h-0 flex-1 overflow-hidden rounded-[3px] border border-white/10">
              <div className="grid grid-cols-[46px_1fr_58px_58px_64px_16px] gap-2 border-b border-white/10 bg-white/[0.04] px-2.5 py-[6px] text-[8px] uppercase tracking-[0.08em] text-white/45">
                <span>Date</span>
                <span>Description</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span className="text-right">Balance</span>
                <span />
              </div>
              {ROWS.map((r) => (
                <div key={r.date + r.description} data-row className="grid grid-cols-[46px_1fr_58px_58px_64px_16px] items-center gap-2 border-b border-white/[0.06] px-2.5 py-[6px] tabular-nums">
                  <span className="text-white/50">{r.date}</span>
                  <span data-desc className="truncate">{r.description}</span>
                  <span data-amt className="text-right text-white/85">{r.debit ? fmt(r.debit) : "—"}</span>
                  <span data-amt className="text-right text-[#8db39e]">{r.credit ? fmt(r.credit) : "—"}</span>
                  <span data-amt className="text-right">{fmt(r.balance)}</span>
                  <span data-tick className="grid size-[12px] place-items-center rounded-[2px] bg-[#2f6b4f] text-[8px] text-white">✓</span>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-center justify-between text-[9px]">
              <span className="flex items-center gap-1.5 text-white/60">
                <span className="size-[5px] animate-pulse rounded-full bg-[#8db39e]" />
                <span data-status>Reconciled {ROWS.length}/{ROWS.length} · balance agrees</span>
              </span>
              <span className="text-white/60">
                Closing balance <span data-close className="ml-1 text-[11px] text-white">{fmt(closing)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
