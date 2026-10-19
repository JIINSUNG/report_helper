import type { CompetitorProduct } from "./product";

export interface CatalogOverride {
  price?: number | null;
  note?: string;
  comps?: CompetitorProduct[];
  hidden?: boolean;
  by?: string | null;
  at?: string;
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
