import { achievements, experience, tools } from "@/lib/content";

/**
 * Page sections the panda can take visitors to. Ids match the real section ids;
 * sections hidden on the site (empty content) are left out automatically.
 */
export type SectionInfo = { id: string; label: string; about: string };

export const SECTIONS: SectionInfo[] = [
  { id: "top", label: "Home", about: "the intro: Rao Ali's role, a short summary and quick links" },
  { id: "about", label: "About", about: "who Rao Ali is, how he works, and the services he offers" },
  { id: "crm", label: "CRM", about: "his CRM work (administration, data cleanup, automation) and the platforms he has worked with: " + tools.flatMap((g) => g.items.map((i) => i.name)).join(", ") },
  { id: "accounting", label: "Accounting", about: "his accounting & financial operations work: invoicing, billing, records, reconciliation" },
  ...(experience.length ? [{ id: "experience", label: "Experience", about: "his work history" }] : []),
  { id: "skills", label: "Skills", about: "his accounting/finance and CRM/operations skills" },
  { id: "work", label: "Case studies", about: "his projects and case studies: one real client project plus demonstrations" },
  ...(achievements.list.length || achievements.metrics.length
    ? [{ id: "achievements", label: "Achievements", about: "education, certificates and awards" }]
    : []),
  { id: "contact", label: "Contact", about: "how to reach him: email, LinkedIn and Instagram" },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export function sectionById(id: string) {
  return SECTIONS.find((s) => s.id === id);
}
