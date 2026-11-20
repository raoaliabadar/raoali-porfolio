import { ArrowUpRight } from "lucide-react";
import { site } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { CopyEmail } from "@/components/ui/CopyEmail";

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden py-28 md:py-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[140px]" />
      </div>

      <div className="container-x text-center">
        <Reveal>
          <p className="label mb-8 flex items-center justify-center gap-3">
            <span className="text-accent">07</span>
            <span className="h-px w-8 bg-line" aria-hidden />
            Contact
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mx-auto max-w-5xl font-serif text-[clamp(3rem,9vw,8.5rem)] leading-[0.95] tracking-[-0.02em]">
            Let&apos;s build something <em className="italic text-accent">together</em>.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-8 max-w-xl text-lg text-fg/70">
            Have a project, a role, or just an idea? My inbox is always open — I usually reply within a day.
          </p>
        </Reveal>

        <Reveal delay={0.24} className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <MagneticButton
            href={`mailto:${site.email}`}
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 text-base font-medium text-ink transition-colors hover:bg-fg"
          >
            Start a conversation
            <ArrowUpRight className="size-5 transition-transform duration-300 group-hover:rotate-45" />
          </MagneticButton>
          <CopyEmail email={site.email} />
        </Reveal>

        <Reveal delay={0.32}>
          <ul className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {site.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-1.5 text-muted transition-colors hover:text-fg"
                >
                  <span className="relative">
                    {s.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-500 group-hover:scale-x-100" />
                  </span>
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
            {site.resumeUrl && (
              <li>
                <a href={site.resumeUrl} className="text-muted transition-colors hover:text-fg">
                  Résumé ↓
                </a>
              </li>
            )}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
