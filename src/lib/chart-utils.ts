import type { EffectiveProduct } from "./product-utils";
import type { MetricRow } from "@/types/product";

const normN = (t: string) =>
  (t || "")
    .toLowerCase()
    .replace(/샤오미|xiaomi|스마트|redmi|레드미/g, "")
    .replace(/[\s·()\-]/g, "");

const toks = (t: string) =>
  (t || "")
    .toLowerCase()
    .replace(/샤오미|xiaomi/g, " ")
    .split(/[\s·()]+/)
    .filter(Boolean);

/** METRICS 행(제품 이름 문자열)을 실제 제품/경쟁 제품 가격에 연결한다 (이름이 완전히 같지 않을 수 있어 느슨하게 매칭). */
export function priceOf(row: MetricRow, items: EffectiveProduct[]): { p: number; label: string } | null {
  const rn = normN(row.n);
  if (row.x) {
    let hit =
      items.find((p) => normN(p.name) === rn) ||
      items.filter((p) => normN(p.name).endsWith(rn)).sort((a, b) => a.name.length - b.name.length)[0];
    if (!hit) {
      const rt = toks(row.n);
      hit = items.filter((p) => rt.every((t) => toks(p.name).includes(t))).sort((a, b) => a.name.length - b.name.length)[0];
    }
    return hit && hit.p ? { p: hit.p, label: hit.name } : null;
  }
  const comps = items.flatMap((p) => p.comps).filter((c) => c.p);
  const rt = toks(row.n);
  const hit = comps.find((c) => normN(c.n) === rn) || comps.find((c) => normN(c.n).includes(rn)) || comps.find((c) => rt.every((t) => toks(c.n).includes(t)));
  return hit ? { p: hit.p as number, label: hit.n } : null;
}

/** 제품 이름으로 (성능)METRICS 행 중 이 제품(샤오미 쪽, x:true)에 해당하는 행을 찾는다. priceOf의 역방향. */
export function metricRowFor(productName: string, rows: MetricRow[]): MetricRow | null {
  const pn = normN(productName);
  const mine = rows.filter((r) => r.x);
  let hit = mine.find((r) => normN(r.n) === pn) || mine.filter((r) => normN(r.n).endsWith(pn)).sort((a, b) => a.n.length - b.n.length)[0];
  if (!hit) {
    const pt = toks(productName);
    hit = mine.filter((r) => pt.every((t) => toks(r.n).includes(t))).sort((a, b) => a.n.length - b.n.length)[0];
  }
  return hit || null;
}
