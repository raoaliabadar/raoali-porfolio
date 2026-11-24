import { contact, crm, experience, projects, services, site, skills, tools } from "@/lib/content";
import type { PandaMood, PandaReaction } from "@/lib/panda";
import { assistantConfig } from "./config";

/**
 * Offline brain: keyword-matched answers built from the real portfolio content.
 * Used when the AI backend isn't configured or is unavailable, so the panda
 * always has something accurate to say.
 */
export type LocalReply = { text: string; nav?: string };

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));
const list = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

export function localAnswer(input: string): LocalReply {
  const q = ` ${input.toLowerCase().replace(/[^\p{L}\p{N}@.\s]/gu, " ").replace(/\s+/g, " ")} `;
  const realProject = projects.find((p) => p.label !== "Demonstration");

  if (has(q, " hi ", " hello ", " hey ", " salam ", " assalam", " aoa "))
    return { text: `Hello! I'm ${site.shortName}'s panda assistant. Ask me about his skills, services, case studies or how to reach him.` };

  if (has(q, "thank", "shukria", "thanks"))
    return { text: "You're welcome! Anything else you'd like to know about Rao Ali?" };

  if (has(q, "contact", "email", "reach", "hire", "get in touch", "linkedin", "instagram", "message him", "rabta"))
    return {
      text: `You can email Rao Ali at ${site.email} or find him on ${list(site.socials.map((s) => s.label))}.${/usually reply within a day/i.test(contact.text) ? " He usually replies within a day." : ""} I'll take you to the Contact section.`,
      nav: "contact",
    };

  if (has(q, "experience", "work history", "worked", "job", "company", "years"))
    return experience.length
      ? {
          text: `Rao Ali has worked as ${list(experience.map((e) => `${e.role} at ${e.company} (${e.period})`))}.`,
          nav: "experience",
        }
      : {
          text: `His full work history isn't listed on the site yet. What I can tell you: he has hands-on experience on client CRM projects in ${list(crm.platforms.map((p) => p.name))}, where he set up automated workflows, streamlined processes and organised client information. He also does accounting work like invoicing, billing and records. For details, ask him directly at ${site.email}.`,
          nav: "crm",
        };

  if (has(q, "project", "case stud", "portfolio work", "show me", "examples", "work samples"))
    return {
      text: `Here are his case studies. ${realProject ? `${realProject.title} is real client work: ${realProject.description.charAt(0).toLowerCase()}${realProject.description.slice(1)} ` : ""}The others (${list(projects.filter((p) => p !== realProject).map((p) => p.title))}) are demonstrations with sample data that show how he approaches each problem.`,
      nav: "work",
    };

  if (has(q, "skill", "good at", "expertise", "strength", "technical"))
    return {
      text: `${skills.map((g) => `${g.title}: ${list(g.items.slice(0, 4))}`).join(". ")}. He's detail-oriented, with a strong focus on data accuracy and clear reporting.`,
      nav: "skills",
    };

  if (has(q, "tool", "software", "excel", "stripe", "hubspot", "zoho", "trello", "slack", "google"))
    return {
      text: `He works with ${list(tools.flatMap((g) => g.items.map((i) => i.name)))}.`,
      nav: "tools",
    };

  if (has(q, " crm", "automation", "workflow"))
    return { text: `${crm.intro} Platforms: ${list(crm.platforms.map((p) => p.name))}.`, nav: "crm" };

  if (has(q, "account", "invoice", "billing", "bookkeep", "reconcil", "finance", "payment"))
    return {
      text: "On the accounting side he prepares invoices, runs monthly billing, tracks payments and expenses, keeps financial records organised and supports reconciliation and reporting.",
      nav: "accounting",
    };

  if (has(q, "service", "offer", "help with", "what does he do", "what can he do"))
    return { text: `He offers ${list(services.map((s) => s.title.toLowerCase()))}.`, nav: "about" };

  if (has(q, "unique", "special", "different", "why him", "why should"))
    return {
      text: "He combines careful accounting work with CRM and automation skills, so billing, records and customer data stay accurate and connected. The portfolio itself is interactive too: you're chatting with its 3D panda right now.",
    };

  if (has(q, "where", "location", "based", "country", "pakistan"))
    return { text: `He's based in ${site.location} and is ${site.availability.charAt(0).toLowerCase()}${site.availability.slice(1)}.` };

  if (has(q, "available", "open to", "freelance", "remote", "full time", "part time"))
    return { text: `${site.availability}. Reach him at ${site.email}.`, nav: "contact" };

  if (has(q, "who", "about", "tell me", "introduce", "kaun"))
    return {
      text: `Rao Ali is an ${site.title.toLowerCase()} based in ${site.location}. He keeps financial records, billing and customer data accurate and organised, and automates CRM workflows so teams spend less time on manual work.`,
      nav: "about",
    };

  if (has(q, "resume", "cv"))
    return site.resumeUrl
      ? { text: `You can download his résumé from the Contact section.`, nav: "contact" }
      : { text: `His résumé isn't on the site yet. Email ${site.email} and he can send it.` };

  return {
    text: `Hmm, that isn't on Rao Ali's portfolio. I can tell you about his skills, services, case studies or tools, or you can ask him directly at ${site.email}.`,
  };
}

// Hidden commands: short messages that trigger special animations.
export type HiddenCommand = { reply: string; reaction?: PandaReaction; mood?: PandaMood };

const COMMANDS: { match: RegExp; cmd: HiddenCommand }[] = [
  { match: /^(\/)?(dance|let'?s dance|party|panda party)$/, cmd: { reply: "Watch this. *panda dance*", reaction: "dance" } },
  { match: /^(\/)?(spin|do a spin|barrel roll|do a barrel roll)$/, cmd: { reply: "Wheee!", reaction: "spin" } },
  { match: /^(\/)?(sleep|go to sleep|goodnight|good night|nap|take a nap)$/, cmd: { reply: "Yawn… just a quick nap. Say “wake up” when you need me.", mood: "sleeping" } },
  { match: /^(\/)?(wake up|wakey wakey|rise and shine)$/, cmd: { reply: "I'm up, I'm up!", reaction: "surprised", mood: "idle" } },
  { match: /^(\/)?(high five|hi five|wave)$/, cmd: { reply: "High five!", reaction: "wave" } },
  { match: /^(\/)?(celebrate|yay|woohoo)$/, cmd: { reply: "Woohoo!", reaction: "cheer" } },
  { match: /^(\/)?(bamboo|feed the panda|snack)$/, cmd: { reply: "Bamboo?! My favourite. *happy panda noises*", reaction: "cheer" } },
  { match: /^(\/)?(help|commands|secret|secrets)$/, cmd: { reply: `Psst… try typing “dance”, “spin”, “high five”, “bamboo” or “sleep”. Or ask me anything about ${site.shortName}.`, reaction: "nod" } },
];

export function hiddenCommand(input: string): HiddenCommand | null {
  const q = input.trim().toLowerCase().replace(/[!.?]+$/g, "");
  return COMMANDS.find((c) => c.match.test(q))?.cmd ?? null;
}

export const GREETING = assistantConfig.greeting;
