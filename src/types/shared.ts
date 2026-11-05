import type { CompetitorProduct } from "./product";

export interface CatalogOverride {
  price?: number | null;
  note?: string;
  comps?: CompetitorProduct[];
  hidden?: boolean;
  by?: string | null;
  at?: string;
}

/** 가격을 바꿀 때마다 자동으로 쌓이는 변경 기록 (삭제·되돌리기 없음, 조회용). */
export interface PriceHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  oldPrice: number | null;
  newPrice: number;
  by: string | null;
  at: string;
}

export interface Tip {
  id: string;
  pid: string;
  text: string;
  by: string | null;
  at: string;
  editedAt?: string;
}

export interface Rival {
  id: string;
  group: string;
  n: string;
  b: string;
  p: number | null;
  url?: string;
  src: string;
  pts?: string;
  by: string | null;
  at: string;
  editedAt?: string;
}

export type EventKind = "promo" | "delivery" | "task" | "wait";

export interface ScheduleEvent {
  id: string;
  kind: EventKind;
  title: string;
  start?: string;
  end?: string;
  when?: "open" | "close";
  items?: string;
  lead?: number;
  time?: string;
  memo?: string;
  owner?: string;
  due?: string;
  status?: "open" | "doing" | "closed";
  notes?: { at: string; text: string }[];
  store?: string;
  done?: Record<string, boolean>;
  by: string | null;
  editedBy?: string | null;
  created?: string;
  at?: string;
}

export type PostTag = "good" | "warn" | "ask" | "notice" | "free";

export interface Post {
  id: string;
  tag: PostTag;
  text: string;
  prod?: string;
  store?: string;
  by: string | null;
  byName?: string;
  at: string;
  editedAt?: string;
  likes?: Record<string, boolean>;
}

export interface Comment {
  id: string;
  postId: string;
  text: string;
  by: string | null;
  byName?: string;
  at: string;
  editedAt?: string;
}

/** 창고 칸 하나에 뭐가 들어있는지 — 직원 누구나 보고 고칠 수 있는 공유 메모. */
export interface WarehouseCell {
  id: string;
  text: string;
  by: string | null;
  byName?: string;
  at: string;
}

/** 창고 구역 하나(선반 또는 넓은 공간) — 직원이 이름·구조를 직접 고칠 수 있다. */
export interface WarehouseZone {
  id: string;
  kind: "shelf" | "area";
  label: string;
  /** area 전용 — "선반 2개 크기" 같은 설명. */
  sub?: string;
  /** 행(앞에서 봤을 때 가로줄) 개수(1~8). 선반이면 "단", 공간이면 "줄". 기본 1(area)/4(shelf). */
  tiers?: number;
  /** 한 행을 몇 열로 나눌지(1~6). 기본 1(안 나눔). */
  cols?: number;
  /** shelf 전용 — 맨 위 평평한 면도 칸으로 쓸지. */
  hasTop?: boolean;
  /** 행 번호(1부터, 맨 위는 0)별 커스텀 이름. 없으면 기본 이름("1단" 등)을 쓴다. */
  rowLabels?: Record<number, string>;
}

export interface WarehouseLayoutDoc {
  zones: WarehouseZone[];
}

export type DelReqKind = "post" | "comment" | "tip" | "rival" | "event" | "product";

export interface DelRequest {
  id: string;
  kind: DelReqKind;
  target: string;
  label: string;
  reason?: string;
  by: string | null;
  at: string;
  status: "open" | "done" | "rejected";
  doneAt?: string;
  doneBy?: string | null;
}
