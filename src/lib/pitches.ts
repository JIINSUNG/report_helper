// 잘 먹혔던 세일즈 멘트 노트 — 이 기기 localStorage에만 저장(보고서와 같은 LocalReportData 안).
// 손님 개인정보·매출이 아니라 내 말투 기록이라 민감하진 않지만, 다른 로컬 기록과 같은 곳에 둬서 같이 백업·초기화된다.
import { uid } from "./format";
import type { LocalReportData, Pitch, PitchStage } from "@/types/report";

export const PITCH_STAGES: { id: PitchStage; label: string; hint: string }[] = [
  { id: "greet", label: "첫인사", hint: "말 걸기·분위기 풀기" },
  { id: "needs", label: "니즈 파악", hint: "뭐가 필요한지 묻기" },
  { id: "explain", label: "제품 설명", hint: "핵심 포인트 한 줄" },
  { id: "compare", label: "비교·가격", hint: "타사·상위 모델 비교" },
  { id: "benefit", label: "혜택", hint: "행사·사은품·할부" },
  { id: "objection", label: "반론 대응", hint: "\"비싸요\", \"더 볼게요\"" },
  { id: "close", label: "클로징", hint: "결정 도와주기" },
  { id: "upsell", label: "추가 판매", hint: "케이스·보호필름·액세서리" },
];

export const PITCH_STAGE_LABEL = Object.fromEntries(PITCH_STAGES.map((s) => [s.id, s.label])) as Record<PitchStage, string>;

export interface PitchInput {
  text: string;
  stage: PitchStage;
  cat?: string;
  note?: string;
}

function clean(input: PitchInput) {
  const cat = input.cat?.trim();
  const note = input.note?.trim();
  return { text: input.text.trim(), stage: input.stage, ...(cat ? { cat } : {}), ...(note ? { note } : {}) };
}

export function addPitch(d: LocalReportData, input: PitchInput, date: string, id: string = uid()): LocalReportData {
  const p: Pitch = { id, ...clean(input), wins: 1, lastWin: date, createdAt: new Date().toISOString() };
  return { ...d, pitches: [p, ...(d.pitches ?? [])] };
}

export function updatePitch(d: LocalReportData, id: string, input: PitchInput): LocalReportData {
  return {
    ...d,
    pitches: (d.pitches ?? []).map((p) => {
      if (p.id !== id) return p;
      const rest: Pitch = { ...p };
      delete rest.cat;
      delete rest.note;
      return { ...rest, ...clean(input) };
    }),
  };
}

export function removePitch(d: LocalReportData, id: string): LocalReportData {
  return { ...d, pitches: (d.pitches ?? []).filter((p) => p.id !== id) };
}

/** "또 먹혔어요" — 횟수 +1, 마지막으로 먹힌 날 갱신. */
export function winPitch(d: LocalReportData, id: string, date: string): LocalReportData {
  return { ...d, pitches: (d.pitches ?? []).map((p) => (p.id === id ? { ...p, wins: p.wins + 1, lastWin: date > p.lastWin ? date : p.lastWin } : p)) };
}

export function togglePinPitch(d: LocalReportData, id: string): LocalReportData {
  return { ...d, pitches: (d.pitches ?? []).map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)) };
}

export type PitchSort = "wins" | "recent";

/** 고정한 것 먼저, 그다음 많이 먹힌 순(또는 최근에 먹힌 순). 단계·카테고리·검색어로 거른다. */
export function filterPitches(
  list: Pitch[],
  { stage, cat, q, sort }: { stage?: PitchStage | null; cat?: string | null; q?: string; sort: PitchSort }
): Pitch[] {
  const query = (q ?? "").trim().toLowerCase();
  return list
    .filter((p) => !stage || p.stage === stage)
    .filter((p) => !cat || p.cat === cat)
    .filter((p) => !query || [p.text, p.note, p.cat, PITCH_STAGE_LABEL[p.stage]].some((t) => (t ?? "").toLowerCase().includes(query)))
    .sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      if (sort === "wins" && a.wins !== b.wins) return b.wins - a.wins;
      if (a.lastWin !== b.lastWin) return b.lastWin.localeCompare(a.lastWin);
      return b.createdAt.localeCompare(a.createdAt);
    });
}

/** 지금까지 쓴 카테고리 목록(많이 쓴 순). */
export function pitchCategories(list: Pitch[]): string[] {
  const n = new Map<string, number>();
  for (const p of list) if (p.cat) n.set(p.cat, (n.get(p.cat) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
}
