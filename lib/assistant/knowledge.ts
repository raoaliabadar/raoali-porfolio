import {
  about,
  accounting,
  achievements,
  contact,
  crm,
  experience,
  hero,
  projects,
  services,
  site,
  skills,
  tools,
} from "@/lib/content";
import { assistantConfig } from "./config";
import { SECTIONS } from "./sections";

/**
 * The assistant's knowledge base, generated from the real portfolio content
 * (lib/content.ts) plus the extra facts in lib/assistant/config.ts.
 * Nothing here is invented: if it isn't on the site, the panda doesn't know it.
 */
const plain = (s: string) => s.replace(/\*/g, "");

export function buildKnowledge(): string {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  push(
    "## Basics",
    `Name: ${site.name} (goes by ${site.shortName})`,
    `Title: ${site.title}`,
    `Based in: ${site.location} (timezone ${site.timezone})`,
    `Availability: ${site.availability}. Site badge: "${hero.badge}".`,
    `Focus: ${hero.meta.map((m) => `${m.label}: ${m.value}`).join("; ")}`,
    "",
    "## About",
    plain(about.statement),
    about.bio,
    ...about.facts.map((f) => `- ${f.label}: ${f.value}`),
    "",
    "## Services",
    ...services.map((s) => `- ${s.title}: ${s.description} (${s.tags.join(", ")})`),
    "",
    "## CRM specialist",
    crm.intro,
    ...crm.capabilities.map((c) => `- ${c.title}: ${c.description}`),
    "Platforms used:",
    ...crm.platforms.map((p) => `- ${p.name} (${p.summary}): ${p.details.join("; ")}`),
    "",
    "## Accounting & financial operations",
    accounting.intro,
    ...accounting.areas.map((a) => `- ${a.title}: ${a.description}`),
    "",
    "## Skills",
    ...skills.map((g) => `- ${g.title}: ${g.items.join(", ")}`),
    "",
    "## Case studies / projects",
    "Label meaning: 'Client projects' = real work; 'Demonstration' = a sample scenario with example data showing his approach (not a real client).",
    ...projects.map(
      (p) =>
        `- ${p.title} [${p.label}] (${p.category}): ${p.description} Problem: ${p.problem} Solution: ${p.solution} Outcome: ${p.outcome} Skills: ${p.skills.join(", ")}`,
    ),
    "",
    "## Tools",
    ...tools.filter((g) => g.items.length).map((g) => `- ${g.group}: ${g.items.map((i) => i.name).join(", ")}`),
    "",
    "## Experience (work history)",
    ...(experience.length
      ? experience.map((e) => `- ${e.role} at ${e.company} (${e.period}, ${e.location}): ${e.summary} ${e.highlights.join("; ")}`)
      : ["Not listed on the site yet. Do not guess employers, dates or years of experience. Hands-on work on client CRM projects is described above."]),
    "",
    "## Education, certificates, achievements",
    ...(achievements.list.length
      ? achievements.list.map((a) => `- ${a.year}: ${a.title} (${a.type})`)
      : ["Not listed on the site yet."]),
    "",
    "## Contact",
    contact.text,
    `Email: ${site.email}`,
    ...site.socials.map((s) => `${s.label}: ${s.href}`),
    site.resumeUrl ? `Résumé: ${site.resumeUrl}` : "Résumé: not available for download yet.",
    "",
    "## What makes this portfolio different",
    "It is an interactive site: an animated 3D panda (that's me, the assistant!) works at a desk doing Rao Ali's kinds of tasks (invoicing, reconciling, client calls, CRM review), and visitors can pick its job, click it, chat with it by text or voice, and be guided around the page. It combines accounting accuracy with CRM/automation skills, which is less common than either alone.",
  );

  if (assistantConfig.extraFacts.length) push("", "## Extra facts (from Rao Ali)", ...assistantConfig.extraFacts.map((f) => `- ${f}`));

  push("", "## Page sections (id: what's there)", ...SECTIONS.map((s) => `- ${s.id} (${s.label}): ${s.about}`));

  return lines.join("\n");
}
