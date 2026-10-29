"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { SnippetEditor } from "@/components/ui/SnippetEditor";
import { uid } from "@/lib/format";
import { extractVars } from "@/lib/snippets";
import { locationLabel } from "@/data/snippet-locations";
import type { LocalReportData, Snippet } from "@/types/report";

export function SnippetsManager({
  data,
  update,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const snippets = data.settings.snippets || [];
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const add = (label: string, template: string, locations: string[], position: "top" | "bottom", frequency: "daily" | "optional") => {
    const s: Snippet = { id: uid(), label, template, locations, position, frequency };
    update((d) => ({ ...d, settings: { ...d.settings, snippets: [...(d.settings.snippets || []), s] } }));
    setAdding(false);
  };

  const edit = (id: string, label: string, template: string, locations: string[], position: "top" | "bottom", frequency: "daily" | "optional") => {
    update((d) => ({
      ...d,
      settings: { ...d.settings, snippets: (d.settings.snippets || []).map((s) => (s.id === id ? { ...s, label, template, locations, position, frequency } : s)) },
    }));
    setEditId(null);
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, snippets: (d.settings.snippets || []).filter((s) => s.id !== id) } }));
    setDeleteId(null);
  };

  return (
    <Card title="내 문구 (변수 틀)" right={<span className="sub">오픈·마감·세일즈에서 불러오기</span>}>
      <p className="hint" style={{ margin: 0 }}>
        자주 쓰는 문장을 저장해두고, 글 쓸 때 &apos;문구 불러오기&apos;로 바로 넣을 수 있어요. 변수를 넣으면 쓸 때마다 값을 따로 채워 넣어요.
      </p>
      {snippets.length === 0 && !adding && <p className="hint">아직 저장한 문구가 없어요.</p>}
      {snippets.map((s) =>
        editId === s.id ? (
          <SnippetEditor
            key={s.id}
            initialLabel={s.label}
            initialTemplate={s.template}
            initialLocations={s.locations || []}
            initialPosition={s.position ?? "bottom"}
            initialFrequency={s.frequency ?? "optional"}
            onCancel={() => setEditId(null)}
            onSave={(label, template, locations, position, frequency) => edit(s.id, label, template, locations, position, frequency)}
          />
        ) : (
          <div className="box" key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <b style={{ fontSize: 14 }}>
                {s.frequency === "daily" ? "📌 " : ""}
                {s.label}
              </b>
              <p className="hint" style={{ margin: 0 }}>
                {s.template}
                {extractVars(s.template).length > 0 && ` · 변수: ${extractVars(s.template).join(", ")}`}
              </p>
              <p className="hint" style={{ margin: 0 }}>
                위치: {s.locations && s.locations.length > 0 ? s.locations.map(locationLabel).join(", ") : "모든 칸"} · 넣는 자리: {s.position === "top" ? "맨 위" : "맨 아래"}
                {s.frequency === "daily" ? " · 매일 반영(보고서에 기본으로 미리 들어감)" : ""}
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
              <span style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button type="button" className="link" onClick={() => setEditId(s.id)}>
                  수정
                </button>
                <button type="button" className="link danger" onClick={() => setDeleteId(s.id)}>
                  삭제
                </button>
              </span>
            )}
          </div>
        )
      )}

      {adding ? (
        <SnippetEditor onCancel={() => setAdding(false)} onSave={add} />
      ) : (
        <button type="button" className="btn pri sm" style={{ alignSelf: "flex-start" }} onClick={() => setAdding(true)}>
          + 문구 추가
        </button>
      )}
    </Card>
  );
}
