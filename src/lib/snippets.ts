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
