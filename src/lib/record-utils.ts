import { EXTRA_ITEMS } from "@/data/report-items";
import { ACTIONS } from "@/data/record-options";
import type { ReportSettings, SalesRecord } from "@/types/report";

export function recCount(name: string, settings: ReportSettings, recs: SalesRecord[]): number {
  const ex = EXTRA_ITEMS.find((x) => x.name === name);
  const base = settings.items.find((x) => x.name === name);
  const hit = (r: SalesRecord) =>
    ex && ex.kw ? ex.kw.some((k) => (r.product || "").includes(k)) : r.cat === (base ? base.cat : ex ? ex.cat : "__");
  return recs.filter((r) => r.result === "buy" && hit(r)).reduce((s, r) => s + r.qty, 0);
}

const WITH: Record<string, string> = {
  커플: "일행과 함께 방문",
  가족: "가족과 함께 방문",
  친구: "친구와 함께 방문",
  혼자: "혼자 방문",
};

export const autoS = (r: SalesRecord) =>
  `${[r.age, r.gender].filter(Boolean).join(" ") || ""} 고객${r.party ? `, ${WITH[r.party]}` : ""}${
    r.memo ? ` (${r.memo})` : ""
  }`.trim();

export const autoT = (r: SalesRecord) => [r.needs.join("·"), r.needMemo].filter(Boolean).join(" / ");
export const autoA = (r: SalesRecord) => r.actions.map((a) => ACTIONS[a][1]).join(", ");
export const autoR = (r: SalesRecord) =>
  r.result === "buy"
    ? `${r.product || r.cat} ${r.qty}대 구매`
    : r.result === "revisit"
      ? `${r.product || r.cat} 재방문 약속 (잠재 리드 확보)`
      : "구매로 이어지지 않음";

export function salesSummary(recs: SalesRecord[]): string {
  if (!recs.length) return "";
  const cnt = (arr: (string | undefined)[]) => {
    const m: Record<string, number> = {};
    arr.forEach((x) => {
      if (x) m[x] = (m[x] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const sold = recs
    .filter((r) => r.result === "buy")
    .map((r) => `${r.product || r.cat} ${r.qty}대`)
    .join(", ");
  const groups = cnt(recs.map((r) => [r.age, r.gender].filter(Boolean).join(" ")))
    .map(([k, v]) => `${k} ${v}명`)
    .join(", ");
  const party = cnt(recs.map((r) => r.party))
    .filter(([k]) => k !== "혼자")
    .map(([k, v]) => `${k} ${v}팀`)
    .join(", ");
  const needs = cnt(recs.flatMap((r) => r.needs))
    .slice(0, 3)
    .map(([k]) => k)
    .join(", ");
  const buy = recs.filter((r) => r.result === "buy").length;
  const rv = recs.filter((r) => r.result === "revisit").length;
  return [
    sold && `- 판매: ${sold}`,
    groups && `- 주요 고객층: ${groups}${party ? ` (${party})` : ""}`,
    needs && `- 많았던 니즈: ${needs}`,
    `- 상담 ${recs.length}건 중 구매 ${buy}건${rv ? `, 재방문 약속 ${rv}건` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}
