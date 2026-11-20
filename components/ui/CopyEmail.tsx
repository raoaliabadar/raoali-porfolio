"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-3 rounded-full border border-line px-5 py-3.5 text-sm transition-colors hover:border-fg/40"
    >
      <span className="font-mono">{email}</span>
      <span className="relative grid size-4 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span key="ok" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Check className="size-4 text-emerald-400" />
            </motion.span>
          ) : (
            <motion.span key="copy" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
              <Copy className="size-4 text-muted transition-colors group-hover:text-fg" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email copied to clipboard" : "Copy email address"}
      </span>
    </button>
  );
}
