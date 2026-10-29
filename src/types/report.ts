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
  customText?: Record<string, Section[]>;
  customAmount?: Record<string, CustomAmountValue>;
  /** frequency가 "optional"인 커스텀 항목 중, 오늘 "+ 추가"로 펼쳐둔 것의 id 목록. */
  customRevealed?: string[];
}

export interface ReasonEntry {
  id: string;
  from?: string;
  type: string;
  text: string;
  side: "retail" | "pos";
  /** side 쪽이 amount만큼 더 많으면 1, 더 적으면 -1. 기존 데이터는 없으면 1(더 많음)로 본다. */
  sign?: 1 | -1;
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
  phoneInsights: Section[];
  plans: Section[];
  note: string;
  ctx?: ContextState;
  customText?: Record<string, Section[]>;
  customAmount?: Record<string, CustomAmountValue>;
  /** frequency가 "optional"인 커스텀 항목 중, 오늘 "+ 추가"로 펼쳐둔 것의 id 목록. */
  customRevealed?: string[];
}

export interface Section {
  t: string;
  b: string[];
  /** false면 번호 없이(제목만) 넣는다. 없으면(undefined) 번호 매김 — 기존 데이터와 호환. */
  numbered?: boolean;
}

/** 보고서에 사용자가 직접 추가하는 커스텀 섹션 — 설정 탭에서 정의. */
export type CustomSectionType = "sections" | "amount";
export type CustomAppliesTo = "open" | "close" | "both";
/** "daily"(기본값)면 매일 보고서에 자동으로 나타나고, "optional"이면 "+ 추가"를 눌러야 그날만 나타난다. */
export type CustomFrequency = "daily" | "optional";

export interface CustomSectionDef {
  id: string;
  label: string;
  appliesTo: CustomAppliesTo;
  type: CustomSectionType;
  /** type==="amount"일 때만: 전체 예산(원). 예: 세일즈 활용 금액 150,000원 */
  totalBudget?: number;
  /** 없으면(undefined) "daily"로 본다 — 기존 데이터와 호환. */
  frequency?: CustomFrequency;
}

export interface CustomAmountValue {
  amount: number;
  note: string;
}

/** 보고서 작성 중 자주 쓰는 틀. {품목}처럼 중괄호 안이 값을 넣는 변수. */
export interface Snippet {
  id: string;
  label: string;
  template: string;
  /** 어느 칸에서 보일지. 비어있거나 없으면 모든 칸에서 보임. id는 SNIPPET_LOCATIONS 참고. */
  locations?: string[];
  /** 넣을 때 맨 위(top)에 둘지 맨 아래(bottom)에 둘지. 없으면 맨 아래. */
  position?: "top" | "bottom";
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
  issues: string;
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
  customSections?: CustomSectionDef[];
  snippets?: Snippet[];
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
