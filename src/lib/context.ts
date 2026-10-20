import { isOffDay } from "@/data/holidays";
import type { Phrase } from "@/data/phrases";
import type { ContextState } from "@/types/report";

export const emptyCtx = (): ContextState => ({ add: [], off: [], promo: "", item: null });

export interface AutoContext {
  tags: string[];
  item: string;
}

interface AutoContextBasis {
  dayTargetGMV: number;
  dayGMV: number;
  items: { name: string; target: number; actual: number }[];
}

/** 날짜·전일(또는 금일) 실적만 보고 자동으로 고를 수 있는 "오늘 상황" 태그. */
export function autoContext(date: string, basis?: AutoContextBasis): AutoContext {
  const tags = [isOffDay(date) ? "weekend" : "weekday"];
  let miss: string[] = [];
  if (basis && basis.dayTargetGMV > 0 && basis.dayGMV > 0) tags.push(basis.dayGMV >= basis.dayTargetGMV ? "high" : "low");
  if (basis) {
    miss = basis.items.filter((i) => i.target > 0 && i.actual < i.target).map((i) => i.name);
    if (miss.length) tags.push("itemMiss");
  }
  return { tags, item: miss.join(", ") };
}

export function ctxTags(auto: AutoContext, c?: ContextState | null): string[] {
  const cc = c || emptyCtx();
  return [...new Set([...auto.tags.filter((t) => !cc.off.includes(t)), ...cc.add])];
}

export function ctxManual(auto: AutoContext, c?: ContextState | null): string[] {
  const cc = c || emptyCtx();
  return cc.add.filter((t) => !auto.tags.includes(t));
}

export function ctxVars(auto: AutoContext, c?: ContextState | null): { promo: string; item: string } {
  const cc = c || emptyCtx();
  return { promo: cc.promo || "", item: (cc.item ?? auto.item) || "" };
}

export function fill(s: string, v: { promo: string; item: string }): string {
  return s.replaceAll("{promo}", v.promo.trim() || "진행 중인").replaceAll("{item}", v.item.trim() || "주력 제품");
}

export function recommend(all: Phrase[], k: Phrase["k"], tags: string[], manual: string[], favs: string[]): Phrase[] {
  return all
    .filter((p) => p.k === k)
    .map((p) => ({
      p,
      s: p.tags.filter((t) => tags.includes(t)).length * 10 + p.tags.filter((t) => manual.includes(t)).length * 15 + (favs.includes(p.id) ? 5 : 0),
    }))
    .filter((x) => x.s >= 10 || favs.includes(x.p.id))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);
}
