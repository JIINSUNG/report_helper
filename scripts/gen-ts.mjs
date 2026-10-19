import { readFileSync, writeFileSync } from "node:fs";

const read = (name) => JSON.parse(readFileSync(new URL(`./out/${name}.json`, import.meta.url), "utf8"));

const HEADER = "// 이 파일은 scripts/extract-data.mjs + scripts/gen-ts.mjs로 login-demo.html 원본에서\n// 그대로 추출해 생성했습니다. 값을 고칠 땐 원본도 함께 고치거나, 이 파일만 직접 수정하세요.\n";

function write(path, content) {
  writeFileSync(new URL(path, import.meta.url), content);
  console.log("wrote", path);
}

// groups.ts
{
  const groups = read("groups");
  const content = `${HEADER}import type { ProductGroup } from "@/types/product";\n\nexport const GROUPS: ProductGroup[] = ${JSON.stringify(groups, null, 2)};\n`;
  write("../src/data/groups.ts", content);
}

// metrics.ts
{
  const metrics = read("metrics");
  const content = `${HEADER}import type { Metric } from "@/types/product";\n\nexport const METRICS: Record<string, Metric[]> = ${JSON.stringify(metrics, null, 2)};\n`;
  write("../src/data/metrics.ts", content);
}

// official.ts
{
  const official = read("official");
  const links = read("product-links");
  const content = `${HEADER}import type { OfficialRow } from "@/types/product";\n\n/** 샤오미 코리아 공식몰 사이트맵(mi.com/kr/sitemap) 전체 제품 목록. */\nexport const OFFICIAL: OfficialRow[] = ${JSON.stringify(official, null, 2)};\n\n/** GROUPS의 제품 id -> 공식몰 상품 페이지 링크 (GROUPS 안에 link가 없을 때 대신 씀). */\nexport const PRODUCT_LINKS: Record<string, string> = ${JSON.stringify(links, null, 2)};\n`;
  write("../src/data/official.ts", content);
}

// context-tags.ts (오늘 상황 칩)
{
  const tags = read("tags");
  const tagGroup = read("tag-group");
  const content = `${HEADER}export interface ContextTag {\n  id: string;\n  label: string;\n  auto?: number;\n  g?: string;\n}\n\nexport const TAGS: ContextTag[] = ${JSON.stringify(tags, null, 2)};\n\nexport const TAG_GROUP: Record<string, string> = ${JSON.stringify(tagGroup, null, 2)};\n`;
  write("../src/data/context-tags.ts", content);
}

// phrases.ts
{
  const phrases = read("phrases");
  const content = `${HEADER}export interface Phrase {\n  id: string;\n  k: "comment" | "highlight" | "plan";\n  tags: string[];\n  t: string;\n  b: string[];\n}\n\nexport const PHRASES: Phrase[] = ${JSON.stringify(phrases, null, 2)};\n`;
  write("../src/data/phrases.ts", content);
}

// sales-summary-options.ts 의 COMMENTS 부분은 이미 수기로 작성했지만, 원본과 다를 수 있어
// 검증용으로 별도 덤프 (comments-verified.json 비교용) — 수동 파일이 이미 일치하면 됨.
{
  const comments = read("comments");
  write("./out/comments-check.json", JSON.stringify(comments, null, 2) + "\n");
}

// guides.ts
{
  const guides = read("guides");
  const content = `${HEADER}export interface TabGuide {\n  title: string;\n  desc: string;\n  tips: string[];\n}\n\ntype RawGuide = [string, string, string[]];\n\nconst RAW_GUIDES: Record<string, RawGuide> = ${JSON.stringify(guides, null, 2)};\n\n/** 탭별 "이렇게 써요" 안내 텍스트. 키는 탭 id. */\nexport const GUIDES: Record<string, TabGuide> = Object.fromEntries(\n  Object.entries(RAW_GUIDES).map(([k, v]) => [k, { title: v[0], desc: v[1], tips: v[2] }])\n);\n`;
  write("../src/data/guides.ts", content);
}
