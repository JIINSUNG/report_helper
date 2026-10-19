"use client";

import { useState } from "react";
import { BASE_STORES } from "@/data/stores";
import type { LocalReportData } from "@/types/report";

export function StorePicker({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const [t, setT] = useState("");
  const cur = data.settings.storeName;
  const list = [...new Set([...(data.settings.stores || BASE_STORES), cur])];
  const setS = (p: Partial<LocalReportData["settings"]>) => update((d) => ({ ...d, settings: { ...d.settings, ...p } }));
  const add = () => {
    let n = t.trim();
    if (!n) return;
    if (!/점$/.test(n)) n += "점";
    setS({ stores: [...new Set([...list, n])], storeName: n });
    setT("");
  };

  return (
    <div className="field">
      <span>
        <span>지점</span>
        <span>보고서·일정에 이 지점 이름이 들어가요</span>
      </span>
      <div className="chips">
        {list.map((n) => (
          <button key={n} type="button" className="chip" aria-pressed={n === cur} onClick={() => setS({ storeName: n, stores: list })}>
            {n === cur ? "✓ " : ""}
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          id="s-store-new"
          className="inp"
          placeholder="지점 직접 추가 (예: 판교점)"
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button type="button" className="btn sm" style={{ whiteSpace: "nowrap" }} onClick={add}>
          추가
        </button>
      </div>
      {list.filter((n) => n !== cur && !BASE_STORES.includes(n)).length > 0 && (
        <div className="chips">
          {list
            .filter((n) => n !== cur && !BASE_STORES.includes(n))
            .map((n) => (
              <button key={n} type="button" className="link danger" onClick={() => setS({ stores: list.filter((x) => x !== n) })}>
                {n} 빼기
              </button>
            ))}
        </div>
      )}
      <p className="hint">일정 탭은 지점별로 따로 보여요. 보고서·기록은 이 기기에만 저장돼요.</p>
    </div>
  );
}
