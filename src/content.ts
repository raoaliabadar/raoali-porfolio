/**
 * THE LEDGER BLUEPRINT: every word on the site comes from this file.
 *
 * Source: the existing site on this branch (lib/content.ts, lib/slides.ts, lib/sample-data.ts
 * and the copy written directly in components/slides/*). Nothing here is new: text is copied
 * as it was, or shortened for a headline with the same meaning.
 *
 * Rules:
 *  - `// TODO: Ali to provide` marks information that does not exist yet. Sections that need it
 *    are hidden until it is filled in; they never show placeholder or invented data.
 *  - `fictional: true` marks demo data that the old site already labelled as invented.
 *    It must always be shown with that label, never as real results.
 */

/* ------------------------------------------------------------------ */
/* [00] IDENTITY                                                       */
/* ------------------------------------------------------------------ */
export const identity = {
  name: "Rao Ali Badar",
  shortName: "Rao Ali",
  initials: "RA",
  /** The role line under the name (old hero kicker). */
  role: "Accounting & Finance · CRM Operations",
  title: "Accountant & CRM Specialist",
  email: "raoalibadar6@gmail.com",
  location: "Pakistan",
  timezone: "Asia/Karachi",
  availability: "Open to full-time, part-time & remote roles",
  url: "https://raoali-porfolio.vercel.app",
  resumeUrl: "", // TODO: Ali to provide (e.g. "/resume.pdf"). Empty = no resume button.
  portrait: { src: "/portrait.jpg", alt: "Portrait of Rao Ali Badar" },
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rao-ali-badar-051594355/" },
    { label: "Instagram", href: "https://www.instagram.com/raoali.31/" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Section index: numbers, nav labels and titles (from the old slides) */
/* ------------------------------------------------------------------ */
export const sections = [
  { id: "hero", n: "01", label: "Workspace", title: "The Accountant's Workspace" },
  { id: "about", n: "02", label: "About", title: "Behind the Numbers" },
  { id: "accounting", n: "03", label: "Accounting", title: "Understanding the Numbers" },
  { id: "workflow", n: "04", label: "Workflow", title: "Business Operations in Action" },
  { id: "dashboard", n: "05", label: "Dashboard", title: "Numbers in Motion" },
  { id: "tools", n: "06", label: "Tools", title: "The Tools Behind My Work" },
  { id: "experience", n: "07", label: "Experience", title: "Experience" },
  { id: "projects", n: "08", label: "Projects", title: "Knowledge Put Into Practice" },
  { id: "ask", n: "09", label: "Ask", title: "Ask My AI" },
  { id: "contact", n: "10", label: "Contact", title: "Let's Connect." },
] as const;

/* ------------------------------------------------------------------ */
/* [01] HERO                                                           */
/* ------------------------------------------------------------------ */
export const hero = {
  name: "Rao Ali Badar",
  role: "Accounting & Finance · CRM Operations",
  intro:
    "I look after business operations at a software house: accurate billing, payments and client records, and the CRM workflows behind every client project.",
  status: "Open to new opportunities",
  ctas: [
    { label: "Explore My Journey", href: "#about", kind: "primary" },
    { label: "View My Work", href: "#projects", kind: "secondary" },
  ],
  /** Callouts on the workspace drawing: each one is an accounting area from this file. */
  annotations: [
    { target: "monitor", code: "A", label: "Financial reporting support" },
    { target: "books", code: "B", label: "Financial record maintenance" },
    { target: "documents", code: "C", label: "Invoice preparation & management" },
    { target: "lamp", code: "D", label: "Data verification & accuracy" },
  ],
  /** Terminal lines for the preloader (UI text, not claims). */
  loadingLog: ["LOADING LEDGER…", "RECONCILING…", "SYNCING CRM…", "READY"],
} as const;

/* ------------------------------------------------------------------ */
/* [02] ABOUT                                                          */
/* ------------------------------------------------------------------ */
export const about = {
  headline: "I keep the numbers accurate and the records organised.",
  /** Word-by-word scrub paragraph. */
  intro:
    "I come from an academic background in Accounting & Finance and work in a software house, where I look after the business operations around client projects.",
  body: [
    "My day-to-day covers billing and invoicing, payment tracking, CRM operations and client data, client onboarding, and coordinating projects between clients and the team.",
    "I'm most interested in the point where financial operations meet technology: accurate records, clear reporting and tools that take manual work away.",
  ],
  interest: "Where financial operations meet technology",
  /** "Currently" marquee: Ali's own focus list. */
  currently: ["Financial operations", "Billing & invoicing", "CRM & client data", "Client & project coordination"],
  facts: [
    { label: "Focus", value: "Accounting & CRM operations" },
    { label: "Strength", value: "Data accuracy & reporting" },
    { label: "Work style", value: "Detail-oriented, process-driven" },
    { label: "Based in", value: "Pakistan" },
  ],
  education: {
    field: "Accounting & Finance",
    degree: "", // TODO: Ali to provide
    institution: "", // TODO: Ali to provide
    years: "", // TODO: Ali to provide
  },
  current: {
    setting: "Software house",
    role: "", // TODO: Ali to provide
    company: "", // TODO: Ali to provide
    period: "Current",
  },
  howIWork: [
    "Detail-oriented and process-driven",
    "Accurate data behind every report",
    "Clear communication with clients and teams",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* [03] ACCOUNTING: bordered columns [01]–[09]                         */
/* ------------------------------------------------------------------ */
export const accounting = {
  headline: "Financial operations, done carefully.",
  intro:
    "The day-to-day work that keeps money moving correctly: preparing invoices, following up on payments and supporting reconciliation.",
  areas: [
    { title: "Invoice preparation & management", text: "Accurate invoices, issued on time and tracked to payment.", icon: "invoice" },
    { title: "Billing & payment tracking", text: "Monitoring what's billed, paid and outstanding.", icon: "wallet" },
    { title: "Financial record maintenance", text: "Organised, up-to-date records that are easy to review.", icon: "ledger" },
    { title: "Transaction & expense tracking", text: "Recording and categorising transactions and expenses.", icon: "transfer" },
    { title: "Data verification & accuracy", text: "Cross-checking figures before they reach a report.", icon: "check" },
    { title: "Spreadsheet management", text: "Structured, well-maintained spreadsheets and trackers.", icon: "sheet" },
    { title: "Financial reporting support", text: "Preparing the data and summaries behind financial reports.", icon: "chart" },
    { title: "Monthly billing operations", text: "Running recurring billing cycles reliably every month.", icon: "calendar" },
    { title: "Follow-ups & reconciliation support", text: "Chasing overdue payments and helping match records to statements.", icon: "reconcile" },
  ],
  /** The broader service list (old "Services" deck). */
  services: [
    { title: "Invoicing & Billing", text: "Preparing accurate invoices, running monthly billing cycles and keeping every charge traceable.", tags: ["Invoices", "Monthly billing", "Follow-ups"] },
    { title: "Financial Records", text: "Maintaining organised financial records, transactions and expenses, verified and easy to audit.", tags: ["Records", "Transactions", "Expenses"] },
    { title: "CRM & Automation", text: "Setting up CRM workflows and automating business processes so teams spend less time on manual work.", tags: ["Workflows", "Automation", "Configuration"] },
    { title: "Customer Data", text: "Managing client records and communication history so every team works from the same accurate data.", tags: ["Client records", "Cleanup", "Communication"] },
    { title: "Reporting", text: "Turning spreadsheets and CRM data into clear reports, and tidying the processes behind them.", tags: ["Reports", "Spreadsheets", "Process improvement"] },
  ],
  skills: {
    accounting: ["Invoice management", "Billing operations", "Financial data management", "Spreadsheet management", "Payment tracking", "Reporting support"],
    crm: ["CRM administration", "Customer data management", "Workflow management", "Business process automation", "Customer relationship management", "Data organization", "Process improvement"],
  },
} as const;

/* ------------------------------------------------------------------ */
/* [--] STATEMENT: one line of Ali's own text                          */
/* ------------------------------------------------------------------ */
export const statement = {
  line: "I keep the numbers accurate and the customer records organised.",
  // From: "I keep the numbers accurate and the customer records organised, so businesses can bill on time and serve clients better."
} as const;

/* ------------------------------------------------------------------ */
/* [04] WORKFLOW: the operations Ali handles, in order                 */
/* ------------------------------------------------------------------ */
export const workflow = {
  steps: [
    { id: "onboarding", title: "Client onboarding", text: "Setting new clients up in the CRM and billing tools with complete, accurate details.", points: ["New client records created", "Billing details captured", "Client information organised"], tools: ["HubSpot", "GoHighLevel", "HoneyBook"] },
    { id: "crm", title: "CRM operations", text: "Setting up workflows, automating business processes and organising client information.", points: ["Workflows configured", "Routine steps automated", "Pipelines kept current"], tools: ["HubSpot", "GoHighLevel"] },
    { id: "data", title: "Client & customer data", text: "Creating, updating and maintaining complete client profiles, and keeping records clean and consistent.", points: ["Profiles kept complete", "Duplicates and errors fixed", "Interaction history logged"], tools: ["HubSpot", "Baserow"] },
    { id: "coordination", title: "Project coordination", text: "Keeping client projects moving between the client and the team, with tasks and status tracked in one place.", points: ["Tasks and status tracked", "Client updates shared", "Hand-offs documented"], tools: ["Jira", "Confluence"] },
    { id: "billing", title: "Billing & invoicing", text: "Preparing accurate invoices, running monthly billing cycles and keeping every charge traceable.", points: ["Invoices prepared and issued", "Monthly billing cycle", "Charges traceable"], tools: ["Stripe", "HoneyBook", "Dubsado"] },
    { id: "payments", title: "Payment tracking", text: "Monitoring what's billed, paid and outstanding, and following up on overdue payments.", points: ["Billed vs paid tracked", "Overdue items followed up", "Records matched to payments"], tools: ["Stripe", "Spreadsheets"] },
    { id: "docs", title: "Documentation & support", text: "Keeping process documentation current and supporting customers when they need help.", points: ["Processes documented", "Customer questions answered", "Knowledge shared with the team"], tools: ["Confluence", "Intercom"] },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* [05] DASHBOARD                                                      */
/* ------------------------------------------------------------------ */
/**
 * There are NO real financial figures in the codebase. The old dashboard used invented data
 * for a fictional business, labelled as such. Keep `fictional: true` visible on the page, or
 * replace with real, shareable figures.  // TODO: Ali to provide (or confirm the demo is OK)
 */
export const dashboard = {
  fictional: true,
  company: "Northwind Studio (fictional)",
  note: "Figures are invented for demonstration.",
  kpiLabels: ["Total revenue", "Total expenses", "Net profit", "Net cash flow"],
  charts: { bars: "Income vs expenses", line: "Monthly performance (net profit)" },
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  income: [14200, 13800, 15600, 16100, 15200, 17400, 18100, 17600, 18900, 19400, 19250, 21300],
  expenses: [9800, 9600, 10400, 10900, 10300, 11200, 11800, 11500, 12100, 12300, 12050, 13100],
  cash: [16100, 19700, 24300, 28900, 33400, 38800, 44600, 50200, 56300, 62700, 69100, 76400],
  /** Sample ledger rows that slide in (from the old spreadsheet demo, fictional). */
  rows: [
    { date: "01 Nov", description: "Client A, website retainer", category: "Revenue", debit: 0, credit: 4200 },
    { date: "03 Nov", description: "Office rent", category: "Rent", debit: 1800, credit: 0 },
    { date: "06 Nov", description: "Client B, invoice INV-2042", category: "Revenue", debit: 0, credit: 2650 },
    { date: "09 Nov", description: "Software subscriptions", category: "Software", debit: 420, credit: 0 },
    { date: "14 Nov", description: "Contractor payment", category: "Contractors", debit: 1350, credit: 0 },
    { date: "18 Nov", description: "Client C, milestone 2", category: "Revenue", debit: 0, credit: 3100 },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* [06] TOOLS: Ali's exact list                                        */
/* ------------------------------------------------------------------ */
export const tools = {
  intro:
    "Hands-on experience working with Stripe, Baserow, Intercom, Jira, Confluence, HoneyBook, HubSpot, GoHighLevel, Dubsado, and Auth0 for customer support, CRM management, workflow automation, project management, billing, and platform administration.",
  items: [
    { name: "HubSpot", group: "CRM", use: "CRM records, pipelines and workflow automation" },
    { name: "GoHighLevel", group: "CRM", use: "CRM management and workflow automation" },
    { name: "Zoho CRM", group: "CRM", use: "Client data and workflow automation" },
    { name: "Stripe", group: "Billing", use: "Payments, invoices and subscription billing" },
    { name: "HoneyBook", group: "Billing", use: "Client management, proposals and invoicing" },
    { name: "Dubsado", group: "Billing", use: "Client management and billing" },
    { name: "Intercom", group: "Client ops", use: "Customer support conversations" },
    { name: "Slack", group: "Client ops", use: "Team communication and client hand-offs" },
    { name: "Jira", group: "Projects", use: "Project and task tracking" },
    { name: "Confluence", group: "Projects", use: "Project documentation and processes" },
    { name: "Trello", group: "Projects", use: "Task boards and project tracking" },
    { name: "Baserow", group: "Workflows", use: "Structured business data and administration" },
    { name: "Retool", group: "Workflows", use: "Internal tools and admin panels" },
    { name: "Auth0", group: "Workflows", use: "User access and platform administration" },
    { name: "Microsoft Excel", group: "Workflows", use: "Spreadsheets, records and reports" },
    { name: "Google Workspace", group: "Workflows", use: "Shared documents, sheets and email" },
  ],
} as const;

/* ------------------------------------------------------------------ */
/* [07] EXPERIENCE                                                     */
/* ------------------------------------------------------------------ */
/**
 * No roles, companies or dates exist in the codebase, so the timeline is HIDDEN until filled.
 * TODO: Ali to provide, newest first, e.g.
 *   { role: "", company: "", period: "", location: "", summary: "", highlights: [] }
 */
export const experience: {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
}[] = [];

/* ------------------------------------------------------------------ */
/* [08] PROJECTS                                                       */
/* ------------------------------------------------------------------ */
/**
 * "Client projects" = real work. "Demonstration" = a sample scenario (the old site said so);
 * the label must stay visible. No project images exist.  // TODO: Ali to provide images (optional)
 */
export const projects = [
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
  },
] as const;

/* ------------------------------------------------------------------ */
/* [09] ASK MY AI                                                      */
/* ------------------------------------------------------------------ */
export const ask = {
  fallback: "Please contact Ali directly",
  /** Chips: one per section title. Answers come only from this file. */
  chips: [
    "What does Ali do in accounting?",
    "What is Ali's background?",
    "Which tools has Ali used?",
    "What does Ali's workflow look like?",
    "What projects has Ali worked on?",
    "How can I contact Ali?",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* [10] CONTACT + FOOTER                                               */
/* ------------------------------------------------------------------ */
export const contact = {
  title: "Let's Connect.",
  headline: "Let's keep your numbers in order.",
  text: "Looking for someone reliable for accounting operations, billing or CRM management? I'd be glad to hear about the role. I usually reply within a day.",
  email: identity.email,
  socials: identity.socials,
  location: identity.location,
  timezone: identity.timezone,
  form: {
    messagePlaceholder: "A few lines about the role or project",
    hint: "Opens your email app with the message filled in.",
    error: "Please add your name, a valid email and a short message.",
  },
} as const;
