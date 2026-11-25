"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Email button that copies the address. The icon swap is plain CSS (no animation library on the page). */
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

  const icon = "absolute inset-0 transition-[opacity,transform] duration-200 ease-out";
  return (
    <button
      type="button"
      onClick={copy}
      className="group inline-flex items-center gap-3 rounded-full border border-line bg-surface px-5 py-3.5 text-sm transition-colors hover:border-fg/40"
    >
      <span className="text-sm">{email}</span>
      <span className="relative grid size-4 place-items-center" aria-hidden>
        <Check className={`${icon} size-4 text-emerald-600 ${copied ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
        <Copy className={`${icon} size-4 text-muted group-hover:text-fg ${copied ? "scale-50 opacity-0" : "scale-100 opacity-100"}`} />
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Email copied to clipboard" : "Copy email address"}
      </span>
    </button>
  );
}
