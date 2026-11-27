"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { APP_IDS, back, closeApp, minimizeApp, openApp, showDesktop, useComputer } from "@/lib/computer";
import { computer as copy, dashboard, identity } from "@/src/content";
import { AppBody, AppIcon, appCrumb, fmt } from "./apps";

const REVENUE = dashboard.income.reduce((s, x) => s + x, 0);
const EXPENSES = dashboard.expenses.reduce((s, x) => s + x, 0);
const CASH = dashboard.cash[dashboard.cash.length - 1];

/** Local date and time (Asia/Karachi), updated every 20 seconds. */
function useClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: identity.timezone, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
    const tick = () => setNow(f.format(new Date()).replace(",", ""));
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * The computer's screen at full size, laid out like a desktop OS: a menu bar (app name, clock,
 * the sample-data flag), a desktop of app tiles with a month-end summary widget, one window in
 * front (Back · title · Minimise · Close) and a dock of every app, with a dot under the open ones.
 */
export function Screen() {
  const s = useComputer();
  const win = useRef<HTMLDivElement>(null);
  const active = s.active;
  const path = active ? (s.paths[active] ?? []) : [];
  const clock = useClock();

  // Windows open with a quick scale-up, and take the focus (their text field if they have
  // one), so keys typed next go to them and not to the icon that opened them.
  useEffect(() => {
    const w = win.current;
    if (!w || !active) return;
    const hadFocus = w.closest("[role=dialog]")?.contains(document.activeElement);
    if (hadFocus) (w.querySelector<HTMLElement>("textarea, input") ?? w).focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    setupGsap();
    gsap.fromTo(w, { scale: 0.97, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: "power3.out" });
  }, [active]);

  const crumb = active ? appCrumb(active, path) : null;
  const open = new Set(s.windows.map((w) => w.id));

  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-[4px] bg-[#15201b] font-sans text-[#e9efe9]">
      {/* Menu bar */}
      <div className="flex h-8 shrink-0 items-center gap-3 border-b border-white/[0.08] bg-[#111a16]/95 px-3 text-[0.72rem]">
        <span className="grid size-5 shrink-0 place-items-center rounded-[4px] bg-[#2f6b4f] font-mono text-[0.55rem] font-semibold text-white">{identity.initials}</span>
        <span className="font-semibold text-white">Ledger</span>
        <span className="truncate text-white/55">{active ? copy.apps[active] : copy.desktop}</span>
        <span className="ml-auto hidden shrink-0 tabular-nums text-white/60 sm:inline">{clock}</span>
        <span className="shrink-0 rounded-[3px] border border-[#c9a24a]/50 bg-[#c9a24a]/10 px-1.5 py-[2px] font-mono text-[0.56rem] uppercase tracking-[0.08em] text-[#d9b867]">{copy.sample}</span>
      </div>

      {/* Desktop */}
      <div className="relative min-h-0 flex-1 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:18px_18px]">
        <div className="flex h-full gap-4 p-3 sm:p-5">
          <ul className="grid flex-1 grid-cols-4 content-start gap-x-1 gap-y-3 sm:gap-x-2 sm:gap-y-4" aria-label="Applications">
            {APP_IDS.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => openApp(id)}
                  className="group flex w-full flex-col items-center gap-1.5 rounded-[8px] px-1 py-1.5 text-center outline-none focus-visible:bg-white/[0.07]"
                >
                  <span className="grid size-12 place-items-center rounded-[12px] border border-white/10 bg-white/[0.05] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.8)] transition-[transform,background-color,border-color] duration-300 group-hover:-translate-y-0.5 group-hover:border-[#8db39e]/50 group-hover:bg-white/[0.09] sm:size-14">
                    <AppIcon id={id} className="size-8 text-white/85 sm:size-9" />
                  </span>
                  <span className="text-[0.64rem] leading-tight text-white/80 sm:text-[0.72rem]">{copy.apps[id]}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Month-end summary widget (sample data) */}
          <aside className="hidden w-52 shrink-0 self-start rounded-[10px] border border-white/10 bg-[#1b2822]/90 p-3.5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)] md:block" aria-label="Year summary">
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.1em] text-white/50">Year to date</p>
            <dl className="mt-3 space-y-2.5 text-[0.78rem]">
              {[
                ["Revenue", fmt(REVENUE)],
                ["Expenses", fmt(EXPENSES)],
                ["Net profit", fmt(REVENUE - EXPENSES)],
                ["Cash at bank", fmt(CASH)],
              ].map(([k, v], i) => (
                <div key={k} className="flex items-baseline justify-between gap-2">
                  <dt className="text-white/60">{k}</dt>
                  <dd className={`font-mono tabular-nums ${i === 2 ? "text-[#8db39e]" : "text-white"}`}>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2.5 text-[0.68rem] text-white/55">
              <span className="size-1.5 rounded-full bg-[#8db39e]" />
              Books reconciled
            </p>
          </aside>
        </div>

        {/* The window in front */}
        {active && (
          <div
            ref={win}
            role="region"
            tabIndex={-1}
            aria-label={copy.apps[active]}
            className="absolute inset-2 flex flex-col overflow-hidden rounded-[10px] border border-white/[0.12] bg-[#1c2a24] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] outline-none sm:inset-4"
          >
            <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#17231e] px-2">
              <button type="button" onClick={back} aria-label="Back" title="Back" className="grid size-7 place-items-center rounded-[6px] border border-white/10 text-[0.8rem] text-white/80 hover:bg-white/10">
                ←
              </button>
              <AppIcon id={active} className="size-5 shrink-0 text-white/80" />
              <p className="min-w-0 flex-1 truncate text-[0.8rem] font-medium text-white">
                {copy.apps[active]}
                {crumb && <span className="font-normal text-white/50"> / {crumb}</span>}
              </p>
              <button type="button" onClick={() => minimizeApp(active)} aria-label="Minimise" title="Minimise" className="grid size-7 place-items-center rounded-[6px] text-white/75 hover:bg-white/10">
                <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden><path d="M1 5h8" stroke="currentColor" strokeWidth="1.3" /></svg>
              </button>
              <button type="button" onClick={() => closeApp(active)} aria-label="Close" title="Close" className="grid size-7 place-items-center rounded-[6px] text-white/75 hover:bg-[#b0473a] hover:text-white">
                <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" /></svg>
              </button>
            </div>
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-5">
              <AppBody id={active} />
            </div>
          </div>
        )}

        {/* Notices from the desk */}
        {s.toast && (
          <p key={s.toast.id} role="status" className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-[8px] border border-white/10 bg-[#111a16]/95 px-3 py-2 text-[0.72rem] text-white shadow-lg">
            <span className="size-1.5 rounded-full bg-[#8db39e]" />
            {s.toast.text}
          </p>
        )}
      </div>

      {/* Dock */}
      <div className="flex h-12 shrink-0 items-center justify-center border-t border-white/[0.08] bg-[#111a16]/95 px-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={showDesktop}
            aria-pressed={!active}
            title={copy.desktop}
            aria-label={copy.desktop}
            className={`grid size-9 shrink-0 place-items-center rounded-[8px] ${!active ? "bg-white/[0.12]" : "hover:bg-white/[0.08]"}`}
          >
            <svg viewBox="0 0 16 16" className="size-4 text-white/80" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
          </button>
          <span aria-hidden className="mx-1 h-6 w-px bg-white/10" />
          {APP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => (s.active === id ? minimizeApp(id) : openApp(id))}
              aria-pressed={s.active === id}
              aria-label={copy.apps[id]}
              title={copy.apps[id]}
              className={`relative grid size-9 shrink-0 place-items-center rounded-[8px] transition-colors ${s.active === id ? "bg-white/[0.12]" : "hover:bg-white/[0.08]"}`}
            >
              <AppIcon id={id} className="size-6 text-white/85" />
              {open.has(id) && <span aria-hidden className={`absolute -bottom-0.5 size-1 rounded-full ${s.active === id ? "bg-[#8db39e]" : "bg-white/50"}`} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
