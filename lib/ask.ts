import { about, accounting, ask, identity, projects, tools, workflow } from "@/src/content";

/**
 * Answers questions about Ali using ONLY src/content.ts. No model, no network: each topic is a
 * set of keywords and an answer assembled from the content file. Anything outside these
 * topics (salary, age, past employers, dates…) gets the fallback.
 */
type Topic = { keys: string[]; answer: () => string };

const list = (xs: readonly string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

const TOPICS: Topic[] = [
  {
    keys: ["contact", "email", "reach", "hire", "linkedin", "instagram", "connect", "message", "touch"],
    answer: () =>
      `Email ${identity.email}. Ali is also on ${list(identity.socials.map((s) => s.label))}, and is based in ${identity.location}. ${identity.availability}.`,
  },
  {
    keys: ["available", "availability", "open to", "remote", "part-time", "full-time", "job", "role"],
    answer: () => `${identity.availability}. The quickest way to start is an email to ${identity.email}.`,
  },
  {
    keys: ["tool", "software", "platform", "stack", "hubspot", "stripe", "zoho", "jira", "excel", "use"],
    answer: () => `${tools.intro} The full list: ${list(tools.items.map((t) => t.name))}.`,
  },
  {
    keys: ["workflow", "process", "day-to-day", "daily", "operations", "steps", "onboarding", "how does"],
    answer: () => `Ali's operations run in ${workflow.steps.length} steps: ${list(workflow.steps.map((s) => s.title))}.`,
  },
  {
    keys: ["crm", "automation", "automate", "client data", "customer data", "pipeline"],
    answer: () => {
      const crm = workflow.steps.find((s) => s.id === "crm")!;
      const data = workflow.steps.find((s) => s.id === "data")!;
      return `${crm.text} ${data.text} Tools used for this include ${list([...new Set([...crm.tools, ...data.tools])])}.`;
    },
  },
  {
    keys: ["accounting", "finance", "invoice", "billing", "payment", "reconcil", "bookkeeping", "expense", "report", "spreadsheet"],
    answer: () => `${accounting.intro} The areas Ali covers: ${list(accounting.areas.map((a) => a.title.toLowerCase()))}.`,
  },
  {
    keys: ["project", "case", "work", "portfolio", "example"],
    answer: () =>
      `${list(projects.map((p) => `${p.title} (${p.label === "Client projects" ? "real client work" : "a demonstration"})`))}. Open any of them in the Projects section for the problem, approach and outcome.`,
  },
  {
    keys: ["background", "about", "who", "study", "studied", "academic", "education", "degree", "interest", "yourself", "ali"],
    answer: () => `${about.intro} ${about.body[1]}`,
  },
];

/** Things the content file has no answer for, even if a keyword above would match. */
const UNKNOWN = ["salary", "rate", "price", "cost", "age", "old", "married", "phone", "number", "address", "company name", "employer", "years of experience", "how long"];

export function answer(question: string): string {
  const q = question.toLowerCase();
  // Whole words only, so "accurate" never trips "rate".
  if (!q.trim() || UNKNOWN.some((u) => new RegExp(String.raw`\b${u}\b`).test(q))) return ask.fallback + ".";
  let best: Topic | null = null;
  let score = 0;
  for (const t of TOPICS) {
    const s = t.keys.reduce((n, k) => n + (q.includes(k) ? k.length : 0), 0);
    if (s > score) {
      score = s;
      best = t;
    }
  }
  return best ? best.answer() : ask.fallback + ".";
}
