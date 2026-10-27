"use client";

import { Card } from "@/components/ui/Card";
import { Txt, Area } from "@/components/ui/Fields";
import { CopyBlock } from "@/components/ui/CopyBlock";
import { SnippetPicker } from "@/components/ui/SnippetPicker";
import { VariableFiller } from "@/components/ui/VariableFiller";
import { getMgr } from "@/lib/local-reports";
import { caseText, type CaseFields } from "@/lib/report-text";
import { formSummary, getSumForm, recHints } from "@/lib/sales-summary";
import { salesSummary, autoS, autoT, autoA, autoR } from "@/lib/record-utils";
import { uid } from "@/lib/format";
import { SUM_CATS, SUM_WHO, SUM_CTX, SUM_PURPOSE, COMMENTS } from "@/data/sales-summary-options";
import type { LocalReportData, ManualCase, SalesCase, SalesRecord, SummarySlot } from "@/types/report";

function caseFields(c: SalesCase, rec: SalesRecord | null): CaseFields {
  const auto = rec ? { info: autoS(rec), need: autoT(rec), offer: autoA(rec), result: autoR(rec) } : null;
  const a = (k: "info" | "need" | "offer" | "result"): string => c[k] ?? auto?.[k] ?? "";
  return { info: a("info"), need: a("need"), offer: a("offer"), result: a("result"), comment: c.comment || "" };
}

function salesCases(data: LocalReportData, date: string) {
  const mg = getMgr(data, date);
  const recs = data.records[date] || [];
  const fromRec = recs
    .filter((r) => r.star)
    .slice(0, 2)
    .map((r) => ({ key: r.id, rec: r, c: mg.cases[r.id] || {} }));
  const manual = (mg.manual || []).map((c) => ({ key: c.id, rec: null as SalesRecord | null, c, manual: true as const }));
  return [...fromRec, ...manual];
}

function SlotPick({ label, x, onChange, hint }: { label: string; x: SummarySlot; onChange: (v: SummarySlot) => void; hint?: string }) {
  const tog = (k: "who" | "ctx" | "purpose", v: string) => onChange({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] });
  return (
    <div className="slot">
      <div className="slothead">
        <b>{label}</b>
        {hint && <span className="sub">기록: {hint}</span>}
      </div>
      <span className="sub">어떤 고객이 많았나요?</span>
      <div className="chips">
        {SUM_WHO.map((w) => (
          <button key={w} type="button" className="chip" aria-pressed={x.who.includes(w)} onClick={() => tog("who", w)}>
            {w}
          </button>
        ))}
      </div>
      <span className="sub">
        어떤 계기로? <em className="opt">선택</em>
      </span>
      <div className="chips">
        {Object.keys(SUM_CTX).map((w) => (
          <button key={w} type="button" className="chip" aria-pressed={x.ctx.includes(w)} onClick={() => tog("ctx", w)}>
            {w}
          </button>
        ))}
      </div>
      <span className="sub">방문 목적은?</span>
      <div className="chips">
        {Object.keys(SUM_PURPOSE).map((w) => (
          <button key={w} type="button" className="chip" aria-pressed={x.purpose.includes(w)} onClick={() => tog("purpose", w)}>
            {w}
          </button>
        ))}
      </div>
      <input className="inp" placeholder="덧붙일 말 (선택)" value={x.memo} onChange={(e) => onChange({ ...x, memo: e.target.value })} />
    </div>
  );
}

function CaseEditor({
  k,
  f,
  onChange,
  rec,
  onRemove,
  title,
  sub,
  label,
}: {
  k: string;
  f: CaseFields;
  onChange: (p: Partial<CaseFields>) => void;
  rec: SalesRecord | null;
  onRemove: React.ReactNode;
  title: string;
  sub: string;
  label: string;
}) {
  const fields: [keyof CaseFields, string, string][] = [
    ["info", "고객정보", "예: 40대 여성, 남편과 함께 방문"],
    ["need", "고객니즈", "예: 강아지 털, 청소할 시간이 부족"],
    ["offer", "제안내용", "예: 털 엉킴 방지 기능 시연, 홈캠 기능 함께 소개"],
    ["result", "판매결과", "예: 로봇청소기 1대 구매"],
  ];
  const list = COMMENTS.filter((x) => x.need === "*" || (rec && ((x.act && rec.actions.includes(x.act)) || (x.need && rec.needs.includes(x.need)))));
  const add = (x: string) => onChange({ comment: f.comment.trim() ? f.comment.trim() + " " + x : x });
  return (
    <div className="box">
      <div className="cardhead">
        <b style={{ fontSize: 14.5 }}>{title}</b>
        <span className="sub">{sub}</span>
      </div>
      {fields.map(([key, l, ph]) => (
        <label className="field" key={key} htmlFor={`s-${key}-${k}`}>
          <span>
            <span>{l}</span>
          </span>
          <Area id={`s-${key}-${k}`} rows={2} value={f[key]} ph={ph} onChange={(v) => onChange({ [key]: v })} />
        </label>
      ))}
      <div className="field">
        <span>
          <span>코멘트 (선택)</span>
          <span>배운 점 · 다음에 해볼 것</span>
        </span>
        <div className="chips">
          {list.map((x) => (
            <button key={x.x} type="button" className="chip" style={{ textAlign: "left" }} onClick={() => add(x.x)}>
              + {x.x}
            </button>
          ))}
        </div>
        <Area id={`s-cm-${k}`} rows={2} value={f.comment} ph="비워두면 보고에 안 나와요" onChange={(v) => onChange({ comment: v })} />
      </div>
      <CopyBlock text={caseText(f)} label={label} empty="칸을 채우면 이 사례만 따로 복사할 수 있어요." />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>{onRemove}</div>
    </div>
  );
}

export function SalesTab({
  data,
  update,
  date,
  goRecord,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
  goRecord: () => void;
}) {
  const mg = getMgr(data, date);
  const recs = data.records[date] || [];
  const set = (p: Partial<typeof mg>) => update((d) => ({ ...d, managers: { ...d.managers, [date]: { ...getMgr(d, date), ...p } } }));
  const setCase = (id: string, p: Partial<SalesCase>) =>
    update((d) => {
      const m = getMgr(d, date);
      return { ...d, managers: { ...d.managers, [date]: { ...m, cases: { ...m.cases, [id]: { ...(m.cases[id] || {}), ...p } } } } };
    });
  const setManual = (id: string, p: Partial<ManualCase>) =>
    update((d) => {
      const m = getMgr(d, date);
      return { ...d, managers: { ...d.managers, [date]: { ...m, manual: (m.manual || []).map((c) => (c.id === id ? { ...c, ...p } : c)) } } };
    });
  const addManual = () => set({ manual: [...(mg.manual || []), { id: uid(), info: "", need: "", offer: "", result: "", comment: "" }] });
  const unstar = (id: string) =>
    update((d) => ({ ...d, records: { ...d.records, [date]: (d.records[date] || []).map((r) => (r.id === id ? { ...r, star: false } : r)) } }));
  const cases = salesCases(data, date);
  const sf = getSumForm(mg);
  const autoSum = formSummary(sf);
  const hints = recHints(recs);
  const setSF = (p: Partial<typeof sf>) => set({ sumForm: { ...sf, ...p } });
  const recCount = cases.filter((x) => !("manual" in x)).length;

  return (
    <>
      <Card title="금일 판매 요약" right={<span className="sub">골라서 문장 만들기</span>}>
        <SlotPick label="오전" x={sf.am} hint={hints.am} onChange={(v) => setSF({ am: v })} />
        <SlotPick label="오후" x={sf.pm} hint={hints.pm} onChange={(v) => setSF({ pm: v })} />
        <div className="slot">
          <div className="slothead">
            <b>오늘 강세</b>
            {hints.sold && <span className="sub">기록 판매: {hints.sold}</span>}
          </div>
          <span className="sub">문의·판매가 많았던 카테고리</span>
          <div className="chips">
            {SUM_CATS.map((c) => (
              <button
                key={c}
                type="button"
                className="chip"
                aria-pressed={sf.strong.cats.includes(c)}
                onClick={() => setSF({ strong: { ...sf.strong, cats: sf.strong.cats.includes(c) ? sf.strong.cats.filter((y) => y !== c) : [...sf.strong.cats, c] } })}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid2">
            <Txt id="s-ask" label="문의 많았던 제품 (선택)" value={sf.strong.ask} ph="예: 로봇청소기" onChange={(v) => setSF({ strong: { ...sf.strong, ask: v } })} />
            <Txt id="s-res" label="판매 결과" value={sf.strong.result} ph="예: 로봇청소기 6 2대" onChange={(v) => setSF({ strong: { ...sf.strong, result: v } })} />
          </div>
          {hints.sold && !sf.strong.result && (
            <button type="button" className="link" style={{ alignSelf: "flex-start" }} onClick={() => setSF({ strong: { ...sf.strong, result: hints.sold } })}>
              기록 판매 넣기: {hints.sold}
            </button>
          )}
          <input className="inp" placeholder="덧붙일 말 (선택)" value={sf.strong.memo} onChange={(e) => setSF({ strong: { ...sf.strong, memo: e.target.value } })} />
        </div>
        <div className="field">
          <span>
            <span style={{ fontWeight: 600, color: "var(--fg)" }}>완성된 요약</span>
            <span>직접 고쳐도 돼요</span>
          </span>
          <Area id="s-sum" rows={8} value={mg.summary ?? autoSum} ph="위에서 고르면 문장이 만들어져요" onChange={(v) => set({ summary: v })} />
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {mg.summary != null && mg.summary !== autoSum && (
            <button type="button" className="link" onClick={() => set({ summary: null })}>
              고른 내용으로 다시 쓰기
            </button>
          )}
          {recs.length > 0 && (
            <button type="button" className="link" onClick={() => set({ summary: ((mg.summary ?? autoSum).trim() + "\n" + salesSummary(recs)).trim() })}>
              + 기록 통계 붙이기
            </button>
          )}
        </div>
        <Txt id="s-note" label="특이사항 (선택)" value={mg.note} ph="없으면 비워두세요" onChange={(v) => set({ note: v })} />
        <CopyBlock text={[(mg.summary ?? autoSum).trim(), mg.note.trim() && `- 특이사항: ${mg.note.trim()}`].filter(Boolean).join("\n")} empty="기록을 남기거나 직접 써주세요." />
      </Card>

      <Card title="판매 우수 사례" right={<span className="sub">기록에서 ☆ {recCount}/2 · 직접 {(mg.manual || []).length}</span>}>
        {cases.map((x, i) => {
          const f = caseFields(x.c, x.rec);
          return "manual" in x ? (
            <CaseEditor
              key={x.key}
              k={x.key}
              f={f}
              title={`사례 ${i + 1} · 직접 작성`}
              sub=""
              label={`사례 ${i + 1} 복사`}
              rec={null}
              onChange={(p) => setManual(x.key, p)}
              onRemove={
                <button type="button" className="link danger" onClick={() => set({ manual: (mg.manual || []).filter((c) => c.id !== x.key) })}>
                  삭제
                </button>
              }
            />
          ) : (
            <CaseEditor
              key={x.key}
              k={x.key}
              f={f}
              title={`사례 ${i + 1} · ${x.rec!.product || x.rec!.cat}`}
              sub="기록에서 채움"
              label={`사례 ${i + 1} 복사`}
              rec={x.rec}
              onChange={(p) => setCase(x.key, p)}
              onRemove={
                <>
                  <button type="button" className="link" onClick={() => setCase(x.key, { info: undefined, need: undefined, offer: undefined, result: undefined })}>
                    기록 내용으로 되돌리기
                  </button>
                  <button type="button" className="link danger" onClick={() => unstar(x.key)}>
                    우수사례에서 빼기
                  </button>
                </>
              }
            />
          );
        })}
        {cases.length === 0 && <p className="hint">기록 탭에서 ☆을 눌러 고르거나, 기록하지 못한 판매는 아래에서 직접 써주세요.</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="btn dash" style={{ flex: 1 }} onClick={addManual}>
            + 직접 작성
          </button>
          <button type="button" className="btn dash" style={{ flex: 1 }} onClick={goRecord}>
            ☆ 기록에서 고르기
          </button>
        </div>
      </Card>

      <Card title="익일 판매 계획">
        <Area id="s-plan" rows={5} value={mg.plan} ph="내일 어떤 제품을, 어떤 방식으로 팔아볼지" onChange={(v) => set({ plan: v })} />
        <SnippetPicker
          snippets={data.settings.snippets || []}
          location="sales-plan"
          onInsert={(text) => set({ plan: (mg.plan.trim() ? mg.plan.trim() + "\n" : "") + text })}
          update={update}
        />
        <VariableFiller text={mg.plan} onApply={(text) => set({ plan: text })} />
        <CopyBlock text={mg.plan.trim()} empty="계획을 쓰면 복사할 수 있어요." />
      </Card>
    </>
  );
}
