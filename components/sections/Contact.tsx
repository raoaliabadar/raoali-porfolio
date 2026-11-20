import { ArrowUpRight } from "lucide-react";
import { contact, site } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { CopyEmail } from "@/components/ui/CopyEmail";

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden pb-16 pt-28 md:pt-44">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="animate-float-slow absolute left-[20%] top-[20%] h-[70%] w-[70%] rounded-full bg-glow/40 blur-[150px]" />
        <div className="absolute right-[5%] top-[40%] h-[35%] w-[25%] rounded-full bg-cyan/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink to-transparent" />
      </div>

      <div className="container-x">
        <Reveal>
          <p className="label mb-10">
            <span className="text-fg">(07)</span> Contacts
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="max-w-6xl font-display text-[clamp(3.2rem,9.5vw,9.5rem)] font-medium leading-[0.9] tracking-[-0.06em]">
            <RichText text={contact.heading} />
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-12 md:items-end">
          <Reveal delay={0.16} className="md:col-span-5">
            <p className="max-w-md text-lg leading-relaxed text-fg/70">{contact.text}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                href={`mailto:${site.email}`}
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-7 py-4 text-sm font-semibold text-ink transition-colors hover:bg-accent"
              >
                Start a conversation
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </MagneticButton>
              <CopyEmail email={site.email} />
            </div>
          </Reveal>

          <Reveal delay={0.24} className="md:col-span-6 md:col-start-7">
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between py-5 text-lg transition-colors hover:text-accent"
                  >
                    <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2">
                      {s.label}
                    </span>
                    <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" />
                  </a>
                </li>
              ))}
              {site.resumeUrl && (
                <li>
                  <a href={site.resumeUrl} className="group flex items-center justify-between py-5 text-lg transition-colors hover:text-accent">
                    Résumé <span aria-hidden>↓</span>
                  </a>
                </li>
              )}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
