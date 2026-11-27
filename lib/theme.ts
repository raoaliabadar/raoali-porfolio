"use client";

import { useSyncExternalStore } from "react";

/** Light (day) / dark (night, lamp on). Stored per visitor; applied before paint by THEME_INIT. */
export type Theme = "light" | "dark";
export const THEME_EVENT = "ledger:theme";
const KEY = "ledger:theme";


export const getTheme = (): Theme => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");

export function setTheme(t: Theme) {
  const html = document.documentElement;
  html.classList.add("theme-fade");
  html.dataset.theme = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {}
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: t }));
  window.setTimeout(() => html.classList.remove("theme-fade"), 700);
}

export const toggleTheme = () => setTheme(getTheme() === "dark" ? "light" : "dark");

const subscribe = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
};
/** The current theme, re-rendering when it changes. ("light" on the server.) */
export const useTheme = () => useSyncExternalStore<Theme>(subscribe, getTheme, () => "light");
