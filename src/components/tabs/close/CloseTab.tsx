"use client";

import { Card } from "@/components/ui/Card";
import { Num, Txt, Area } from "@/components/ui/Fields";
import { Chips } from "@/components/ui/Fields";
import { Items } from "@/components/ui/Items";
import { ItemPicker } from "@/components/ui/ItemPicker";
import { Sections } from "@/components/ui/Sections";
import { ContextBar } from "@/components/ui/ContextBar";
import { Reco } from "@/components/ui/Reco";
import { CustomSectionCard } from "@/components/ui/CustomSectionCard";
import { SnippetPicker } from "@/components/ui/SnippetPicker";
import { VariableFiller } from "@/components/ui/VariableFiller";
import { InvCheck } from "./InvCheck";
import { getClose, latestBefore } from "@/lib/local-reports";
import { diffOf, reasonSum, signed } from "@/lib/report-text";
import { autoContext, ctxManual, ctxTags, ctxVars, emptyCtx } from "@/lib/context";
import { amountRemaining, blankCustomAmount, mapsFor } from "@/lib/custom-sections";
import { recCount } from "@/lib/record-utils";
import { won, pct, uid, shift } from "@/lib/format";
import { DIFF_TYPES, NOTE_CHIPS } from "@/data/record-options";
import { SchedPeek } from "@/components/tabs/schedule/SchedPeek";
import type { LocalReportData, ReasonEntry } from "@/types/report";

const SIDE_SIGNS: { side: "retail" | "pos"; sign: 1 | -1; label: string }[] = [
  { side: "retail", sign: 1, label: "리테일 +" },
  { side: "retail", sign: -1, label: "리테일 -" },
  { side: "pos", sign: 1, label: "포스기 +" },
  { side: "pos", sign: -1, label: "포스기 -" },
];

export function CloseTab({
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
  const r = getClose(data, date);
  const set = (p: Partial<typeof r>) => update((d) => ({ ...d, closes: { ...d.closes, [date]: { ...getClose(d, date), ...p } } }));
  const recs = data.records[date] || [];
  const pc = latestBefore(data.closes, date);
  const prevMonth = pc && pc.date.slice(0, 7) === date.slice(0, 7) ? pc.monthGMV : undefined;
  const sugMonth = (prevMonth || 0) + r.dayGMV;
  const diff = diffOf(r);
  const sum = reasonSum(r.reasons);
  const remain = diff - sum;
  const auto = autoContext(date, r.dayGMV > 0 ? r : undefined);
  const ctx = r.ctx || emptyCtx();
  const setCtx = (v: typeof ctx) => set({ ctx: v });
  const vars = ctxVars(auto, ctx);
  const tags = ctxTags(auto, ctx);
  const manual = ctxManual(auto, ctx);
  const customDefs = (data.settings.customSections || []).filter((d) => d.appliesTo === "close" || d.appliesTo === "both");
  const inv = r.inv || null;
  const fromRec = r.items.map((it) => recCount(it.name, data.settings, recs));
  const recMismatch = fromRec.some((n, i) => n !== r.items[i].actual);
  const diffRecs = recs.filter((x) => x.diff && x.diff.amount > 0 && !r.reasons.some((y) => y.from === x.id));
  const setReason = (i: number, p: Partial<ReasonEntry>) => set({ reasons: r.reasons.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const pull = () =>
    set({
      reasons: [
        ...r.reasons,
        ...diffRecs.map((x) => ({
          id: uid(),
          from: x.id,
          type: x.diff!.type,
          text: `${x.product || x.cat}${x.qty > 1 ? ` ${x.qty}개` : ""} ${DIFF_TYPES.find((t) => t.id === x.diff!.type)?.label || ""}${
            x.diff!.type === "bulk" ? "건" : ""
          }`.trim(),
          side: x.diff!.side,
          amount: x.diff!.amount,
        })),
      ],
    });
  const covered = diff ? Math.min(100, Math.max(0, Math.round((Math.abs(sum) / Math.abs(diff)) * 100))) : 0;

  return (
    <>
      <Card title="일간 실적">
        <div className="grid2">
          <Num id="c-dt" label="일 목표 GMV" value={r.dayTargetGMV} onChange={(v) => set({ dayTargetGMV: v })} suf="원" />
          <Num
            id="c-da"
            label="일 달성 GMV"
            value={r.dayGMV}
            onChange={(v) => set({ dayGMV: v })}
            suf="원"
            hint={r.dayTargetGMV ? <span className="rate">{pct(r.dayGMV, r.dayTargetGMV)}</span> : null}
          />
        </div>
      </Card>

      <Card title="월간 누적">
        <div className="grid2">
          <Num id="c-mt" label="월 목표 GMV" value={r.monthTargetGMV} onChange={(v) => set({ monthTargetGMV: v })} suf="원" />
          <Num
            id="c-ma"
            label="월 누적 GMV"
            value={r.monthGMV}
            onChange={(v) => set({ monthGMV: v })}
            suf="원"
            hint={r.monthTargetGMV ? <span className="rate">{pct(r.monthGMV, r.monthTargetGMV)}</span> : null}
          />
        </div>
        {prevMonth !== undefined && r.dayGMV > 0 && r.monthGMV !== sugMonth && (
          <button type="button" className="btn" style={{ textAlign: "left", fontWeight: 400, fontSize: 13.5 }} onClick={() => set({ monthGMV: sugMonth })}>
            전일 누적 {prevMonth.toLocaleString("ko-KR")} + 오늘 {r.dayGMV.toLocaleString("ko-KR")} = <b>{won(sugMonth)}</b> 적용
          </button>
        )}
      </Card>

      <Card title="품목 목표 / 달성">
        <Items items={r.items} cols={["target", "actual"]} onChange={(v) => set({ items: v })} />
        <ItemPicker
          items={r.items}
          onChange={(v) => set({ items: v })}
          make={(n) => ({ name: n, target: data.opens[date]?.targetItems.find((x) => x.name === n)?.target ?? 0, actual: recCount(n, data.settings, recs) })}
        />
        {recs.length > 0 && recMismatch && (
          <button
            type="button"
            className="btn"
            style={{ textAlign: "left", fontWeight: 400, fontSize: 13.5 }}
            onClick={() => set({ items: r.items.map((it, i) => ({ ...it, actual: fromRec[i] })) })}
          >
            기록 기준 판매: {r.items.map((it, i) => `${it.name} ${fromRec[i]}`).join(", ")} <b>적용</b>
          </button>
        )}
      </Card>

      <Card title="운영 데이터" right={<span className="sub">리테일 시스템 값 그대로</span>}>
        <div className="grid2">
          <Num id="c-tr" label="트래픽" value={r.traffic} onChange={(v) => set({ traffic: v })} />
          <Num id="c-vi" label="입점 고객 수" value={r.visitors} onChange={(v) => set({ visitors: v })} />
          <Txt id="c-cv" label="전환율" value={r.conversion} onChange={(v) => set({ conversion: v })} suf="%" mode="decimal" ph="13.93" />
          <Txt id="c-ar" label="연계율" value={r.attachRate} onChange={(v) => set({ attachRate: v })} mode="decimal" ph="2.76" />
        </div>
        <Txt id="c-aov" label="객단가" value={r.aov} onChange={(v) => set({ aov: v })} ph="267.53K" />
        {inv ? (
          <InvCheck inv={inv} onChange={(v) => set({ inv: v })} def={data.settings.inventoryNote} />
        ) : (
          <>
            <Txt id="c-inv" label="재고 확인" value={r.inventoryNote} onChange={(v) => set({ inventoryNote: v })} />
            <button
              type="button"
              className="link"
              style={{ alignSelf: "flex-start" }}
              onClick={() => set({ inv: { phone: { diff: 0, reason: "" }, tablet: { diff: 0, reason: "" } } })}
            >
              품목별 재고 확인으로 바꾸기
            </button>
          </>
        )}
      </Card>

      <Card
        title="리테일 · 포스 차액"
        right={diff !== 0 && <span className={"tag " + (remain === 0 ? "ok" : "warn")}>{remain === 0 ? "사유 합계 일치" : "사유 확인 필요"}</span>}
      >
        <div className="grid2">
          <Num id="c-rt" label="리테일" value={r.retail} onChange={(v) => set({ retail: v })} suf="원" />
          <Num id="c-ps" label="포스기" value={r.pos} onChange={(v) => set({ pos: v })} suf="원" />
        </div>
        {(r.retail > 0 || r.pos > 0) && (
          <div className="say">
            {diff === 0 ? "리테일과 포스기 금액이 같아요" : diff < 0 ? `리테일이 ${won(-diff)} 더 많아요` : `포스기가 ${won(diff)} 더 많아요`}
            <small>보고서에는 &quot;차액 {signed(diff)}&quot;로 들어가요 (포스기 − 리테일)</small>
          </div>
        )}
        {diff !== 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="meter">
              <div style={{ width: covered + "%" }} />
            </div>
            <div className="remain">
              <span>사유로 설명된 금액 {won(Math.abs(sum))}</span>
              <b style={{ color: remain === 0 ? "var(--ok)" : "var(--warn)" }}>{remain === 0 ? "남은 금액 없음" : `남은 ${won(Math.abs(remain))}`}</b>
            </div>
            {remain !== 0 && <p className="hint">남은 금액은 {remain < 0 ? "리테일" : "포스기"}에 더 잡힌 사유를 찾아야 해요.</p>}
          </div>
        )}
        {diffRecs.length > 0 && (
          <button type="button" className="btn" style={{ textAlign: "left", fontWeight: 400, fontSize: 13.5 }} onClick={pull}>
            오늘 기록에 차액 {diffRecs.length}건이 있어요 · <b>사유로 불러오기</b>
          </button>
        )}
        {r.reasons.map((x, i) => {
          const t = DIFF_TYPES.find((y) => y.id === x.type) || DIFF_TYPES[3];
          return (
            <div className="box" key={x.id || i}>
              <Chips
                options={DIFF_TYPES.map((y) => y.id)}
                labels={Object.fromEntries(DIFF_TYPES.map((y) => [y.id, y.label]))}
                value={x.type || "custom"}
                onChange={(v) => {
                  const nt = DIFF_TYPES.find((y) => y.id === v) || DIFF_TYPES[3];
                  setReason(i, { type: nt.id, side: nt.side, sign: 1 });
                }}
              />
              <Txt id={`c-rs${i}`} label="품목 · 내용" value={x.text} onChange={(v) => setReason(i, { text: v })} ph="예: H300 헤어드라이기 24개 대량주문건" />
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div className="seg" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                  {SIDE_SIGNS.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed={x.side === o.side && (x.sign ?? 1) === o.sign}
                      onClick={() => setReason(i, { side: o.side, sign: o.sign })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <Num id={`c-ra${i}`} label="금액" value={x.amount} onChange={(v) => setReason(i, { amount: v })} suf="원" />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className="hint">{t.hint}</span>
                <button type="button" className="link danger" onClick={() => set({ reasons: r.reasons.filter((_, j) => j !== i) })}>
                  삭제
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="btn dash"
          onClick={() =>
            set({
              reasons: [...r.reasons, { id: uid(), type: "custom", text: "", side: remain < 0 ? "retail" : "pos", amount: Math.abs(remain) }],
            })
          }
        >
          + 사유 추가{remain !== 0 ? ` (남은 ${won(Math.abs(remain))} 채워서)` : ""}
        </button>
      </Card>

      <Card title="오늘 상황">
        <ContextBar auto={auto} state={ctx} setState={setCtx} />
      </Card>

      <Card title="금일 핵심 내용">
        <Reco data={data} update={update} k="highlight" tags={tags} manual={manual} vars={vars} onPick={(p) => set({ highlights: [...r.highlights, p] })} />
        <Sections idp="hl" list={r.highlights} onChange={(v) => set({ highlights: v })} />
      </Card>
      <Card title="금일 스마트폰 인사이트" right={<span className="sub">선택 · 비우면 보고서에 안 나와요</span>}>
        <p className="hint">예: &quot;20대 커플 / Xiaomi 17시리즈&quot; 처럼 고객군·제품을 제목으로 쓰고, 판매·리드 확보 등 결과를 아래에 적어주세요.</p>
        <Sections idp="pi" list={r.phoneInsights || []} onChange={(v) => set({ phoneInsights: v })} />
      </Card>
      <Card title="익일 계획">
        <Reco data={data} update={update} k="plan" tags={tags} manual={manual} vars={vars} onPick={(p) => set({ plans: [...r.plans, p] })} />
        <Sections idp="pl" list={r.plans} onChange={(v) => set({ plans: v })} />
      </Card>

      <Card title="특이사항" right={<span className="sub">선택 · 비우면 보고서에 안 나와요</span>}>
        <div className="chips">
          {NOTE_CHIPS.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => set({ note: (r.note.trim() ? r.note.trim() + "\n" : "") + c + ": " })}>
              + {c}
            </button>
          ))}
        </div>
        <Area id="c-note" value={r.note} ph="한 줄에 하나씩" onChange={(v) => set({ note: v })} />
        <SnippetPicker
          snippets={data.settings.snippets || []}
          location="close-note"
          onInsert={(text) => set({ note: (r.note.trim() ? r.note.trim() + "\n" : "") + text })}
          update={update}
        />
        <VariableFiller text={r.note} onApply={(text) => set({ note: text })} />
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

      {!isGuest && <SchedPeek storeLabel={storeLabel} date={shift(date, 1)} title="내일 일정" goSchedule={goSchedule} />}
    </>
  );
}
