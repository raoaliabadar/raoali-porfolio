"use client";

import { useEffect } from "react";
import { getPandaMood, pandaReact, setPandaMood } from "@/lib/panda";

/**
 * Sleep / wake easter egg: after a stretch with no activity the panda dozes off
 * (when it isn't busy), and wakes up with a surprised reaction on the next
 * mouse move, scroll, key press or tap.
 */
const SLEEP_AFTER_MS = 60_000;

let lastActive = Date.now();
let sleepHeldUntil = 0;

/** Keep a commanded nap ("sleep" in the chat) from being woken immediately by typing. */
export function holdSleep(ms: number) {
  sleepHeldUntil = Date.now() + ms;
}

const WAKE_LINES = ["Oh! I'm awake.", "Huh? I wasn't sleeping!", "*yawn* Hi again."];

export function useIdleSleep(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onActivity = () => {
      lastActive = Date.now();
      if (getPandaMood() === "sleeping" && Date.now() > sleepHeldUntil) {
        setPandaMood("idle");
        pandaReact("surprised", WAKE_LINES[Math.floor(Math.random() * WAKE_LINES.length)]);
      }
    };
    const opts = { passive: true } as const;
    const events = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, opts));
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (getPandaMood() === "idle" && Date.now() - lastActive > SLEEP_AFTER_MS) setPandaMood("sleeping");
    }, 5_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
    };
  }, [enabled]);
}
