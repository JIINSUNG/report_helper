"use client";

import { won } from "@/lib/format";
import { metricRowFor } from "@/lib/chart-utils";
import type { EffectiveProduct } from "@/lib/product-utils";
import type { Metric } from "@/types/product";

const rankText = (rank: number, total: number) => `${total}개 중 ${rank}위`;

export function ProductCompareCard({ p, metrics }: { p: EffectiveProduct; metrics: Metric[] }) {
  const pricedComps = p.comps.filter((c) => c.p);
  const metricRows = metrics
    .map((m) => ({ m, mine: metricRowFor(p.name, m.rows) }))
    .filter((x): x is { m: Metric; mine: NonNullable<ReturnType<typeof metricRowFor>> } => !!x.mine);

  if (!pricedComps.length && !metricRows.length) return null;

  return (
    <div className="box">
      <span className="sub">{p.name} 기준으로 보기</span>

      {pricedComps.length > 0 &&
        (() => {
          const all = [{ n: p.name, v: p.p || 0, mine: true }, ...pricedComps.map((c) => ({ n: c.n, v: c.p as number, mine: false }))];
          const sorted = [...all].sort((a, b) => a.v - b.v);
          const myRank = sorted.findIndex((x) => x.mine) + 1;
          const max = Math.max(...all.map((x) => x.v));
          return (
            <div style={{ marginTop: 4 }}>
              {sorted.map((x) => (
                <div className="bl" key={x.n}>
                  <span className={"bn" + (x.mine ? " me" : "")}>
                    {x.mine ? "⭐ " : ""}
                    {x.n}
                  </span>
                  <div className="tr">
                    <div className="track">
                      <div className={"b " + (x.mine ? "x" : "c")} style={{ width: Math.max(1.5, (x.v / max) * 100) + "%" }} />
                    </div>
                    <span className="bv">{won(x.v)}</span>
                  </div>
                </div>
              ))}
              <p className="hint" style={{ margin: 0 }}>
                가격 기준 {rankText(myRank, sorted.length)} (낮을수록 저렴)
              </p>
            </div>
          );
        })()}

      {metricRows.map(({ m, mine }) => {
        const sorted = [...m.rows].filter((r) => r.v > 0).sort((a, b) => (m.low ? a.v - b.v : b.v - a.v));
        const myRank = sorted.findIndex((r) => r.n === mine.n) + 1;
        const max = Math.max(...sorted.map((r) => r.v));
        return (
          <div key={m.id} style={{ marginTop: 10 }}>
            <span className="sub">
              {m.label} ({m.unit})
            </span>
            {sorted.map((r) => (
              <div className="bl" key={r.n}>
                <span className={"bn" + (r.n === mine.n ? " me" : "")}>
                  {r.n === mine.n ? "⭐ " : ""}
                  {r.n}
                </span>
                <div className="tr">
                  <div className="track">
                    <div className={"b " + (r.x ? "x" : "c")} style={{ width: Math.max(1.5, (r.v / max) * 100) + "%" }} />
                  </div>
                  <span className="bv">
                    {r.v}
                    {m.unit}
                  </span>
                </div>
              </div>
            ))}
            <p className="hint" style={{ margin: 0 }}>
              {m.label} 기준 {rankText(myRank, sorted.length)} {m.low ? "(낮을수록 좋음)" : "(높을수록 좋음)"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
