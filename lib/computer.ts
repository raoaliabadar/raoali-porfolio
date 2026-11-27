"use client";

import { useSyncExternalStore } from "react";

/**
 * The desk computer: one shared state for the close-up screen (the dialog) and the small copy
 * on the monitor in the hero drawing, so both always show the same thing. Desk objects, the
 * desk keyboard and the physical keyboard all drive it through the actions below.
 */
export type AppId = "dashboard" | "reports" | "flows" | "balance" | "transactions" | "calculator" | "documents" | "notes";
export const APP_IDS: AppId[] = ["dashboard", "reports", "flows", "balance", "transactions", "calculator", "documents", "notes"];

type Calc = { display: string; acc: number | null; op: string | null; fresh: boolean; tape: string[] };

export type ComputerState = {
  /** The screen has been woken by an interaction (until then the monitor shows its usual art). */
  on: boolean;
  /** The close-up screen is open. */
  dialog: boolean;
  /** The physical keyboard types into the computer while the dialog is closed (desk keyboard in use). */
  typing: boolean;
  /** Open windows, in the order opened. */
  windows: { id: AppId; min: boolean }[];
  /** The window in front (null = the desktop). */
  active: AppId | null;
  /** In-app navigation (folder → document, list → detail…), for Back. */
  paths: Partial<Record<AppId, string[]>>;
  notes: string;
  calc: Calc;
  query: string;
  toast: { id: number; text: string } | null;
  /** The last key pressed, so both keyboards can flash it. */
  key: { k: string; n: number } | null;
};

const NOTES_KEY = "ledger:pc-notes";
const CALC0: Calc = { display: "0", acc: null, op: null, fresh: true, tape: [] };

let state: ComputerState = {
  on: false,
  dialog: false,
  typing: false,
  windows: [],
  active: null,
  paths: {},
  notes: "",
  calc: CALC0,
  query: "",
  toast: null,
  key: null,
};
let loadedNotes = false;

const listeners = new Set<() => void>();
function set(patch: Partial<ComputerState> | ((s: ComputerState) => Partial<ComputerState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};
const get = () => state;
const SERVER = state;
export const useComputer = () => useSyncExternalStore(subscribe, get, () => SERVER);
export const computer = get;

function loadNotes() {
  if (loadedNotes) return;
  loadedNotes = true;
  try {
    state = { ...state, notes: localStorage.getItem(NOTES_KEY) ?? "" };
  } catch {}
}

/* ---------------- Windows ---------------- */

export function openApp(id: AppId, path?: string[]) {
  loadNotes();
  set((s) => ({
    on: true,
    windows: s.windows.some((w) => w.id === id) ? s.windows.map((w) => (w.id === id ? { ...w, min: false } : w)) : [...s.windows, { id, min: false }],
    active: id,
    paths: path ? { ...s.paths, [id]: path } : s.paths,
  }));
}

const frontmost = (windows: ComputerState["windows"]) => [...windows].reverse().find((w) => !w.min)?.id ?? null;

export function closeApp(id: AppId) {
  set((s) => {
    const windows = s.windows.filter((w) => w.id !== id);
    const paths = { ...s.paths };
    delete paths[id];
    return { windows, paths, active: s.active === id ? frontmost(windows) : s.active };
  });
}

export function minimizeApp(id: AppId) {
  set((s) => {
    const windows = s.windows.map((w) => (w.id === id ? { ...w, min: true } : w));
    return { windows, active: s.active === id ? frontmost(windows) : s.active };
  });
}

/** Back: one step up inside the app; at its top level, back to the desktop. */
export function back() {
  const a = state.active;
  if (!a) return;
  const p = state.paths[a] ?? [];
  if (p.length) set((s) => ({ paths: { ...s.paths, [a]: p.slice(0, -1) } }));
  else minimizeApp(a);
}

export function navigate(id: AppId, seg: string) {
  set((s) => ({ paths: { ...s.paths, [id]: [...(s.paths[id] ?? []), seg] } }));
}

export const showDesktop = () => set((s) => ({ windows: s.windows.map((w) => ({ ...w, min: true })), active: null }));

/* ---------------- The screen itself ---------------- */

export function wake() {
  loadNotes();
  if (!state.on) set({ on: true });
}

/** Open the close-up screen, optionally on an app (and a place inside it). */
export function openComputer(id?: AppId, path?: string[]) {
  wake();
  if (id) openApp(id, path);
  set({ dialog: true, typing: false });
}
export const closeComputer = () => set({ dialog: false });
export const setTyping = (typing: boolean) => state.typing !== typing && set({ typing });

let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** A short notice on the screen ("Desk lamp on", "Top drawer opened"…). */
export function notify(text: string) {
  wake();
  clearTimeout(toastTimer);
  set({ toast: { id: Date.now(), text } });
  toastTimer = setTimeout(() => set({ toast: null }), 2200);
}

/* ---------------- Text and keys ---------------- */

export function setNotes(notes: string) {
  set({ notes: notes.slice(0, 4000) });
  try {
    localStorage.setItem(NOTES_KEY, state.notes);
  } catch {}
}
export const setQuery = (query: string) => set({ query: query.slice(0, 40) });

/** Desk keys are labelled in capitals; they type like a phone keyboard: a capital to start a sentence. */
function caseFor(ch: string, before: string) {
  if (!/^[A-Z]$/i.test(ch) || ch !== ch.toUpperCase()) return ch;
  return before.trim() === "" || /[.!?]\s+$|\n\s*$/.test(before) ? ch : ch.toLowerCase();
}

/**
 * A key from either keyboard. `fromDesk` keys are the capitals printed on the desk keyboard.
 * Goes to the app in front: the calculator takes sums, Transaction History takes its search,
 * everything else types into Notes (opening it if needed).
 */
export function typeKey(k: string, fromDesk = false) {
  wake();
  set((s) => ({ key: { k, n: (s.key?.n ?? 0) + 1 } }));
  const a = state.active;
  if (a === "calculator") return calcPress(k);
  if (a === "transactions" && !(state.paths.transactions ?? []).length) {
    if (k === "Backspace") return setQuery(state.query.slice(0, -1));
    if (k.length === 1) return setQuery(state.query + (fromDesk ? k.toLowerCase() : k));
    return;
  }
  if (a !== "notes") openApp("notes");
  const t = state.notes;
  if (k === "Backspace") return setNotes(t.slice(0, -1));
  if (k === "Enter") return setNotes(t + "\n");
  if (k.length === 1) setNotes(t + (fromDesk ? caseFor(k, t) : k));
}

/* ---------------- Calculator ---------------- */

const fmtNum = (n: number) => {
  if (!Number.isFinite(n)) return "Error";
  const r = Math.round(n * 1e10) / 1e10;
  return String(r).length > 14 ? r.toPrecision(10).replace(/\.?0+$/, "") : String(r);
};
const apply = (a: number, op: string, b: number) => (op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : op === "/" ? a / b : b);
const OPS: Record<string, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export function calcPress(raw: string) {
  const k = raw === "Enter" ? "=" : raw === "x" || raw === "X" ? "*" : raw === "c" || raw === "C" || raw === "Escape" ? "C" : raw;
  const c = state.calc;
  const cur = Number(c.display);
  let next: Calc = c;
  if (/^\d$/.test(k)) {
    next = c.fresh || c.display === "0" ? { ...c, display: k, fresh: false } : c.display.replace(/[-.]/g, "").length >= 12 ? c : { ...c, display: c.display + k };
  } else if (k === ".") {
    next = c.fresh ? { ...c, display: "0.", fresh: false } : c.display.includes(".") ? c : { ...c, display: c.display + "." };
  } else if (k in OPS) {
    if (c.op && c.acc !== null && !c.fresh) {
      const r = apply(c.acc, c.op, cur);
      next = { ...c, display: fmtNum(r), acc: r, op: k, fresh: true };
    } else next = { ...c, acc: c.display === "Error" ? 0 : cur, op: k, fresh: true };
  } else if (k === "=") {
    if (c.op && c.acc !== null) {
      const r = apply(c.acc, c.op, cur);
      const line = `${fmtNum(c.acc)} ${OPS[c.op]} ${fmtNum(cur)} = ${fmtNum(r)}`;
      next = { display: fmtNum(r), acc: null, op: null, fresh: true, tape: [...c.tape, line].slice(-6) };
    }
  } else if (k === "%") {
    next = { ...c, display: fmtNum(c.op && c.acc !== null ? (c.acc * cur) / 100 : cur / 100), fresh: false };
  } else if (k === "±") {
    next = { ...c, display: fmtNum(-cur) };
  } else if (k === "Backspace") {
    next = c.fresh ? c : { ...c, display: c.display.length > 1 ? c.display.slice(0, -1) : "0" };
  } else if (k === "C") {
    next = { ...CALC0, tape: c.tape };
  }
  if (next !== c) set({ calc: next });
}
export const CALC_OPS = OPS;
