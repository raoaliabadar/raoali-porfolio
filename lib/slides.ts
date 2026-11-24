/**
 * The eight full-screen slides, in order. `id` is also the URL hash (#about, #contact…).
 * Anything on the page can move the deck with `goToSlide("contact")`.
 */
export const SLIDES = [
  { id: "workspace", label: "Workspace", title: "The Accountant's Workspace" },
  { id: "about", label: "About", title: "Behind the Numbers" },
  { id: "accounting", label: "Accounting", title: "Understanding the Numbers" },
  { id: "dashboard", label: "Dashboard", title: "Numbers in Motion" },
  { id: "tools", label: "Tools", title: "The Tools Behind My Work" },
  { id: "experience", label: "Experience", title: "Business Operations in Action" },
  { id: "projects", label: "Projects", title: "Knowledge Put Into Practice" },
  { id: "contact", label: "Contact", title: "Let's Connect." },
] as const;

export type SlideId = (typeof SLIDES)[number]["id"];

export const GO_EVENT = "slides:go";

export function goToSlide(target: SlideId | number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SlideId | number>(GO_EVENT, { detail: target }));
}

/** Old section ids (used by the laptop's mini-site) → the slide that now holds that content. */
const LEGACY: Record<string, SlideId> = {
  top: "workspace",
  about: "about",
  work: "projects",
  skills: "tools",
  crm: "tools",
  accounting: "accounting",
  experience: "experience",
  contact: "contact",
};

export function goToSection(id: string) {
  goToSlide(LEGACY[id] ?? (SLIDES.some((s) => s.id === id) ? (id as SlideId) : "workspace"));
}
