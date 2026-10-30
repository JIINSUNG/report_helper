"use client";

import { useState } from "react";
import type { FeatureGroup } from "@/types/product";

/**
 * 기능 O/X 비교는 가로로 넓은 표라 폰에서 옆으로 슬라이드해야 보기 불편했다.
 * 제품 하나당 카드 하나로 바꿔서, 세로로만 스크롤하며 봐도 되게 했다.
 */
export function FeatureTable({ data }: { data: FeatureGroup }) {
  const [onlyMine, setOnlyMine] = useState(false);
  const rows = onlyMine ? data.rows.filter((r) => r.x) : data.rows;

  return (
    <div className="ftablewrap">
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="link" onClick={() => setOnlyMine(!onlyMine)}>
          {onlyMine ? "경쟁 제품도 보기" : "우리 제품만 보기"}
        </button>
      </div>
      <div className="fcards">
        {rows.map((r) => (
          <div className={`fcard${r.x ? " me" : ""}`} key={r.n}>
            <b className="fname">{r.n}</b>
            <div className="fchips">
              {data.features.map((f) => {
                const v = r.values[f.id] ?? "-";
                const cls = v.startsWith("O") ? "ok" : v.startsWith("X") ? "no" : "";
                return (
                  <span className={`fchip${cls ? " " + cls : ""}`} key={f.id}>
                    <i>{f.label}</i>
                    {v}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {data.notes && data.notes.length > 0 && (
        <ul className="fnotes">
          {data.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
