/**
 * The books on the desk: the 3D covers and spines are drawn from this, and clicking a book opens
 * its notes. Generic subject titles (not real published books) with short, accurate study notes.
 */
export type DeskBook = {
  title: string;
  subtitle: string;
  /** Cloth colour of the cover. */
  color: string;
  /** Lettering / ornament colour. */
  ink: string;
  notes: string[];
};

export const DESK_BOOKS: DeskBook[] = [
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
];

/** The first six stand in a row between bookends; the last two stand on display, covers out. */
export const ROW_BOOKS = 6;
