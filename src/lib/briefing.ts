import { itemDueOn, secOn, type TodoData } from "@/data/todo-seed";
import { aEnd, type ScheduleAction } from "@/lib/use-schedule";
import { shift as shiftDate } from "@/lib/format";
import type { EventKind } from "@/types/shared";

export const EVENT_KIND_LABEL: Record<EventKind, string> = { promo: "행사", delivery: "배송", wait: "대기", task: "할 일" };

export interface BriefingItem {
  id: string;
  text: string;
  /** 체크된 할일에서 자동으로 걸린 게 아니라, "오늘 한 일"에 직접 적어 넣은 항목이면 true. */
  manual?: boolean;
}

export interface BriefingSplit {
  done: BriefingItem[];
  remaining: BriefingItem[];
}

/** 오늘(date) 기준, 현재 근무(shift)에 보이는 묶음 중에서 브리핑에 실제로 넣을 수 있는 것들.
 * todo.briefingSections가 없으면(아직 한 번도 안 골랐으면) 전부, 있으면 그중 오늘 보이는 것만. */
export function briefingEligibleSections(todo: TodoData, shift: string): { id: string; name: string }[] {
  const visible = todo.sections.filter((s) => secOn(s.when, shift));
  return visible.map((s) => ({ id: s.id, name: s.name }));
}

/** 오늘(date) 기준, 현재 근무(shift)로 화면에 보이는 할일 항목을 체크 여부로 나눈다 — TodoTab이 "오늘 할
 * 일"을 걸러 보여주는 기준(묶음·항목 근무 조건 + 반복 조건)을 그대로 써서 체크리스트와 브리핑 내용이 늘 일치한다.
 * todo.briefingSections에 고른 묶음 id가 있으면 그 묶음들만 센다(없으면 기존처럼 전부).
 * 세부 항목(parent 있는 것)은 상위 항목에 묶여 있는 디테일이라 브리핑에서는 상위 항목만 센다. */
export function splitTodayTodos(todo: TodoData, date: string, shift: string): BriefingSplit {
  const doneMap = todo.done[date] || {};
  let secIds = new Set(todo.sections.filter((s) => secOn(s.when, shift)).map((s) => s.id));
  if (todo.briefingSections) {
    const picked = new Set(todo.briefingSections);
    secIds = new Set([...secIds].filter((id) => picked.has(id)));
  }
  const items = todo.items
    .filter((i) => !i.parent && secIds.has(i.sec) && secOn(i.when ?? "all", shift) && itemDueOn(i, date))
    .map((i) => ({ id: i.id, text: i.text }));
  const extras = (todo.extra[date] || [])
    .filter((x) => secIds.has(x.sec) && secOn(x.when ?? "all", shift))
    .map((x) => ({ id: x.id, text: x.text }));
  const all = [...items, ...extras];
  const excluded = new Set(todo.briefingExcluded?.[date] ?? []);
  const manualDone = (todo.briefingExtra?.[date] ?? []).map((m) => ({ ...m, manual: true as const }));
  return {
    done: [...all.filter((t) => doneMap[t.id] && !excluded.has(t.id)), ...manualDone],
    remaining: all.filter((t) => !doneMap[t.id]),
  };
}

/** 일정 탭의 액션 중, 오늘(date) 기준 앞으로 withinDays일 안에 마감(aEnd)이 걸리는 것들 — 아직 안
 * 끝난 행사/배송/대기/할 일을 D-7 정도부터 미리 보여준다. ScheduleTab의 "다가오는 할 일" 필터와 같은 기준.
 * 카테고리 선택은 호출하는 쪽에서 kind로 한 번 더 걸러서 쓴다. */
export function upcomingScheduleActions(actions: ScheduleAction[], date: string, withinDays = 7): ScheduleAction[] {
  const until = shiftDate(date, withinDays);
  return actions.filter((a) => !a.done && aEnd(a) >= date && a.date <= until);
}

/** 동료에게 보내는 간단한 인수인계용 텍스트. 매출 보고서(closeText 등)와 달리 숫자 없이
 * 오늘 한 일 · 해야 할 일 · 특이사항만 다룬다. */
export function briefingText(storeLabel: string, date: string, done: string[], remaining: string[], note: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return [
    `[${y}년 ${m}월 ${d}일] ${storeLabel} 브리핑`,
    "",
    "[오늘 한 일]",
    ...(done.length ? done.map((t) => `- ${t}`) : ["- (없음)"]),
    "",
    "[해야 할 일]",
    ...(remaining.length ? remaining.map((t) => `- ${t}`) : ["- 없음"]),
    ...(note.trim() ? ["", "[특이사항]", ...note.trim().split("\n").map((x) => `- ${x.replace(/^-\s*/, "")}`)] : []),
  ].join("\n");
}
