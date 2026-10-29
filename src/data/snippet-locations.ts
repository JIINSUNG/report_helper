/** 문구(틀)가 삽입될 수 있는 자리. id는 Snippet.locations에, label은 선택 UI에 쓴다. */
export const SNIPPET_LOCATIONS: [string, string][] = [
  ["open-comment", "오픈보고 · 코멘트"],
  ["close-highlight", "마감보고 · 금일 핵심 내용"],
  ["close-insight", "마감보고 · 금일 스마트폰 인사이트"],
  ["close-plan", "마감보고 · 익일 계획"],
  ["close-inventory", "마감보고 · 운영 데이터(재고 확인)"],
  ["close-note", "마감보고 · 특이사항"],
  ["sales-summary", "세일즈 · 금일 판매 요약"],
  ["sales-note", "세일즈 · 특이사항"],
  ["sales-plan", "세일즈 · 익일 판매 계획"],
  ["retro-did", "회고 · 오늘 한 일"],
];

export function locationLabel(id: string): string {
  return SNIPPET_LOCATIONS.find(([k]) => k === id)?.[1] ?? id;
}

/**
 * "세일즈 · 금일 판매 요약"은 기록을 바탕으로 자동 생성되는 문장(autoSum)과
 * null(=자동 생성 사용)/직접 쓴 텍스트를 넘나드는 특별한 칸이라, "매일 반영"으로
 * 기본값을 미리 넣어두면 그 자동 생성 로직과 충돌한다. 이 칸만 "매일 반영"에서 뺀다.
 */
const DAILY_UNSUPPORTED = new Set(["sales-summary"]);

export function supportsDaily(id: string): boolean {
  return !DAILY_UNSUPPORTED.has(id);
}
