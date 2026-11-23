/**
 * Tiny event channel between page interactions and the 3D panda.
 * Any component can call `pandaReact("cheer", "Payment recorded ✓")`;
 * every panda scene on the page listens and plays the matching animation.
 */

export type PandaReaction = "cheer" | "nod" | "think" | "surprised" | "wave";
export type PandaEvent = { type: PandaReaction; message?: string };

export const PANDA_EVENT = "panda:react";

/** The jobs the desk panda can work on — each has its own animation and props. */
export type PandaTask = "invoice" | "reconcile" | "call" | "crm" | "coffee";

export const PANDA_TASKS: { id: PandaTask; label: string; status: string }[] = [
  { id: "invoice", label: "Invoicing", status: "Preparing invoices…" },
  { id: "reconcile", label: "Reconciling", status: "Reconciling accounts…" },
  { id: "call", label: "Client call", status: "On a call with a client…" },
  { id: "crm", label: "CRM review", status: "Reviewing CRM records…" },
  { id: "coffee", label: "Coffee break", status: "Coffee break ☕" },
];

export function pandaReact(type: PandaReaction, message?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<PandaEvent>(PANDA_EVENT, { detail: { type, message } }));
}
