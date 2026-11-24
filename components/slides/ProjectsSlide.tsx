"use client";

/* eslint-disable @next/next/no-img-element -- certificate images come from Blob storage */
import { ArrowUpRight, Award, Boxes, ClipboardCheck, FileSpreadsheet, GraduationCap, ReceiptText, Users, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { caseStudies, profile, type CaseStudy } from "@/lib/content";
import type { WallItem, WallManifest } from "@/lib/wall/types";
import type { SlideProps } from "./SlideDeck";
import { Kicker, Modal, SlideFrame, SlideTitle } from "./ui";

const ICON = {
  billing: ReceiptText,
  crm: Users,
  automation: Workflow,
  onboarding: ClipboardCheck,
  coordination: Boxes,
  "finance-data": FileSpreadsheet,
} as Record<string, typeof ReceiptText>;

/** Slide 07: Knowledge Put Into Practice. Case studies (open for details), education and certificates. */
export function ProjectsSlide({ near }: SlideProps) {
  const [open, setOpen] = useState<CaseStudy | null>(null);
  const [cert, setCert] = useState<WallItem | null>(null);
  const [certs, setCerts] = useState<WallItem[]>([]);

  // Certificates uploaded in /wall-editor (the same ones framed on the office wall).
  useEffect(() => {
    if (!near || certs.length) return;
    fetch("/api/wall")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { manifest?: WallManifest } | null) => {
        const m = d?.manifest;
        if (!m) return;
        const hung = m.slots.map((id) => m.items.find((i) => i.id === id)).filter(Boolean) as WallItem[];
        const rest = m.items.filter((i) => !hung.includes(i));
        setCerts([...hung, ...rest]);
      })
      .catch(() => {});
  }, [near, certs.length]);

  const edu = profile.education;

  return (
    <SlideFrame>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 lg:col-span-8">
          <Kicker n={7}>Projects & education</Kicker>
          <SlideTitle className="text-forest">
            Knowledge Put Into <em className="text-bronze-ink">Practice</em>
          </SlideTitle>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {caseStudies.map((c) => {
              const Icon = ICON[c.id] ?? Workflow;
              return (
                <li key={c.id} data-reveal="card">
                  <button
                    type="button"
                    onClick={() => setOpen(c)}
                    aria-haspopup="dialog"
                    className="group flex h-full w-full flex-col rounded-[20px] border border-line bg-surface p-5 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-bronze hover:shadow-[0_24px_44px_-28px_rgb(20_39_31/0.6)]"
                  >
                    <span className="flex w-full items-center justify-between">
                      <span className="grid size-11 place-items-center rounded-[12px] bg-forest text-bronze">
                        <Icon aria-hidden className="size-5" />
                      </span>
                      <ArrowUpRight aria-hidden className="size-5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest" />
                    </span>
                    <span className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-bronze-ink">{c.label}</span>
                    <span className="mt-1 font-display-serif text-2xl leading-tight text-forest">{c.title}</span>
                    <span className="mt-2 text-sm leading-snug text-muted">{c.summary}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="flex min-w-0 flex-col gap-3 lg:col-span-4 lg:pt-28" aria-label="Education and certificates">
          <article data-reveal="card" className="rounded-[20px] bg-forest p-5 text-beige">
            <GraduationCap aria-hidden className="size-6 text-bronze" />
            <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-beige/70">Education</h3>
            {edu.map((e) => (
              <div key={e.field} className="mt-2">
                <p className="font-display-serif text-2xl leading-tight">{e.degree || e.field}</p>
                {e.degree && <p className="text-sm text-beige/75">{e.field}</p>}
                {(e.institution || e.years) && <p className="mt-1 text-sm text-beige/75">{[e.institution, e.years].filter(Boolean).join(" · ")}</p>}
              </div>
            ))}
          </article>
          <article data-reveal="card" className="rounded-[20px] border border-line bg-surface p-5">
            <div className="flex items-center gap-2">
              <Award aria-hidden className="size-5 text-bronze-ink" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Certificates</h3>
            </div>
            {certs.length ? (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {certs.slice(0, 6).map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setCert(c)}
                      aria-haspopup="dialog"
                      aria-label={`View certificate: ${c.title || "Certificate"}`}
                      className="grid aspect-square w-full place-items-center overflow-hidden rounded-[10px] border border-line bg-cream p-1 transition-colors hover:border-bronze"
                    >
                      <img src={c.url} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">Framed on the office wall on the first slide.</p>
            )}
          </article>
        </aside>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} wide>
        {open && (
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bronze-ink">{open.label}</p>
              <p className="mt-2 leading-relaxed">{open.summary}</p>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">The problem</h4>
              <p className="mt-1.5 leading-relaxed text-muted">{open.problem}</p>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Approach</h4>
              <ol className="mt-2 space-y-2">
                {open.approach.map((a, i) => (
                  <li key={a} className="flex gap-3 text-sm leading-relaxed">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest text-[0.7rem] font-semibold text-beige">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ol>
              <h4 className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Outcome</h4>
              <p className="mt-1.5 leading-relaxed">{open.outcome}</p>
            </div>
            <div className="space-y-4 md:col-span-2">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Tools</h4>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {open.tools.map((t) => (
                    <li key={t} className="rounded-full bg-cream px-3 py-1 text-sm">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {open.sample && (
                <figure className="slide-scroll-x rounded-[14px] border border-line">
                  <table className="w-full text-sm">
                    <caption className="px-3 pt-3 text-left text-xs text-muted">{open.sample.caption}</caption>
                    <thead>
                      <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                        {open.sample.columns.map((c) => (
                          <th key={c} scope="col" className="px-3 py-2 font-semibold">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {open.sample.rows.map((r) => (
                        <tr key={r.join()} className="border-b border-line last:border-0">
                          {r.map((v, i) => (
                            <td key={i} className="px-3 py-2 tabular-nums">
                              {v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </figure>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!cert} onClose={() => setCert(null)} title={cert?.title || "Certificate"} wide>
        {cert && (
          <img src={cert.url} alt={cert.title || "Certificate"} className="mx-auto max-h-[70svh] w-auto max-w-full rounded-[10px] border border-line" />
        )}
      </Modal>
    </SlideFrame>
  );
}
