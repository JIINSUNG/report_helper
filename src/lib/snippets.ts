import type { Snippet } from "@/types/report";

/** "{품목} 특가 안내" 같은 틀에서 중괄호 안의 변수 이름만 뽑는다. 순서 유지, 중복 제거. */
export function extractVars(template: string): string[] {
  const out: string[] = [];
  const re = /\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template))) {
    const name = m[1].trim();
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

export function fillSnippet(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([^{}]+)\}/g, (_, name: string) => vars[name.trim()] ?? "");
}

/** 자유 텍스트 칸에 문구를 맨 위(첫 줄) 또는 맨 아래(마지막 줄)로 넣는다. */
export function insertAtPosition(existing: string, text: string, position: "top" | "bottom"): string {
  const trimmed = existing.trim();
  if (!trimmed) return text;
  return position === "top" ? `${text}\n${trimmed}` : `${trimmed}\n${text}`;
}

/** 금일 핵심 내용 같은 '제목 + 여러 줄' 섹션 목록에, 문구를 새 항목(제목=문구 이름, 내용=채운 문구)으로 맨 위/맨 아래에 넣는다. */
export function insertSectionFromSnippet<T extends { t: string; b: string[] }>(
  list: T[],
  label: string,
  text: string,
  position: "top" | "bottom"
): T[] {
  const lines = text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const entry = { t: label, b: lines.length ? lines : [text.trim()] } as T;
  return position === "top" ? [entry, ...list] : [...list, entry];
}

/** frequency가 "daily"인 문구 중 이 위치(location) 전용인 것들만, 저장된 순서대로 골라낸다. */
function dailySnippetsFor(snippets: Snippet[], location: string): Snippet[] {
  return snippets.filter((s) => s.frequency === "daily" && s.locations?.length === 1 && s.locations[0] === location);
}

/**
 * 새 보고서를 만들 때(날짜별로 한 번), "매일 반영"으로 설정한 문구를 자유 텍스트 칸의
 * 기본값에 미리 넣어둔다. base(기존 기본 문구 등)가 있으면 그 뒤/앞에 이어 붙인다.
 * 변수가 있는 문구는(채울 값이 없어서) 애초에 "매일 반영"을 고를 수 없게 UI에서 막는다.
 */
export function dailySnippetText(snippets: Snippet[], location: string, base = ""): string {
  return dailySnippetsFor(snippets, location).reduce((acc, s) => insertAtPosition(acc, s.template, s.position ?? "bottom"), base);
}

/** 위와 같은 목적이지만 Section[] 목록(금일 핵심 내용 등)에 넣을 때. */
export function dailySnippetSections<T extends { t: string; b: string[] }>(snippets: Snippet[], location: string, base: T[] = []): T[] {
  return dailySnippetsFor(snippets, location).reduce((acc, s) => insertSectionFromSnippet(acc, s.label, s.template, s.position ?? "bottom"), base);
}
