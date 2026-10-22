"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { won } from "@/lib/format";
import type { EffectiveProduct } from "@/lib/product-utils";
import type { useShared } from "@/lib/use-shared";

export function BulkPriceEditor({
  items,
  shared,
  onDone,
}: {
  items: EffectiveProduct[];
  shared: ReturnType<typeof useShared>;
  onDone: () => void;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<"amount" | "percent">("amount");
  const [value, setValue] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const priced = items.filter((p) => p.p != null && p.p > 0);
  const chosen = priced.filter((p) => selected[p.id]);
  const allOn = priced.length > 0 && chosen.length === priced.length;

  const nextPrice = (p: EffectiveProduct) => {
    const cur = p.p || 0;
    const next = mode === "amount" ? cur + value : Math.round(cur * (1 + value / 100));
    return Math.max(0, next);
  };

  const toggleAll = () => setSelected(allOn ? {} : Object.fromEntries(priced.map((p) => [p.id, true])));

  const apply = async () => {
    if (!chosen.length || !value) return;
    setBusy(true);
    setErr("");
    try {
      for (const p of chosen) {
        await shared.saveProduct(p.id, p.name, p.p, { price: nextPrice(p), note: p.note || "", comps: p.comps, hidden: p.hidden });
      }
      onDone();
    } catch {
      setErr("일부 항목을 저장하지 못했어요. 권한을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="일괄 가격 변경"
      right={
        <button type="button" className="link" onClick={onDone}>
          닫기
        </button>
      }
    >
      <p className="hint" style={{ margin: 0 }}>
        선택한 제품에 같은 금액 또는 비율을 한 번에 적용해요. 가격이 없는 제품은 목록에 안 보여요.
      </p>
      <div className="chips">
        {priced.map((p) => (
          <button key={p.id} type="button" className="chip" aria-pressed={!!selected[p.id]} onClick={() => setSelected({ ...selected, [p.id]: !selected[p.id] })}>
            {p.name} · {won(p.p || 0)}
          </button>
        ))}
      </div>
      {priced.length === 0 ? (
        <p className="hint">이 카테고리에는 가격이 있는 제품이 없어요.</p>
      ) : (
        <button type="button" className="link" onClick={toggleAll}>
          {allOn ? "전체 해제" : "전체 선택"}
        </button>
      )}

      <div className="seg" style={{ alignSelf: "flex-start" }}>
        <button type="button" aria-pressed={mode === "amount"} onClick={() => setMode("amount")}>
          금액(원)
        </button>
        <button type="button" aria-pressed={mode === "percent"} onClick={() => setMode("percent")}>
          비율(%)
        </button>
      </div>
      <label className="field" htmlFor="bulk-value">
        <span>
          <span>{mode === "amount" ? "변경할 금액" : "변경할 비율"}</span>
          <span>+면 인상, -면 인하 (예: {mode === "amount" ? "10000" : "5"})</span>
        </span>
        <input
          id="bulk-value"
          className="inp"
          inputMode="numeric"
          placeholder={mode === "amount" ? "예: 10000" : "예: 5"}
          value={value || ""}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9-]/g, "");
            setValue(raw ? Number(raw) : 0);
          }}
        />
      </label>

      {chosen.length > 0 && value !== 0 && (
        <div className="box">
          <span className="sub">미리보기</span>
          {chosen.map((p) => (
            <div className="crow" key={p.id}>
              <span>{p.name}</span>
              <b>
                {won(p.p || 0)} → {won(nextPrice(p))}
              </b>
            </div>
          ))}
        </div>
      )}

      {err && <div className="alert">{err}</div>}
      <button type="button" className="btn pri" disabled={busy || !chosen.length || !value} onClick={apply}>
        {busy ? "적용 중…" : `선택한 ${chosen.length}개에 적용`}
      </button>
    </Card>
  );
}
