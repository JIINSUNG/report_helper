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
 * 변수가 없는 "daily" 문구만. 변수가 있는 문구는 값을 날마다 따로 입력해야 해서
 * (리테일·포스 같은 전용 입력칸으로) 여기서는 다루지 않는다 — dailyVarSnippetsFor 참고.
 */
function dailyPlainSnippetsFor(snippets: Snippet[], location: string): Snippet[] {
  return dailySnippetsFor(snippets, location).filter((s) => extractVars(s.template).length === 0);
}

/** 변수가 있는 "daily" 문구만. 이 목록의 각 문구마다, 보고서 화면에 변수 입력칸이 따로 생긴다. */
export function dailyVarSnippetsFor(snippets: Snippet[], location: string): Snippet[] {
  return dailySnippetsFor(snippets, location).filter((s) => extractVars(s.template).length > 0);
}

/**
 * 새 보고서를 만들 때(날짜별로 한 번), 변수 없는 "daily" 문구를 자유 텍스트 칸의
 * 기본값에 미리 넣어둔다. base(기존 기본 문구 등)가 있으면 그 뒤/앞에 이어 붙인다.
 */
export function dailySnippetText(snippets: Snippet[], location: string, base = ""): string {
  return dailyPlainSnippetsFor(snippets, location).reduce((acc, s) => insertAtPosition(acc, s.template, s.position ?? "bottom"), base);
}

/** 위와 같은 목적이지만 Section[] 목록(금일 핵심 내용 등)에 넣을 때. */
export function dailySnippetSections<T extends { t: string; b: string[] }>(snippets: Snippet[], location: string, base: T[] = []): T[] {
  return dailyPlainSnippetsFor(snippets, location).reduce((acc, s) => insertSectionFromSnippet(acc, s.label, s.template, s.position ?? "bottom"), base);
}

/**
 * 변수가 있는 "daily" 문구를, 그날 입력된 값(snippetVars[문구id])으로 채워 하나의 텍스트로
 * 이어붙인다. 보고서 텍스트를 만들 때(복사용) base 뒤에 덧붙여 쓴다. 값을 아직 안 넣었으면
 * 그 문구는 빈 줄도 안 남기고 건너뛴다. 그날 '빼기'로 뺀 문구(skip)도 건너뛴다.
 */
export function dailyVarSnippetText(
  snippets: Snippet[],
  location: string,
  snippetVars: Record<string, Record<string, string>>,
  base = "",
  skip: string[] = []
): string {
  const filled = dailyVarSnippetsFor(snippets, location)
    .filter((s) => !skip.includes(s.id))
    .map((s) => fillSnippet(s.template, snippetVars[s.id] || {}).trim())
    .filter(Boolean);
  return filled.reduce((acc, text) => insertAtPosition(acc, text, "bottom"), base);
}

/** 위와 같은 목적이지만, 금일 핵심 내용처럼 Section[] 목록으로 나가는 보고서 텍스트에 쓸 때. */
export function dailyVarSnippetSections<T extends { t: string; b: string[] }>(
  snippets: Snippet[],
  location: string,
  snippetVars: Record<string, Record<string, string>>,
  base: T[] = [],
  skip: string[] = []
): T[] {
  return dailyVarSnippetsFor(snippets, location)
    .filter((s) => !skip.includes(s.id))
    .reduce((acc, s) => {
      const text = fillSnippet(s.template, snippetVars[s.id] || {}).trim();
      return text ? insertSectionFromSnippet(acc, s.label, text, s.position ?? "bottom") : acc;
    }, base);
}
