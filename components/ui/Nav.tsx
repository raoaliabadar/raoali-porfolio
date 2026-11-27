"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { onLoaded } from "@/lib/animations/loader";
import { visibleSections } from "@/lib/sections";
import { toggleTheme, useTheme } from "@/lib/theme";
import { desk, identity } from "@/src/content";

const LINKS = visibleSections.filter((s) => s.id !== "hero");

/**
 * Sticky nav inside a bordered grid bar. Slides away when scrolling down, back on scroll up.
 * Below lg the links fold into a full-screen sheet.
 */
export function Nav() {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const night = useTheme() === "dark";

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    setupGsap();
    gsap.set(el, { yPercent: -100 });
    const off = onLoaded(() => gsap.to(el, { yPercent: 0, duration: 1, ease: "expo.out", delay: 0.2 }));
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate(self) {
        if (open) return;
        const hide = self.direction === 1 && self.scroll() > 120;
        gsap.to(el, { yPercent: hide ? -100 : 0, duration: 0.6, ease: "power3.out", overwrite: "auto" });
      },
    });
    return () => {
      off();
      st.kill();
    };
  }, [open]);

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 bg-paper/95">
      <nav aria-label="Main" className="mx-[var(--gutter)] grid h-[var(--nav-h)] grid-cols-[auto_1fr_auto] border-x border-b border-rule">
        <a href="#top" className="flex items-center gap-3 border-r border-rule px-4" aria-label={`${identity.name}, back to top`}>
          <span className="grid size-7 place-items-center rounded-[4px] bg-ink font-mono text-[0.68rem] font-semibold text-paper">{identity.initials}</span>
          <span className="label hidden text-ink sm:inline">{identity.name}</span>
        </a>

        <ul className="hidden items-stretch justify-center lg:flex">
          {LINKS.map((s) => (
            <li key={s.id} className="flex">
              <a href={`#${s.id}`} className="group label flex items-center gap-1.5 px-3 text-mute transition-colors hover:text-ink xl:px-4">
                <span className="text-signal/70 transition-colors group-hover:text-signal">{s.n}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <span className="lg:hidden" />

        <div className="flex items-stretch">
          {/* The desk lamp, as a switch: on = night */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-pressed={night}
            aria-label={night ? desk.lamp.off : desk.lamp.on}
            title={night ? desk.lamp.off : desk.lamp.on}
            className="group flex items-center gap-2 border-l border-rule px-4 text-ink transition-colors hover:bg-panel"
          >
            <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M3 14h6M6 14V9l-2-4 5-2" />
              <path d="M8.5 1.5 14 4.5 11 8.5 7 5.5Z" className={night ? "fill-[#ffd98a] stroke-[#c9a24a]" : ""} />
              {night && <path d="M12 10l1.5 2.5M9.5 11l.5 3M14 8.5l2 .5" stroke="#c9a24a" />}
            </svg>
            <span className="label hidden xl:inline">{night ? "Lamp on" : "Lamp off"}</span>
          </button>
          <a
            href="#connect"
            className="label hidden items-center gap-2 border-l border-rule px-5 text-ink transition-colors hover:bg-ink hover:text-paper sm:flex"
          >
            <span className="size-1.5 rounded-full bg-signal" />
            Let&apos;s connect
          </a>
          <button
            type="button"
            className="label flex items-center border-l border-rule px-4 text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="mx-[var(--gutter)] border-x border-b border-rule bg-paper lg:hidden">
          <ul>
            {LINKS.map((s) => (
              <li key={s.id} className="border-b border-rule last:border-b-0">
                <a href={`#${s.id}`} onClick={() => setOpen(false)} className="flex items-baseline gap-3 px-4 py-3">
                  <span className="label text-signal">[{s.n}]</span>
                  <span className="font-display text-3xl leading-none">{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
