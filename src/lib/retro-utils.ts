import { parts, won, pct } from "./format";
import { MOODS } from "@/data/retro-hints";
import { dailySnippetText, dailyVarSnippetText } from "./snippets";
import type { LocalReportData, Retro } from "@/types/report";

export function getRetro(d: LocalReportData, date: string): Retro {
  const e = d.retros[date];
  return {
    dayType: e?.dayType ?? "work",
    mode: e?.mode ?? "kpt",
    mood: e?.mood ?? 0,
    day: e?.day ?? "",
    did: e?.did ?? dailySnippetText(d.settings.snippets || [], "retro-did"),
    issues: e?.issues ?? "",
    keep: e?.keep ?? "",
    problem: e?.problem ?? "",
    try: e?.try ?? "",
    s: e?.s ?? "",
    t: e?.t ?? "",
    a: e?.a ?? "",
    r: e?.r ?? "",
    learn: e?.learn ?? "",
    triedPrev: e?.triedPrev ?? {},
    snippetVars: e?.snippetVars ?? {},
    snippetSkip: e?.snippetSkip ?? [],
  };
}

export const lines = (t: string) =>
  (t || "")
    .split("\n")
    .map((x) => x.replace(/^\s*[-·•]\s*/, "").trim())
    .filter(Boolean);

export function prevRetro(d: LocalReportData, date: string) {
  const ks = Object.keys(d.retros || {})
    .filter((k) => k < date && lines(getRetro(d, k).try).length)
    .sort();
  const k = ks.pop();
  return k ? { date: k, r: getRetro(d, k) } : null;
}

export function didSummary(d: LocalReportData, date: string): string {
  const recs = d.records[date] || [];
  const c = d.closes[date];
  const buy = recs.filter((r) => r.result === "buy");
  const out: string[] = [];
  if (recs.length)
    out.push(`- 상담 기록 ${recs.length}건, 구매 ${buy.length}건${buy.length ? ` (${buy.map((r) => r.product || r.cat).join(", ")})` : ""}`);
  if (c && c.dayGMV) out.push(`- 일 GMV ${won(c.dayGMV)} (목표 대비 ${pct(c.dayGMV, c.dayTargetGMV)})`);
  if (c && c.highlights && c.highlights.length) out.push(...c.highlights.filter((h) => h.t.trim()).map((h) => `- ${h.t.trim()}`));
  return out.join("\n");
}

export function retroText(d: LocalReportData, date: string): string {
  const r = getRetro(d, date);
  const [, m, dd] = parts(date);
  const sec = (l: string, v: string) => (v.trim() ? [`■ ${l}`, v.trim(), ""] : []);
  const body =
    r.mode === "star"
      ? [...sec("상황 (S)", r.s), ...sec("과제 (T)", r.t), ...sec("행동 (A)", r.a), ...sec("결과 (R)", r.r), ...sec("배운 점", r.learn)]
      : [...sec("Keep · 잘된 점", r.keep), ...sec("Problem · 부족했던 점", r.problem), ...sec("Try · 다음에 해볼 것", r.try)];
  const pv = prevRetro(d, date);
  const tried = pv ? lines(pv.r.try).map((t, i) => `${r.triedPrev[i] ? "✓" : "·"} ${t}`).join("\n") : "";
  const anyTried = pv && Object.values(r.triedPrev).some(Boolean);
  const did = dailyVarSnippetText(d.settings.snippets || [], "retro-did", r.snippetVars || {}, r.did, r.snippetSkip || []);
  return [
    `[${m}월 ${dd}일 회고${r.dayType === "off" ? " · 쉬는 날" : r.dayType === "work" ? " · 근무일" : ""}]${
      r.mood ? ` 오늘 기분: ${MOODS[r.mood - 1]}` : ""
    }`,
    "",
    ...sec("오늘 하루", r.day),
    ...sec("오늘 한 일", did),
    ...sec("걸리는 일 · 찜찜했던 일", r.issues),
    ...(anyTried ? sec("지난 Try 실천", tried) : []),
    ...body,
  ]
    .join("\n")
    .trim();
}
