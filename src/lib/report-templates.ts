// 보고서 양식(복사되는 텍스트의 블록 순서·켜기/끄기·제목 문구) — 여러 개 만들어두고 골라 쓴다.
// 기본 양식(DEFAULT_TEMPLATE)은 양식 기능이 생기기 전의 보고서 텍스트와 글자 하나까지 똑같이 나오도록 맞춰져 있다.
import { uid } from "./format";
import type { CloseBlockId, OpenBlockId, ReportSettings, ReportTemplate, TemplateBlock } from "@/types/report";

export const OPEN_BLOCK_LABEL: Record<OpenBlockId, string> = {
  header: "첫 줄(날짜·매장)",
  prev: "전일 실적",
  target: "금일 목표",
  comment: "코멘트",
  custom: "커스텀 항목",
  footer: "끝맺음",
};

export const CLOSE_BLOCK_LABEL: Record<CloseBlockId, string> = {
  header: "첫 줄(날짜·매장)",
  salesHead: "판매 데이터 머리말",
  day: "일간 누적 실적",
  month: "월간 누적 실적",
  items: "목표/달성",
  ops: "운영 데이터(트래픽·재고·리테일/포스)",
  highlights: "금일 핵심 내용",
  insights: "금일 스마트폰 인사이트",
  plans: "익일 계획",
  note: "특이사항",
  custom: "커스텀 항목",
  footer: "끝맺음",
};

/** 제목이 의미 없는(내용만 있는) 블록 — 제목 칸을 안 보여준다. */
export const UNTITLED_BLOCKS = new Set<string>(["custom"]);

const OPEN_DEFAULT: TemplateBlock<OpenBlockId>[] = [
  { id: "header", title: "[{yy}년 {m}월 {d}일] {store} 오픈보고", on: true },
  { id: "prev", title: "- 전일 전환율", on: true },
  { id: "target", title: "- 금일 목표", on: true },
  { id: "comment", title: "- 코멘트", on: true },
  { id: "custom", title: "", on: true },
  { id: "footer", title: "이상입니다.", on: false },
];

const CLOSE_DEFAULT: TemplateBlock<CloseBlockId>[] = [
  { id: "header", title: "[{yyyy}년 {m}월 {d}일]\n{store} 일일 보고서", on: true },
  { id: "salesHead", title: "[판매 데이터]", on: true },
  { id: "day", title: "일간 누적 실적", on: true },
  { id: "month", title: "월간 누적 실적", on: true },
  { id: "items", title: "목표/달성", on: true },
  { id: "ops", title: "운영 데이터", on: true },
  { id: "highlights", title: "[금일 핵심 내용]", on: true },
  { id: "insights", title: "[금일 스마트폰 인사이트]", on: true },
  { id: "plans", title: "[익일계획]", on: true },
  { id: "note", title: "[특이사항]", on: true },
  { id: "custom", title: "", on: true },
  { id: "footer", title: "이상입니다.", on: true },
];

export const DEFAULT_TEMPLATE_ID = "default";

export const DEFAULT_TEMPLATE: ReportTemplate = {
  id: DEFAULT_TEMPLATE_ID,
  name: "1번 보고서 양식",
  open: OPEN_DEFAULT,
  close: CLOSE_DEFAULT,
};

/** 저장된 블록 목록에 빠진 블록(나중에 생긴 블록 등)이 있으면 기본값으로 채워 넣는다. 모르는 블록은 버린다. */
function completeBlocks<I extends string>(saved: TemplateBlock<I>[] | undefined, defaults: TemplateBlock<I>[]): TemplateBlock<I>[] {
  const known = new Set(defaults.map((b) => b.id));
  const list = (saved ?? []).filter((b) => known.has(b.id));
  const missing = defaults.filter((d) => !list.some((b) => b.id === d.id));
  return [...list, ...missing.map((b) => ({ ...b }))];
}

export function normalizeTemplate(t: ReportTemplate): ReportTemplate {
  return { ...t, open: completeBlocks(t.open, OPEN_DEFAULT), close: completeBlocks(t.close, CLOSE_DEFAULT) };
}

export function templateList(settings: ReportSettings): ReportTemplate[] {
  const list = settings.templates?.length ? settings.templates : [DEFAULT_TEMPLATE];
  return list.map(normalizeTemplate);
}

export function activeTemplate(settings: ReportSettings): ReportTemplate {
  const list = templateList(settings);
  return list.find((t) => t.id === settings.activeTemplateId) ?? list[0];
}

/** 새 양식 — 기준 양식을 그대로 복제하고 이름만 "N번 보고서 양식"으로. */
export function duplicateTemplate(settings: ReportSettings, baseId?: string, name?: string, id: string = uid()): { settings: ReportSettings; id: string } {
  const list = templateList(settings);
  const base = list.find((t) => t.id === baseId) ?? activeTemplate(settings);
  const copy: ReportTemplate = {
    id,
    name: name?.trim() || `${list.length + 1}번 보고서 양식`,
    open: base.open.map((b) => ({ ...b })),
    close: base.close.map((b) => ({ ...b })),
  };
  return { settings: { ...settings, templates: [...list, copy] }, id };
}

export function saveTemplate(settings: ReportSettings, tpl: ReportTemplate): ReportSettings {
  const list = templateList(settings);
  return { ...settings, templates: list.map((t) => (t.id === tpl.id ? normalizeTemplate(tpl) : t)) };
}

/** 마지막 하나는 못 지운다. 지금 쓰던 양식을 지우면 남은 첫 양식으로 바꾼다. */
export function deleteTemplate(settings: ReportSettings, id: string): ReportSettings {
  const list = templateList(settings);
  if (list.length <= 1) return settings;
  const rest = list.filter((t) => t.id !== id);
  const activeId = settings.activeTemplateId && settings.activeTemplateId !== id ? settings.activeTemplateId : rest[0].id;
  return { ...settings, templates: rest, activeTemplateId: activeId };
}

export function selectTemplate(settings: ReportSettings, id: string): ReportSettings {
  return { ...settings, templates: templateList(settings), activeTemplateId: id };
}

/** 블록 하나를 위/아래로. */
export function moveBlock<I extends string>(blocks: TemplateBlock<I>[], index: number, dir: -1 | 1): TemplateBlock<I>[] {
  const j = index + dir;
  if (j < 0 || j >= blocks.length) return blocks;
  const next = [...blocks];
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

const WD = "일월화수목금토";

/** 제목의 {yyyy}{yy}{m}{d}{요일}{store} 변수를 채운다. */
export function fillTitle(title: string, date: string, store: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const wd = WD[new Date(y, m - 1, d).getDay()];
  return title
    .replaceAll("{yyyy}", String(y))
    .replaceAll("{yy}", String(y).slice(2))
    .replaceAll("{m}", String(m))
    .replaceAll("{d}", String(d))
    .replaceAll("{요일}", wd)
    .replaceAll("{store}", store);
}

export const TITLE_VARS = ["{yyyy}", "{yy}", "{m}", "{d}", "{요일}", "{store}"];
