"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/content";
import { ease } from "@/lib/motion";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Over the dark intro scene the transparent bar would put dark links on navy, so keep the solid bar.
  const [overDarkIntro, setOverDarkIntro] = useState(false);
  useEffect(() => setOverDarkIntro(!!document.getElementById("intro")), []);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
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
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
          scrolled || overDarkIntro ? "border-b border-line bg-ink/75 backdrop-blur-xl" : "border-b border-transparent"
        }`}
      >
        <div className="container-x grid h-20 grid-cols-2 items-center lg:flex lg:justify-between">
          <a href="#top" className="group flex min-h-11 w-fit min-w-11 items-center gap-3" aria-label={`${site.name}, back to top`}>
            <Logo className="h-6 w-auto text-fg transition-colors duration-500 group-hover:text-accent" />
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.1em] max-sm:hidden">{site.shortName}</span>
          </a>

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active === item.id ? "true" : undefined}
                className={`group relative w-fit text-[0.7rem] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-colors ${
                  active === item.id ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px w-full origin-left bg-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    active === item.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 justify-self-end">
          <ThemeToggle />
          <a
            href="#contact"
            className="hidden min-h-11 items-center rounded-full bg-accent-strong px-5 py-2.5 text-[0.72rem] font-semibold text-white shadow-[0_8px_24px_-10px_rgb(201_58_0/0.7)] transition-colors hover:bg-accent-strong-hover lg:inline-flex"
          >
            Get in touch
          </a>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="relative z-50 inline-flex min-h-11 items-center px-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] lg:hidden"
          >
            <span className="flex items-center gap-2">
              {open ? "Close" : "Menu"}
              <span className="flex w-5 flex-col gap-1">
                <span className={`h-px w-full bg-fg transition-transform duration-300 ${open ? "translate-y-[2.5px] rotate-45" : ""}`} />
                <span className={`h-px w-full bg-fg transition-transform duration-300 ${open ? "-translate-y-[2.5px] -rotate-45" : ""}`} />
              </span>
            </span>
          </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.7, ease }}
            className="fixed inset-0 z-40 bg-ink lg:hidden"
          >
            <nav aria-label="Mobile" className="container-x relative flex h-full flex-col justify-center">
              <ul className="space-y-1">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease, delay: 0.2 + i * 0.06 }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-4 py-1 font-display text-5xl font-medium tracking-[-0.04em]"
                    >
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
