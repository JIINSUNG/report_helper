"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { GROUPS } from "@/data/groups";
import { DATA_UPDATED } from "@/data/groups.meta";
import { ALL_PRODUCTS, effectiveProduct, officialRows } from "@/lib/product-utils";
import { useShared } from "@/lib/use-shared";
import { METRICS } from "@/data/metrics";
import { ProductCard } from "./ProductCard";
import { RivalCard } from "./RivalCard";
import { PriceChart } from "./PriceChart";
import { MetricChart } from "./MetricChart";
import { ScatterChart } from "./ScatterChart";
import { PriceHistoryCard } from "./PriceHistoryCard";
import { BulkPriceEditor } from "./BulkPriceEditor";
import { ProductQuiz } from "./ProductQuiz";

export function ProductsTab() {
  const shared = useShared();
  const [g, setG] = useState(GROUPS[0].id);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [acc, setAcc] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const official = g === "official";
  const grp = GROUPS.find((x) => x.id === g) || GROUPS[0];
  const qlower = q.trim().toLowerCase();
  const qs = official ? "" : qlower;
  const base = official
    ? []
    : qs
      ? ALL_PRODUCTS.filter((p) => (p.name + " " + p.for + " " + p.pitch + " " + p.spec).toLowerCase().includes(qs))
      : ALL_PRODUCTS.filter((p) => p.group === grp.id);
  const all = base.map((p) => effectiveProduct(p, shared.overrides));
  const items = all.filter((p) => !p.hidden);
  const hiddenItems = all.filter((p) => p.hidden);
  const allRows = official ? officialRows() : [];
  const rows = official ? allRows.filter((r) => (acc || !r.a) && (!qlower || (r.n + " " + r.c).toLowerCase().includes(qlower))) : [];
  const cats = official ? [...new Set(rows.map((r) => r.c))] : [];
  const groupHistory = shared.priceHistory.filter((h) => all.some((p) => p.id === h.productId));

  return (
    <>
      <div className="warnbox" role="note">
        <b>⚠ 참고용 정보예요 · 최종 수정 {DATA_UPDATED.replaceAll("-", ".")}</b>
        <span>제품 스펙·가격·경쟁사 비교는 틀리거나 바뀌었을 수 있어요. 고객에게 안내하기 전에 반드시 공식몰·매장 시스템으로 크로스 체크하세요.</span>
      </div>
      <section className="card" style={{ gap: 10 }}>
        <input
          className="inp"
          type="search"
          placeholder={official ? "공식몰 제품 검색" : "제품·고객 유형 검색 (예: 부모님, 게임, 패드 8)"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
          {GROUPS.map((x) => (
            <button
              key={x.id}
              type="button"
              className="chip"
              aria-pressed={!qs && g === x.id}
              onClick={() => {
                setQ("");
                setG(x.id);
                setOpen(null);
                setQuizOpen(false);
              }}
            >
              {x.label}
            </button>
          ))}
          <button
            type="button"
            className="chip"
            aria-pressed={official}
            onClick={() => {
              setQ("");
              setG("official");
              setOpen(null);
              setQuizOpen(false);
            }}
          >
            공식몰 전체
          </button>
        </div>
      </section>

      {official && (
        <Card title="공식몰 전체 제품" right={<span className="sub">{rows.length}개</span>}>
          <label className="tryrow" style={{ fontSize: 13 }}>
            <input type="checkbox" checked={acc} onChange={(e) => setAcc(e.target.checked)} />
            <span style={{ textDecoration: "none", color: "var(--fg2)" }}>액세서리·소모품(커버, 필터, 펜 등)도 보기</span>
          </label>
          {cats.length === 0 && <p className="hint">&quot;{q}&quot;에 맞는 제품이 없어요.</p>}
          {cats.map((c) => {
            const list = rows.filter((r) => r.c === c);
            return (
              <details key={c} open={!!qlower || cats.length <= 3}>
                <summary>
                  {c} <span className="sub">{list.length}</span>
                </summary>
                <div className="olist">
                  {list.map((r, i) => (
                    <div className="orow" key={r.n + i}>
                      <span className="oname">
                        {r.n}
                        {r.a && <small>액세서리</small>}
                      </span>
                      {r.guide && (
                        <button
                          type="button"
                          className="tag ok"
                          onClick={() => {
                            setQ("");
                            setG(r.guide!.group);
                            setOpen(r.guide!.id);
                          }}
                        >
                          매장 가이드
                        </button>
                      )}
                      {r.u ? (
                        <a className="olink" href={r.u} target="_blank" rel="noopener noreferrer">
                          상품 페이지 ↗
                        </a>
                      ) : (
                        <span className="sub">링크 없음</span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </Card>
      )}

      {!official && !qs && (
        <Card
          title={grp.label + " 가격 비교"}
          right={
            shared.canWrite ? (
              <button type="button" className="link" onClick={() => setBulkOpen(!bulkOpen)}>
                {bulkOpen ? "일괄 변경 닫기" : "일괄 가격 변경"}
              </button>
            ) : (
              <span className="sub">매장가 vs 경쟁 제품</span>
            )
          }
        >
          <PriceChart items={items} />
          <p className="hint">각 막대 이름 아래에 정확한 금액과 출처가 적혀 있어요. 경쟁 제품 가격은 각 제품 카드의 &quot;가격 수정&quot;에서 바꿀 수 있어요.</p>
        </Card>
      )}

      {!official && !qs && bulkOpen && shared.canWrite && <BulkPriceEditor items={items} shared={shared} onDone={() => setBulkOpen(false)} />}

      {!official && !qs && <PriceHistoryCard history={groupHistory} />}

      {!official && !qs && METRICS[grp.id] && (
        <Card
          title={grp.label + " 성능 비교"}
          right={
            <button type="button" className="link" onClick={() => setQuizOpen(true)}>
              📝 퀴즈로 확인
            </button>
          }
        >
          <MetricChart metrics={METRICS[grp.id]} groupId={grp.id} />
        </Card>
      )}

      {!official && !qs && quizOpen && <ProductQuiz groupId={grp.id} groupLabel={grp.label} onClose={() => setQuizOpen(false)} />}

      {!official && !qs && METRICS[grp.id] && (
        <Card title={grp.label + " 가격 대비 성능"} right={<span className="sub">x 가격 · y 성능</span>}>
          <ScatterChart metrics={METRICS[grp.id]} items={items} />
        </Card>
      )}

      {!official && !qs && (
        <Card title="응대 가이드">
          <div className="soft">
            <b style={{ fontSize: 13.5 }}>첫 질문</b>
            <p style={{ margin: 0, fontSize: 14 }}>{grp.ask}</p>
          </div>
          <ul className="glist">
            {grp.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          {grp.upsell.length > 0 && (
            <details>
              <summary>업셀 경로 {grp.upsell.length}</summary>
              <ol className="glist">
                {grp.upsell.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </details>
          )}
          {grp.faq.length > 0 && (
            <details>
              <summary>자주 나오는 반론과 대응 {grp.faq.length}</summary>
              <div className="faq">
                {grp.faq.map((x) => (
                  <div key={x.q}>
                    <b>{x.q}</b>
                    <p>{x.a}</p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </Card>
      )}

      {!official && qs && items.length === 0 && <p className="hint">&quot;{q}&quot;에 맞는 매장 가이드 제품이 없어요. &quot;공식몰 전체&quot;에서 찾아보세요.</p>}
      {items.map((p) => (
        <ProductCard key={p.id} p={p} shared={shared} open={open === p.id} onToggle={() => setOpen(open === p.id ? null : p.id)} metrics={METRICS[p.group] || []} />
      ))}

      {!official && !qs && <RivalCard grp={grp} shared={shared} />}

      {hiddenItems.length > 0 && (
        <details className="card hiddenbox">
          <summary>단종·숨긴 제품 {hiddenItems.length}개</summary>
          {hiddenItems.map((p) => (
            <div className="crow" key={p.id}>
              <span>{p.name}</span>
              {shared.isAdmin && (
                <button type="button" className="btn sm" onClick={() => shared.setHidden(p.id, false)}>
                  다시 보이기
                </button>
              )}
            </div>
          ))}
        </details>
      )}
    </>
  );
}
