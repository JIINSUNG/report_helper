/** 문구(틀)가 삽입될 수 있는 자리. id는 Snippet.locations에, label은 선택 UI에 쓴다. */
export const SNIPPET_LOCATIONS: [string, string][] = [
  ["open-comment", "오픈보고 · 코멘트"],
  ["close-highlight", "마감보고 · 금일 핵심 내용"],
  ["close-insight", "마감보고 · 금일 스마트폰 인사이트"],
  ["close-plan", "마감보고 · 익일 계획"],
  ["close-note", "마감보고 · 특이사항"],
  ["sales-plan", "세일즈 · 익일 판매 계획"],
];

export function locationLabel(id: string): string {
  return SNIPPET_LOCATIONS.find(([k]) => k === id)?.[1] ?? id;
}
