import { ChevronRight } from "lucide-react";
import { contact, site } from "@/lib/content";
import { Reveal } from "@/components/ui/Reveal";
import { CopyEmail } from "@/components/ui/CopyEmail";

const plain = (s: string) => s.replace(/\*/g, "");

export function Contact() {
  const rows = [
    { label: "Email", href: `mailto:${site.email}`, note: site.email },
    ...site.socials.map((s) => ({ label: s.label, href: s.href, note: "" })),
    ...(site.resumeUrl ? [{ label: "Résumé", href: site.resumeUrl, note: "Download" }] : []),
  ];

  return (
    <section id="contact" className="panel bg-navy py-24 md:py-32">
      <div className="container-x relative text-center">
        {/* Plasma orb */}
        <Reveal className="flex justify-center">
          <span className="relative block size-20 md:size-24">
            <span className="plasma absolute inset-0 rounded-full" />
            <span aria-hidden className="absolute inset-[18%] animate-[spin_9s_linear_infinite] rounded-full border-2 border-transparent border-t-[#ffe08a]/80 border-b-[#ffb340]/60" />
            <span aria-hidden className="absolute inset-[6%] animate-[spin_14s_linear_infinite_reverse] rounded-full border border-transparent border-l-[#ffd27a]/70 border-r-[#ff8a3d]/60" />
          </span>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="mt-10 text-[clamp(2.4rem,5vw,4rem)] font-medium leading-[1] tracking-[-0.05em]">{plain(contact.heading)}</h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-5 max-w-xl text-[#a8b5d6] md:text-lg">{contact.text}</p>
        </Reveal>

        <Reveal delay={0.18}>
          <ul className="mx-auto mt-14 max-w-xl text-left">
            {rows.map((r) => (
              <li key={r.label} className="border-t border-white/10 last:border-b">
                <a
                  href={r.href}
                  target={r.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 py-5 text-lg transition-colors hover:text-accent md:text-xl"
                >
                  <span>{r.label}</span>
                  <span className="flex items-center gap-3 text-sm text-[#8e9ab8]">
                    <span className="hidden sm:inline">{r.note}</span>
                    <ChevronRight className="size-4 text-white transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.24} className="mt-10 flex justify-center">
          <CopyEmail email={site.email} />
        </Reveal>
      </div>
    </section>
  );
}
