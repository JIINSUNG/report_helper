export type TodoWhen = "all" | "open" | "close";

export interface TodoSection {
  id: string;
  name: string;
  when: TodoWhen;
}

export interface TodoItem {
  id: string;
  sec: string;
  text: string;
  days: number[] | null;
  parent?: string;
  /** 직접 고른 탭 바로가기 (예: "products"). 안 고르면 TODO_LINKS 자동 매칭을 써요. */
  linkTab?: string | null;
}

export interface TodoExtraItem {
  id: string;
  sec: string;
  text: string;
}

export interface TodoData {
  sections: TodoSection[];
  items: TodoItem[];
  extra: Record<string, TodoExtraItem[]>;
  done: Record<string, Record<string, boolean>>;
  shift: Record<string, string>;
  lastShift: string;
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
  ["all", "항상"],
  ["open", "오픈 근무"],
  ["close", "마감 근무"],
];

export function secOn(when: TodoWhen, shift: string) {
  return shift !== "off" && (when === "all" || shift === "full" || when === shift);
}

export const WD = "일월화수목금토";
