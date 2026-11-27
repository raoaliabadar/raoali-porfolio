"use client";

import { useCallback, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { closeComputer, computer, setTyping, typeKey, useComputer } from "@/lib/computer";
import { computer as copy } from "@/src/content";
import { Keyboard } from "./Keyboard";
import { Screen } from "./Screen";

const isField = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * The monitor, close up: the working screen with the desk keyboard under it. Also owns the one
 * physical-keyboard listener: while this is open, or while the desk keyboard is in use in the
 * hero, typed keys go to the computer.
 */
export function ComputerDialog() {
  const { dialog } = useComputer();
  const close = useCallback(() => closeComputer(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = computer();
      if (!s.dialog && !s.typing) return;
      if (e.key === "Escape" && s.typing && !s.dialog) return setTyping(false);
      if (e.ctrlKey || e.metaKey || e.altKey || isField(e.target)) return;
      // Enter / Space on a focused button still press that button.
      if ((e.key === "Enter" || e.key === " ") && e.target instanceof Element && e.target.closest("button,a,[role=button]")) return;
      if (e.key.length === 1 || e.key === "Backspace" || e.key === "Enter") {
        e.preventDefault();
        typeKey(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Modal open={dialog} onClose={close} labelledBy="pc-title" className="max-w-[60rem]">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <p id="pc-title" className="label text-ink">
          <span className="text-signal">[D]</span> {copy.title}
        </p>
        <button type="button" onClick={close} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
          Close
        </button>
      </div>
      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        {/* Monitor bezel */}
        <div className="rounded-[8px] bg-[#1f221e] p-1.5 shadow-[0_24px_50px_-30px_rgba(0,0,0,0.7)] sm:p-2.5">
          <div data-autofocus tabIndex={-1} aria-label={copy.title} className="h-[min(32rem,calc(100svh-20rem))] min-h-[17rem] outline-none">
            <Screen />
          </div>
        </div>
        <Keyboard />
      </div>
    </Modal>
  );
}
