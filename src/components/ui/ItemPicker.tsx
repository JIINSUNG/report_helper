"use client";

import { useState } from "react";
import { BASE_ITEMS, EXTRA_ITEMS } from "@/data/report-items";
import type { ItemTarget } from "@/types/report";

export function ItemPicker({
  items,
  onChange,
  make,
  hint,
}: {
  items: ItemTarget[];
  onChange: (v: ItemTarget[]) => void;
  make: (name: string) => ItemTarget;
  hint?: string;
}) {
  const [custom, setCustom] = useState("");
  const names = items.map((i) => i.name);
  const opts = [...new Set([...BASE_ITEMS, ...EXTRA_ITEMS.map((x) => x.name), ...names])];
  const tog = (n: string) => onChange(names.includes(n) ? items.filter((i) => i.name !== n) : [...items, make(n)]);
  const add = () => {
    const n = custom.trim();
    if (!n || names.includes(n)) return;
    onChange([...items, make(n)]);
    setCustom("");
  };
  return (
    <details className="picker">
      <summary>
        품목 추가·빼기 <span className="sub">{names.length}개 · {hint || "고단가 판매가 두드러진 날 추가"}</span>
      </summary>
      <div className="chips" style={{ marginTop: 8 }}>
        {opts.map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={names.includes(n)} onClick={() => tog(n)}>
            {names.includes(n) ? "✓ " : ""}
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          className="inp"
          placeholder="직접 입력 (예: 헤어드라이기)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className="btn sm" style={{ whiteSpace: "nowrap" }} onClick={add}>
          추가
        </button>
      </div>
    </details>
  );
}
