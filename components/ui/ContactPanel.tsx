"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { contact, identity } from "@/src/content";

export const CONTACT_EVENT = "ledger:contact";
export const openContact = () => window.dispatchEvent(new Event(CONTACT_EVENT));

/**
 * Slide-in contact panel. The form opens the visitor's email app with the message filled in
 * (no server, nothing stored). Opens from any [href="#connect"] link or `openContact()`.
 */
export function ContactPanel() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest('a[href="#connect"]');
      if (a) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener(CONTACT_EVENT, show);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener(CONTACT_EVENT, show);
      document.removeEventListener("click", onClick);
    };
  }, []);

  useEffect(() => {
    const p = panel.current;
    const s = shade.current;
    if (!p || !s) return;
    setupGsap();
    const lenis = (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;
    const d = prefersReducedMotion() ? 0 : 0.8;
    if (open) {
      lenis?.stop();
      gsap.set([p, s], { visibility: "visible" });
      gsap.to(s, { opacity: 1, duration: d * 0.6 });
      gsap.fromTo(p, { xPercent: 100 }, { xPercent: 0, duration: d, ease: "drawer", onComplete: () => first.current?.focus() });
      gsap.from(p.querySelectorAll("[data-pl]"), { y: 20, autoAlpha: 0, duration: d, ease: "expo.out", stagger: 0.05, delay: d * 0.4 });
      const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", esc);
      return () => window.removeEventListener("keydown", esc);
    }
    lenis?.start();
    gsap.to(s, { opacity: 0, duration: d * 0.5 });
    gsap.to(p, { xPercent: 100, duration: d * 0.8, ease: "drawer", onComplete: () => void gsap.set([p, s], { visibility: "hidden" }) });
    opener.current?.focus?.();
  }, [open]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || message.length < 5) {
      setError(contact.form.error);
      return;
    }
    setError("");
    const body = `${message}\n\n${name}\n${email}`;
    window.location.href = `mailto:${identity.email}?subject=${encodeURIComponent(`Hello from ${name}`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <div ref={shade} onClick={() => setOpen(false)} className="invisible fixed inset-0 z-[150] bg-ink/40 opacity-0" aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-title"
        className="invisible fixed inset-y-0 right-0 z-[160] flex w-full max-w-[34rem] flex-col overflow-y-auto border-l border-ink bg-paper"
      >
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <p className="label text-ink">
            <span className="text-signal">[→]</span> Let&apos;s connect
          </p>
          <button type="button" onClick={() => setOpen(false)} className="label rounded-[4px] border border-ink/20 px-3 py-2 hover:border-ink">
            Close
          </button>
        </div>

        <div className="flex-1 px-6 py-10">
          <h2 id="connect-title" data-pl className="font-display text-[clamp(1.92rem,5.18vw,2.74rem)] font-[700] leading-[0.88]">
            {contact.headline}
          </h2>
          <p data-pl className="mt-5 text-[0.98rem] leading-relaxed text-ink/75">{contact.text}</p>

          <form onSubmit={submit} noValidate className="mt-10 space-y-6">
            {[
              { id: "name", label: "Name", type: "text", auto: "name" },
              { id: "email", label: "Email", type: "email", auto: "email" },
            ].map((f, i) => (
              <div key={f.id} data-pl>
                <label htmlFor={`c-${f.id}`} className="label text-mute">
                  <span className="text-signal">0{i + 1}</span> {f.label}
                </label>
                <input
                  ref={i === 0 ? first : undefined}
                  id={`c-${f.id}`}
                  name={f.id}
                  type={f.type}
                  autoComplete={f.auto}
                  required
                  className="mt-2 w-full border-b border-ink/25 bg-transparent py-2.5 text-[1.05rem] outline-none transition-colors focus:border-signal"
                />
              </div>
            ))}
            <div data-pl>
              <label htmlFor="c-message" className="label text-mute">
                <span className="text-signal">03</span> Message
              </label>
              <textarea
                id="c-message"
                name="message"
                rows={4}
                required
                placeholder={contact.form.messagePlaceholder}
                className="mt-2 w-full resize-none border-b border-ink/25 bg-transparent py-2.5 text-[1.05rem] outline-none transition-colors placeholder:text-ink/35 focus:border-signal"
              />
            </div>
            {error && (
              <p role="alert" className="label text-[#9a3d22]">
                {error}
              </p>
            )}
            <div data-pl className="flex flex-wrap items-center gap-4">
              <button type="submit" className="label inline-flex h-12 items-center rounded-[6px] bg-signal px-6 text-paper transition-colors hover:bg-signal-deep">
                Send message
              </button>
              <span className="text-[0.82rem] text-mute">{contact.form.hint}</span>
            </div>
          </form>
        </div>

        <div data-pl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-rule px-6 py-5">
          <a href={`mailto:${identity.email}`} className="label text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-signal">
            {identity.email}
          </a>
          {identity.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`} className="label text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-signal">
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
