"use client";

import { useState } from "react";
import { ago, won } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { useRequests } from "@/lib/use-requests";
import { ProductCompareCard } from "./ProductCompareCard";
import { metricRowFor } from "@/lib/chart-utils";
import { metricGuideText } from "@/data/metric-guides";
import type { EffectiveProduct } from "@/lib/product-utils";
import type { useShared } from "@/lib/use-shared";
import type { CompetitorProduct, Metric } from "@/types/product";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

function PriceEditor({ p, shared, onDone }: { p: EffectiveProduct; shared: ReturnType<typeof useShared>; onDone: () => void }) {
  const [price, setPrice] = useState(p.p || 0);
  const [note, setNote] = useState(p.note || "");
  const [comps, setComps] = useState<CompetitorProduct[]>(p.comps.map((c) => ({ ...c })));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const setC = (i: number, patch: Partial<CompetitorProduct>) => setComps(comps.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  const save = async () => {
    setBusy(true);
    try {
      await shared.saveProduct(p.id, p.name, p.p, {
        price: price || null,
        note: note.trim(),
        comps: comps
          .filter((c) => c.n.trim())
          .map((c) => ({
            n: c.n.trim(),
            b: (c.b || "").trim(),
            p: c.p || null,
            note: (c.note || "").trim(),
            pts: (c.pts || "").trim().slice(0, 300),
            url: /^https?:\/\//.test((c.url || "").trim()) ? (c.url || "").trim() : "",
          })),
        hidden: p.hidden,
      });
      onDone();
    } catch {
      setErr("저장하지 못했어요. 권한을 확인해주세요.");
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await shared.resetProduct(p.id);
      onDone();
    } catch {
      setErr("되돌리지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="box">
      <div className="grid2">
        <label className="field" htmlFor={"pe-p-" + p.id}>
          <span>
            <span>샤오미 매장가</span>
          </span>
          <input id={"pe-p-" + p.id} className="inp" inputMode="numeric" value={price || ""} onChange={(e) => setPrice(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)} />
        </label>
        <label className="field" htmlFor={"pe-n-" + p.id}>
          <span>
            <span>가격 메모</span>
          </span>
          <input id={"pe-n-" + p.id} className="inp" placeholder="예: 이번 달 프로모션" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      <span className="sub">경쟁 제품 (국내가 기준으로 넣으면 그래프에 반영돼요)</span>
      {comps.map((c, i) => (
        <div className="box" key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <b style={{ fontSize: 13 }}>경쟁 제품 {i + 1}</b>
            <button type="button" className="link danger" onClick={() => setComps(comps.filter((_, j) => j !== i))}>
              삭제
            </button>
          </div>
          <div className="grid2">
            <input className="inp" placeholder="제품명" value={c.n} onChange={(e) => setC(i, { n: e.target.value })} />
            <input className="inp" placeholder="브랜드" value={c.b || ""} onChange={(e) => setC(i, { b: e.target.value })} />
          </div>
          <div className="grid2">
            <input className="inp" placeholder="가격" inputMode="numeric" value={c.p || ""} onChange={(e) => setC(i, { p: Number(e.target.value.replace(/[^0-9]/g, "")) || null })} />
            <input className="inp" placeholder="출처 (예: 다나와 최저가 10/19)" value={c.note || ""} onChange={(e) => setC(i, { note: e.target.value })} />
          </div>
          <input className="inp" placeholder="상세 링크 (https://...)" value={c.url || ""} onChange={(e) => setC(i, { url: e.target.value })} />
          <input className="inp" placeholder="특장점 (선택)" value={c.pts || ""} onChange={(e) => setC(i, { pts: e.target.value })} />
        </div>
      ))}
      <button type="button" className="btn dash" onClick={() => setComps([...comps, { n: "", p: 0, note: "", pts: "", b: "", url: "" }])}>
        + 경쟁 제품 추가
      </button>
      {err && <div className="alert">{err}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {p.edited && shared.isAdmin && (
          <button type="button" className="link" disabled={busy} onClick={reset}>
            문서 기본값으로 되돌리기 (관리자)
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" className="btn sm" onClick={onDone}>
          취소
        </button>
        <button type="button" className="btn pri sm" disabled={busy} onClick={save}>
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

function Tips({ p, shared }: { p: EffectiveProduct; shared: ReturnType<typeof useShared> }) {
  const { uid } = useAuth();
  const [t, setT] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const tips = shared.tips.filter((x) => x.pid === p.id);

  const add = async () => {
    const v = t.trim();
    if (!v) return;
    if (PHONE_RE.test(v)) {
      setErr("전화번호처럼 보이는 내용이 있어요. 고객 정보는 공유 팁에 적을 수 없어요.");
      return;
    }
    setBusy(true);
    try {
      await shared.addTip(p.id, v.slice(0, 500));
      setT("");
      setErr("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tips">
      <span className="lbl">직원 세일즈 팁 {tips.length ? tips.length + "개" : ""}</span>
      {tips.length === 0 && <p className="hint">아직 남겨진 팁이 없어요.</p>}
      {tips.map((x) => (
        <div className="tip" key={x.id}>
          <p>{x.text}</p>
          <div className="tipm">
            <span>
              {x.by === uid ? "나" : "동료"} · {ago(x.at)}
            </span>
            {x.by === uid && (
              <button type="button" className="link danger" onClick={() => shared.deleteTip(x.id)}>
                삭제
              </button>
            )}
          </div>
        </div>
      ))}
      {shared.canWrite && (
        <>
          <textarea className="inp" rows={2} value={t} onChange={(e) => setT(e.target.value)} placeholder="잘 먹힌 멘트나 고객 반응을 공유해주세요" />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <span className="hint">직원 모두에게 보여요 · 고객 정보·매출 숫자 금지</span>
            <button type="button" className="btn pri sm" disabled={busy || !t.trim()} onClick={add}>
              {busy ? "등록 중…" : "팁 남기기"}
            </button>
          </div>
        </>
      )}
      {err && <div className="alert">{err}</div>}
    </div>
  );
}

export function ProductCard({
  p,
  open,
  onToggle,
  shared,
  metrics,
}: {
  p: EffectiveProduct;
  open: boolean;
  onToggle: () => void;
  shared: ReturnType<typeof useShared>;
  metrics?: Metric[];
}) {
  const { role } = useAuth();
  const reqs = useRequests();
  const [edit, setEdit] = useState(false);
  const [hideConfirm, setHideConfirm] = useState(false);
  const pending = reqs.pendingFor("product", p.id);
  const multiMetric = metrics?.find((m) => m.id === "multi");
  const myMultiRow = multiMetric ? metricRowFor(p.name, multiMetric.rows) : null;
  const usageGuide = myMultiRow ? metricGuideText(p.group, "multi", myMultiRow.v) : null;

  return (
    <section className="card pcard">
      <button type="button" className="phead" aria-expanded={open} onClick={onToggle}>
        <div style={{ minWidth: 0 }}>
          <b className="pname">{p.name}</b>
          <p className="pspec">{p.spec}</p>
        </div>
        <div className="pprice">
          <b>{p.p ? won(p.p) : "매장 확인"}</b>
          {p.note && <small>{p.note}</small>}
          {p.edited && <small className="edited">수정됨</small>}
        </div>
      </button>
      {open && (
        <>
          <p className="hint">⚠ 참고용 · 가격은 매장 시스템으로 꼭 확인 후 안내하세요.</p>
          {p.link && (
            <a className="olink big" href={p.link} target="_blank" rel="noopener noreferrer">
              샤오미 공식몰 상품 페이지 ↗
            </a>
          )}
          {p.specTable && p.specTable.length > 0 ? (
            <table className="spectable">
              <tbody>
                {p.specTable.map((row) => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="pspec" style={{ margin: 0 }}>
              {p.spec}
            </p>
          )}
          {usageGuide && (
            <div className="usageguide">
              <b>🎮 실사용 체감</b>
              <p>{usageGuide}</p>
              <small className="hint" style={{ margin: 0 }}>
                칩 성능 점수 기준 참고용 설명이에요 · &quot;성능 비교&quot; 그래프에서 더 자세히 볼 수 있어요
              </small>
            </div>
          )}
          <div className="kv">
            <span>추천 고객</span>
            <p>{p.for}</p>
          </div>
          <div className="pitch">
            <p>&quot;{p.pitch}&quot;</p>
          </div>
          <div className="kv">
            <span>강점</span>
            <div className="chips">
              {p.points.map((x) => (
                <span className="chip static" key={x}>
                  {x}
                </span>
              ))}
            </div>
          </div>
          {p.weak && (
            <div className="kv">
              <span>솔직하게 밀리는 점</span>
              <p>{p.weak}</p>
            </div>
          )}
          <div className="kv">
            <span>경쟁 제품</span>
            {p.comps.length === 0 && <p className="hint">등록된 경쟁 제품이 없어요.</p>}
            {p.comps.map((c, i) => (
              <div className="crow" key={i}>
                <span>
                  {c.b && <i className="brand">{c.b}</i>}
                  {c.n}
                </span>
                <b>{c.p ? won(c.p) : "가격 확인 필요"}</b>
                {c.pts && <em className="cpts">특장점: {c.pts}</em>}
                {(c.note || c.url) && (
                  <small>
                    {c.note ? "출처: " + c.note : ""}
                    {c.url && (
                      <>
                        {" "}
                        <a href={c.url} target="_blank" rel="noopener noreferrer" className="olink">
                          상세 ↗
                        </a>
                      </>
                    )}
                  </small>
                )}
              </div>
            ))}
          </div>
          <ProductCompareCard p={p} metrics={metrics || []} />
          {edit ? (
            <PriceEditor p={p} shared={shared} onDone={() => setEdit(false)} />
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span className="hint">{p.edited ? "직원이 가격을 수정했어요" : "문서 정리 기준 가격"}</span>
              {shared.canWrite && (
                <div style={{ display: "flex", gap: 6 }}>
                  {shared.isAdmin ? (
                    !hideConfirm ? (
                      <button type="button" className="btn sm" onClick={() => setHideConfirm(true)}>
                        단종·숨기기
                      </button>
                    ) : (
                      <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <small className="hint" style={{ margin: 0 }}>
                          숨길까요?
                        </small>
                        <button type="button" className="btn sm" onClick={() => setHideConfirm(false)}>
                          취소
                        </button>
                        <button
                          type="button"
                          className="btn sm"
                          onClick={() => {
                            shared.setHidden(p.id, true);
                            setHideConfirm(false);
                          }}
                        >
                          확인
                        </button>
                      </span>
                    )
                  ) : (
                    role !== "guest" && (
                      <button type="button" className="btn sm" style={{ color: "var(--muted)" }} disabled={pending} onClick={() => reqs.add({ kind: "product", target: p.id, label: p.name })}>
                        {pending ? "요청됨" : "단종 요청"}
                      </button>
                    )
                  )}
                  <button type="button" className="btn sm" onClick={() => setEdit(true)}>
                    가격 수정
                  </button>
                </div>
              )}
            </div>
          )}
          <Tips p={p} shared={shared} />
        </>
      )}
    </section>
  );
}
