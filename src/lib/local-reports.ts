"use client";

import { useCallback, useState } from "react";
import { today } from "./format";
import { isOffDay } from "@/data/holidays";
import { dailySnippetSections, dailySnippetText } from "./snippets";
import type {
  CloseReport,
  LocalReportData,
  OpenReport,
  ReportDefaults,
  ReportSettings,
  SalesManager,
} from "@/types/report";

const STORAGE_KEY = "report-helper:v1";

export const DEFS_BASE: ReportDefaults = {
  weekdayTarget: 1,
  weekendTarget: 2,
  targetConversion: "7",
  monthTargets: {},
};

export function itemTarget(settings: ReportSettings, name: string, off: boolean): number {
  const df = { ...DEFS_BASE, ...(settings.defaults ?? {}) };
  const t = settings.items.find((i) => i.name === name);
  return off ? t?.we ?? df.weekendTarget : t?.wd ?? df.weekdayTarget;
}

export function defaultTarget(settings: ReportSettings, date: string, name: string): number {
  return itemTarget(settings, name, isOffDay(date, extraHolidayList(settings)));
}

export function extraHolidayList(settings: ReportSettings): string[] {
  return (settings.extraHolidays || "")
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x));
}

function defaultSettings(storeName: string): ReportSettings {
  return {
    storeName,
    items: [
      { name: "스마트폰", cat: "스마트폰" },
      { name: "패드", cat: "태블릿" },
      { name: "TV", cat: "TV" },
    ],
    inventoryNote: "휴대폰 및 태블릿 재고 이상 없습니다.",
  };
}

export function blankReportData(storeName: string): LocalReportData {
  return {
    example: false,
    settings: defaultSettings(storeName),
    opens: {},
    closes: {},
    records: {},
    managers: {},
    retros: {},
    favorites: [],
  };
}

export function latestBefore<T extends { date: string }>(rec: Record<string, T>, date: string): T | undefined {
  const keys = Object.keys(rec)
    .filter((k) => k < date)
    .sort();
  const k = keys.pop();
  return k ? rec[k] : undefined;
}

export function newOpen(data: LocalReportData, date: string): OpenReport {
  const pc = latestBefore(data.closes, date);
  const po = data.opens[date];
  const names = data.settings.items.map((i) => i.name);
  const prevNames = pc ? [...new Set([...names, ...pc.items.map((i) => i.name)])] : names;
  const df = { ...DEFS_BASE, ...(data.settings.defaults ?? {}) };
  return {
    date,
    prevConversion: pc?.conversion || "",
    prevSales: prevNames.map((n) => ({
      name: n,
      target: 0,
      actual: pc?.items.find((i) => i.name === n)?.actual ?? 0,
    })),
    targetGMV: po?.targetGMV || 0,
    targetConversion: df.targetConversion || po?.targetConversion || "7",
    targetItems: names.map((n) => ({ name: n, target: defaultTarget(data.settings, date, n), actual: 0 })),
    comment: dailySnippetText(data.settings.snippets || [], "open-comment"),
  };
}

export function newClose(data: LocalReportData, date: string): CloseReport {
  const o = data.opens[date];
  const pc = latestBefore(data.closes, date);
  const same = pc && pc.date.slice(0, 7) === date.slice(0, 7);
  const df = { ...DEFS_BASE, ...(data.settings.defaults ?? {}) };
  const itemNames = o ? o.targetItems.map((x) => x.name) : data.settings.items.map((i) => i.name);
  return {
    date,
    dayTargetGMV: o?.targetGMV || 0,
    dayGMV: 0,
    monthTargetGMV: df.monthTargets[date.slice(0, 7)] || (same ? pc!.monthTargetGMV : 0),
    monthGMV: same ? pc!.monthGMV : 0,
    items: itemNames.map((n) => ({
      name: n,
      target: o?.targetItems.find((x) => x.name === n)?.target ?? defaultTarget(data.settings, date, n),
      actual: 0,
    })),
    traffic: 0,
    visitors: 0,
    conversion: "",
    attachRate: "",
    aov: "",
    inventoryNote: dailySnippetText(data.settings.snippets || [], "close-inventory", data.settings.inventoryNote),
    inv: { phone: { diff: 0, reason: "" }, tablet: { diff: 0, reason: "" } },
    retail: 0,
    pos: 0,
    reasons: [],
    highlights: dailySnippetSections(data.settings.snippets || [], "close-highlight"),
    phoneInsights: dailySnippetSections(data.settings.snippets || [], "close-insight"),
    plans: dailySnippetSections(data.settings.snippets || [], "close-plan"),
    note: dailySnippetText(data.settings.snippets || [], "close-note"),
  };
}

export function getOpen(d: LocalReportData, date: string): OpenReport {
  return d.opens[date] || newOpen(d, date);
}
export function getClose(d: LocalReportData, date: string): CloseReport {
  const r = d.closes[date] || newClose(d, date);
  // phoneInsights는 나중에 추가된 필드라, 그 전에 저장된 마감보고에는 없을 수 있다.
  return { ...r, phoneInsights: r.phoneInsights ?? [] };
}
export function getMgr(d: LocalReportData, date: string): SalesManager {
  const existing = d.managers[date];
  const snippets = d.settings.snippets || [];
  return {
    cases: existing?.cases ?? {},
    manual: existing?.manual ?? [],
    summary: existing?.summary ?? null,
    sumForm: existing?.sumForm,
    plan: existing?.plan ?? dailySnippetText(snippets, "sales-plan"),
    note: existing?.note ?? dailySnippetText(snippets, "sales-note"),
    snippetVars: existing?.snippetVars ?? {},
  };
}

export function useLocalReports(storeName: string) {
  const [data, setData] = useState<LocalReportData>(() => {
    if (typeof window === "undefined") return blankReportData(storeName);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as LocalReportData;
    } catch {
      // ignore corrupt storage — fall through to blank
    }
    return blankReportData(storeName);
  });

  const update = useCallback((fn: (prev: LocalReportData) => LocalReportData) => {
    setData((prev) => {
      const next = fn(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (private mode 등) — 메모리 상태만 유지
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => update(() => blankReportData(storeName)), [update, storeName]);

  return { data, update, reset, today: today() };
}
