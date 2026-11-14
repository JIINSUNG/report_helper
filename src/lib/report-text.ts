import { won, comma } from "./format";
import { dailyVarSnippetSections, dailyVarSnippetText } from "./snippets";
import { DEFAULT_TEMPLATE, fillTitle, normalizeTemplate } from "./report-templates";
import type { CloseBlockId, CloseReport, CustomSectionDef, ItemTarget, OpenBlockId, OpenReport, ReportTemplate, Section, Snippet } from "@/types/report";

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

/** 블록별 줄들을 양식 순서대로 이어 붙인다. 꺼진 블록은 빼고, 맨 앞 빈 줄은 지운다(첫 줄 블록을 아래로 옮겼을 때). */
function assemble<I extends string>(blocks: { id: I; title: string; on: boolean }[], render: (id: I, title: string[]) => string[], date: string, store: string): string {
  const lines: string[] = [];
  for (const b of blocks) {
    if (!b.on) continue;
    const title = b.title.trim() ? fillTitle(b.title, date, store).split("\n") : [];
    lines.push(...render(b.id, title));
  }
  while (lines.length && lines[0] === "") lines.shift();
  return lines.join("\n");
}

export function openText(
  r: OpenReport,
  store: string,
  customDefs: CustomSectionDef[] = [],
  remainingFor: (defId: string) => number | null = () => null,
  snippets: Snippet[] = [],
  template: ReportTemplate = DEFAULT_TEMPLATE
): string {
  const comment = dailyVarSnippetText(snippets, "open-comment", r.snippetVars || {}, r.comment.trim(), r.snippetSkip || []);
  const render = (id: OpenBlockId, title: string[]): string[] => {
    switch (id) {
      case "header":
        return title;
      case "prev":
        // 제목이 "- 전일 전환율"이면 "- 전일 전환율 3.2%"처럼 같은 줄에 붙는다.
        return [title.length ? `${title.join(" ")} ${r.prevConversion}%` : `${r.prevConversion}%`, itemsLine(r.prevSales, "actual")];
      case "target":
        return ["", ...title, `GMV : ${won(r.targetGMV)}`, `전환율 : ${r.targetConversion}%`, itemsLine(r.targetItems, "target")];
      case "comment":
        return ["", ...title, comment];
      case "custom":
        return customSectionLines(r, customDefs, "open", remainingFor);
      case "footer":
        return ["", ...title];
    }
  };
  return assemble(normalizeTemplate(template).open, render, r.date, store);
}

export function closeText(
  r: CloseReport,
  store: string,
  def?: string,
  customDefs: CustomSectionDef[] = [],
  remainingFor: (defId: string) => number | null = () => null,
  snippets: Snippet[] = [],
  template: ReportTemplate = DEFAULT_TEMPLATE
): string {
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
  const skip = r.snippetSkip || [];
  const inventoryNote = dailyVarSnippetText(snippets, "close-inventory", vars, r.inventoryNote, skip);
  const hs = sectionsText(dailyVarSnippetSections(snippets, "close-highlight", vars, r.highlights, skip));
  const pis = sectionsText(dailyVarSnippetSections(snippets, "close-insight", vars, r.phoneInsights || [], skip));
  const ps = sectionsText(dailyVarSnippetSections(snippets, "close-plan", vars, r.plans, skip));
  const note = dailyVarSnippetText(snippets, "close-note", vars, r.note.trim(), skip);
  const render = (id: CloseBlockId, title: string[]): string[] => {
    switch (id) {
      case "header":
        return title;
      case "salesHead":
        return ["", ...title];
      case "day":
        return [...title, `일 목표 GMV: ${won(r.dayTargetGMV)}`, `일 달성 GMV: ${won(r.dayGMV)}(${pctStr(r.dayGMV, r.dayTargetGMV)})`, ""];
      case "month":
        return [...title, `월 목표 GMV: ${won(r.monthTargetGMV)}`, `월 누적 GMV: ${won(r.monthGMV)}(${pctStr(r.monthGMV, r.monthTargetGMV)})`, ""];
      case "items":
        return [...title, `목표: ${itemsLine(r.items, "target")}`, `달성: ${itemsLine(r.items, "actual")}`, ""];
      case "ops":
        return [
          ...title,
          `- 트래픽: ${comma(r.traffic)}`,
          `- 입점 고객 수: ${comma(r.visitors)}`,
          `- 전환율: ${r.conversion}%`,
          `- 연계율: ${r.attachRate}`,
          `- 객단가: ${r.aov}`,
          ...invLines({ ...r, inventoryNote }, def).map((x) => `- ${x}`),
          `- 금일 리테일 ${won(r.retail)}, 포스기 ${won(r.pos)} 기록하였습니다.`,
          ...dl,
          "",
        ];
      case "highlights":
        return [...title, "", ...(hs ? [hs] : [])];
      case "insights":
        return [...title, "", ...(pis ? [pis] : [])];
      case "plans":
        return [...title, "", ...(ps ? [ps] : [])];
      case "note":
        return note ? [...title, ...note.split("\n").map((x) => "- " + x.replace(/^-\s*/, ""))] : [];
      case "custom":
        return customSectionLines(r, customDefs, "close", remainingFor);
      case "footer":
        return title;
    }
  };
  return assemble(normalizeTemplate(template).close, render, r.date, store);
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
