/**
 * ═════════════════════════════════════════════════════════════════
 *   PORTFOLIO CONTENT  —  all site text lives in this file.
 * ═════════════════════════════════════════════════════════════════
 *
 *  • Lines marked  ✏️  still need YOUR real information.
 *  • Sections whose list is empty are HIDDEN automatically
 *    (experience, CRM platforms, tools, stats, achievements),
 *    so nothing invented ever appears on the live site.
 *  • In headings, wrap a word in *asterisks* → italic accent word.
 *  • Images go in /public and are referenced as "/file.jpg".
 */

import type { IconName } from "@/components/ui/Icon";

/* ─────────────────────────── 1. BASIC INFO ─────────────────────────── */
export const site = {
  name: "Rao Ali Badar", // ✏️ confirm full name
  shortName: "Rao Ali",
  initials: "RA",
  title: "Accountant & CRM Specialist",
  /** Short text used in the rotating badge on the portrait. */
  badge: "Accounts & CRM",
  email: "raoali6@gmail.com",
  location: "Pakistan", // ✏️
  timezone: "Asia/Karachi",
  availability: "Open to full-time, part-time & remote roles", // ✏️
  resumeUrl: "", // ✏️ e.g. "/resume.pdf" (file in /public). Empty = hidden.
  url: "https://raoali-porfolio.vercel.app",
  socials: [
    // ✏️ your real profile links
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rao-ali-badar-051594355/" },
    { label: "Instagram", href: "https://www.instagram.com/raoali.31/" },
  ],
};

/* ─────────────────────────── 2. HERO ─────────────────────────── */
export const hero = {
  lineOne: "Accounts",
  accent: "& CRM",
  lineTwo: "specialist",
  tagline:
    "keeping financial records, billing and customer data accurate, organised and ready for decisions.",
  meta: [
    { label: "Focus", value: "Accounting · CRM · Automation" },
    { label: "Status", value: "Open to new opportunities" },
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
};

/* ─────────────────────────── 3. ABOUT ─────────────────────────── */
export const about = {
  statement:
    "I'm Rao Ali — I keep the *numbers* accurate and the *customer* records organised, so businesses can bill on time and serve clients better.",
  bio: "I work at the point where finance meets customer operations: maintaining financial records, preparing invoices, tracking payments, keeping CRM data clean and automating workflows on client CRM projects. I care about accuracy, clear reporting and simple processes that save teams time.",
  portrait: "/portrait.jpg", // ✏️ replace /public/portrait.jpg if needed
  facts: [
    { label: "Focus", value: "Accounting & CRM operations" },
    { label: "Strength", value: "Data accuracy & reporting" },
    { label: "Work style", value: "Detail-oriented, process-driven" },
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
  /**
   * ✏️ Animated counters — ONLY add real numbers (max 3), e.g.
   *   { value: 3, suffix: "+", label: "Years experience" },
   * Empty = the counter row is hidden.
   */
  stats: [] as { value: number; suffix: string; label: string }[],
};

/* ──────────── 4. SERVICES  (the stacked card deck in About) ──────────── */
export type Service = {
  title: string;
  description: string;
  tags: string[];
  icon: IconName;
  color: string;
};

export const services: Service[] = [
  {
    title: "Invoicing & Billing",
    description: "Preparing accurate invoices, running monthly billing cycles and keeping every charge traceable.",
    tags: ["Invoices", "Monthly billing", "Follow-ups"],
    icon: "receipt",
    color: "#FFA800",
  },
  {
    title: "Financial Records",
    description: "Maintaining organised financial records, transactions and expenses — verified and easy to audit.",
    tags: ["Records", "Transactions", "Expenses"],
    icon: "ledger",
    color: "#00FFE0",
  },
  {
    title: "CRM & Automation",
    description: "Setting up CRM workflows and automating business processes so teams spend less time on manual work.",
    tags: ["Workflows", "Automation", "Configuration"],
    icon: "settings",
    color: "#8B5CF6",
  },
  {
    title: "Customer Data",
    description: "Managing client records and communication history so every team works from the same accurate data.",
    tags: ["Client records", "Cleanup", "Communication"],
    icon: "users",
    color: "#3B82F6",
  },
  {
    title: "Reporting",
    description: "Turning spreadsheets and CRM data into clear reports, and tidying the processes behind them.",
    tags: ["Reports", "Spreadsheets", "Process improvement"],
    icon: "chart",
    color: "#22C55E",
  },
];

/* ─────────────────────────── 5. CRM SPECIALIST ─────────────────────────── */
export type Capability = { title: string; description: string; icon: IconName; span?: "wide" };

export const crm = {
  heading: "CRM systems that *stay* clean.",
  intro:
    "Hands-on experience on client CRM projects — setting up workflows, automating business processes, managing client information and helping businesses run their day-to-day operations more smoothly.",
  capabilities: [
    {
      title: "CRM administration & configuration",
      description: "Setting up fields, stages, users and views so the system matches how the business actually works.",
      icon: "settings",
      span: "wide",
    },
    { title: "Customer & client records", description: "Creating, updating and maintaining complete client profiles.", icon: "contact" },
    { title: "Data entry & cleanup", description: "Removing duplicates, fixing errors and standardising records.", icon: "search" },
    { title: "Customer interactions", description: "Logging calls, emails and follow-ups so no conversation is lost.", icon: "messages" },
    { title: "Leads & activity tracking", description: "Tracking leads, clients and business activities through each stage.", icon: "target" },
    {
      title: "Business process automation",
      description: "Setting up automated workflows that take repetitive work off the team's plate.",
      icon: "workflow",
    },
    { title: "Reporting & data accuracy", description: "Producing reports and keeping the underlying data trustworthy.", icon: "chart" },
    {
      title: "Better support & operations",
      description: "Using well-kept CRM data to make customer support faster and business operations smoother.",
      icon: "headset",
    },
  ] as Capability[],
  /**
   * ✏️ CRM platforms you have ACTUALLY used. Empty = the platform cards are hidden.
   *   icon = simple-icons export name (https://simpleicons.org), optional.
   * details = what you did in it (bullets). When filled, the card becomes expandable,
   *   e.g. ["Maintained contact and company records", "Built weekly reports"].
   */
  platforms: [
    {
      name: "HubSpot",
      icon: "siHubspot",
      summary: "Workflow automation & client data",
      details: [
        "Set up automated workflows on client projects",
        "Streamlined business processes through automation",
        "Managed and organised client information",
      ],
    },
    {
      name: "Zoho CRM",
      icon: "siZoho",
      summary: "Workflow automation & client data",
      details: [
        "Set up automated workflows on client projects",
        "Streamlined business processes through automation",
        "Managed and organised client information",
      ],
    },
  ] as { name: string; icon?: string; summary: string; details: string[] }[],
};

/* ─────────────────────── 6. ACCOUNTING & FINANCIAL OPERATIONS ─────────────────────── */
export const accounting = {
  heading: "Financial operations, *done* carefully.",
  intro:
    "The day-to-day work that keeps money moving correctly — from preparing invoices to following up on payments and supporting reconciliation.",
  areas: [
    { title: "Invoice preparation & management", description: "Accurate invoices, issued on time and tracked to payment.", icon: "receipt" },
    { title: "Billing & payment tracking", description: "Monitoring what's billed, paid and outstanding.", icon: "wallet" },
    { title: "Financial record maintenance", description: "Organised, up-to-date records that are easy to review.", icon: "ledger" },
    { title: "Transaction & expense tracking", description: "Recording and categorising transactions and expenses.", icon: "transfer" },
    { title: "Data verification & accuracy", description: "Cross-checking figures before they reach a report.", icon: "shield" },
    { title: "Spreadsheet management", description: "Structured, well-maintained spreadsheets and trackers.", icon: "spreadsheet" },
    { title: "Financial reporting support", description: "Preparing the data and summaries behind financial reports.", icon: "chart" },
    { title: "Monthly billing operations", description: "Running recurring billing cycles reliably every month.", icon: "calendar" },
    { title: "Follow-ups & reconciliation support", description: "Chasing overdue payments and helping match records to statements.", icon: "coins" },
  ] as Capability[],
};

/* ─────────────────────────── 7. EXPERIENCE ─────────────────────────── */
export type Experience = {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
  tools: string[];
};

/**
 * ✏️ Your REAL work history, newest first. Empty = the section is hidden.
 * Example:
 *   {
 *     role: "Accounts & CRM Executive",
 *     company: "Company Name",
 *     period: "2023 — Now",
 *     location: "Lahore, PK",
 *     summary: "Billing, customer records and CRM administration.",
 *     highlights: ["Prepared and issued monthly client invoices", "Maintained CRM records"],
 *     tools: ["Excel", "Your CRM"],
 *   },
 */
export const experience: Experience[] = [];

/* ─────────────────────────── 8. SKILLS ─────────────────────────── */
export type SkillGroup = {
  title: string;
  icon: IconName;
  description: string;
  items: string[];
  span?: "wide";
};

export const skills: SkillGroup[] = [
  {
    title: "Accounting & Finance",
    icon: "ledger",
    description: "Keeping billing, payments and financial data accurate and organised.",
    items: [
      "Invoice Management",
      "Billing Operations",
      "Financial Data Management",
      "Spreadsheet Management",
      "Payment Tracking",
      "Reporting Support",
    ],
    span: "wide",
  },
  {
    title: "CRM & Operations",
    icon: "users",
    description: "Running customer systems and the processes around them.",
    items: [
      "CRM Administration",
      "Customer Data Management",
      "Workflow Management",
      "Business Process Automation",
      "Customer Relationship Management",
      "Data Organization",
      "Process Improvement",
    ],
  },
];

/* ─────────────────────────── 9. CASE STUDIES ─────────────────────────── */
export type Project = {
  title: string;
  category: string;
  /** "Demonstration" = sample scenario. Change to e.g. "Based on my work at X" only if true. */
  label: string;
  description: string;
  problem: string;
  solution: string;
  outcome: string;
  skills: string[];
  /** Small sample table shown in the case study. Always fictional demo data. */
  sample?: { columns: string[]; rows: string[][] };
  cover: [string, string];
  image?: string;
};

export const projects: Project[] = [
  {
    title: "CRM Automation",
    category: "Business process automation",
    label: "Client projects",
    description:
      "Work across several client CRM projects, automating business processes and organising client information.",
    problem:
      "Clients were handling routine steps manually and keeping client information in ways that slowed down their day-to-day operations.",
    solution:
      "Set up workflows in the CRM, automated repetitive steps, streamlined the surrounding processes and organised client records.",
    outcome: "Helped the businesses run smoother day-to-day operations with less manual work.",
    skills: ["Workflow automation", "Process streamlining", "Client data management", "HubSpot", "Zoho CRM"],
    cover: ["#8B5CF6", "#0b1d5c"],
  },
  {
    title: "Invoice & Billing",
    category: "Billing management",
    label: "Demonstration",
    description: "A structured approach to monthly invoicing and payment tracking for a recurring-client business.",
    problem: "Invoices are created ad hoc, due dates are missed and nobody has a single view of what is outstanding.",
    solution:
      "One billing tracker with invoice numbers, issue and due dates, status and follow-up notes — updated on a fixed monthly cycle.",
    outcome: "Shows how a consistent billing routine makes outstanding balances visible and follow-ups predictable.",
    skills: ["Invoice management", "Billing operations", "Payment tracking"],
    sample: {
      columns: ["Invoice", "Client", "Due", "Amount", "Status"],
      rows: [
        ["INV-1042", "Client A", "05 Nov", "1,250.00", "Paid"],
        ["INV-1043", "Client B", "10 Nov", "860.00", "Overdue"],
        ["INV-1044", "Client C", "15 Nov", "2,100.00", "Sent"],
      ],
    },
    cover: ["#FFA800", "#1d3fb8"],
  },
  {
    title: "CRM Data Cleanup",
    category: "CRM data organization",
    label: "Demonstration",
    description: "Turning a cluttered CRM into a reliable source of customer information.",
    problem: "Duplicate contacts, inconsistent formats and missing fields make reports unreliable.",
    solution:
      "Audit the records, merge duplicates, standardise names, phones and statuses, and define required fields for new entries.",
    outcome: "Shows a repeatable cleanup process that keeps CRM data trustworthy over time.",
    skills: ["CRM administration", "Data cleanup", "Data organization"],
    sample: {
      columns: ["Check", "Before", "After"],
      rows: [
        ["Duplicate contacts", "Many", "Merged"],
        ["Phone format", "Mixed", "Standardised"],
        ["Missing status", "Common", "Required field"],
      ],
    },
    cover: ["#00FFE0", "#2a1b6b"],
  },
  {
    title: "Customer Database",
    category: "Customer data management",
    label: "Demonstration",
    description: "Organising client records so sales, support and accounts all work from the same data.",
    problem: "Customer details live in inboxes and separate sheets, so teams give inconsistent answers.",
    solution: "A single customer database with clear ownership, segments and an interaction history for every client.",
    outcome: "Shows how centralised customer records improve communication and response times.",
    skills: ["Customer data management", "CRM", "Client communication"],
    cover: ["#8B5CF6", "#0f3b4a"],
  },
  {
    title: "Financial Reporting",
    category: "Spreadsheet management",
    label: "Demonstration",
    description: "Monthly financial summaries built from well-structured spreadsheets.",
    problem: "Figures are spread across files, and building the monthly summary takes days of manual copying.",
    solution:
      "A consistent spreadsheet structure for transactions and expenses, with verification checks and a summary tab for reporting.",
    outcome: "Shows how organised data and simple checks make monthly reporting faster and more accurate.",
    skills: ["Spreadsheet management", "Data verification", "Reporting support"],
    sample: {
      columns: ["Category", "Oct", "Nov", "Change"],
      rows: [
        ["Revenue billed", "18,400", "19,250", "+4.6%"],
        ["Collected", "16,900", "18,100", "+7.1%"],
        ["Expenses", "7,300", "7,050", "−3.4%"],
      ],
    },
    cover: ["#3B82F6", "#111827"],
  },
  {
    title: "Support Workflow",
    category: "Customer support operations",
    label: "Demonstration",
    description: "A clear path for customer requests from first contact to resolution.",
    problem: "Requests arrive through several channels and some are never followed up.",
    solution: "Log every request in the CRM, assign an owner and status, and review open items on a fixed schedule.",
    outcome: "Shows how a simple, tracked workflow prevents missed requests and improves customer experience.",
    skills: ["Workflow management", "Customer support", "CRM"],
    cover: ["#22C55E", "#0b1d5c"],
  },
  {
    title: "Process Improvement",
    category: "Business process improvement",
    label: "Demonstration",
    description: "Finding and removing repetitive manual steps in everyday admin and billing work.",
    problem: "The same data is typed into several places, causing delays and errors.",
    solution: "Map the current process, remove duplicate steps, introduce templates and a single source of data.",
    outcome: "Shows a practical approach to making routine operations simpler and less error-prone.",
    skills: ["Process improvement", "Administrative support", "Data organization"],
    cover: ["#d946ef", "#111827"],
  },
];

/* ─────────────────────────── 10. TOOLS ─────────────────────────── */
/**
 * ✏️ Only tools you have ACTUALLY used. Groups with no items are hidden;
 * if every group is empty the whole Tools section is hidden.
 * `icon` = simple-icons export name (e.g. "siGooglesheets", "siQuickbooks"). Optional.
 */
export const tools: { group: string; icon: IconName; items: { name: string; icon?: string }[] }[] = [
  { group: "Accounting & billing", icon: "ledger", items: [{ name: "Stripe", icon: "siStripe" }] },
  { group: "Spreadsheets", icon: "spreadsheet", items: [{ name: "Microsoft Excel" }] },
  {
    group: "CRM platforms",
    icon: "users",
    items: [
      { name: "HubSpot", icon: "siHubspot" },
      { name: "Zoho CRM", icon: "siZoho" },
    ],
  },
  {
    group: "Productivity tools",
    icon: "layers",
    items: [
      { name: "Google Workspace", icon: "siGoogle" },
      { name: "Slack" },
      { name: "Trello", icon: "siTrello" },
    ],
  },
];

/* ─────────────────────────── 11. ACHIEVEMENTS ─────────────────────────── */
/** ✏️ Real education, certificates or awards only. Both empty = section hidden. */
export const achievements = {
  metrics: [] as { value: number; suffix: string; label: string }[],
  list: [] as { year: string; title: string; type: string }[],
};

/* ─────────────────────────── 12. CONTACT ─────────────────────────── */
export const contact = {
  heading: "Let's keep your numbers *in order*.",
  text: "Looking for someone reliable for accounting operations, billing or CRM management? I'd be glad to hear about the role — I usually reply within a day.",
};

/* Navigation (ids match section ids; hidden sections are left out) */
export const nav = [
  { id: "about", label: "About" },
  { id: "crm", label: "CRM" },
  { id: "accounting", label: "Accounting" },
  ...(experience.length ? [{ id: "experience", label: "Experience" }] : []),
  { id: "work", label: "Case studies" },
  { id: "contact", label: "Contact" },
];

/* Section numbering — counts only visible sections, so hidden ones never leave gaps. */
const sectionOrder: { id: string; visible: boolean }[] = [
  { id: "about", visible: true },
  { id: "crm", visible: true },
  { id: "accounting", visible: true },
  { id: "experience", visible: experience.length > 0 },
  { id: "skills", visible: skills.length > 0 },
  { id: "work", visible: projects.length > 0 },
  { id: "tools", visible: tools.some((g) => g.items.length > 0) },
  { id: "achievements", visible: achievements.metrics.length + achievements.list.length > 0 },
  { id: "contact", visible: true },
];

/** "01", "02"… for a section id, based on visible sections only. */
export function sectionIndex(id: string): string {
  const n = sectionOrder.filter((s) => s.visible).findIndex((s) => s.id === id) + 1;
  return String(n).padStart(2, "0");
}
