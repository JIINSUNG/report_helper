import { parts, won, comma } from "./format";
import { dailyVarSnippetSections, dailyVarSnippetText } from "./snippets";
import type { CloseReport, CustomSectionDef, ItemTarget, OpenReport, Section, Snippet } from "@/types/report";

export const itemsLine = (it: ItemTarget[], k: "target" | "actual") =>
  it.map((i) => `${i.name} ${i[k]}대`).join(", ");

export const sectionsText = (ss: Section[]) => {
  let n = 0;
  return ss
    .filter((s) => s.t.trim() || s.b.some((x) => x.trim()))
    .map((s) => {
      const head = s.numbered === false ? s.t.trim() : `${++n}. ${s.t.trim()}`;
      return `${head}\n\n${s.b.filter((x) => x.trim()).map((x) => "- " + x.trim()).join("\n")}`;
    })
    .join("\n");
};

export const diffOf = (r: CloseReport) => r.pos - r.retail;
export const reasonSum = (rs: CloseReport["reasons"]) =>
  rs.reduce((s, x) => s + (x.side === "pos" ? 1 : -1) * (x.sign ?? 1) * x.amount, 0);
export const signed = (n: number) => (n > 0 ? "+" : n < 0 ? "-" : "") + won(Math.abs(n));

const INV_LABEL: Record<string, string> = { phone: "휴대폰", tablet: "태블릿" };

export function invLines(r: CloseReport, def?: string): string[] {
  if (!r.inv) return [(r.inventoryNote || def || "").trim()];
  const ks = Object.keys(INV_LABEL);
  const bad = ks.filter((k) => r.inv![k] && r.inv![k].diff);
  if (!bad.length) return [(def || "휴대폰 및 태블릿 재고 이상 없습니다.").trim()];
  return ks.map((k) => {
    const v = r.inv![k] || { diff: 0, reason: "" };
    if (!v.diff) return `${INV_LABEL[k]} 재고 이상 없습니다.`;
    return `${INV_LABEL[k]} 재고 ${v.diff > 0 ? "+" : ""}${v.diff}대 차이 있습니다.${
      v.reason && v.reason.trim() ? ` (사유: ${v.reason.trim()})` : ""
    }`;
  });
}

/** 사용자가 설정에서 직접 정의한 커스텀 섹션(텍스트 목록/금액 관리)을 보고서 텍스트에 덧붙인다. */
function customSectionLines(
  r: { customText?: Record<string, Section[]>; customAmount?: Record<string, { amount: number; note: string }> },
  defs: CustomSectionDef[],
  scope: "open" | "close",
  remainingFor: (defId: string) => number | null
): string[] {
  const out: string[] = [];
  defs
    .filter((d) => d.appliesTo === scope || d.appliesTo === "both")
    .forEach((d) => {
      if (d.type === "sections") {
        const txt = sectionsText(r.customText?.[d.id] || []);
        if (txt) out.push("", `[${d.label}]`, "", txt);
      } else {
        const v = r.customAmount?.[d.id];
        if (v && (v.amount || v.note.trim())) {
          const remain = remainingFor(d.id);
          out.push(
            "",
            `[${d.label}]`,
            `- 오늘 사용: ${won(v.amount)}${v.note.trim() ? ` (${v.note.trim()})` : ""}`,
            ...(remain != null ? [`- 남은 금액: ${won(remain)}`] : [])
          );
        }
      }
    });
  return out;
}

export function openText(
  r: OpenReport,
  store: string,
  customDefs: CustomSectionDef[] = [],
  remainingFor: (defId: string) => number | null = () => null,
  snippets: Snippet[] = []
): string {
  const [y, m, d] = parts(r.date);
  const comment = dailyVarSnippetText(snippets, "open-comment", r.snippetVars || {}, r.comment.trim());
  return [
    `[${String(y).slice(2)}년 ${m}월 ${d}일] ${store} 오픈보고`,
    `- 전일 전환율 ${r.prevConversion}%`,
    itemsLine(r.prevSales, "actual"),
    "",
    "- 금일 목표",
    `GMV : ${won(r.targetGMV)}`,
    `전환율 : ${r.targetConversion}%`,
    itemsLine(r.targetItems, "target"),
    "",
    "- 코멘트",
    comment,
    ...customSectionLines(r, customDefs, "open", remainingFor),
  ].join("\n");
}

export function closeText(
  r: CloseReport,
  store: string,
  def?: string,
  customDefs: CustomSectionDef[] = [],
  remainingFor: (defId: string) => number | null = () => null,
  snippets: Snippet[] = []
): string {
  const [y, m, d] = parts(r.date);
  const diff = diffOf(r);
  const dl =
    diff === 0
      ? ["- 리테일과 포스간 금액 차액 없습니다."]
      : [
          `- 리테일과 포스간 금액 차액 ${signed(diff)} 있습니다.`,
          "- 사유는 아래와 같습니다.",
          ...r.reasons
            .filter((x) => x.text.trim())
            .map((x) => `- ${x.text.trim()} ${x.side === "retail" ? "리테일" : "포스기"} ${(x.sign ?? 1) < 0 ? "-" : "+"}${won(x.amount)}`),
        ];
  const vars = r.snippetVars || {};
  const inventoryNote = dailyVarSnippetText(snippets, "close-inventory", vars, r.inventoryNote);
  const hs = sectionsText(dailyVarSnippetSections(snippets, "close-highlight", vars, r.highlights));
  const pis = sectionsText(dailyVarSnippetSections(snippets, "close-insight", vars, r.phoneInsights || []));
  const ps = sectionsText(dailyVarSnippetSections(snippets, "close-plan", vars, r.plans));
  const note = dailyVarSnippetText(snippets, "close-note", vars, r.note.trim());
  return [
    `[${y}년 ${m}월 ${d}일]`,
    `${store} 일일 보고서`,
    "",
    "[판매 데이터]",
    "일간 누적 실적",
    `일 목표 GMV: ${won(r.dayTargetGMV)}`,
    `일 달성 GMV: ${won(r.dayGMV)}(${pctStr(r.dayGMV, r.dayTargetGMV)})`,
    "",
    "월간 누적 실적",
    `월 목표 GMV: ${won(r.monthTargetGMV)}`,
    `월 누적 GMV: ${won(r.monthGMV)}(${pctStr(r.monthGMV, r.monthTargetGMV)})`,
    "",
    "목표/달성",
    `목표: ${itemsLine(r.items, "target")}`,
    `달성: ${itemsLine(r.items, "actual")}`,
    "",
    "운영 데이터",
    `- 트래픽: ${comma(r.traffic)}`,
    `- 입점 고객 수: ${comma(r.visitors)}`,
    `- 전환율: ${r.conversion}%`,
    `- 연계율: ${r.attachRate}`,
    `- 객단가: ${r.aov}`,
    ...invLines({ ...r, inventoryNote }, def).map((x) => `- ${x}`),
    `- 금일 리테일 ${won(r.retail)}, 포스기 ${won(r.pos)} 기록하였습니다.`,
    ...dl,
    "",
    "[금일 핵심 내용]",
    "",
    ...(hs ? [hs] : []),
    "[금일 스마트폰 인사이트]",
    "",
    ...(pis ? [pis] : []),
    "[익일계획]",
    "",
    ...(ps ? [ps] : []),
    ...(note ? ["[특이사항]", ...note.split("\n").map((x) => "- " + x.replace(/^-\s*/, ""))] : []),
    ...customSectionLines(r, customDefs, "close", remainingFor),
    "이상입니다.",
  ].join("\n");
}

function pctStr(a: number, b: number) {
  return b ? ((a / b) * 100).toFixed(1) + "%" : "0%";
}

export interface CaseFields {
  info: string;
  need: string;
  offer: string;
  result: string;
  comment: string;
}

export function caseText(f: CaseFields): string {
  return [
    ["고객정보", f.info],
    ["고객니즈", f.need],
    ["제안내용", f.offer],
    ["판매결과", f.result],
    ["코멘트", f.comment],
  ]
    .filter(([, v]) => v.trim())
    .map(([l, v]) => `· ${l}: ${v.trim()}`)
    .join("\n");
}
