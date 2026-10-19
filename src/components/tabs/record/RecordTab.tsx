"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chips, Stepper, Txt, Num } from "@/components/ui/Fields";
import { ACTIONS, AGES, CATS, DIFF_TYPES, GENDERS, NEEDS, PARTIES, RESULTS } from "@/data/record-options";
import { autoT } from "@/lib/record-utils";
import { uid } from "@/lib/format";
import { won } from "@/lib/format";
import type { LocalReportData, SalesRecord } from "@/types/report";

const emptyRec = (): Omit<SalesRecord, "id" | "time"> => ({
  cat: "",
  product: "",
  qty: 1,
  gender: "",
  age: "",
  party: "",
  needs: [],
  needMemo: "",
  actions: [],
  memo: "",
  result: "buy",
  diff: null,
  star: false,
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function RecordTab({
  data,
  update,
  date,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
}) {
  const [f, setF] = useState(emptyRec());
  const [more, setMore] = useState(false);
  const [err, setErr] = useState("");
  const recs = data.records[date] || [];
  const products = [...new Set(Object.values(data.records).flat().map((r) => r.product).filter(Boolean))];
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  const save = () => {
    if (!f.cat) {
      setErr("카테고리를 골라주세요.");
      return;
    }
    const now = new Date();
    const rec: SalesRecord = { ...f, id: uid(), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
    update((d) => ({ ...d, records: { ...d.records, [date]: [...(d.records[date] || []), rec] } }));
    setF(emptyRec());
    setMore(false);
    setErr("");
  };

  const patch = (id: string, p: Partial<SalesRecord>) =>
    update((d) => ({
      ...d,
      records: { ...d.records, [date]: (d.records[date] || []).map((r) => (r.id === id ? { ...r, ...p } : r)) },
    }));
  const del = (id: string) =>
    update((d) => ({ ...d, records: { ...d.records, [date]: (d.records[date] || []).filter((r) => r.id !== id) } }));

  const starCount = recs.filter((r) => r.star).length;
  const dt = f.diff && DIFF_TYPES.find((t) => t.id === f.diff!.type);

  return (
    <>
      <Card title="빠른 기록" right={<span className="sub">카테고리만 골라도 저장돼요</span>}>
        <div className="field">
          <span>카테고리</span>
          <Chips options={CATS} value={f.cat} onChange={(v) => set({ cat: v as string })} />
        </div>
        <div className="grid2" style={{ gridTemplateColumns: "1fr auto" }}>
          <label className="field" htmlFor="r-prod">
            <span>제품명 (선택)</span>
            <input
              id="r-prod"
              className="inp"
              list="prods"
              placeholder="예: 레드미 패드 2 프로"
              value={f.product}
              onChange={(e) => set({ product: e.target.value })}
            />
            <datalist id="prods">
              {products.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <div className="field">
            <span>수량</span>
            <Stepper value={f.qty} onChange={(v) => set({ qty: Math.max(1, v) })} />
          </div>
        </div>
        <div className="field">
          <span>고객</span>
          <Chips options={GENDERS} value={f.gender} onChange={(v) => set({ gender: v as string })} />
          <Chips options={AGES} value={f.age} onChange={(v) => set({ age: v as string })} />
          <Chips options={PARTIES} value={f.party} onChange={(v) => set({ party: v as string })} />
        </div>
        <div className="field">
          <span>결과</span>
          <Chips
            options={Object.keys(RESULTS)}
            labels={RESULTS}
            value={f.result}
            onChange={(v) => set({ result: (v as SalesRecord["result"]) || "buy" })}
          />
        </div>
        {!more && (
          <button type="button" className="btn dash" onClick={() => setMore(true)}>
            + 니즈 · 한 일 · 차액 (나중에 마감 때 채워도 돼요)
          </button>
        )}
        {more && (
          <>
            <div className="field">
              <span>니즈</span>
              <Chips multi options={NEEDS} value={f.needs} onChange={(v) => set({ needs: v as string[] })} />
              <input
                id="r-need"
                className="inp"
                placeholder="한 줄 메모 (예: 강아지 털이 고민)"
                value={f.needMemo}
                onChange={(e) => set({ needMemo: e.target.value })}
              />
            </div>
            <div className="field">
              <span>한 일</span>
              <Chips
                multi
                options={Object.keys(ACTIONS)}
                labels={Object.fromEntries(Object.entries(ACTIONS).map(([k, v]) => [k, v[0]]))}
                value={f.actions}
                onChange={(v) => set({ actions: v as string[] })}
              />
            </div>
            <Txt id="r-memo" label="상황 메모 (선택)" value={f.memo} onChange={(v) => set({ memo: v })} ph="예: 공기청정기 문의로 방문" />
            <div className="box">
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 600, fontSize: 14 }}>
                리테일·포스 차액이 생기는 판매
                <input
                  type="checkbox"
                  checked={!!f.diff}
                  onChange={(e) => set({ diff: e.target.checked ? { type: "bulk", side: "retail", amount: 0 } : null })}
                  style={{ width: 20, height: 20, accentColor: "var(--accent)" }}
                />
              </label>
              {f.diff && (
                <>
                  <Chips
                    options={DIFF_TYPES.map((t) => t.id)}
                    labels={Object.fromEntries(DIFF_TYPES.map((t) => [t.id, t.label]))}
                    value={f.diff.type}
                    onChange={(v) => {
                      const t = DIFF_TYPES.find((x) => x.id === v) || DIFF_TYPES[0];
                      set({ diff: { ...f.diff!, type: t.id, side: t.side } });
                    }}
                  />
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
                    <div className="seg">
                      {(["retail", "pos"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={f.diff!.side === s}
                          onClick={() => set({ diff: { ...f.diff!, side: s } })}
                        >
                          {s === "retail" ? "리테일에 더 잡힘" : "포스기에 더 잡힘"}
                        </button>
                      ))}
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <Num id="r-damt" label="차액 금액" value={f.diff.amount} onChange={(v) => set({ diff: { ...f.diff!, amount: v } })} suf="원" />
                    </div>
                  </div>
                  <p className="hint">{dt?.hint}. 마감보고 차액 사유에 자동으로 들어가요.</p>
                </>
              )}
            </div>
          </>
        )}
        {err && <div className="alert">{err}</div>}
        <button type="button" className="btn pri" onClick={save}>
          기록 저장
        </button>
      </Card>

      <Card
        title={`오늘 기록 ${recs.length}건`}
        right={<span className="sub">☆ 눌러 세일즈 우수사례로 (최대 2건, 지금 {starCount}건)</span>}
      >
        {recs.length === 0 && <p className="hint">판매하거나 기억에 남는 상담이 있을 때마다 기록해두면 마감보고와 매니저 보고가 쉬워져요.</p>}
        {[...recs].reverse().map((r) => (
          <div className="rec" key={r.id}>
            <div className="h">
              <b>
                {r.product || r.cat} {r.qty > 1 ? `×${r.qty}` : ""}
              </b>
              <button
                type="button"
                className="star"
                aria-pressed={!!r.star}
                onClick={() => {
                  if (!r.star && starCount >= 2) return;
                  patch(r.id, { star: !r.star });
                }}
              >
                {r.star ? "★ 우수사례" : "☆ 우수사례"}
              </button>
            </div>
            <p>
              {r.time} · {r.cat} · {[r.age, r.gender].filter(Boolean).join(" ") || "고객 정보 없음"}
              {r.party ? ` · ${r.party}` : ""} · <b>{RESULTS[r.result]}</b>
            </p>
            {(r.needs.length || r.needMemo) && <p>니즈: {autoT(r)}</p>}
            {r.actions.length > 0 && <p>한 일: {r.actions.map((a) => ACTIONS[a][0]).join(", ")}</p>}
            {r.diff && (
              <p>
                <span className="tag warn">차액</span> {DIFF_TYPES.find((t) => t.id === r.diff!.type)?.label} ·{" "}
                {r.diff.side === "retail" ? "리테일" : "포스기"} +{won(r.diff.amount)}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" className="link danger" onClick={() => del(r.id)}>
                삭제
              </button>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
