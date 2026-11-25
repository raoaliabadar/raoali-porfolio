"use client";

import { ArrowUp, ArrowUpRight, Mail, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { CopyEmail } from "@/components/ui/CopyEmail";
import { site } from "@/lib/content";
import { goToSlide } from "@/lib/slides";
import type { SlideProps } from "./SlideDeck";
import { Kicker, SlideFrame, SlideTitle } from "./ui";

const linkedIn = site.socials.find((s) => s.label === "LinkedIn")?.href;

/**
 * Slide 08: Let's Connect. Email, LinkedIn and a contact form. The form has no server or third
 * party: it opens the visitor's email app with the message filled in, addressed to you.
 */
export function ContactSlide(_: SlideProps) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) {
      setError("Please add your name, a valid email and a short message.");
      return;
    }
    setError("");
    const subject = `Portfolio enquiry from ${name}`;
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const field =
    "mt-1.5 w-full rounded-[14px] border border-line bg-surface px-4 py-3 text-[0.95rem] outline-none transition-colors placeholder:text-muted/70 focus:border-forest";

  return (
    <SlideFrame>
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 lg:col-span-6">
          <Kicker n={8}>Contact</Kicker>
          <SlideTitle className="text-forest">
            Let&apos;s <em className="text-bronze-ink">Connect.</em>
          </SlideTitle>
          <p data-reveal className="mt-5 max-w-md leading-relaxed text-muted">
            Looking for someone reliable for accounting operations, billing or CRM management? I&apos;d be glad to hear about the role.
          </p>
          <div data-reveal className="mt-6 flex flex-wrap items-center gap-3">
            <CopyEmail email={site.email} />
            {linkedIn && (
              <a
                href={linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-5 text-sm font-semibold text-beige transition-colors hover:bg-accent-strong-hover"
              >
                LinkedIn <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>

        {/* Contact form: beside the intro on large screens, below it on smaller ones. */}
        <div className="min-w-0 lg:col-span-6">
          <form data-reveal noValidate onSubmit={submit} className="grid max-w-xl gap-3 sm:grid-cols-2 lg:ml-auto" aria-describedby="form-note">
            <label className="text-sm font-medium">
              Name
              <input name="name" autoComplete="name" required className={field} />
            </label>
            <label className="text-sm font-medium">
              Email
              <input name="email" type="email" autoComplete="email" required className={field} />
            </label>
            <label className="text-sm font-medium sm:col-span-2">
              Message
              <textarea name="message" rows={3} required className={`${field} resize-none`} placeholder="A few lines about the role or project" />
            </label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-6 text-sm font-semibold text-beige transition-colors hover:bg-accent-strong-hover">
                Send message <Send aria-hidden className="size-4" />
              </button>
              <p id="form-note" className="text-xs text-muted" role="status">
                {error ? (
                  <span className="text-warn">{error}</span>
                ) : sent ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail aria-hidden className="size-3.5" /> Your email app should open with the message ready to send.
                  </span>
                ) : (
                  "Opens your email app with the message filled in."
                )}
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer data-reveal className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm text-muted">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <button type="button" onClick={() => goToSlide("workspace")} className="inline-flex items-center gap-1.5 hover:text-fg">
          Back to the start <ArrowUp aria-hidden className="size-4" />
        </button>
      </footer>
    </SlideFrame>
  );
}
