"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, setupGsap } from "@/lib/animations/gsap";
import { onLoaded } from "@/lib/animations/loader";
import { visibleSections } from "@/lib/sections";
import { toggleTheme, useTheme } from "@/lib/theme";
import { desk, identity } from "@/src/content";

const LINKS = visibleSections.filter((s) => s.id !== "hero");

/**
 * Nav pinned to the top in a bordered grid bar. Once you scroll it slims to a thin line, and the
 * link for the section you are in turns bold with an accent rule under it.
 * Below lg the links fold into a sheet.
 */
export function Nav() {
  const bar = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [slim, setSlim] = useState(false);
  const [active, setActive] = useState("");
  const night = useTheme() === "dark";

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    setupGsap();
    gsap.set(el, { yPercent: -100 });
    const triggers: ScrollTrigger[] = [];
    const off = onLoaded(() => {
      gsap.to(el, { yPercent: 0, duration: 1, ease: "expo.out", delay: 0.2 });
      // Built after the page is up, so pinned sections have added their spacers first.
      triggers.push(
        ScrollTrigger.create({ start: 40, end: "max", onToggle: (s) => setSlim(s.isActive), refreshPriority: -1 }),
        ScrollTrigger.create({ trigger: "#top", start: "top top", end: "bottom 50%", onToggle: (s) => s.isActive && setActive(""), refreshPriority: -1 }),
        ...LINKS.flatMap((l) => {
          const t = document.getElementById(l.id);
          return t
            ? [ScrollTrigger.create({ trigger: t, start: "top 50%", end: "bottom 50%", onToggle: (s) => s.isActive && setActive(l.id), refreshPriority: -1 })]
            : [];
        }),
      );
      ScrollTrigger.refresh();
    });
    return () => {
      off();
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <header ref={bar} className="fixed inset-x-0 top-0 z-50 bg-paper/95 backdrop-blur-[2px]">
      <nav
        aria-label="Main"
        className={`mx-[var(--gutter)] grid grid-cols-[auto_1fr_auto] border-x border-b border-rule transition-[height] duration-500 ease-[var(--ease-expo)] ${slim ? "h-10" : "h-[var(--nav-h)]"}`}
      >
        <a href="#top" className="flex items-center gap-3 border-r border-rule px-4" aria-label={`${identity.name}, back to top`}>
          <span className={`grid place-items-center rounded-[4px] bg-ink font-mono text-[0.68rem] font-semibold text-paper transition-all duration-500 ${slim ? "size-6" : "size-7"}`}>{identity.initials}</span>
          {/* Small laptops / tablets in landscape: the eight links need the room, so the name waits for xl */}
          <span className="label hidden whitespace-nowrap text-ink sm:inline lg:max-xl:hidden">{identity.name}</span>
        </a>

        <ul className="hidden items-stretch justify-center lg:flex">
          {LINKS.map((s) => {
            const on = active === s.id;
            return (
              <li key={s.id} className="flex">
                <a
                  href={`#${s.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`group label relative flex items-center gap-1.5 px-3 transition-colors lg:max-xl:px-2 xl:px-4 ${on ? "font-bold text-ink" : "text-mute hover:text-ink"}`}
                >
                  <span className={`transition-colors ${on ? "text-signal" : "text-signal/70 group-hover:text-signal"}`}>{s.n}</span>
                  {s.label}
                  <span aria-hidden className={`absolute inset-x-3 -bottom-px h-[2px] origin-left bg-signal transition-transform duration-500 ease-[var(--ease-expo)] lg:max-xl:inset-x-2 xl:inset-x-4 ${on ? "scale-x-100" : "scale-x-0"}`} />
                </a>
              </li>
            );
          })}
        </ul>
        {/* Phones: the current section, since the links are folded away */}
        <span className="label flex min-w-0 items-center justify-center gap-1.5 truncate px-2 font-bold text-ink lg:hidden" aria-live="polite">
          {active && (
            <>
              <span className="text-signal">[{LINKS.find((l) => l.id === active)?.n}]</span>
              {LINKS.find((l) => l.id === active)?.label}
            </>
          )}
        </span>

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
            <span className="label hidden whitespace-nowrap min-[1360px]:inline">{night ? "Lamp on" : "Lamp off"}</span>
          </button>
          <a
            href="#connect"
            className="label hidden items-center gap-2 whitespace-nowrap border-l border-rule px-5 text-ink lg:max-xl:px-4 transition-colors hover:bg-ink hover:text-paper sm:flex"
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
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  aria-current={active === s.id ? "location" : undefined}
                  className={`flex items-baseline gap-3 px-4 py-3 ${active === s.id ? "bg-panel" : ""}`}
                >
                  <span className="label text-signal">[{s.n}]</span>
                  <span className={`font-display text-3xl leading-none ${active === s.id ? "" : "opacity-60"}`}>{s.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
