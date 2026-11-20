"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/content";
import { ease } from "@/lib/motion";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > prev && y > 300 && !open);
  });

  // Track the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    nav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock scroll + close on Escape when the mobile menu is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="container-x flex h-20 items-center justify-between">
          <a href="#top" className="group font-serif text-2xl tracking-tight" aria-label={`${site.name} — home`}>
            {site.initials}
            <span className="text-accent transition-colors group-hover:text-fg">.</span>
          </a>

          <nav
            aria-label="Primary"
            className={`hidden rounded-full border px-1.5 py-1.5 backdrop-blur-xl transition-colors duration-500 md:block ${
              scrolled ? "border-line bg-surface/70" : "border-transparent bg-transparent"
            }`}
          >
            <ul className="flex items-center gap-1">
              {nav.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active === item.id ? "true" : undefined}
                    className={`relative isolate block rounded-full px-4 py-2 text-sm transition-colors ${
                      active === item.id ? "text-ink" : "text-muted hover:text-fg"
                    }`}
                  >
                    {active === item.id && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-fg"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <a
            href={`mailto:${site.email}`}
            className="hidden rounded-full border border-line bg-surface/60 px-4 py-2 text-sm backdrop-blur-xl transition-colors hover:border-accent hover:text-accent md:inline-flex"
          >
            Let&apos;s talk
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative z-50 grid size-11 place-items-center rounded-full border border-line bg-surface/70 backdrop-blur-xl md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-ink/95 backdrop-blur-xl md:hidden"
          >
            <nav aria-label="Mobile" className="container-x flex h-full flex-col justify-center">
              <ul className="space-y-2">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.05 + i * 0.05 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 py-1 font-serif text-5xl"
                    >
                      <span className="label">0{i + 1}</span>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
              <p className="label mt-12">{site.email}</p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
