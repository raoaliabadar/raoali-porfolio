/**
 * Tiny event channel between page interactions and the 3D panda.
 * Any component can call `pandaReact("cheer", "Payment recorded ✓")`;
 * every panda scene on the page listens and plays the matching animation.
 */

export type PandaReaction = "cheer" | "nod" | "think" | "surprised" | "wave";
export type PandaEvent = { type: PandaReaction; message?: string };

export const PANDA_EVENT = "panda:react";

export function pandaReact(type: PandaReaction, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PandaEvent>(PANDA_EVENT, { detail: { type, message } }));
}
