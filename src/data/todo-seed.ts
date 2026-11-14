import type { EventKind } from "@/types/shared";

export type TodoWhen = "all" | "open" | "close" | "work" | "off";

export interface TodoSection {
  id: string;
  name: string;
  when: TodoWhen;
}

export interface TodoItem {
  id: string;
  sec: string;
  text: string;
  /** 요일 반복. null이면 매일, monthDay가 있으면 무시됨. */
  days: number[] | null;
  /** 매월 특정 일(1~31)에만 반복. 있으면 days는 무시되고 이 날에만 보여요. */
  monthDay?: number | null;
  /** 반복을 시작할 날짜("YYYY-MM-DD"). 없으면 기한 없이 처음부터. */
  startDate?: string | null;
  /** 반복을 끝낼 날짜("YYYY-MM-DD", 포함). 없으면 기한 없이 계속. */
  endDate?: string | null;
  parent?: string;
  /** 직접 고른 탭 바로가기 (예: "products"). 안 고르면 TODO_LINKS 자동 매칭을 써요. */
  linkTab?: string | null;
  /** 묶음의 when과 별개로, 이 항목만 오픈·마감 근무로 좁힐 때. 안 정하면(undefined) "all" */
  when?: TodoWhen;
}

/** 오늘(date, YYYY-MM-DD) 이 항목이 보여야 하는지. 기간(startDate~endDate) 밖이면 항상 제외,
 * 기간 안이면 monthDay > days(요일) > 매일 순으로 본다. */
export function itemDueOn(item: Pick<TodoItem, "days" | "monthDay" | "startDate" | "endDate">, date: string): boolean {
  if (item.startDate && date < item.startDate) return false;
  if (item.endDate && date > item.endDate) return false;
  const [y, m, d] = date.split("-").map(Number);
  if (item.monthDay) return d === item.monthDay;
  if (!item.days) return true;
  const weekday = new Date(y, m - 1, d).getDay();
  return item.days.includes(weekday);
}

export interface TodoExtraItem {
  id: string;
  sec: string;
  text: string;
  /** 묶음의 when과 별개로, 이 항목만 오픈·마감 근무로 좁힐 때. 안 정하면(undefined) "all" */
  when?: TodoWhen;
}

export interface TodoData {
  sections: TodoSection[];
  items: TodoItem[];
  extra: Record<string, TodoExtraItem[]>;
  done: Record<string, Record<string, boolean>>;
  shift: Record<string, string>;
  lastShift: string;
  /** 브리핑에 포함할 묶음 id. undefined면 "오늘 보이는 묶음 전부"(기존 동작, 하위호환). */
  briefingSections?: string[];
  /** 브리핑 "해야 할 일"에 포함할 일정 카테고리(행사/배송/대기/할 일). undefined면 전부. */
  briefingScheduleKinds?: EventKind[];
  /** 이번 주 목표. key는 그 주 월요일("YYYY-MM-DD") — 주가 바뀌면 자동으로 지난 목표 취급. */
  weeklyGoal?: TodoGoal;
  /** 이번 달 목표. key는 "YYYY-MM". */
  monthlyGoal?: TodoGoal;
  /** "오늘 한 일"에서 자동으로 걸린(체크된) 항목 중, 그날만 빼고 싶은 것의 id. 체크 자체는
   * 안 풀리고 "한 일" 목록에서만 숨는다. key는 날짜. */
  briefingExcluded?: Record<string, string[]>;
  /** "오늘 한 일"에 체크한 할일과 별개로 직접 적어 넣은 것들. key는 날짜. */
  briefingExtra?: Record<string, { id: string; text: string }[]>;
  /** 마지막으로 바뀐 시각(ms) — 클라우드 동기화 시 최신본 판단용. */
  updatedAt?: number;
}

export interface TodoGoal {
  text: string;
  key: string;
}

let uidCounter = 0;
function tid(prefix: string) {
  uidCounter += 1;
  return `${prefix}${Date.now().toString(36)}${uidCounter}`;
}

export function todoBlank(): TodoData {
  return {
    sections: [{ id: tid("s"), name: "오늘 할 일", when: "all" }],
    items: [],
    extra: {},
    done: {},
    shift: {},
    lastShift: "full",
  };
}

const SEED_LISTS: Record<string, string[]> = {
  arrive: ["이카운트 출첵", "오늘의 목표 및 투두리스트 설정", "제습기 물 차 있으면 버리기", "쓰레기 등 있으면 정리"],
  open: [
    "제미 목표달성률 올리기 (세일즈 공유방)",
    "스피커 세팅",
    "청소기 충전기 제거 및 원상태 돌리기",
    "TV 세팅",
    "가습기 물 보충",
    "오픈보고 (내 계정으로)",
    "청소기 먼지 비우기",
    "제품 전원 켜기",
    "청소기 돌리기 (2명이면 한 명은 걸레)",
    "마감보고용 스티커메모 최신화",
    "차단기 올리기",
    "시재 체크",
    "포스 개설",
    "불 켜기",
  ],
  day: [
    "배터리 부족 제품 충전",
    "특정일 전 제품 먼지털기",
    "특정일 입고 & 재고조사",
    "먼지털기",
    "디스플레이 닦기",
    "패드 액세서리 배터리 확인 (80% 이상)",
    "손님 응대",
    "제품 공부",
  ],
  close: [
    "미워크 점장 보고",
    "제품 정리 및 충전",
    "제미 목표달성률 올리기",
    "불 끄기",
    "청소기 전원 충전",
    "스피커 등 전원 끊기",
    "포스 마감",
    "차단기",
    "재고 체크",
    "선풍기 전원 끄기",
    "매출 기록",
    "마감 입금",
    "경진대회 달성률 기록",
    "GMV 기록",
    "시재 체크",
  ],
  leave: ["15분 회고 진행", "카운터 정리", "가방 챙기고 퇴근", "쓰레기 버리기", "반성노트", "명찰 벗기", "유니폼 벗기", "이카운트 퇴근"],
};

const CLOSE_REPORT_SUBS = [
  "특이사항 (있는 경우에만)",
  "익일 계획 핵심내용 2-3",
  "오늘 핵심 내용 2-3",
  "재고 이상 여부",
  "차액 여부 및 사유",
  "스마트폰 등 대수 목표",
  "월 목표 및 누적 실적",
  "운영 데이터 (퍼트래픽 등)",
  "일 판매 목표 및 달성 여부",
];

const SECTIONS: [string, string, TodoWhen][] = [
  ["arrive", "출근 시", "all"],
  ["open", "오픈 시", "open"],
  ["day", "매장 일과", "all"],
  ["close", "마감 시", "close"],
  ["leave", "퇴근 시", "all"],
];

export function todoSeed(): TodoData {
  const items: TodoItem[] = [];
  const sections: TodoSection[] = SECTIONS.map(([id, name, when]) => ({ id, name, when }));
  for (const [sec, list] of Object.entries(SEED_LISTS)) {
    for (const text of list) {
      const id = tid("r");
      items.push({ id, sec, text, days: null });
      if (text === "미워크 점장 보고") {
        for (const sub of CLOSE_REPORT_SUBS) {
          items.push({ id: tid("r"), sec, text: sub, parent: id, days: null });
        }
      }
    }
  }
  return { sections, items, extra: {}, done: {}, shift: {}, lastShift: "full" };
}

export const SHIFTS: [string, string][] = [
  ["open", "오픈"],
  ["close", "마감"],
  ["full", "풀타임"],
  ["off", "휴무"],
];

export const WHENS: [TodoWhen, string][] = [
  ["all", "항상(휴무 포함)"],
  ["work", "오픈·마감(휴무 제외)"],
  ["open", "오픈 근무만"],
  ["close", "마감 근무만"],
  ["off", "휴무일에만"],
];

/** 항목 추가 시 쓰는 표현(묶음의 WHENS와 같은 값, 문구만 짧게). */
export const ITEM_WHENS: [TodoWhen, string][] = [
  ["all", "항상"],
  ["work", "오픈·마감"],
  ["open", "오픈만"],
  ["close", "마감만"],
  ["off", "휴무만"],
];

/** 근무(shift)에 따라 이 when이 보여야 하는지.
 * - "all": 휴무를 포함해 언제나 보임.
 * - "work": 오픈·마감·풀타임 등 근무 중엔 보이지만 휴무일엔 숨음.
 * - "open"/"close": 그 근무(또는 풀타임)일 때만 보임.
 * - "off": 휴무일에만 보임(근무 중엔 숨음) — 휴무일을 개인 할 일 체크리스트로 쓸 때 쓴다. */
export function secOn(when: TodoWhen, shift: string) {
  if (shift === "off") return when === "all" || when === "off";
  if (when === "off") return false;
  if (when === "all" || when === "work") return true;
  return shift === "full" || when === shift;
}

export const WD = "일월화수목금토";
