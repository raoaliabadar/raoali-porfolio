import {
  ArrowLeftRight,
  BookOpenCheck,
  CalendarClock,
  ChartColumn,
  Contact,
  FileSpreadsheet,
  HandCoins,
  Headset,
  Layers,
  MessagesSquare,
  ReceiptText,
  SearchCheck,
  Settings2,
  ShieldCheck,
  Target,
  UsersRound,
  Wallet,
  Workflow,
  type LucideProps,
} from "lucide-react";

const map = {
  receipt: ReceiptText,
  ledger: BookOpenCheck,
  settings: Settings2,
  users: UsersRound,
  chart: ChartColumn,
  contact: Contact,
  search: SearchCheck,
  messages: MessagesSquare,
  target: Target,
  workflow: Workflow,
  headset: Headset,
  wallet: Wallet,
  transfer: ArrowLeftRight,
  shield: ShieldCheck,
  spreadsheet: FileSpreadsheet,
  calendar: CalendarClock,
  coins: HandCoins,
  layers: Layers,
};

export type IconName = keyof typeof map;

/** Named icon used by content.ts so content never imports lucide directly. */
export function Icon({ name, ...props }: { name: IconName } & LucideProps) {
  const Cmp = map[name];
  return <Cmp {...props} />;
}
