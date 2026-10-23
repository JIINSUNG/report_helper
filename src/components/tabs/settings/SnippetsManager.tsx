"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { uid } from "@/lib/format";
import { extractVars } from "@/lib/snippets";
import type { LocalReportData, Snippet } from "@/types/report";

export function SnippetsManager({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const snippets = data.settings.snippets || [];
  const [label, setLabel] = useState("");
  const [template, setTemplate] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const add = () => {
    const l = label.trim();
    const t = template.trim();
    if (!l || !t) return;
    const s: Snippet = { id: uid(), label: l.slice(0, 40), template: t.slice(0, 500) };
    update((d) => ({ ...d, settings: { ...d.settings, snippets: [...(d.settings.snippets || []), s] } }));
    setLabel("");
    setTemplate("");
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, snippets: (d.settings.snippets || []).filter((s) => s.id !== id) } }));
    setDeleteId(null);
  };

  return (
    <Card title="내 문구 (변수 틀)" right={<span className="sub">오픈·마감·세일즈에서 불러오기</span>}>
      <p className="hint" style={{ margin: 0 }}>
        자주 쓰는 문장을 저장해두고, 글 쓸 때 &apos;문구 불러오기&apos;로 바로 넣을 수 있어요. 중괄호로 변수를 만들면 쓸 때마다 값을 채워 넣어요. 예:{" "}
        <code>{"{품목} 특가 안내드렸습니다"}</code>
      </p>
      {snippets.length === 0 && <p className="hint">아직 저장한 문구가 없어요.</p>}
      {snippets.map((s) => (
        <div className="box" key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div>
            <b style={{ fontSize: 14 }}>{s.label}</b>
            <p className="hint" style={{ margin: 0 }}>
              {s.template}
              {extractVars(s.template).length > 0 && ` · 변수: ${extractVars(s.template).join(", ")}`}
            </p>
          </div>
          {deleteId === s.id ? (
            <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button type="button" className="btn sm" onClick={() => setDeleteId(null)}>
                취소
              </button>
              <button type="button" className="btn sm pri" onClick={() => remove(s.id)}>
                삭제
              </button>
            </span>
          ) : (
            <button type="button" className="link danger" style={{ flexShrink: 0 }} onClick={() => setDeleteId(s.id)}>
              삭제
            </button>
          )}
        </div>
      ))}

      <div className="box">
        <input className="inp" placeholder="문구 이름 (예: 특가 안내)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <textarea
          className="inp"
          rows={3}
          placeholder="문구 내용 — {}로 감싸면 변수가 돼요. 예: {품목} 특가로 {가격}에 안내드렸습니다"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
        <button type="button" className="btn pri sm" disabled={!label.trim() || !template.trim()} onClick={add}>
          문구 추가
        </button>
      </div>
    </Card>
  );
}
