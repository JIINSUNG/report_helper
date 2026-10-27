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
