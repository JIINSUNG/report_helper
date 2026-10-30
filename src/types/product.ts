export interface CompetitorProduct {
  n: string;
  p: number | null;
  note?: string;
  pts?: string;
  b?: string;
  url?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  p: number | null;
  note?: string;
  spec: string;
  /** spec을 항목별로 나눈 표. 없으면 상세보기에서 spec 한 줄을 그대로 보여준다. */
  specTable?: { label: string; value: string }[];
  for: string;
  pitch: string;
  points: string[];
  weak: string;
  comps: CompetitorProduct[];
  link?: string | null;
}

export interface ProductGroup {
  id: string;
  label: string;
  cat: string;
  ask: string;
  tips: string[];
  upsell: string[];
  faq: { q: string; a: string }[];
  cross: string[];
  items: ProductItem[];
}

export interface MetricRow {
  n: string;
  v: number;
  x: boolean;
  sub: string;
  /** 대략적인 출시 연월(예: "2025.09"). 모르면 생략 — 참고용이라 공식 수치는 아님. */
  rel?: string;
}

export interface Metric {
  id: string;
  label: string;
  unit: string;
  desc: string;
  note: string;
  low?: boolean;
  rows: MetricRow[];
}

export interface OfficialRow {
  n: string;
  u: string;
  c: string;
  s: string;
  a: boolean;
}

export interface FeatureRow {
  n: string;
  /** 샤오미/레드미/포코(우리) 제품이면 true */
  x: boolean;
  /** featureId → "O" | "X" | 방수 등급·펜 종류 같은 짧은 텍스트 */
  values: Record<string, string>;
}

export interface FeatureGroup {
  label: string;
  features: { id: string; label: string }[];
  rows: FeatureRow[];
  /** O/X만으로는 설명이 부족한 항목(그립 장착 시 등급 변경 등)을 보충하는 참고 설명 */
  notes?: string[];
}
