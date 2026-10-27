"use client";

import { Card } from "@/components/ui/Card";
import { Num, Txt, Area } from "@/components/ui/Fields";
import { Items } from "@/components/ui/Items";
import { ItemPicker } from "@/components/ui/ItemPicker";
import { ContextBar } from "@/components/ui/ContextBar";
import { Reco } from "@/components/ui/Reco";
import { CustomSectionCard } from "@/components/ui/CustomSectionCard";
import { SnippetPicker } from "@/components/ui/SnippetPicker";
import { VariableFiller } from "@/components/ui/VariableFiller";
import { getOpen, itemTarget, latestBefore } from "@/lib/local-reports";
import { insertAtPosition } from "@/lib/snippets";
import { autoContext, ctxManual, ctxTags, ctxVars, emptyCtx } from "@/lib/context";
import { amountRemaining, blankCustomAmount, mapsFor } from "@/lib/custom-sections";
import { isOffDay } from "@/data/holidays";
import { SchedPeek } from "@/components/tabs/schedule/SchedPeek";
import type { LocalReportData } from "@/types/report";

export function OpenTab({
  data,
  update,
  date,
  storeLabel,
  isGuest,
  goSchedule,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
  storeLabel: string;
  isGuest: boolean;
  goSchedule: () => void;
}) {
  const r = getOpen(data, date);
  const set = (p: Partial<typeof r>) =>
    update((d) => ({ ...d, opens: { ...d.opens, [date]: { ...getOpen(d, date), ...p } } }));
  const pc = latestBefore(data.closes, date);
  const off = isOffDay(date, (data.settings.extraHolidays || "").split(/[,\s]+/).filter(Boolean));
  const auto = autoContext(date, pc);
  const ctx = r.ctx || emptyCtx();
  const setCtx = (v: typeof ctx) => set({ ctx: v });
  const tags = ctxTags(auto, ctx);
  const offEff = tags.includes("weekend") || tags.includes("holiday");
  const customDefs = (data.settings.customSections || []).filter((d) => d.appliesTo === "open" || d.appliesTo === "both");

  return (
    <>
      <Card title="전일 실적" right={pc && <span className="sub">{pc.date} 마감보고에서 가져옴</span>}>
        <Txt id="o-pc" label="전일 전환율" value={r.prevConversion} onChange={(v) => set({ prevConversion: v })} suf="%" mode="decimal" />
        <Items items={r.prevSales} cols={["actual"]} onChange={(v) => set({ prevSales: v })} />
        <ItemPicker
          items={r.prevSales}
          onChange={(v) => set({ prevSales: v })}
          make={(n) => ({ name: n, target: 0, actual: pc?.items.find((i) => i.name === n)?.actual ?? 0 })}
        />
      </Card>

      <Card title="금일 목표" right={<span className="sub">{offEff ? "주말·공휴일" : "평일"} 기본 목표 적용</span>}>
        {r.targetItems.some((i) => i.target !== itemTarget(data.settings, i.name, offEff)) && offEff !== off && (
          <button
            type="button"
            className="btn"
            style={{ textAlign: "left", fontWeight: 400, fontSize: 13.5 }}
            onClick={() => set({ targetItems: r.targetItems.map((i) => ({ ...i, target: itemTarget(data.settings, i.name, offEff) })) })}
          >
            오늘 상황을 {offEff ? "주말·공휴일" : "평일"}로 골랐어요 ·{" "}
            <b>
              {offEff ? "주말" : "평일"} 기본 목표로 맞추기 ({r.targetItems.map((i) => `${i.name} ${itemTarget(data.settings, i.name, offEff)}`).join(", ")})
            </b>
          </button>
        )}
        <div className="grid2">
          <Num id="o-gmv" label="GMV" value={r.targetGMV} onChange={(v) => set({ targetGMV: v })} suf="원" />
          <Txt id="o-cv" label="전환율" value={r.targetConversion} onChange={(v) => set({ targetConversion: v })} suf="%" mode="decimal" />
        </div>
        <Items items={r.targetItems} cols={["target"]} onChange={(v) => set({ targetItems: v })} />
        <ItemPicker
          items={r.targetItems}
          onChange={(v) => set({ targetItems: v })}
          make={(n) => ({ name: n, target: itemTarget(data.settings, n, offEff), actual: 0 })}
        />
      </Card>

      <Card title="오늘 상황">
        <ContextBar auto={auto} state={ctx} setState={setCtx} />
      </Card>

      <Card title="코멘트">
        <Reco
          data={data}
          update={update}
          k="comment"
          tags={tags}
          manual={ctxManual(auto, ctx)}
          vars={ctxVars(auto, ctx)}
          label="이 문장 쓰기"
          onPick={(p) => set({ comment: (r.comment.trim() ? r.comment.trim() + " " : "") + p.b.join(" ") })}
        />
        <Area id="o-cm" rows={4} value={r.comment} ph="추천 문장을 고르거나 직접 써주세요" onChange={(v) => set({ comment: v })} />
        <SnippetPicker
          snippets={data.settings.snippets || []}
          location="open-comment"
          onInsert={({ text, position }) => set({ comment: insertAtPosition(r.comment, text, position) })}
          update={update}
        />
        <VariableFiller text={r.comment} onApply={(text) => set({ comment: text })} />
      </Card>

      {customDefs.map((def) => (
        <CustomSectionCard
          key={def.id}
          def={def}
          sectionsValue={r.customText?.[def.id] || []}
          amountValue={r.customAmount?.[def.id] || blankCustomAmount()}
          remaining={def.type === "amount" && def.totalBudget != null ? amountRemaining(mapsFor(def, data.opens, data.closes), def.id, def.totalBudget, date) : null}
          onChangeSections={(v) => set({ customText: { ...(r.customText || {}), [def.id]: v } })}
          onChangeAmount={(v) => set({ customAmount: { ...(r.customAmount || {}), [def.id]: v } })}
        />
      ))}

      {!isGuest && <SchedPeek storeLabel={storeLabel} date={date} title="오늘 일정" goSchedule={goSchedule} />}
    </>
  );
}
