/**
 * FICTIONAL sample data for the accounting demonstrations and the dashboard.
 * "Northwind Studio" is an invented business; no figure here is real.
 */

export const SAMPLE_COMPANY = "Northwind Studio (fictional)";

export type Txn = { date: string; description: string; category: string; debit: number; credit: number };

/** Opening balance + a month of transactions for the spreadsheet demo. */
export const OPENING_BALANCE = 12500;
export const transactions: Txn[] = [
  { date: "01 Nov", description: "Client A, website retainer", category: "Revenue", debit: 0, credit: 4200 },
  { date: "03 Nov", description: "Office rent", category: "Rent", debit: 1800, credit: 0 },
  { date: "06 Nov", description: "Client B, invoice INV-2042", category: "Revenue", debit: 0, credit: 2650 },
  { date: "09 Nov", description: "Software subscriptions", category: "Software", debit: 420, credit: 0 },
  { date: "14 Nov", description: "Contractor payment", category: "Contractors", debit: 1350, credit: 0 },
  { date: "18 Nov", description: "Client C, milestone 2", category: "Revenue", debit: 0, credit: 3100 },
  { date: "22 Nov", description: "Utilities", category: "Utilities", debit: 260, credit: 0 },
  { date: "28 Nov", description: "Bank charges", category: "Bank fees", debit: 35, credit: 0 },
];

/** Income vs expenses demo. */
export const incomeLines = [
  { label: "Service revenue", amount: 9950 },
  { label: "Maintenance plans", amount: 1800 },
  { label: "Consulting", amount: 750 },
];
export const expenseLines = [
  { label: "Salaries & contractors", amount: 5200 },
  { label: "Rent & utilities", amount: 2060 },
  { label: "Software", amount: 420 },
  { label: "Marketing", amount: 600 },
];

/** Invoice demo. */
export const invoiceSample = {
  number: "INV-2044",
  client: "Client D (fictional)",
  issued: "01 Dec",
  due: "15 Dec",
  taxRate: 5,
  lines: [
    { item: "Monthly bookkeeping", qty: 1, rate: 650 },
    { item: "Invoice processing (per batch)", qty: 3, rate: 120 },
    { item: "CRM data cleanup (hours)", qty: 6, rate: 45 },
  ],
};

/** Bank reconciliation demo: bank statement vs the company's ledger. */
export const reconciliation = {
  statementBalance: 18740,
  ledgerBalance: 18165,
  bank: [
    { id: "b1", date: "06 Nov", description: "Deposit, Client B", amount: 2650 },
    { id: "b2", date: "14 Nov", description: "Transfer, contractor", amount: -1350 },
    { id: "b3", date: "18 Nov", description: "Deposit, Client C", amount: 3100 },
    { id: "b4", date: "28 Nov", description: "Bank charges", amount: -35 },
  ],
  ledger: [
    { id: "l1", date: "06 Nov", description: "Receipt, Client B", amount: 2650, match: "b1" },
    { id: "l2", date: "14 Nov", description: "Contractor payment", amount: -1350, match: "b2" },
    { id: "l3", date: "18 Nov", description: "Receipt, Client C", amount: 3100, match: "b3" },
    { id: "l4", date: "29 Nov", description: "Cheque #1027, supplier", amount: -610, match: null },
  ],
};

/** Dashboard: twelve months of fictional figures. */
export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthlyIncome = [14200, 13800, 15600, 16100, 15200, 17400, 18100, 17600, 18900, 19400, 19250, 21300];
export const monthlyExpenses = [9800, 9600, 10400, 10900, 10300, 11200, 11800, 11500, 12100, 12300, 12050, 13100];
/** Cash in the bank at month end (opening 12,500 + collections − payments, with timing differences). */
export const monthlyCash = [16100, 19700, 24300, 28900, 33400, 38800, 44600, 50200, 56300, 62700, 69100, 76400];

export const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
export const money = (n: number, d = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
