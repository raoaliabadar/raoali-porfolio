"use client";

import { useCallback, useEffect, useState } from "react";
import { NOTE_EVENT } from "@/lib/desk";
import { desk } from "@/src/content";
import { Modal } from "./Modal";

const KEY = "ledger:note";
const HAND = `"Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive`;

/**
 * The paper on the desk, to write on. Ruled sheet, handwriting-style ink, saved in this
 * browser only (localStorage); nothing leaves the device.
 */
export function NotePad() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    try {
      setText(localStorage.getItem(KEY) ?? "");
    } catch {}
    const on = () => setOpen(true);
    window.addEventListener(NOTE_EVENT, on);
    return () => window.removeEventListener(NOTE_EVENT, on);
  }, []);

  const write = (v: string) => {
    setText(v);
    try {
      localStorage.setItem(KEY, v);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  return (
    <Modal open={open} onClose={close} labelledBy="note-title" className="max-w-[40rem]">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <p id="note-title" className="label text-ink">
          <span className="text-signal">[C]</span> {desk.note.title}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => write("")} disabled={!text} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink disabled:opacity-40">
            Clear
          </button>
          <button type="button" onClick={close} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
            Close
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="relative rounded-[3px] bg-[#fbf9f2] shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(0,0,0,0.5)]">
          {/* Margin rule */}
          <span aria-hidden className="absolute inset-y-0 left-12 w-px bg-[#c96a5a]/45" />
          <textarea
            data-autofocus
            value={text}
            onChange={(e) => write(e.target.value)}
            maxLength={2000}
            spellCheck={false}
            aria-label="Write on the paper"
            placeholder={desk.note.placeholder}
            className="block h-[24rem] w-full resize-none bg-transparent py-[14px] pl-16 pr-6 text-[1.25rem] leading-[34px] text-[#1f3a8a] caret-[#2f6b4f] outline-none placeholder:text-[#1f3a8a]/35 [background-image:repeating-linear-gradient(transparent_0_33px,rgba(31,58,138,0.16)_33px_34px)] [background-attachment:local] [background-position:0_14px]"
            style={{ fontFamily: HAND }}
          />
        </div>
        <p className="label mt-3 flex items-center gap-2 text-mute">
          <span className={`size-1.5 rounded-full ${saved ? "bg-signal" : "bg-ink/30"}`} />
          {desk.note.hint}
        </p>
      </div>
    </Modal>
  );
}
