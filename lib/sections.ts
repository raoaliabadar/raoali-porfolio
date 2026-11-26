import { experience, sections } from "@/src/content";

/**
 * Sections that have content to show, numbered in page order. Experience stays out until
 * there is real experience data, and the numbers close up so there is never a gap.
 */
export const visibleSections = sections
  .filter((s) => s.id !== "experience" || experience.length > 0)
  .map((s, i) => ({ ...s, n: String(i + 1).padStart(2, "0") }));

export const sectionNumber = (id: string) => visibleSections.find((s) => s.id === id)?.n ?? "";
