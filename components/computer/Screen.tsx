"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { APP_IDS, back, closeApp, minimizeApp, openApp, showDesktop, useComputer } from "@/lib/computer";
import { computer as copy, dashboard } from "@/src/content";
import { AppBody, AppIcon, appCrumb } from "./apps";

/**
 * The computer's screen at full size: a desktop of app icons, one window in front with
 * Back / Minimise / Close, and a taskbar of everything open (minimised windows come back from
 * there). Same dark ledger look as the app on the hero monitor.
 */
export function Screen() {
  const s = useComputer();
  const win = useRef<HTMLDivElement>(null);
  const active = s.active;
  const path = active ? (s.paths[active] ?? []) : [];

  // Windows open with a quick scale-up, and take the focus (their text field if they have
  // one), so keys typed next go to them and not to the icon that opened them.
  useEffect(() => {
    const w = win.current;
    if (!w || !active) return;
    const hadFocus = w.closest("[role=dialog]")?.contains(document.activeElement);
    if (hadFocus) (w.querySelector<HTMLElement>("textarea, input") ?? w).focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    setupGsap();
    gsap.fromTo(w, { scale: 0.96, opacity: 0, y: 8 }, { scale: 1, opacity: 1, y: 0, duration: 0.32, ease: "power3.out" });
  }, [active]);

  const crumb = active ? appCrumb(active, path) : null;

  return (
    <div className="relative flex size-full flex-col overflow-hidden rounded-[3px] bg-[#1c2b24] font-mono text-[#e9efe9]">
      {/* Top bar */}
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-white/10 bg-[#16221c] px-3 text-[0.68rem]">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-[7px] rounded-full bg-white/25" />
          <span className="size-[7px] rounded-full bg-white/25" />
          <span className="size-[7px] rounded-full bg-[#8db39e]" />
        </span>
        <span className="truncate px-2 tracking-[0.04em] text-white/70">Ledger · {dashboard.company}</span>
        <span className="shrink-0 rounded-[2px] border border-[#c9a24a]/60 px-1.5 py-[2px] text-[0.58rem] uppercase tracking-[0.08em] text-[#c9a24a]">{copy.sample}</span>
      </div>

      {/* Desktop */}
      <div className="relative min-h-0 flex-1">
        <ul className="grid grid-cols-4 content-start gap-1 p-3 sm:gap-2 sm:p-4" aria-label="Applications">
          {APP_IDS.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => openApp(id)}
                className="group flex w-full flex-col items-center gap-1.5 rounded-[3px] px-1 py-2 text-center hover:bg-white/[0.06] focus-visible:bg-white/[0.06]"
              >
                <AppIcon id={id} className="h-9 w-9 text-white/80 transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-11 sm:w-11" />
                <span className="text-[0.62rem] leading-tight text-white/80 sm:text-[0.7rem]">{copy.apps[id]}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* The window in front */}
        {active && (
          <div
            ref={win}
            role="region"
            tabIndex={-1}
            aria-label={copy.apps[active]}
            className="absolute inset-1.5 flex flex-col overflow-hidden rounded-[4px] border outline-none border-white/15 bg-[#1f3029] shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] sm:inset-3"
          >
            <div className="flex h-9 shrink-0 items-center gap-1 border-b border-white/10 bg-[#18261f] px-1.5">
              <button type="button" onClick={back} aria-label="Back" title="Back" className="grid size-7 place-items-center rounded-[3px] text-white/80 hover:bg-white/10">
                ←
              </button>
              <p className="min-w-0 flex-1 truncate px-1 text-[0.75rem] text-white/90">
                {copy.apps[active]}
                {crumb && <span className="text-white/50"> / {crumb}</span>}
              </p>
              <button type="button" onClick={() => minimizeApp(active)} aria-label="Minimise" title="Minimise" className="grid size-7 place-items-center rounded-[3px] text-white/80 hover:bg-white/10">
                –
              </button>
              <button type="button" onClick={() => closeApp(active)} aria-label="Close" title="Close" className="grid size-7 place-items-center rounded-[3px] text-white/80 hover:bg-[#8a3b2e]">
                ×
              </button>
            </div>
            <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <AppBody id={active} />
            </div>
          </div>
        )}

        {/* Notices from the desk */}
        {s.toast && (
          <p key={s.toast.id} role="status" className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-[3px] border border-[#8db39e]/50 bg-[#16221c] px-3 py-1.5 text-[0.7rem] text-white shadow-lg">
            {s.toast.text}
          </p>
        )}
      </div>

      {/* Taskbar */}
      <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-t border-white/10 bg-[#16221c] px-1.5">
        <button
          type="button"
          onClick={showDesktop}
          aria-pressed={!active}
          className={`shrink-0 rounded-[3px] px-2 py-1 text-[0.65rem] uppercase tracking-[0.06em] ${!active ? "bg-[#2f6b4f] text-white" : "text-white/70 hover:bg-white/10"}`}
        >
          {copy.desktop}
        </button>
        {s.windows.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => (s.active === w.id ? minimizeApp(w.id) : openApp(w.id))}
            aria-pressed={s.active === w.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-[3px] px-2 py-1 text-[0.65rem] ${
              s.active === w.id ? "bg-white/15 text-white" : w.min ? "text-white/50 hover:bg-white/10" : "text-white/80 hover:bg-white/10"
            }`}
          >
            <AppIcon id={w.id} className="size-3.5 text-white/80" />
            <span className="max-w-[7rem] truncate">{copy.apps[w.id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
