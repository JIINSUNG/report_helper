"use client";

import { useState } from "react";
import type { Metric } from "@/types/product";
import { METRIC_GUIDES } from "@/data/metric-guides";

export function MetricChart({ metrics, groupId }: { metrics: Metric[]; groupId: string }) {
  const [mid, setMid] = useState(metrics[0].id);
  const m = metrics.find((x) => x.id === mid) || metrics[0];
  const guideTiers = METRIC_GUIDES[`${groupId}:${m.id}`];
  const rows = [...m.rows].sort((a, b) => (m.low ? a.v - b.v : b.v - a.v));
  const max = Math.max(...rows.map((r) => r.v)) || 1;
  const fmt = (v: number) => `${v.toLocaleString("ko-KR")}${m.unit === "점" ? "" : m.unit}`;
  const hasComp = rows.some((r) => !r.x);

  return (
    <div className="pc">
      {metrics.length > 1 && (
        <div className="seg" style={{ flexWrap: "wrap" }}>
          {metrics.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === m.id} onClick={() => setMid(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <p className="hint" style={{ margin: 0, color: "var(--fg2)" }}>
        {m.desc}
      </p>
      {hasComp && (
        <div className="legend">
          <span>
            <i className="sw x" />
            샤오미
          </span>
          <span>
            <i className="sw c" />
            경쟁 제품
          </span>
        </div>
      )}
      <div className="mrows">
        {rows.map((r, i) => (
          <div className="bl" key={r.n + i}>
            <span className={"bn" + (r.x ? " me" : "")}>
              {r.n}
              {(r.sub || r.rel) && (
                <small>
                  {r.sub}
                  {r.sub && r.rel ? " · " : ""}
                  {r.rel && `${r.rel} 출시`}
                </small>
              )}
            </span>
            <div className="tr">
              <div className="track">
                {r.v > 0 && (
                  <div
                    className={"b " + (r.x ? "x" : "c")}
                    style={{ width: `${Math.max(1.5, (r.v / max) * 100)}%` }}
                    title={`${r.n}${r.sub ? " (" + r.sub + ")" : ""}: ${fmt(r.v)}`}
                  />
                )}
              </div>
              <span className="bv mv">{r.v > 0 ? fmt(r.v) : r.sub || "—"}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="hint">{m.note}</p>
      {guideTiers && (
        <div className="metricguide">
          <b>실사용 기준 (참고용, 공식 수치 아님)</b>
          <ul>
            {guideTiers.map((t) => (
              <li key={t.min}>
                {t.min > 0 ? `${fmt(t.min)} 이상` : "그 미만"} · {t.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
