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
