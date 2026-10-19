// 원본 login-demo.html에서 순수 데이터 선언부만 정확히 뽑아내는 1회성 스크립트.
// 수동으로 다시 타이핑하지 않고, 실제 소스 텍스트를 그대로 eval해서 JSON으로 덤프한다.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const src = readFileSync(new URL("../login-demo.html", import.meta.url), "utf8");

// 문자열/템플릿 리터럴을 건너뛰면서 괄호 깊이를 추적해, `const NAME = <expr>;` 꼴의
// 선언 하나를 소스 그대로 잘라낸다 (중첩된 {}, [], () 안의 세미콜론에 속지 않기 위해).
function sliceDecl(startIndex) {
  let i = src.indexOf("=", startIndex) + 1;
  // 값 시작까지 공백 건너뛰기
  while (/\s/.test(src[i])) i++;
  const valueStart = i;
  let depth = 0;
  let inStr = null; // '"' | "'" | '`' | null
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === ";" && depth <= 0) break;
  }
  return src.slice(valueStart, i);
}

function findDeclStart(varName, fromIndex = 0) {
  const re = new RegExp(`const\\s+${varName}\\s*=`, "g");
  re.lastIndex = fromIndex;
  const m = re.exec(src);
  if (!m) throw new Error(`const ${varName} 선언을 못 찾았어요.`);
  return m.index;
}

function extractOne(varName, deps = "") {
  const start = findDeclStart(varName);
  const exprSrc = sliceDecl(start);
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${deps}\nreturn (${exprSrc});`);
  return fn();
}

// GROUPS는 헬퍼 P()/C()를 먼저 정의해야 함
const P_SRC = `const P = (id, name, p, o) => ({ id, name, p, ...o });`;
const C_SRC = `const C = (n, p, note) => ({ n, p, note: note || "" });`;
const GROUPS = extractOne("GROUPS", `${P_SRC}\n${C_SRC}`);

// METRICS는 M()과 PHONE_ROWS를 먼저 정의해야 함
const M_SRC = `const M = (n, v, x, sub) => ({ n, v, x: !!x, sub: sub || "" });`;
const phoneRowsStart = findDeclStart("PHONE_ROWS");
const PHONE_ROWS_SRC = `const PHONE_ROWS = (${sliceDecl(phoneRowsStart)});`;
const METRICS = extractOne("METRICS", `${M_SRC}\n${PHONE_ROWS_SRC}`);

const OFFICIAL = extractOne("OFFICIAL");
const PRODUCT_LINKS = extractOne("PRODUCT_LINKS");

const TAGS = extractOne("TAGS");
const TAG_GROUP = extractOne("TAG_GROUP", `const TAGS = (${JSON.stringify(TAGS)});`);

const PHRASES = extractOne("PHRASES");
const COMMENTS = extractOne("COMMENTS");
const GUIDES = extractOne("GUIDES");

mkdirSync(new URL("./out", import.meta.url), { recursive: true });
const dump = (name, value) => writeFileSync(new URL(`./out/${name}.json`, import.meta.url), JSON.stringify(value, null, 2) + "\n");

dump("groups", GROUPS);
dump("metrics", METRICS);
dump("official", OFFICIAL);
dump("product-links", PRODUCT_LINKS);
dump("tags", TAGS);
dump("tag-group", TAG_GROUP);
dump("phrases", PHRASES);
dump("comments", COMMENTS);
dump("guides", GUIDES);

console.log("GROUPS categories:", GROUPS.length);
console.log("GROUPS total items:", GROUPS.reduce((s, g) => s + g.items.length, 0));
console.log("METRICS keys:", Object.keys(METRICS).length);
console.log("OFFICIAL rows:", OFFICIAL.length);
console.log("PRODUCT_LINKS keys:", Object.keys(PRODUCT_LINKS).length);
console.log("TAGS:", TAGS.length);
console.log("PHRASES:", PHRASES.length);
console.log("COMMENTS:", COMMENTS.length);
console.log("GUIDES keys:", Object.keys(GUIDES).length);
