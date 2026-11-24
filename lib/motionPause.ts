/**
 * Site-wide "pause animation" switch for the continuously moving 3D scenes
 * (hero orrery, desk panda). Remembered per visitor.
 */
const KEY = "motion-paused";
const EVENT = "motion:paused";
let paused: boolean | null = null;

export function isMotionPaused() {
  if (paused === null) {
    try {
      paused = localStorage.getItem(KEY) === "1";
    } catch {
      paused = false;
    }
  }
  return paused;
}

export function setMotionPaused(p: boolean) {
  paused = p;
  try {
    localStorage.setItem(KEY, p ? "1" : "0");
  } catch {
    /* storage blocked: still pauses for this page view */
  }
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: p }));
}

export function onMotionPausedChange(fn: (p: boolean) => void) {
  const on = (e: Event) => fn((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, on);
  return () => window.removeEventListener(EVENT, on);
}
