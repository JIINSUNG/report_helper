"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { uid, won } from "@/lib/format";
import type { CustomAppliesTo, CustomSectionDef, CustomSectionType, LocalReportData } from "@/types/report";

const APPLIES_LABEL: Record<CustomAppliesTo, string> = { open: "오픈보고", close: "마감보고", both: "오픈+마감" };
const TYPE_LABEL: Record<CustomSectionType, string> = { sections: "텍스트 목록", amount: "금액 관리" };

export function CustomSectionsManager({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const defs = data.settings.customSections || [];
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CustomSectionType>("sections");
  const [appliesTo, setAppliesTo] = useState<CustomAppliesTo>("close");
  const [budget, setBudget] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const add = () => {
    const v = label.trim();
    if (!v) return;
    const def: CustomSectionDef = {
      id: uid(),
      label: v.slice(0, 40),
      appliesTo: type === "amount" && appliesTo === "both" ? "close" : appliesTo,
      type,
      ...(type === "amount" ? { totalBudget: budget || 0 } : {}),
    };
    update((d) => ({ ...d, settings: { ...d.settings, customSections: [...(d.settings.customSections || []), def] } }));
    setLabel("");
    setBudget(0);
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, customSections: (d.settings.customSections || []).filter((x) => x.id !== id) } }));
    setDeleteId(null);
  };

  return (
    <Card title="보고서 커스텀 항목" right={<span className="sub">오픈·마감보고에 직접 추가</span>}>
      <p className="hint" style={{ margin: 0 }}>
        &apos;스마트폰 인사이트&apos;처럼 텍스트로 정리하는 항목이나, &apos;세일즈 활용 금액&apos;처럼 예산을 정해두고 매일 얼마 썼는지 관리하는 항목을 직접 만들 수 있어요.
      </p>
      {defs.length === 0 && <p className="hint">아직 추가한 항목이 없어요.</p>}
      {defs.map((d) => (
        <div className="box" key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <b style={{ fontSize: 14 }}>{d.label}</b>
            <p className="hint" style={{ margin: 0 }}>
              {APPLIES_LABEL[d.appliesTo]} · {TYPE_LABEL[d.type]}
              {d.type === "amount" && d.totalBudget != null ? ` · 총 ${won(d.totalBudget)}` : ""}
            </p>
          </div>
          {deleteId === d.id ? (
            <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button type="button" className="btn sm" onClick={() => setDeleteId(null)}>
                취소
              </button>
              <button type="button" className="btn sm pri" onClick={() => remove(d.id)}>
                삭제
              </button>
            </span>
          ) : (
            <button type="button" className="link danger" style={{ flexShrink: 0 }} onClick={() => setDeleteId(d.id)}>
              삭제
            </button>
          )}
        </div>
      ))}

      <div className="box">
        <input className="inp" placeholder="항목 이름 (예: 세일즈 활용 금액)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="hint" style={{ margin: 0 }}>
            방식
          </span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={type === "sections"} onClick={() => setType("sections")}>
              텍스트 목록
            </button>
            <button type="button" className="chip" aria-pressed={type === "amount"} onClick={() => setType("amount")}>
              금액 관리
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span className="hint" style={{ margin: 0 }}>
            어디에 넣을까요
          </span>
          <div className="chips">
            <button type="button" className="chip" aria-pressed={appliesTo === "open"} onClick={() => setAppliesTo("open")}>
              오픈보고
            </button>
            <button type="button" className="chip" aria-pressed={appliesTo === "close"} onClick={() => setAppliesTo("close")}>
              마감보고
            </button>
            {type === "sections" && (
              <button type="button" className="chip" aria-pressed={appliesTo === "both"} onClick={() => setAppliesTo("both")}>
                오픈+마감
              </button>
            )}
          </div>
        </div>
        {type === "amount" && (
          <label className="field" htmlFor="cx-budget">
            <span>
              <span>총 예산</span>
              <span>예: 150000 · 매일 사용한 금액을 빼서 남은 금액을 보여줘요</span>
            </span>
            <div className="suf">
              <input
                id="cx-budget"
                className="inp"
                inputMode="numeric"
                value={budget || ""}
                onChange={(e) => setBudget(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              />
              <i>원</i>
            </div>
          </label>
        )}
        <button type="button" className="btn pri sm" disabled={!label.trim()} onClick={add}>
          항목 추가
        </button>
      </div>
    </Card>
  );
}
