"use client";

import { useEffect, useState } from "react";
import { KEY_ROWS } from "@/components/blueprint/workspace";
import { typeKey, useComputer } from "@/lib/computer";

/**
 * The desk keyboard, close up, under the screen: the same keys as on the drawing. Clicking a
 * key types it; keys also light up when the physical keyboard presses them.
 */
export function Keyboard() {
  const { key } = useComputer();
  const [lit, setLit] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    setLit(key.k.toUpperCase());
    const t = setTimeout(() => setLit(null), 160);
    return () => clearTimeout(t);
  }, [key]);

  return (
    <div className="rounded-[6px] border border-ink/15 bg-[#ebe7de] p-1.5 shadow-[inset_0_-2px_0_rgba(0,0,0,0.06)] sm:p-2" aria-label="Desk keyboard" role="group">
      {KEY_ROWS.map((row, r) => (
        <div key={r} className="grid grid-cols-12 gap-1 [&+&]:mt-1">
          {row.map((k) => {
            const on = lit === k.k.toUpperCase();
            return (
              <button
                key={k.k}
                type="button"
                // Keep focus where it is (e.g. in Notes) while clicking keys.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => typeKey(k.k, true)}
                aria-label={k.k === " " ? "Space" : k.k === "Backspace" ? "Backspace" : k.k === "Enter" ? "Enter" : k.k}
                style={{ gridColumn: `span ${k.w ?? 1}` }}
                className={`h-8 rounded-[4px] border font-mono text-[0.72rem] text-[#1b1d1a] transition-[background-color,transform,box-shadow] duration-100 active:translate-y-px sm:h-9 sm:text-[0.8rem] ${
                  on
                    ? "translate-y-px border-[#2f6b4f] bg-[#8db39e] shadow-none"
                    : "border-black/15 bg-[#fbfaf6] shadow-[0_2px_0_rgba(0,0,0,0.14)] hover:bg-white"
                }`}
              >
                {k.label ?? k.k}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
