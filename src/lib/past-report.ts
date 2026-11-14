// 지난 날짜의 보고서 내용을 오늘(지금 보는 날짜) 보고서로 가져오는 순수 함수들.
// "어제 핵심 내용·계획이 오늘도 거의 같다" 같은 경우에 일일이 다시 치지 않게 하려는 것.
import { sectionsText } from "./report-text";
import { insertAtPosition } from "./snippets";
import type { CloseReport, OpenReport, Section } from "@/types/report";

export type CopyMode = "append" | "replace";

export type ClosePart = "highlights" | "phoneInsights" | "plans" | "note" | "inventoryNote";
export const CLOSE_PARTS: { id: ClosePart; label: string }[] = [
  { id: "highlights", label: "금일 핵심 내용" },
  { id: "phoneInsights", label: "스마트폰 인사이트" },
  { id: "plans", label: "익일 계획" },
  { id: "note", label: "특이사항" },
  { id: "inventoryNote", label: "재고 확인 문구" },
];

export type OpenPart = "comment" | "targets" | "prevPlans";
export const OPEN_PARTS: { id: OpenPart; label: string; hint: string }[] = [
  { id: "comment", label: "코멘트", hint: "그날 오픈보고 코멘트" },
  { id: "targets", label: "금일 목표", hint: "목표 매출·전환율·품목별 목표" },
  { id: "prevPlans", label: "마감보고의 익일 계획 → 코멘트", hint: "그날 마감보고에 적은 익일 계획을 오늘 코멘트에" },
];

const hasSectionContent = (s: Section) => !!s.t.trim() || s.b.some((x) => x.trim());
const nonEmpty = (ss: Section[] | undefined) => (ss ?? []).filter(hasSectionContent);
const sameSection = (a: Section, b: Section) => a.t.trim() === b.t.trim() && a.b.join("\n").trim() === b.b.join("\n").trim();
const cloneSections = (ss: Section[]) => ss.map((s) => ({ ...s, b: [...s.b] }));

/** 섹션 목록 합치기 — 덧붙일 땐 이미 똑같은 항목은 건너뛴다(두 번 눌러도 두 번 안 들어가게). */
function mergeSections(current: Section[], incoming: Section[], mode: CopyMode): Section[] {
  const src = cloneSections(nonEmpty(incoming));
  if (mode === "replace") return src;
  const cur = nonEmpty(current);
  return [...cur, ...src.filter((s) => !cur.some((c) => sameSection(c, s)))];
}

function mergeText(current: string, incoming: string, mode: CopyMode): string {
  const src = incoming.trim();
  if (!src) return mode === "replace" ? "" : current;
  if (mode === "replace") return src;
  if (current.includes(src)) return current;
  return insertAtPosition(current, src, "bottom");
}

/** 이 마감보고의 해당 칸에 가져올 게 있는지(개수). 섹션은 항목 수, 텍스트는 있으면 1. */
export function closePartCount(r: CloseReport | undefined, part: ClosePart): number {
  if (!r) return 0;
  if (part === "note" || part === "inventoryNote") return r[part]?.trim() ? 1 : 0;
  return nonEmpty(r[part]).length;
}

export function openPartCount(o: OpenReport | undefined, c: CloseReport | undefined, part: OpenPart): number {
  if (part === "comment") return o?.comment?.trim() ? 1 : 0;
  if (part === "targets") return o && (o.targetGMV > 0 || o.targetItems.some((i) => i.target > 0)) ? 1 : 0;
  return nonEmpty(c?.plans).length;
}

/** 마감보고: 고른 칸만 지난 보고서에서 가져온 패치. */
export function copyFromClose(target: CloseReport, src: CloseReport, parts: ClosePart[], mode: CopyMode): Partial<CloseReport> {
  const patch: Partial<CloseReport> = {};
  for (const part of parts) {
    if (part === "note" || part === "inventoryNote") patch[part] = mergeText(target[part] ?? "", src[part] ?? "", mode);
    else patch[part] = mergeSections(target[part] ?? [], src[part] ?? [], mode);
  }
  return patch;
}

/** 오픈보고: 고른 칸만 지난 오픈보고(목표·코멘트)와 그날 마감보고(익일 계획)에서 가져온 패치. */
export function copyToOpen(
  target: OpenReport,
  srcOpen: OpenReport | undefined,
  srcClose: CloseReport | undefined,
  parts: OpenPart[],
  mode: CopyMode
): Partial<OpenReport> {
  const patch: Partial<OpenReport> = {};
  let comment = target.comment ?? "";
  let commentTouched = false;
  if (parts.includes("comment") && srcOpen) {
    comment = mergeText(comment, srcOpen.comment ?? "", mode);
    commentTouched = true;
  }
  if (parts.includes("prevPlans") && srcClose) {
    const planText = sectionsText(nonEmpty(srcClose.plans));
    // 코멘트와 계획을 둘 다 고른 "바꾸기"에서 계획이 코멘트를 지우지 않도록, 두 번째부터는 덧붙인다.
    comment = mergeText(comment, planText, commentTouched ? "append" : mode);
    commentTouched = true;
  }
  if (commentTouched) patch.comment = comment;
  if (parts.includes("targets") && srcOpen) {
    patch.targetGMV = srcOpen.targetGMV;
    patch.targetConversion = srcOpen.targetConversion;
    // 품목 목록은 오늘 것을 유지하고, 같은 이름의 목표 수치만 가져온다(없던 품목은 덧붙인다).
    const byName = new Map(srcOpen.targetItems.map((i) => [i.name, i.target]));
    const kept = target.targetItems.map((i) => (byName.has(i.name) ? { ...i, target: byName.get(i.name)! } : i));
    const added = srcOpen.targetItems.filter((i) => !target.targetItems.some((t) => t.name === i.name)).map((i) => ({ ...i, actual: 0 }));
    patch.targetItems = [...kept, ...added];
  }
  return patch;
}

/** date보다 앞선 날짜 중 가져올 내용이 있는 날짜들(최근 순, 최대 limit개). */
export function pastDatesWith(dates: string[], date: string, has: (d: string) => boolean, limit = 14): string[] {
  return [...new Set(dates)]
    .filter((d) => d < date && has(d))
    .sort()
    .reverse()
    .slice(0, limit);
}
