"use client";

import { forwardRef } from "react";
import { SCREEN_H, SCREEN_W } from "@/components/blueprint/ScreenApp";
import { APP_IDS, useComputer } from "@/lib/computer";
import { computer as copy, dashboard } from "@/src/content";
import { AppIcon, appGlance } from "./apps";

/**
 * The desk monitor's own view of the computer, laid onto the screen in the drawing. Large type,
 * so it reads at the drawing's size: what is open, what is being typed, the calculator's
 * figure, notices from the desk. Shown once the computer has been woken; click the monitor to
 * open the full screen.
 */
export const Glance = forwardRef<HTMLDivElement>(function Glance(_, ref) {
  const s = useComputer();
  const a = s.active;
  const lines = s.notes.split("\n").slice(-3);

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 origin-top-left transition-opacity duration-500 ${s.on ? "opacity-100" : "opacity-0"}`}
      style={{ width: SCREEN_W, height: SCREEN_H }}
    >
      <div className="flex size-full flex-col overflow-hidden bg-[#1c2b24] font-mono leading-none text-[#e9efe9]">
        <div className="flex h-[40px] shrink-0 items-center justify-between border-b border-white/10 bg-[#16221c] px-4 text-[18px]">
          <span className="truncate text-white/80">{a ? copy.apps[a] : copy.desktop}</span>
          <span className="rounded-[3px] border border-[#c9a24a]/60 px-2 py-1 text-[13px] uppercase tracking-[0.08em] text-[#c9a24a]">{copy.sample}</span>
        </div>

        <div className="relative min-h-0 flex-1 px-6 py-5">
          {!a && (
            <div className="grid grid-cols-4 gap-x-4 gap-y-5">
              {APP_IDS.map((id) => (
                <div key={id} className="flex flex-col items-center gap-2 text-center">
                  <AppIcon id={id} className="size-[62px] text-white/80" />
                  <span className="text-[15px] leading-tight text-white/75">{copy.apps[id].split(" ")[0]}</span>
                </div>
              ))}
            </div>
          )}
          {a === "notes" && (
            <div className="text-[34px] leading-[1.25] text-white">
              {lines.map((l, i) => (
                <p key={i} className="truncate">
                  {l}
                  {i === lines.length - 1 && <span className="ml-0.5 inline-block h-[30px] w-[14px] translate-y-[4px] animate-pulse bg-[#8db39e]" />}
                </p>
              ))}
            </div>
          )}
          {a === "calculator" && (
            <div className="flex h-full flex-col items-end justify-center gap-3">
              <span className="text-[22px] text-white/50">{s.calc.tape[s.calc.tape.length - 1] ?? ""}</span>
              <span className="truncate font-[family-name:var(--font-pixel)] text-[76px] text-white">{s.calc.display}</span>
            </div>
          )}
          {a && a !== "notes" && a !== "calculator" && (
            <div className="flex h-full items-center gap-6">
              <AppIcon id={a} className="size-[120px] shrink-0 text-white/85" />
              <div className="min-w-0">
                <p className="text-[34px] leading-tight text-white">{copy.apps[a]}</p>
                <p className="mt-3 truncate text-[22px] text-[#8db39e]">{appGlance(a)}</p>
                <p className="mt-3 text-[16px] text-white/45">{dashboard.company}</p>
              </div>
            </div>
          )}

          {s.toast && (
            <p key={s.toast.id} className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded-[4px] border border-[#8db39e]/60 bg-[#16221c] px-4 py-2.5 text-[22px] text-white">
              {s.toast.text}
            </p>
          )}
        </div>

        <div className="flex h-[38px] shrink-0 items-center justify-between border-t border-white/10 bg-[#16221c] px-4 text-[15px] text-white/60">
          <span className={s.typing ? "text-[#8db39e]" : ""}>{s.typing ? copy.typing : copy.open}</span>
          <span>{s.windows.length ? `${s.windows.length} open` : ""}</span>
        </div>
      </div>
    </div>
  );
});
