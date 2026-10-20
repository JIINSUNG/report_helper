"use client";

import { useState } from "react";
import { PHRASES, type Phrase } from "@/data/phrases";
import { fill, recommend } from "@/lib/context";
import type { LocalReportData } from "@/types/report";

export function Reco({
  data,
  update,
  k,
  tags,
  manual,
  vars,
  onPick,
  label = "넣기",
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  k: Phrase["k"];
  tags: string[];
  manual: string[];
  vars: { promo: string; item: string };
  onPick: (p: { t: string; b: string[] }) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(true);
  const [all, setAll] = useState(false);
  const list = recommend(PHRASES, k, tags, manual, data.favorites);
  const vis = all ? list : list.slice(0, 2);

  const fav = (id: string) =>
    update((d) => ({ ...d, favorites: d.favorites.includes(id) ? d.favorites.filter((f) => f !== id) : [...d.favorites, id] }));

  return (
    <div className="soft">
      <button type="button" style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 14, width: "100%" }} onClick={() => setOpen(!open)}>
        <span>추천 문장 {list.length}개</span>
        <span className="link">{open ? "접기" : "펼치기"}</span>
      </button>
      {open && (
        <>
          {list.length === 0 && <p className="hint">고른 상황에 맞는 문장이 없어요. 상황 칩을 더 골라보세요.</p>}
          {vis.map((p) => {
            const t = fill(p.t, vars);
            const b = p.b.map((x) => fill(x, vars));
            return (
              <div className="reco" key={p.id}>
                {t && <p className="t">{t}</p>}
                {b.map((x, i) => (
                  <p key={i}>{k === "comment" ? x : "- " + x}</p>
                ))}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, alignItems: "center" }}>
                  <button type="button" className="link" onClick={() => fav(p.id)}>
                    {data.favorites.includes(p.id) ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
                  </button>
                  <button type="button" className="btn pri sm" onClick={() => onPick({ t, b })}>
                    {label}
                  </button>
                </div>
              </div>
            );
          })}
          {list.length > 2 && (
            <button type="button" className="link" onClick={() => setAll(!all)}>
              {all ? "접기" : `${list.length - 2}개 더 보기`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
