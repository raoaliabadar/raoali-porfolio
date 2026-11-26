"use client";

import { useEffect, useRef, useState } from "react";
import { WorkspaceDrawing } from "@/components/blueprint/WorkspaceDrawing";
import { Label, Plus } from "@/components/ui/Label";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { gsap, prefersReducedMotion, setupGsap } from "@/lib/animations/gsap";
import { useSplitReveal } from "@/lib/animations/useSplitReveal";
import { sectionNumber, visibleSections } from "@/lib/sections";
import { contact, identity } from "@/src/content";

/**
 * [09] Contact + footer. A big closing line, the email (copyable), socials, and a "Let's connect"
 * button that opens the slide-in form. The footer draws the workspace once more and shades it in
 * as you reach the bottom, beside an accent circle, grid-column links and Ali's local time.
 */
export function Contact() {
  const n = sectionNumber("contact");
  const title = useRef<HTMLHeadingElement>(null);
  const foot = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  useSplitReveal(title, { stagger: 0.1 });

  useEffect(() => {
    const f = foot.current;
    if (!f) return;
    setupGsap();
    const d = f.querySelector<HTMLDivElement>("[data-foot-drawing]")!;
    const lines = d.querySelectorAll("[data-draw]");
    const fills = d.querySelectorAll("[data-fill]");
    const hatch = d.querySelectorAll("[data-hatch]");
    if (prefersReducedMotion()) {
      gsap.set(lines, { strokeDashoffset: 0 });
      gsap.set(fills, { fillOpacity: 1 });
      gsap.set(hatch, { opacity: 1 });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: f, start: "top 85%", end: "bottom bottom", scrub: 1 } });
      tl.to(lines, { strokeDashoffset: 0, duration: 0.5, stagger: 0.004 }, 0)
        .to(fills, { fillOpacity: 1, duration: 0.15 }, 0.5)
        .to(hatch, { opacity: 1, duration: 0.35, stagger: { each: 0.003, from: "random" } }, 0.55)
        .from(f.querySelector("[data-circle]"), { scale: 0.4, autoAlpha: 0, duration: 0.5, ease: "power2.out" }, 0.2);
    }, f);
    return () => ctx.revert();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(identity.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${identity.email}`;
    }
  };

  return (
    <>
      <section id="contact" aria-labelledby="contact-title" className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-[var(--gutter)] inset-y-0 border-x border-rule">
          <div className="absolute inset-x-0 top-0 h-px bg-rule" />
          <span className="absolute left-0 top-0"><Plus /></span>
          <span className="absolute right-0 top-0"><Plus className="translate-x-1/2" /></span>
        </div>
        <div className="relative mx-[var(--gutter)] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <Label n={n}>{contact.title}</Label>
          <h2 id="contact-title" ref={title} className="font-display mt-6 max-w-[14ch] text-[clamp(3.4rem,10vw,10rem)] font-[800] leading-[0.84]">
            {contact.headline}
          </h2>

          <div className="mt-14 grid gap-10 border-t border-rule pt-10 lg:grid-cols-12">
            <p className="max-w-[30rem] text-[1.05rem] leading-relaxed text-ink/75 lg:col-span-5">{contact.text}</p>
            <div className="flex flex-col gap-6 lg:col-span-7 lg:items-end">
              <div className="flex flex-wrap gap-3">
                <MagneticButton href="#connect">Let&apos;s connect</MagneticButton>
                <button
                  type="button"
                  onClick={copy}
                  className="label inline-flex h-12 items-center gap-3 rounded-[6px] border border-ink/25 px-5 transition-colors hover:border-ink"
                >
                  <span className={copied ? "text-signal" : ""}>{copied ? "Copied" : identity.email}</span>
                  <span aria-hidden className="text-mute">{copied ? "✓" : "Copy"}</span>
                </button>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {contact.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="label group inline-flex items-center gap-2 text-ink">
                      <span className="text-signal">↗</span>
                      <span className="underline decoration-ink/20 underline-offset-4 transition-colors group-hover:decoration-signal">{s.label}</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <footer ref={foot} className="relative overflow-hidden border-t border-rule">
        <div className="relative mx-[var(--gutter)] border-x border-rule">
          {/* Drawing + accent circle */}
          <div className="relative grid items-end gap-6 px-4 pt-14 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="relative lg:col-span-8">
              <span data-circle aria-hidden className="absolute -left-4 top-6 size-[min(42vw,320px)] rounded-full border border-signal bg-signal/[0.06]" />
              <div data-foot-drawing className="relative">
                <WorkspaceDrawing title="Line drawing of the workspace" className="w-full max-w-[760px]" />
              </div>
            </div>
            <div className="pb-6 lg:col-span-4 lg:pb-14">
              <p className="font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-[800] leading-[0.88]">{identity.name}</p>
              <p className="label mt-3 text-signal">{identity.title}</p>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid border-t border-rule sm:grid-cols-3">
            <div className="border-b border-rule px-4 py-6 sm:border-b-0 sm:border-r sm:px-6 lg:px-8">
              <p className="label text-mute">Index</p>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {visibleSections.map((s) => (
                  <li key={s.id}>
                    <a href={s.id === "hero" ? "#top" : `#${s.id}`} className="label text-ink hover:text-signal">
                      <span className="text-signal/70">{s.n}</span> {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-b border-rule px-4 py-6 sm:border-b-0 sm:border-r sm:px-6 lg:px-8">
              <p className="label text-mute">Elsewhere</p>
              <ul className="mt-4 space-y-2">
                {identity.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="label text-ink hover:text-signal">
                      {s.label} <span className="text-signal">↗</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${identity.email}`} className="label text-ink hover:text-signal">
                    Email <span className="text-signal">↗</span>
                  </a>
                </li>
              </ul>
            </div>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <p className="label text-mute">Local time</p>
              <LocalTime />
              <p className="label mt-2 text-mute">
                {identity.location} · {identity.timezone}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-4 py-4 sm:px-6 lg:px-8">
            <p className="label text-mute">
              © {new Date().getFullYear()} {identity.name}
            </p>
            <a href="#top" className="label text-ink hover:text-signal">
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

/** Ali's local time (Asia/Karachi), ticking each second. */
function LocalTime() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: identity.timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <p className="mt-4 font-[family-name:var(--font-pixel)] text-[clamp(1.8rem,3vw,2.6rem)] leading-none tabular-nums text-ink" suppressHydrationWarning>
      {now || "--:--:--"}
    </p>
  );
}
