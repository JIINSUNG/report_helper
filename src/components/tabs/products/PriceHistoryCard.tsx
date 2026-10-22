"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { ago, won } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import type { PriceHistoryEntry } from "@/types/shared";

export function PriceHistoryCard({ history }: { history: PriceHistoryEntry[] }) {
  const { uid } = useAuth();
  const [all, setAll] = useState(false);
  if (!history.length) return null;
  const vis = all ? history : history.slice(0, 8);

  return (
    <Card title="가격 변경 기록" right={<span className="sub">{history.length}건</span>}>
      <div className="olist">
        {vis.map((h) => {
          const up = h.oldPrice != null && h.newPrice > h.oldPrice;
          const down = h.oldPrice != null && h.newPrice < h.oldPrice;
          return (
            <div className="orow" key={h.id}>
              <span className="oname">{h.productName}</span>
              <span style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                {h.oldPrice != null ? won(h.oldPrice) : "—"} → <b>{won(h.newPrice)}</b>
                {up && <small style={{ color: "var(--warn)" }}> ▲ 인상</small>}
                {down && <small style={{ color: "var(--ok)" }}> ▼ 인하</small>}
              </span>
              <small className="sub">
                {h.by === uid ? "나" : "동료"} · {ago(h.at)}
              </small>
            </div>
          );
        })}
      </div>
      {history.length > 8 && (
        <button type="button" className="link" onClick={() => setAll(!all)}>
          {all ? "접기" : `${history.length - 8}건 더 보기`}
        </button>
      )}
    </Card>
  );
}
