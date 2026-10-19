export interface ItemTarget {
  name: string;
  target: number;
  actual: number;
}

export interface OpenReport {
  date: string;
  prevConversion: string;
  prevSales: ItemTarget[];
  targetGMV: number;
  targetConversion: string;
  targetItems: ItemTarget[];
  comment: string;
  ctx?: ContextState;
}

export interface ReasonEntry {
  id: string;
  from?: string;
  type: string;
  text: string;
  side: "retail" | "pos";
  amount: number;
}

export interface InvCheckEntry {
  diff: number;
  reason: string;
  open?: boolean;
}

export interface CloseReport {
  date: string;
  dayTargetGMV: number;
  dayGMV: number;
  monthTargetGMV: number;
  monthGMV: number;
  items: ItemTarget[];
  traffic: number;
  visitors: number;
  conversion: string;
  attachRate: string;
  aov: string;
  inventoryNote: string;
  inv?: Record<string, InvCheckEntry>;
  retail: number;
  pos: number;
  reasons: ReasonEntry[];
  highlights: Section[];
  plans: Section[];
  note: string;
  ctx?: ContextState;
}

export interface Section {
  t: string;
  b: string[];
}

export interface ContextState {
  add: string[];
  off: string[];
  promo: string;
  item: string | null;
}

export interface VoteDiff {
  type: string;
  side: "retail" | "pos";
  amount: number;
}

export interface SalesRecord {
  id: string;
  time: string;
  cat: string;
  product: string;
  qty: number;
  gender: string;
  age: string;
  party: string;
  needs: string[];
  needMemo: string;
  actions: string[];
  memo: string;
  result: "buy" | "revisit" | "none";
  diff: VoteDiff | null;
  star: boolean;
}

export interface SalesCase {
  info?: string;
  need?: string;
  offer?: string;
  result?: string;
  comment?: string;
}

export interface ManualCase extends SalesCase {
  id: string;
}

export interface SummarySlot {
  who: string[];
  ctx: string[];
  purpose: string[];
  memo: string;
}

export interface SummaryForm {
  am: SummarySlot;
  pm: SummarySlot;
  strong: { cats: string[]; ask: string; result: string; memo: string };
}

export interface SalesManager {
  cases: Record<string, SalesCase>;
  manual: ManualCase[];
  summary: string | null;
  sumForm?: SummaryForm;
  plan: string;
  note: string;
}

export interface Retro {
  dayType: "work" | "off";
  mode: "kpt" | "star";
  mood: number;
  day: string;
  did: string;
  keep: string;
  problem: string;
  try: string;
  s: string;
  t: string;
  a: string;
  r: string;
  learn: string;
  triedPrev: Record<number, boolean>;
}

export interface ReportItemSetting {
  name: string;
  cat: string;
  wd?: number;
  we?: number;
}

export interface ReportDefaults {
  weekdayTarget: number;
  weekendTarget: number;
  targetConversion: string;
  monthTargets: Record<string, number>;
}

export interface ReportSettings {
  storeName: string;
  stores?: string[];
  items: ReportItemSetting[];
  inventoryNote: string;
  extraHolidays?: string;
  defaults?: ReportDefaults;
}

export interface LocalReportData {
  example: boolean;
  settings: ReportSettings;
  opens: Record<string, OpenReport>;
  closes: Record<string, CloseReport>;
  records: Record<string, SalesRecord[]>;
  managers: Record<string, SalesManager>;
  retros: Record<string, Retro>;
  favorites: string[];
}
