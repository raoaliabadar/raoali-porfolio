"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Logo } from "@/components/ui/Logo";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 400 && !open);
  });

  // Highlight the section currently in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    nav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Lock scroll + Escape for the mobile menu.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: hidden ? -100 : 0, opacity: 1 }}
        transition={{ duration: 0.7, ease, delay: hidden ? 0 : 0.1 }}
        className="fixed inset-x-0 top-0 z-50"
      >
        <div className="mx-auto flex h-20 max-w-[75rem] items-center justify-between gap-3 px-5 md:px-8 lg:justify-center">
          <a href="#top" className="text-fg transition-colors hover:text-accent" aria-label={`${site.name} — home`}>
            <Logo className="h-6 w-auto" />
          </a>

          {/* Desktop: segmented pill */}
          <nav
            aria-label="Primary"
            className="hidden items-center rounded-xl border border-white/10 bg-[#111521]/85 p-1 backdrop-blur-xl lg:ml-6 lg:flex"
          >
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-[0.8rem] font-medium transition-colors ${
                  active === item.id ? "bg-white/10 text-fg" : "text-fg/80 hover:text-fg"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 lg:ml-1.5">
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[0.8rem] font-medium text-black transition-colors hover:bg-white/85"
            >
              Get in touch
              <ChevronDown className="size-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="relative z-50 grid h-[2.4rem] min-w-[4.25rem] place-items-center rounded-xl border border-white/10 bg-[#111521] px-3 text-[0.8rem] font-medium lg:hidden"
            >
              {open ? <X className="size-4" aria-label="Close menu" /> : "Menu"}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="bg-navy fixed inset-0 z-40 lg:hidden"
          >
            <nav aria-label="Mobile" className="container-x relative flex h-full flex-col justify-center">
              <ul className="border-t border-line">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.1 + i * 0.05 }}
                    className="border-b border-line"
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-4 text-2xl font-medium tracking-[-0.02em]"
                    >
                      {item.label}
                      <span aria-hidden className="text-muted">›</span>
                    </a>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-10 text-sm text-muted">{site.email}</p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
