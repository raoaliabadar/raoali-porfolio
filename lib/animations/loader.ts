"use client";

/**
 * The preloader announces when it has finished, so sections can hold their entrance
 * animations until the page is actually visible.
 */
export const LOADED_EVENT = "ledger:loaded";

let loaded = false;

export function markLoaded() {
  loaded = true;
  window.dispatchEvent(new Event(LOADED_EVENT));
}

export function onLoaded(cb: () => void) {
  if (loaded) {
    cb();
    return () => {};
  }
  window.addEventListener(LOADED_EVENT, cb, { once: true });
  return () => window.removeEventListener(LOADED_EVENT, cb);
}
