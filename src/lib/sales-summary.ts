import { SUM_CTX, SUM_PURPOSE } from "@/data/sales-summary-options";
import type { SalesManager, SalesRecord, SummaryForm, SummarySlot } from "@/types/report";

export const emptySlot = (): SummarySlot => ({ who: [], ctx: [], purpose: [], memo: "" });

export function getSumForm(mg: SalesManager): SummaryForm {
  return { am: emptySlot(), pm: emptySlot(), strong: { cats: [], ask: "", result: "", memo: "" }, ...(mg.sumForm ?? {}) };
}

function josa(w: string, a: string, b: string) {
  const c = (w || "").trim().slice(-1).charCodeAt(0);
  if (!(c >= 0xac00 && c <= 0xd7a3)) return w + b;
  return w + ((c - 0xac00) % 28 ? a : b);
}

function slotSentence(label: string, x: SummarySlot): string {
  if (!x.who.length && !x.ctx.length && !x.purpose.length && !x.memo.trim()) return "";
  const who = x.who.length ? x.who.join(", ") + " 고객님들이" : "다양한 고객님들이";
  const ctx = x.ctx.map((c) => SUM_CTX[c] || c).join(", ");
  const pur = x.purpose.map((p) => SUM_PURPOSE[p] || p);
  let t = `${label}에는 ${who} ${ctx ? ctx + " " : ""}많이 방문해주셨`;
  t += pur.length ? `고, ${josa(pur.join(", "), "이", "가")} 많았습니다.` : "습니다.";
  if (x.memo.trim()) t += " " + x.memo.trim().replace(/([^.])$/, "$1.");
  return t;
}

function strongSentence(st: SummaryForm["strong"]): string {
  const topic = st.ask.trim() || st.cats.join("·");
  if (!topic && !st.result.trim() && !st.memo.trim()) return "";
  let t: string;
  if (topic && st.result.trim()) t = `오늘은 ${topic} 문의 고객이 많아 적극적으로 응대한 결과 ${st.result.trim()} 판매에 성공했습니다.`;
  else if (topic) t = `오늘은 ${topic} 문의 고객이 많아 적극적으로 응대하였습니다.`;
  else t = `오늘은 ${st.result.trim()} 판매에 성공했습니다.`;
  if (st.memo.trim()) t += " " + st.memo.trim().replace(/([^.])$/, "$1.");
  return t;
}

export function formSummary(f: SummaryForm): string {
  return [slotSentence("오전", f.am), slotSentence("오후", f.pm), strongSentence(f.strong)]
    .filter(Boolean)
    .map((x) => "- " + x)
    .join("\n");
}

export function recHints(recs: SalesRecord[]) {
  const am = recs.filter((r) => (r.time || "") < "13:00");
  const pm = recs.filter((r) => (r.time || "") >= "13:00");
  const who = (rs: SalesRecord[]) => {
    const m: Record<string, number> = {};
    rs.forEach((r) => {
      const k = r.party === "가족" ? "가족 단위" : r.party === "커플" ? "커플" : [r.age, r.gender].filter(Boolean).join(" ");
      if (k) m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
  };
  const sold: Record<string, number> = {};
  recs.filter((r) => r.result === "buy").forEach((r) => {
    const k = r.product || r.cat;
    sold[k] = (sold[k] || 0) + r.qty;
  });
  const cats: Record<string, number> = {};
  recs.forEach((r) => {
    cats[r.cat] = (cats[r.cat] || 0) + 1;
  });
  return {
    am: who(am),
    pm: who(pm),
    amN: am.length,
    pmN: pm.length,
    sold: Object.entries(sold).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}대`).join(", "),
    topCat: Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0] || "",
  };
}
