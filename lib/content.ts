/**
 *   PORTFOLIO CONTENT: all site text lives in this file.
 *
 *  • Lines marked  ✏️  still need YOUR real information.
 *  • Sections whose list is empty are HIDDEN automatically
 *    (experience, CRM platforms, tools, stats, achievements),
 *    so nothing invented ever appears on the live site.
 *  • In headings, wrap a word in *asterisks* → italic accent word.
 *  • Images go in /public and are referenced as "/file.jpg".
 */

import type { IconName } from "@/components/ui/Icon";

// 1. BASIC INFO
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

// 2. HERO
export const hero = {
  /** Small pill above the headline. */
  badge: "Open to new opportunities",
  /** Main headline: wrap words in *asterisks* for the accent colour. */
  headline: "Accountant & *CRM Specialist*",
  tagline:
    "I keep financial records, billing and customer data accurate and organised, and I automate CRM workflows so teams spend less time on manual work.",
  meta: [
    { label: "Focus", value: "Accounting · CRM · Automation" },
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
};

// 3. ABOUT
export const about = {
  statement:
    "I'm Rao Ali. I keep the *numbers* accurate and the *customer* records organised, so businesses can bill on time and serve clients better.",
  bio: "I work at the point where finance meets customer operations: maintaining financial records, preparing invoices, tracking payments, keeping CRM data clean and automating workflows on client CRM projects. I care about accuracy, clear reporting and simple processes that save teams time.",
  portrait: "/portrait.jpg", // ✏️ replace /public/portrait.jpg if needed
  facts: [
    { label: "Focus", value: "Accounting & CRM operations" },
    { label: "Strength", value: "Data accuracy & reporting" },
    { label: "Work style", value: "Detail-oriented, process-driven" },
    { label: "Based in", value: "Pakistan" }, // ✏️
  ],
  /**
   * ✏️ Animated counters: ONLY add real numbers (max 3), e.g.
   *   { value: 3, suffix: "+", label: "Years experience" },
   * Empty = the counter row is hidden.
   */
  stats: [] as { value: number; suffix: string; label: string }[],
};

// 3b. ABOUT SLIDES  (scroll-stepped story in the About section)
export type AboutCard = {
  title: string;
  note?: string;
  icon: IconName;
  /** "accent" = filled orange card */
  tone?: "default" | "accent";
  /** Where the card floats around the portrait. */
  at: "tl" | "tr" | "bl" | "br";
};

export type AboutSlide = {
  kicker: string;
  title: string;
  body?: string[];
  items?: string[];
  closing?: string;
  cards: AboutCard[];
};

export const aboutSlides: AboutSlide[] = [
  {
    kicker: "About me",
    title: "I keep the numbers accurate and the records organised.",
    body: [
      "I work where finance meets customer operations: maintaining financial records, preparing invoices and keeping customer data clean and reliable.",
    ],
    cards: [
      { title: "Record verified", note: "Figures cross-checked", icon: "shield", at: "tl" },
      { title: "Invoice sent", note: "Tracked to payment", icon: "receipt", at: "br", tone: "accent" },
    ],
  },
  {
    kicker: "Accounting & billing",
    title: "Billing that runs on time, every month.",
    body: [
      "Preparing invoices, tracking what's billed, paid and outstanding, following up on payments and supporting reconciliation.",
    ],
    cards: [
      { title: "Monthly billing", note: "Recurring cycle on schedule", icon: "calendar", at: "tr" },
      { title: "Payment follow-up", note: "Overdue items chased", icon: "coins", at: "bl", tone: "accent" },
      { title: "Expenses tracked", icon: "transfer", at: "br" },
    ],
  },
  {
    kicker: "CRM & automation",
    title: "CRM workflows that take manual work away.",
    body: [
      "On client CRM projects I set up workflows, automate business processes and organise client information, so teams can focus on their customers.",
    ],
    cards: [
      { title: "Workflow automated", note: "Repetitive steps removed", icon: "workflow", at: "tl", tone: "accent" },
      { title: "Client record updated", icon: "contact", at: "tr" },
      { title: "Duplicates merged", note: "Clean, consistent data", icon: "search", at: "bl" },
    ],
  },
  {
    kicker: "How I work",
    title: "Simple processes, clear reporting.",
    items: [
      "Detail-oriented and process-driven",
      "Accurate data behind every report",
      "Clear communication with clients and teams",
    ],
    closing: "Looking for reliable support in accounting operations or CRM? Let's talk.",
    cards: [
      { title: "Report ready", note: "Verified & summarised", icon: "chart", at: "tr", tone: "accent" },
      { title: "Process improved", icon: "layers", at: "bl" },
    ],
  },
];

// 4. SERVICES  (the stacked card deck in About)
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
    color: "#fe4f02",
  },
  {
    title: "Financial Records",
    description: "Maintaining organised financial records, transactions and expenses, verified and easy to audit.",
    tags: ["Records", "Transactions", "Expenses"],
    icon: "ledger",
    color: "#fe4f02",
  },
  {
    title: "CRM & Automation",
    description: "Setting up CRM workflows and automating business processes so teams spend less time on manual work.",
    tags: ["Workflows", "Automation", "Configuration"],
    icon: "settings",
    color: "#fe4f02",
  },
  {
    title: "Customer Data",
    description: "Managing client records and communication history so every team works from the same accurate data.",
    tags: ["Client records", "Cleanup", "Communication"],
    icon: "users",
    color: "#fe4f02",
  },
  {
    title: "Reporting",
    description: "Turning spreadsheets and CRM data into clear reports, and tidying the processes behind them.",
    tags: ["Reports", "Spreadsheets", "Process improvement"],
    icon: "chart",
    color: "#fe4f02",
  },
];

// 5. CRM SPECIALIST
export type Capability = { title: string; description: string; icon: IconName; span?: "wide" };

export const crm = {
  heading: "CRM systems that *stay* clean.",
  intro:
    "Hands-on experience on client CRM projects: setting up workflows, automating business processes, managing client information and helping businesses run their day-to-day operations more smoothly.",
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
    // ✏️ Add 2-3 `details` bullets to any card below to make it expandable (only what you really did there).
    { name: "GoHighLevel", summary: "CRM management & workflow automation", details: [] },
    { name: "Stripe", icon: "siStripe", summary: "Billing", details: [] },
    { name: "HoneyBook", summary: "Billing & client management", details: [] },
    { name: "Dubsado", summary: "Billing & client management", details: [] },
    { name: "Intercom", icon: "siIntercom", summary: "Customer support", details: [] },
    { name: "Jira", icon: "siJira", summary: "Project management", details: [] },
    { name: "Confluence", icon: "siConfluence", summary: "Project management", details: [] },
    { name: "Baserow", icon: "siBaserow", summary: "Platform administration", details: [] },
    { name: "Auth0", icon: "siAuth0", summary: "Platform administration", details: [] },
  ] as { name: string; icon?: string; summary: string; details: string[] }[],
};

// 6. ACCOUNTING & FINANCIAL OPERATIONS
export const accounting = {
  heading: "Financial operations, *done* carefully.",
  intro:
    "The day-to-day work that keeps money moving correctly: preparing invoices, following up on payments and supporting reconciliation.",
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

// 7. EXPERIENCE
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
 *     period: "2023 to now",
 *     location: "Lahore, PK",
 *     summary: "Billing, customer records and CRM administration.",
 *     highlights: ["Prepared and issued monthly client invoices", "Maintained CRM records"],
 *     tools: ["Excel", "Your CRM"],
 *   },
 */
export const experience: Experience[] = [];

// 8. SKILLS
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
      "Invoice management",
      "Billing operations",
      "Financial data management",
      "Spreadsheet management",
      "Payment tracking",
      "Reporting support",
    ],
    span: "wide",
  },
  {
    title: "CRM & Operations",
    icon: "users",
    description: "Running customer systems and the processes around them.",
    items: [
      "CRM administration",
      "Customer data management",
      "Workflow management",
      "Business process automation",
      "Customer relationship management",
      "Data organization",
      "Process improvement",
    ],
  },
];

// 9. CASE STUDIES
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
    cover: ["#fe4f02", "#1b1a18"],
  },
  {
    title: "Invoice & Billing",
    category: "Billing management",
    label: "Demonstration",
    description: "A structured approach to monthly invoicing and payment tracking for a recurring-client business.",
    problem: "Invoices are created ad hoc, due dates are missed and nobody has a single view of what is outstanding.",
    solution:
      "One billing tracker with invoice numbers, issue and due dates, status and follow-up notes, updated on a fixed monthly cycle.",
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
    cover: ["#ffa800", "#1b1a18"],
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
    cover: ["#c93a00", "#1b1a18"],
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
    cover: ["#ffa800", "#1b1a18"],
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
    cover: ["#7a6b5f", "#1b1a18"],
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
    cover: ["#fe4f02", "#1b1a18"],
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
    cover: ["#c93a00", "#1b1a18"],
  },
];

// 10. TOOLS
/**
 * ✏️ Only tools you have ACTUALLY used. Groups with no items are hidden;
 * if every group is empty the whole Tools section is hidden.
 * `icon` = simple-icons export name (e.g. "siGooglesheets", "siQuickbooks"). Optional.
 */
export const toolsIntro =
  "Hands-on experience working with Stripe, Baserow, Intercom, Jira, Confluence, HoneyBook, HubSpot, GoHighLevel, Dubsado, and Auth0 for customer support, CRM management, workflow automation, project management, billing, and platform administration.";

export const tools: { group: string; icon: IconName; items: { name: string; icon?: string }[] }[] = [
  {
    group: "CRM & automation",
    icon: "users",
    items: [
      { name: "HubSpot", icon: "siHubspot" },
      { name: "GoHighLevel" },
      { name: "Zoho CRM", icon: "siZoho" },
    ],
  },
  {
    group: "Billing & client management",
    icon: "receipt",
    items: [
      { name: "Stripe", icon: "siStripe" },
      { name: "HoneyBook" },
      { name: "Dubsado" },
    ],
  },
  { group: "Customer support", icon: "headset", items: [{ name: "Intercom", icon: "siIntercom" }] },
  {
    group: "Project management",
    icon: "workflow",
    items: [
      { name: "Jira", icon: "siJira" },
      { name: "Confluence", icon: "siConfluence" },
      { name: "Trello", icon: "siTrello" },
    ],
  },
  {
    group: "Platform administration",
    icon: "shield",
    items: [
      { name: "Auth0", icon: "siAuth0" },
      { name: "Baserow", icon: "siBaserow" },
    ],
  },
  {
    group: "Spreadsheets & productivity",
    icon: "spreadsheet",
    items: [{ name: "Microsoft Excel" }, { name: "Google Workspace", icon: "siGoogle" }, { name: "Slack" }],
  },
];

// 11. ACHIEVEMENTS
/** ✏️ Real education, certificates or awards only. Both empty = section hidden. */
export const achievements = {
  metrics: [] as { value: number; suffix: string; label: string }[],
  list: [] as { year: string; title: string; type: string }[],
};

// 12. CONTACT
export const contact = {
  heading: "Let's keep your numbers *in order*.",
  text: "Looking for someone reliable for accounting operations, billing or CRM management? I'd be glad to hear about the role. I usually reply within a day.",
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


/* =====================================================================
 * 13. SLIDE PORTFOLIO (the full-screen, slide-by-slide site)
 * ===================================================================== */

// Slide 01
export const workspace = {
  kicker: "Accounting & Finance · Business Operations",
  headline: "Finance Meets *Technology.*",
  subtitle: "Accounting Knowledge. Business Operations. Digital Solutions.",
};

// Slide 02
export const profile = {
  intro:
    "I come from an academic background in Accounting & Finance and work in a software house, where I look after the business operations around client projects.",
  body: [
    "My day-to-day covers billing and invoicing, payment tracking, CRM operations and client data, client onboarding, and coordinating projects between clients and the team.",
    "I'm most interested in the point where financial operations meet technology: accurate records, clear reporting and tools that take manual work away.",
  ],
  /** ✏️ Fill in degree, institution and years. Empty fields are simply not shown. */
  education: [{ field: "Accounting & Finance", degree: "", institution: "", years: "" }],
  /** ✏️ Add your job title and company if you'd like them shown. */
  current: { setting: "Software house", role: "", company: "", period: "Current" },
  focus: ["Financial operations", "Billing & invoicing", "CRM & client data", "Client & project coordination"],
};

// Slide 05: platforms you use (from your own list)
export type Platform = { name: string; icon?: string; mono: string; group: PlatformGroup; use: string };
export type PlatformGroup = "crm" | "billing" | "support" | "projects" | "workflows";

/** label: filter button; tag: the short category shown on each card. */
export const platformGroups: { id: PlatformGroup; label: string; tag: string; text: string }[] = [
  { id: "crm", label: "CRM management", tag: "CRM", text: "Client records, pipelines and automated follow-ups, kept clean so every team works from the same data." },
  { id: "billing", label: "Billing & payments", tag: "Billing", text: "Invoices, proposals and payments: what's billed, what's paid and what's still outstanding." },
  { id: "support", label: "Client operations", tag: "Client ops", text: "Conversations with customers, so questions are answered and nothing is lost between teams." },
  { id: "projects", label: "Project management", tag: "Projects", text: "Tasks, status and documentation that keep client projects moving between the client and the team." },
  { id: "workflows", label: "Business workflows", tag: "Workflows", text: "Structured data, internal tools and user access behind the day-to-day operations." },
];

export const platforms: Platform[] = [
  { name: "HubSpot", icon: "siHubspot", mono: "Hs", group: "crm", use: "CRM records, pipelines and workflow automation" },
  { name: "GoHighLevel", mono: "GH", group: "crm", use: "CRM management and workflow automation" },
  { name: "Zoho CRM", mono: "ZO", group: "crm", use: "Client data and workflow automation" },
  { name: "Stripe", icon: "siStripe", mono: "St", group: "billing", use: "Payments, invoices and subscription billing" },
  { name: "HoneyBook", mono: "HB", group: "billing", use: "Client management, proposals and invoicing" },
  { name: "Dubsado", mono: "DS", group: "billing", use: "Client management and billing" },
  { name: "Intercom", icon: "siIntercom", mono: "Ic", group: "support", use: "Customer support conversations" },
  { name: "Slack", mono: "SL", group: "support", use: "Team communication and client hand-offs" },
  { name: "Jira", icon: "siJira", mono: "Ji", group: "projects", use: "Project and task tracking" },
  { name: "Confluence", icon: "siConfluence", mono: "Cf", group: "projects", use: "Project documentation and processes" },
  { name: "Trello", icon: "siTrello", mono: "Tr", group: "projects", use: "Task boards and project tracking" },
  { name: "Baserow", icon: "siBaserow", mono: "Br", group: "workflows", use: "Structured business data and administration" },
  { name: "Retool", icon: "siRetool", mono: "Rt", group: "workflows", use: "Internal tools and admin panels" },
  { name: "Auth0", icon: "siAuth0", mono: "A0", group: "workflows", use: "User access and platform administration" },
  { name: "Microsoft Excel", mono: "XL", group: "workflows", use: "Spreadsheets, records and reports" },
  { name: "Google Workspace", icon: "siGoogle", mono: "GW", group: "workflows", use: "Shared documents, sheets and email" },
];

// Slide 06: the operations you handle (from your own list; no invented results)
export const operations: { id: string; title: string; text: string; points: string[]; tools: string[] }[] = [
  {
    id: "onboarding",
    title: "Client onboarding",
    text: "Setting new clients up in the CRM and billing tools with complete, accurate details.",
    points: ["New client records created", "Billing details captured", "Client information organised"],
    tools: ["HubSpot", "GoHighLevel", "HoneyBook"],
  },
  {
    id: "crm",
    title: "CRM operations",
    text: "Setting up workflows, automating business processes and organising client information.",
    points: ["Workflows configured", "Routine steps automated", "Pipelines kept current"],
    tools: ["HubSpot", "GoHighLevel"],
  },
  {
    id: "data",
    title: "Client & customer data",
    text: "Creating, updating and maintaining complete client profiles, and keeping records clean and consistent.",
    points: ["Profiles kept complete", "Duplicates and errors fixed", "Interaction history logged"],
    tools: ["HubSpot", "Baserow"],
  },
  {
    id: "coordination",
    title: "Project coordination",
    text: "Keeping client projects moving between the client and the team, with tasks and status tracked in one place.",
    points: ["Tasks and status tracked", "Client updates shared", "Hand-offs documented"],
    tools: ["Jira", "Confluence"],
  },
  {
    id: "billing",
    title: "Billing & invoicing",
    text: "Preparing accurate invoices, running monthly billing cycles and keeping every charge traceable.",
    points: ["Invoices prepared and issued", "Monthly billing cycle", "Charges traceable"],
    tools: ["Stripe", "HoneyBook", "Dubsado"],
  },
  {
    id: "payments",
    title: "Payment tracking",
    text: "Monitoring what's billed, paid and outstanding, and following up on overdue payments.",
    points: ["Billed vs paid tracked", "Overdue items followed up", "Records matched to payments"],
    tools: ["Stripe", "Spreadsheets"],
  },
  {
    id: "docs",
    title: "Documentation & support",
    text: "Keeping process documentation current and supporting customers when they need help.",
    points: ["Processes documented", "Customer questions answered", "Knowledge shared with the team"],
    tools: ["Confluence", "Intercom"],
  },
];

// Slide 07: case studies. "Demonstration" = a sample scenario with fictional data.
export type CaseStudy = {
  id: string;
  title: string;
  label: string;
  summary: string;
  problem: string;
  approach: string[];
  outcome: string;
  tools: string[];
  sample?: { caption: string; columns: string[]; rows: string[][] };
};

export const caseStudies: CaseStudy[] = [
  {
    id: "billing",
    title: "Billing & Invoicing",
    label: "Demonstration",
    summary: "A structured monthly invoicing and payment-tracking routine for a recurring-client business.",
    problem: "Invoices are created ad hoc, due dates are missed and nobody has one view of what is outstanding.",
    approach: [
      "One billing tracker: invoice number, client, issue and due dates, amount and status",
      "A fixed monthly cycle for preparing, checking and sending invoices",
      "Weekly review of overdue items with follow-up notes",
    ],
    outcome: "Shows how a consistent billing routine makes outstanding balances visible and follow-ups predictable.",
    tools: ["Stripe", "HoneyBook", "Spreadsheets"],
    sample: {
      caption: "Sample billing tracker (fictional data)",
      columns: ["Invoice", "Client", "Due", "Amount", "Status"],
      rows: [
        ["INV-2041", "Client A", "05 Nov", "1,250.00", "Paid"],
        ["INV-2042", "Client B", "10 Nov", "860.00", "Overdue"],
        ["INV-2043", "Client C", "15 Nov", "2,100.00", "Sent"],
      ],
    },
  },
  {
    id: "crm",
    title: "CRM Management",
    label: "Client projects",
    summary: "Work across client CRM projects: setting up workflows, automating processes and organising client information.",
    problem: "Routine steps were handled by hand and client information was kept in ways that slowed day-to-day operations.",
    approach: [
      "Set up workflows in the CRM for the client's real process",
      "Automated repetitive steps and streamlined the processes around them",
      "Organised client records so the team works from one source",
    ],
    outcome: "Helped the businesses run smoother day-to-day operations with less manual work.",
    tools: ["HubSpot", "Zoho CRM", "GoHighLevel"],
  },
  {
    id: "automation",
    title: "Business Automation",
    label: "Demonstration",
    summary: "Finding repetitive manual steps in admin and billing work and replacing them with simple automations.",
    problem: "The same data is typed into several places, which causes delays and errors.",
    approach: [
      "Map the current process step by step",
      "Remove duplicate steps and introduce templates",
      "Automate hand-offs between CRM, billing and project tools",
    ],
    outcome: "Shows a practical approach to making routine operations simpler and less error-prone.",
    tools: ["HubSpot", "Retool", "Baserow"],
  },
  {
    id: "onboarding",
    title: "Client Onboarding",
    label: "Demonstration",
    summary: "A repeatable checklist that takes a new client from signed agreement to first invoice.",
    problem: "Each new client is set up differently, so details go missing and the first invoice is delayed.",
    approach: [
      "One onboarding checklist shared by sales, operations and accounts",
      "Client record, billing details and project space created together",
      "A welcome update with next steps and contacts",
    ],
    outcome: "Shows how a shared checklist gives every client the same complete start.",
    tools: ["HubSpot", "Dubsado", "Confluence"],
    sample: {
      caption: "Sample onboarding checklist (fictional client)",
      columns: ["Step", "Owner", "Status"],
      rows: [
        ["Client record created", "Operations", "Done"],
        ["Billing details verified", "Accounts", "Done"],
        ["Project space set up", "Operations", "In progress"],
        ["Welcome update sent", "Operations", "To do"],
      ],
    },
  },
  {
    id: "coordination",
    title: "Project Coordination",
    label: "Demonstration",
    summary: "Keeping a client project visible to everyone: tasks, status and decisions in one place.",
    problem: "Updates are scattered across chats and emails, so the client and the team see different pictures.",
    approach: [
      "Track tasks and owners on one project board",
      "Record decisions and processes in shared documentation",
      "Send the client a short, regular status update",
    ],
    outcome: "Shows how one source of truth keeps clients informed and hand-offs clean.",
    tools: ["Jira", "Confluence", "Intercom"],
  },
  {
    id: "finance-data",
    title: "Financial Data Organization",
    label: "Demonstration",
    summary: "Monthly financial summaries built from well-structured spreadsheets with simple checks.",
    problem: "Figures are spread across files, and the monthly summary takes days of manual copying.",
    approach: [
      "One structure for transactions and expenses, by category",
      "Verification checks before figures reach a report",
      "A summary tab that rolls up the month automatically",
    ],
    outcome: "Shows how organised data and simple checks make monthly reporting faster and more reliable.",
    tools: ["Spreadsheets", "Baserow"],
    sample: {
      caption: "Sample monthly summary (fictional figures)",
      columns: ["Category", "Oct", "Nov", "Change"],
      rows: [
        ["Revenue billed", "18,400", "19,250", "+4.6%"],
        ["Collected", "16,900", "18,100", "+7.1%"],
        ["Expenses", "7,300", "7,050", "−3.4%"],
      ],
    },
  },
];
