"use client";

import { useState } from "react";
import { won } from "@/lib/format";
import { priceOf } from "@/lib/chart-utils";
import type { EffectiveProduct } from "@/lib/product-utils";
import type { Metric, MetricRow } from "@/types/product";

const W = 340;
const H = 230;
const L = 40;
const Rr = 12;
const T = 14;
const B = 34;

function nice(mx: number): number[] {
  const raw = mx / 4;
  const e = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / e;
  const st = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e;
  const a: number[] = [];
  for (let v = 0; v <= mx; v += st) a.push(v);
  return a;
}

function short(n: string) {
  const t = n.replace(/^(샤오미|Xiaomi)\s+/, "");
  return t.length > 12 ? t.slice(0, 11) + "…" : t;
}

function tw(t: string) {
  return [...t].reduce((w, ch) => w + (/[ㄱ-힣]/.test(ch) ? 9.4 : 5.6), 0) + 4;
}

export function ScatterChart({ metrics, items }: { metrics: Metric[]; items: EffectiveProduct[] }) {
  const usable = metrics.filter((m) => m.rows.filter((r) => r.v > 0 && priceOf(r, items)).length >= 2);
  const [mid, setMid] = useState<string | undefined>(usable[0]?.id);
  const [sel, setSel] = useState<string | null>(null);
  if (!usable.length) return <p className="hint">가격과 연결되는 성능 지표가 아직 부족해요. 경쟁 제품 가격을 넣으면 그래프가 생겨요.</p>;
  const m = usable.find((x) => x.id === mid) || usable[0];

  const seen = new Set<string>();
  const pts: (MetricRow & { price: number })[] = [];
  const miss: string[] = [];
  m.rows.forEach((r) => {
    if (!(r.v > 0) || seen.has(r.n)) return;
    seen.add(r.n);
    const pr = priceOf(r, items);
    if (pr) pts.push({ ...r, price: pr.p });
    else miss.push(r.n);
  });

  if (!pts.length) return <p className="hint">가격과 연결되는 성능 지표가 아직 부족해요.</p>;

  const xmax = Math.max(...pts.map((p) => p.price)) * 1.08;
  const ymax = Math.max(...pts.map((p) => p.v)) * 1.12;
  const X = (v: number) => L + (v / xmax) * (W - L - Rr);
  const Y = (v: number) => H - B - (v / ymax) * (H - T - B);
  const xt = nice(xmax);
  const yt = nice(ymax);
  const fmtY = (v: number) => `${(+v.toFixed(2)).toLocaleString("ko-KR")}${m.unit === "점" ? "" : m.unit}`;

  const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const labels: Record<string, { x: number; anchor: "start" | "end" }> = {};
  [...pts]
    .sort((a, b) => b.price - a.price)
    .forEach((p) => {
      const w = tw(short(p.n));
      const h = 11;
      const cx = X(p.price);
      const cy = Y(p.v);
      for (const [dx, anchor] of [
        [7, "start"] as const,
        [-7, "end"] as const,
      ]) {
        const x0 = anchor === "start" ? cx + dx : cx + dx - w;
        const b = { x0, y0: cy - h / 2 - 1, x1: x0 + w, y1: cy + h / 2 };
        if (b.x0 < L - 2 || b.x1 > W) continue;
        const overlapsBox = boxes.some((o) => !(b.x1 < o.x0 || b.x0 > o.x1 || b.y1 < o.y0 || b.y0 > o.y1));
        const overlapsPoint = pts.some((q) => q !== p && X(q.price) > b.x0 - 7 && X(q.price) < b.x1 + 7 && Y(q.v) > b.y0 - 7 && Y(q.v) < b.y1 + 7);
        if (!overlapsBox && !overlapsPoint) {
          boxes.push(b);
          labels[p.n] = { x: cx + dx, anchor };
          break;
        }
      }
    });

  const S = sel ? pts.find((p) => p.n === sel) : null;

  return (
    <div className="pc">
      {usable.length > 1 && (
        <div className="seg" style={{ flexWrap: "wrap" }}>
          {usable.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === m.id}
              onClick={() => {
                setMid(x.id);
                setSel(null);
              }}
            >
              {x.label}
            </button>
          ))}
        </div>
      )}
      <div className="legend">
        <span>
          <i className="sw x" />
          샤오미
        </span>
        <span>
          <i className="sw c" />
          경쟁 제품
        </span>
        <span className="sub">{m.low ? "↓ 아래·왼쪽일수록 좋음" : "↖ 위·왼쪽일수록 가성비 좋음"}</span>
      </div>
      <svg className="scatter" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`가격 대비 ${m.label} 산점도`}>
        {yt.map((v) => (
          <g key={"y" + v}>
            <line x1={L} x2={W - Rr} y1={Y(v)} y2={Y(v)} className="grid" />
            <text x={L - 5} y={Y(v) + 3.5} className="ax" textAnchor="end">
              {v >= 1000 ? v / 1000 + "k" : +v.toFixed(2)}
            </text>
          </g>
        ))}
        {xt.map((v) => (
          <g key={"x" + v}>
            <line x1={X(v)} x2={X(v)} y1={T} y2={H - B} className="grid" />
            <text x={X(v)} y={H - B + 14} className="ax" textAnchor="middle">
              {v >= 10000 ? Math.round(v / 10000) + "만" : v}
            </text>
          </g>
        ))}
        <text x={(L + W - Rr) / 2} y={H - 4} className="ax t" textAnchor="middle">
          가격 (원)
        </text>
        <text x={10} y={T - 3} className="ax t">
          {m.label} ({m.unit})
        </text>
        {pts.map((p) => (
          <g
            key={p.n}
            className={"pt" + (sel === p.n ? " on" : "")}
            onClick={() => setSel(sel === p.n ? null : p.n)}
            onMouseEnter={() => setSel(p.n)}
            tabIndex={0}
            role="button"
            aria-label={`${p.n} ${won(p.price)} ${fmtY(p.v)}`}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(p.n)}
          >
            <circle cx={X(p.price)} cy={Y(p.v)} r={14} className="hit" />
            <circle cx={X(p.price)} cy={Y(p.v)} r={sel === p.n ? 6.5 : 5} className={p.x ? "dx" : "dc"} />
            {labels[p.n] && (
              <text x={labels[p.n].x} y={Y(p.v) + 3.5} textAnchor={labels[p.n].anchor} className={"lb" + (p.x ? " me" : "")}>
                {short(p.n)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="sdetail">
        {S ? (
          <>
            <b>{S.n}</b>
            <span>
              {won(S.price)} · {m.label} {fmtY(S.v)}
              {S.sub ? ` (${S.sub})` : ""}
            </span>
          </>
        ) : (
          <span className="sub">점을 누르면 제품 이름과 수치가 나와요</span>
        )}
      </div>
      <details className="stable">
        <summary>표로 보기</summary>
        <table>
          <thead>
            <tr>
              <th>제품</th>
              <th>가격</th>
              <th>{m.label}</th>
            </tr>
          </thead>
          <tbody>
            {[...pts]
              .sort((a, b) => a.price - b.price)
              .map((p) => (
                <tr key={p.n}>
                  <td>
                    {p.x ? "● " : "○ "}
                    {p.n}
                  </td>
                  <td>{won(p.price)}</td>
                  <td>{fmtY(p.v)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
      <p className="hint">
        {m.note}
        {miss.length ? ` · 가격이 없어 빠진 제품: ${miss.join(", ")}` : ""}
      </p>
    </div>
  );
}
