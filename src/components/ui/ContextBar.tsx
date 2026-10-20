"use client";

import { TAGS, TAG_GROUP } from "@/data/context-tags";
import { ctxTags, emptyCtx, type AutoContext } from "@/lib/context";
import type { ContextState } from "@/types/report";

export function ContextBar({
  auto,
  state,
  setState,
}: {
  auto: AutoContext;
  state: ContextState | null | undefined;
  setState: (v: ContextState) => void;
}) {
  const c: ContextState = { ...emptyCtx(), ...(state || {}) };
  const on = ctxTags(auto, c);

  const setOn = (id: string, v: boolean, cc: ContextState): ContextState => {
    const isA = auto.tags.includes(id);
    if (v) {
      cc.off = cc.off.filter((x) => x !== id);
      if (!isA && !cc.add.includes(id)) cc.add = [...cc.add, id];
    } else {
      cc.add = cc.add.filter((x) => x !== id);
      if (isA && !cc.off.includes(id)) cc.off = [...cc.off, id];
    }
    return cc;
  };

  const toggle = (id: string) => {
    let cc: ContextState = { ...c, add: [...c.add], off: [...c.off] };
    const v = !on.includes(id);
    const group = TAG_GROUP[id];
    if (v && group) {
      TAGS.filter((t) => t.g === group && t.id !== id && !(id === "holiday" && t.id === "weekend")).forEach((t) => {
        cc = setOn(t.id, false, cc);
      });
    }
    if (v && id === "holiday") cc = setOn("weekend", true, cc);
    setState(setOn(id, v, cc));
  };

  const showPromo = on.includes("promo") || on.includes("promoEnd");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="chips">
        {TAGS.map((t) => {
          const isA = auto.tags.includes(t.id);
          const p = on.includes(t.id);
          return (
            <button key={t.id} type="button" className={"chip" + (isA ? " auto" : "")} aria-pressed={p} onClick={() => toggle(t.id)}>
              {isA ? "• " : ""}
              {t.label}
              {p && t.id === "itemMiss" && (c.item ?? auto.item) ? ` · ${c.item ?? auto.item}` : ""}
            </button>
          );
        })}
      </div>
      {on.includes("itemMiss") && (
        <input
          id="miss-item"
          className="inp"
          placeholder="미달 품목 (예: TV)"
          value={c.item ?? auto.item}
          onChange={(e) => setState({ ...c, item: e.target.value })}
        />
      )}
      {showPromo && (
        <input
          id="promo-name"
          className="inp"
          placeholder="프로모션 제품 (예: Xiaomi 밴드 11)"
          value={c.promo}
          onChange={(e) => setState({ ...c, promo: e.target.value })}
        />
      )}
      <p className="hint">• 표시는 날짜·실적으로 자동 선택된 칩이에요. 대체공휴일이거나 전일 기록이 없으면 눌러서 바꾸세요.</p>
    </div>
  );
}
