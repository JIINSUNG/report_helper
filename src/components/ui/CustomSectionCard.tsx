"use client";

import { Card } from "./Card";
import { Num, Txt } from "./Fields";
import { Sections } from "./Sections";
import { won } from "@/lib/format";
import type { CustomAmountValue, CustomSectionDef, Section } from "@/types/report";

export function CustomSectionCard({
  def,
  sectionsValue,
  amountValue,
  remaining,
  onChangeSections,
  onChangeAmount,
}: {
  def: CustomSectionDef;
  sectionsValue: Section[];
  amountValue: CustomAmountValue;
  remaining: number | null;
  onChangeSections: (v: Section[]) => void;
  onChangeAmount: (v: CustomAmountValue) => void;
}) {
  if (def.type === "sections") {
    return (
      <Card title={def.label} right={<span className="sub">선택 · 비우면 보고서에 안 나와요</span>}>
        <Sections idp={`cx-${def.id}`} list={sectionsValue} onChange={onChangeSections} />
      </Card>
    );
  }

  return (
    <Card title={def.label} right={def.totalBudget != null ? <span className="sub">총 {won(def.totalBudget)}</span> : undefined}>
      <div className="grid2">
        <Num
          id={`cx-amt-${def.id}`}
          label="오늘 사용 금액"
          value={amountValue.amount}
          onChange={(v) => onChangeAmount({ ...amountValue, amount: v })}
          suf="원"
        />
        <Txt id={`cx-note-${def.id}`} label="사유 (선택)" value={amountValue.note} onChange={(v) => onChangeAmount({ ...amountValue, note: v })} />
      </div>
      {remaining != null && (
        <p className="hint" style={{ margin: 0 }}>
          오늘까지 남은 금액: <b style={{ color: remaining < 0 ? "var(--warn)" : "var(--fg)" }}>{won(remaining)}</b>
        </p>
      )}
    </Card>
  );
}
