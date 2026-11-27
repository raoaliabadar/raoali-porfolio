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
  /** Every address Ali uses; the first is the main one (copy button, contact form). */
  emails: ["raoalibadar6@gmail.com", "arao69682@gmail.com"],
  /** Shown as written; `tel` is the international form used for the call link. */
  phones: [
    { label: "0318 0641366", tel: "+923180641366" },
    { label: "0325 3839542", tel: "+923253839542" },
  ],
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
  { id: "contact", n: "09", label: "Contact", title: "Let's Connect." },
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
  /**
   * Each area opens as a document. `details` describe what the work involves, drafted from the
   * headings at Ali's request (no numbers, clients or results claimed). Tools come from `tools` below.
   * Ali to review the wording.
   */
  areas: [
    { title: "Invoice preparation & management", text: "Accurate invoices, issued on time and tracked to payment.", icon: "invoice",
      details: {
        summary: "Preparing invoices from the agreed scope and rates, checking them before they go out, and keeping track of each one until it is paid.",
        covers: ["Drafting invoices from the project scope, rates and billing terms","Checking client details, line items, amounts and due dates before sending","Issuing invoices and keeping a clear record of what was sent and when","Tracking each invoice from sent to paid"],
        tools: ["Stripe","HoneyBook","Dubsado","Microsoft Excel"],
      },
    },
    { title: "Billing & payment tracking", text: "Monitoring what's billed, paid and outstanding.", icon: "wallet",
      details: {
        summary: "Keeping a clear picture of what has been billed, what has been paid and what is still outstanding.",
        covers: ["Recording payments against the right invoices","Keeping a list of outstanding and overdue balances","Flagging partial, failed or late payments early","Keeping billing status visible to the team"],
        tools: ["Stripe","HoneyBook","Dubsado","Microsoft Excel"],
      },
    },
    { title: "Financial record maintenance", text: "Organised, up-to-date records that are easy to review.", icon: "ledger",
      details: {
        summary: "Keeping financial records organised, consistent and current, so any figure can be found and reviewed quickly.",
        covers: ["Filing invoices, receipts and payment confirmations in one consistent structure","Updating records as transactions happen","Using clear names and categories so records are easy to search","Keeping records ready for review at any time"],
        tools: ["Microsoft Excel","Google Workspace","Baserow"],
      },
    },
    { title: "Transaction & expense tracking", text: "Recording and categorising transactions and expenses.", icon: "transfer",
      details: {
        summary: "Recording every transaction and expense and putting it in the right category, so it is clear where money comes from and goes.",
        covers: ["Logging incoming and outgoing transactions","Categorising expenses consistently","Keeping supporting documents with each entry","Keeping running totals by category and period"],
        tools: ["Microsoft Excel","Google Workspace","Stripe"],
      },
    },
    { title: "Data verification & accuracy", text: "Cross-checking figures before they reach a report.", icon: "check",
      details: {
        summary: "Checking figures against their sources before they are used in a report or sent to a client.",
        covers: ["Cross-checking totals against invoices, statements and source records","Spotting duplicates, missing entries and typing errors","Correcting issues and noting what was changed","Confirming the numbers before they reach a report"],
        tools: ["Microsoft Excel","Google Workspace"],
      },
    },
    { title: "Spreadsheet management", text: "Structured, well-maintained spreadsheets and trackers.", icon: "sheet",
      details: {
        summary: "Building and maintaining spreadsheets and trackers that stay structured and easy to use as the data grows.",
        covers: ["Setting up clear layouts, headers and consistent formats","Using formulas and checks to cut down manual work","Keeping trackers updated and tidy","Sharing sheets with the right access for the team"],
        tools: ["Microsoft Excel","Google Workspace"],
      },
    },
    { title: "Financial reporting support", text: "Preparing the data and summaries behind financial reports.", icon: "chart",
      details: {
        summary: "Preparing the data and summaries that financial reports are built on.",
        covers: ["Collecting figures from billing, payment and expense records","Organising the data into summaries by period or client","Preparing tables that are ready for reporting","Making sure the numbers match the underlying records"],
        tools: ["Microsoft Excel","Google Workspace","HubSpot"],
      },
    },
    { title: "Monthly billing operations", text: "Running recurring billing cycles reliably every month.", icon: "calendar",
      details: {
        summary: "Running the recurring billing cycle every month, so clients are invoiced on time and nothing is missed.",
        covers: ["Preparing the monthly list of clients to bill","Generating and sending the recurring invoices","Checking that subscriptions and recurring charges ran correctly","Closing the cycle with an updated billing record"],
        tools: ["Stripe","HoneyBook","Dubsado"],
      },
    },
    { title: "Follow-ups & reconciliation support", text: "Chasing overdue payments and helping match records to statements.", icon: "reconcile",
      details: {
        summary: "Following up on overdue payments and helping match internal records to statements.",
        covers: ["Sending polite reminders for overdue invoices","Keeping a log of follow-ups and client replies","Matching payments in the records to bank and payment statements","Flagging differences so they can be resolved"],
        tools: ["Stripe","Microsoft Excel","Google Workspace"],
      },
    },
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
  /** Cash at the start of the year (net cash flow = year-end cash − this). Fictional. */
  openingBalance: 12500,
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
/** Roles from Ali's CV, newest first. Wording as he gave it; no figures added. Company names are left off at Ali's request. */
export const experience: {
  role: string;
  company: string;
  period: string;
  location: string;
  summary: string;
  highlights: string[];
}[] = [
  {
    role: "Assistant Accountant",
    company: "",
    period: "Nov 2024 – Mar 2025",
    location: "Depalpur",
    summary: "",
    highlights: [
      "Assisted with the preparation of year-end accounts, working closely with accountants to compile financial statements.",
      "Gathered all banking transactions via statements, recorded activity in Excel and reconciled balances.",
      "Reviewed and reconciled the general ledger with high accuracy; posted financial data in Excel and managed inventory records.",
    ],
  },
  {
    role: "Financial Analyst",
    company: "",
    period: "Feb 2020 – Jun 2021",
    location: "",
    summary: "",
    highlights: [
      "Assisted in budget preparation, variance analysis and cost tracking to support project managers and the finance department.",
      "Coordinated with external auditors during annual audits, providing documentation and ensuring adherence to internal control procedures.",
      "Monitored project-related expenditures and issued client invoices based on project milestones and contracts, reducing payment delays.",
    ],
  },
];

/** The Experience section: Ali's CV summary, education and skills (his wording). */
export const career = {
  summary:
    "Finance professional with experience in managing accounts payable and receivable, reconciling bank statements, and preparing financial reports. Skilled in using accounting software, maintaining accurate records, and supporting month-end closing processes. Strong analytical skills, ensuring compliance with financial regulations and company policies.",
  education: [
    { title: "Associate Degree in Accounting & Finance", school: "Government College University Faisalabad", period: "2022 – 2024" },
    { title: "FSc", school: "Superior College, Depalpur Campus", period: "2019 – 2021" },
    { title: "Matriculation", school: "Allied School, Depalpur Campus", period: "2019" },
  ],
  skills: [
    "Inventory Accounting",
    "Regulatory Compliance",
    "Cash Flow Management",
    "Financial Statement Analysis",
    "Data Collection & Sampling",
    "Data Entry",
    "Professional Judgement",
    "Expense Reports",
    "Bank Reconciliation",
    "General Ledger",
    "Microsoft Excel (Advanced)",
  ],
} as const;

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
/* DESK: the books and the paper on the hero drawing                    */
/* ------------------------------------------------------------------ */
/**
 * The books on the desk (from the old site): generic subject titles, not real published books,
 * each with short study notes. Click the books in the hero to read them.
 */
export const desk = {
  books: [
    {
      title: "Financial Accounting",
      subtitle: "Principles & Practice",
      color: "#14271f",
      ink: "#d6b37f",
      notes: [
        "The accounting equation: Assets = Liabilities + Equity, and every transaction keeps it in balance.",
        "Double entry: each transaction is recorded with equal debits and credits.",
        "Accrual basis: revenue is recorded when earned and expenses when incurred, not when cash moves.",
        "The core statements are the income statement, the balance sheet and the cash flow statement.",
        "A trial balance checks that total debits equal total credits before the statements are prepared.",
      ],
    },
    {
      title: "Bookkeeping Essentials",
      subtitle: "Journals, Ledgers & Reconciliation",
      color: "#6b2e2a",
      ink: "#f1d9a8",
      notes: [
        "Debits increase assets and expenses; credits increase liabilities, equity and income.",
        "The flow of records: source document → journal → general ledger → trial balance.",
        "Reconcile the bank account every month so the books match the bank statement.",
        "Keep invoices and receipts as evidence for every entry you post.",
        "Close each period: post adjustments, review balances, then lock the month.",
      ],
    },
    {
      title: "Cost Accounting",
      subtitle: "Costing, Budgets & Variances",
      color: "#56705c",
      ink: "#f4f1e9",
      notes: [
        "Fixed costs stay the same as volume changes; variable costs rise and fall with it.",
        "Contribution margin = sales − variable costs.",
        "Break-even point (units) = fixed costs ÷ contribution per unit.",
        "A variance is actual minus budget; investigate the large or unexpected ones.",
        "Overheads are allocated to products or services using a cost driver, such as labour hours.",
      ],
    },
    {
      title: "Taxation Basics",
      subtitle: "Records, Filing & Deadlines",
      color: "#2f3a45",
      ink: "#e2c690",
      notes: [
        "Keep complete records of income and allowable expenses for the whole year.",
        "Sales tax collected from customers is a liability until it is paid to the tax authority.",
        "Tax withheld at source is usually credited against the final tax due.",
        "Missing a filing deadline normally means penalties, so keep a calendar of due dates.",
        "Rules differ by country and change often: always check the current local law.",
      ],
    },
    {
      title: "Auditing",
      subtitle: "Controls, Evidence & Assurance",
      color: "#e6dfcf",
      ink: "#14271f",
      notes: [
        "Good internal controls include segregation of duties, approvals and regular reconciliations.",
        "Audit evidence must be sufficient (enough of it) and appropriate (relevant and reliable).",
        "Materiality: misstatements matter when they could change a reader's decisions.",
        "Sampling tests a selection of items to draw conclusions about the whole population.",
        "A clear audit trail links every figure in the reports back to its source document.",
      ],
    },
    {
      title: "CRM Operations",
      subtitle: "Pipelines, Data & Automation",
      color: "#4a3a2c",
      ink: "#e9c98f",
      notes: [
        "Keep one record per client and merge duplicates regularly.",
        "Define clear pipeline stages so every deal has a status and a next step.",
        "Automate routine follow-ups, reminders and hand-offs between teams.",
        "Use consistent, required fields so reports and filters can be trusted.",
        "Track conversion rates and response times to see where deals stall.",
      ],
    },
    {
      title: "Financial Statements",
      subtitle: "Reading the Numbers",
      color: "#1f3550",
      ink: "#e8cf9c",
      notes: [
        "Income statement: revenue − expenses = profit or loss for a period.",
        "Balance sheet: what the business owns and owes at a single point in time.",
        "Cash flow statement: cash from operating, investing and financing activities.",
        "Gross margin = (revenue − cost of sales) ÷ revenue.",
        "Current ratio = current assets ÷ current liabilities, a quick check of short-term liquidity.",
      ],
    },
    {
      title: "Excel for Accountants",
      subtitle: "Formulas, Pivots & Checks",
      color: "#1d5b3c",
      ink: "#f4f1e9",
      notes: [
        "SUMIFS totals amounts by category, period or client in one formula.",
        "XLOOKUP (or VLOOKUP) matches records between two lists, such as invoices and payments.",
        "Pivot tables summarise thousands of rows by month, category or customer in seconds.",
        "Data validation keeps entries consistent, for example a fixed list of categories.",
        "Conditional formatting flags overdue items, negative balances and duplicates.",
      ],
    },
  ],
  note: {
    title: "A sheet of paper",
    hint: "Write anything. It stays in this browser only; nothing is sent anywhere.",
    placeholder: "Write something…",
  },
  lamp: { on: "Turn the desk lamp on", off: "Turn the desk lamp off", onNote: "Desk lamp on", offNote: "Desk lamp off" },
  /** The nav switch: the site's day / night theme (the desk lamp is separate). */
  theme: { toNight: "Switch to night mode", toDay: "Switch to day mode", night: "Night", day: "Day" },
  drawers: ["Bottom drawer", "Middle drawer", "Top drawer"],
  car: "Toy car: drag it along the desk, or tap it",
  hint: "Click the lamp, the screen, the keys, the drawers or the car",
} as const;

/* ------------------------------------------------------------------ */
/* The desk computer (hero monitor). Figures are the dashboard's        */
/* fictional sample; nothing here is real client data.                 */
/* ------------------------------------------------------------------ */
export const computer = {
  title: "The desk computer",
  open: "Open the computer",
  apps: {
    dashboard: "Accounting Dashboard",
    reports: "Financial Reports",
    flows: "Income & Expenses",
    balance: "Balance Sheet",
    transactions: "Transaction History",
    calculator: "Calculator",
    documents: "Documents",
    notes: "Notes",
  },
  sample: "Sample data",
  typing: "Typing from the desk keyboard · Esc to stop",
  desktop: "Desktop",
  notesPlaceholder: "Type here, on the desk keyboard below or on your own keyboard…",
  notesHint: "Saved in this browser only.",
  searchPlaceholder: "Search transactions",
  balanceNote:
    "Built from the fictional sample: cash is the year-end bank balance, and receivables are the year's profit not yet collected in cash.",
  periods: ["Full year", "Q1", "Q2", "Q3", "Q4"],
  folders: { areas: "Accounting file", books: "Reference books" },
} as const;

/* ------------------------------------------------------------------ */
/* [09] CONTACT + FOOTER                                               */
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
