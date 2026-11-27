"use client";

import { useSyncExternalStore } from "react";

/**
 * The desk lamp: the room light in the hero drawing only. Independent of the site theme (the
 * nav switch). Stored per visitor and applied before paint by THEME_INIT as html[data-lamp].
 */
export const LAMP_EVENT = "ledger:lamp";
const KEY = "ledger:lamp";

export const getLamp = () => document.documentElement.dataset.lamp === "on";

export function setLamp(on: boolean) {
  document.documentElement.dataset.lamp = on ? "on" : "off";
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  window.dispatchEvent(new CustomEvent<boolean>(LAMP_EVENT, { detail: on }));
}

export const toggleLamp = () => setLamp(!getLamp());

const subscribe = (cb: () => void) => {
  window.addEventListener(LAMP_EVENT, cb);
  return () => window.removeEventListener(LAMP_EVENT, cb);
};
export const useLamp = () => useSyncExternalStore(subscribe, getLamp, () => false);
