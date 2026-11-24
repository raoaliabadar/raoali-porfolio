/**
 * Tiny event channel between page interactions and the 3D panda.
 *
 * - One-shot reactions: `pandaReact("cheer", "Payment recorded ✓")`: every panda scene
 *   on the page plays the matching animation (and shows the optional message).
 * - Persistent mood: `setPandaMood("listening")`: the panda holds that state
 *   (listening / thinking / talking / sleeping) until the mood changes back to "idle".
 */

export type PandaReaction =
  | "cheer" // happy jump, both arms up
  | "nod"
  | "think"
  | "surprised"
  | "wave"
  | "confused" // shrug + head tilt (errors)
  | "dizzy" // spins in the chair, swirly eyes (too many clicks)
  | "dance" // hidden command
  | "spin" // one happy chair spin
  | "sip"; // paw to mouth, eyes closed (the intro scene's coffee cup)

export type PandaEvent = { type: PandaReaction; message?: string };

export const PANDA_EVENT = "panda:react";

/** Long-lived states driven by the AI assistant and the idle timer. */
export type PandaMood = "idle" | "listening" | "thinking" | "talking" | "sleeping";
export type PandaMoodEvent = { mood: PandaMood };

export const PANDA_MOOD_EVENT = "panda:mood";

/** The jobs the desk panda can work on: each has its own animation and props. */
export type PandaTask = "invoice" | "reconcile" | "call" | "crm" | "coffee";

export const PANDA_TASKS: { id: PandaTask; label: string; status: string }[] = [
  { id: "invoice", label: "Invoicing", status: "Preparing invoices…" },
  { id: "reconcile", label: "Reconciling", status: "Reconciling accounts…" },
  { id: "call", label: "Client call", status: "On a call with a client…" },
  { id: "crm", label: "CRM review", status: "Reviewing CRM records…" },
  { id: "coffee", label: "Coffee break", status: "Taking a coffee break…" },
];

export function pandaReact(type: PandaReaction, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PandaEvent>(PANDA_EVENT, { detail: { type, message } }));
}

let currentMood: PandaMood = "idle";

/** The mood right now: lets a scene that mounts later start in the right state. */
export function getPandaMood(): PandaMood {
  return currentMood;
}

export function setPandaMood(mood: PandaMood) {
  if (typeof window === "undefined" || mood === currentMood) return;
  currentMood = mood;
  window.dispatchEvent(new CustomEvent<PandaMoodEvent>(PANDA_MOOD_EVENT, { detail: { mood } }));
}
