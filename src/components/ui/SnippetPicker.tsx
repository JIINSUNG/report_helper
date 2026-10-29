"use client";

import { useState } from "react";
import { SnippetEditor } from "@/components/ui/SnippetEditor";
import { extractVars, fillSnippet } from "@/lib/snippets";
import { uid } from "@/lib/format";
import { locationLabel } from "@/data/snippet-locations";
import type { LocalReportData, Snippet } from "@/types/report";

export interface SnippetInsert {
  text: string;
  label: string;
  position: "top" | "bottom";
}

export function SnippetPicker({
  snippets,
  location,
  onInsert,
  update,
}: {
  snippets: Snippet[];
  /** 이 칸의 위치 id. SNIPPET_LOCATIONS 참고 — 이 위치로 지정된(또는 위치 지정이 없는) 문구만 보여준다. */
  location: string;
  onInsert: (p: SnippetInsert) => void;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const byDaily = (a: Snippet, b: Snippet) => (b.frequency === "daily" ? 1 : 0) - (a.frequency === "daily" ? 1 : 0);
  const visible = snippets.filter((s) => !s.locations || s.locations.length === 0 || s.locations.includes(location)).sort(byDaily);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [showAll, setShowAll] = useState(false);
  const [editTarget, setEditTarget] = useState<Snippet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Snippet | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});

  const shown = showAll ? [...snippets].sort(byDaily) : visible;

  const close = () => {
    setOpen(false);
    setMode("list");
    setShowAll(false);
    setPicked(null);
    setVars({});
    setEditTarget(null);
    setDeleteId(null);
  };

  const pick = (s: Snippet) => {
    setPicked(s);
    setVars(Object.fromEntries(extractVars(s.template).map((v) => [v, ""])));
  };

  const insert = () => {
    if (!picked) return;
    onInsert({ text: fillSnippet(picked.template, vars), label: picked.label, position: picked.position ?? "bottom" });
    close();
  };

  const addSnippet = (
    label: string,
    template: string,
    locations: string[],
    position: "top" | "bottom",
    frequency: "daily" | "optional",
    dailyVars: Record<string, string>
  ) => {
    const s: Snippet = { id: uid(), label, template, locations, position, frequency, dailyVars };
    update((d) => ({ ...d, settings: { ...d.settings, snippets: [...(d.settings.snippets || []), s] } }));
    setMode("list");
  };

  const editSnippet = (
    id: string,
    label: string,
    template: string,
    locations: string[],
    position: "top" | "bottom",
    frequency: "daily" | "optional",
    dailyVars: Record<string, string>
  ) => {
    update((d) => ({
      ...d,
      settings: {
        ...d.settings,
        snippets: (d.settings.snippets || []).map((s) => (s.id === id ? { ...s, label, template, locations, position, frequency, dailyVars } : s)),
      },
    }));
    setMode("list");
    setEditTarget(null);
  };

  const removeSnippet = (id: string) => {
    update((d) => ({ ...d, settings: { ...d.settings, snippets: (d.settings.snippets || []).filter((s) => s.id !== id) } }));
    setDeleteId(null);
  };

  if (!open) {
    return (
      <button type="button" className="link" onClick={() => setOpen(true)}>
        {snippets.length ? "문구 불러오기" : "문구 만들기"}
      </button>
    );
  }

  if (mode === "add") {
    return <SnippetEditor initialLocations={[location]} onCancel={() => setMode("list")} onSave={addSnippet} />;
  }

  if (mode === "edit" && editTarget) {
    return (
      <SnippetEditor
        initialLabel={editTarget.label}
        initialTemplate={editTarget.template}
        initialLocations={editTarget.locations || []}
        initialPosition={editTarget.position ?? "bottom"}
        initialFrequency={editTarget.frequency ?? "optional"}
        initialDailyVars={editTarget.dailyVars || {}}
        onCancel={() => {
          setMode("list");
          setEditTarget(null);
        }}
        onSave={(label, template, locations, position, frequency, dailyVars) =>
          editSnippet(editTarget.id, label, template, locations, position, frequency, dailyVars)
        }
      />
    );
  }

  if (picked) {
    return (
      <div className="box">
        <span className="sub">{picked.label}</span>
        <p className="hint" style={{ margin: 0 }}>
          {picked.template}
        </p>
        {extractVars(picked.template).map((v) => (
          <label className="field" key={v} htmlFor={`snip-${v}`}>
            <span>
              <span>{v}</span>
            </span>
            <input id={`snip-${v}`} className="inp" value={vars[v] || ""} onChange={(e) => setVars({ ...vars, [v]: e.target.value })} />
          </label>
        ))}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" className="btn sm" onClick={() => setPicked(null)}>
            다른 문구
          </button>
          <button type="button" className="btn pri sm" onClick={insert}>
            삽입
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="box">
      <span className="sub">어떤 문구를 쓸까요?</span>
      {shown.length === 0 && (
        <p className="hint" style={{ margin: 0 }}>
          {snippets.length === 0 ? "아직 저장한 문구가 없어요. 바로 만들어볼까요?" : "이 칸에 보이도록 정한 문구가 없어요. 새로 만들거나, 아래 '다른 칸 문구도 보기'에서 위치를 바꿔보세요."}
        </p>
      )}
      {shown.map((s) =>
        deleteId === s.id ? (
          <div className="alert" key={s.id}>
            &apos;{s.label}&apos; 문구를 지울까요?
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn sm" onClick={() => setDeleteId(null)}>
                취소
              </button>
              <button type="button" className="btn sm pri" onClick={() => removeSnippet(s.id)}>
                삭제
              </button>
            </div>
          </div>
        ) : (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" className="chip" style={{ flex: 1, textAlign: "left" }} onClick={() => pick(s)}>
              {s.frequency === "daily" ? "📌 " : ""}
              {s.label}
              {showAll && (
                <small style={{ display: "block", fontWeight: 400 }}>
                  위치: {s.locations && s.locations.length > 0 ? s.locations.map(locationLabel).join(", ") : "모든 칸"} · {s.position === "top" ? "맨 위" : "맨 아래"}
                  {s.frequency === "daily" ? " · 매일 반영" : ""}
                </small>
              )}
            </button>
            <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setEditTarget(s);
                  setMode("edit");
                }}
              >
                수정
              </button>
              <button type="button" className="link danger" onClick={() => setDeleteId(s.id)}>
                삭제
              </button>
            </span>
          </div>
        )
      )}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button type="button" className="link" onClick={() => setMode("add")}>
          + 새 문구 만들기
        </button>
        {snippets.length !== visible.length && (
          <button type="button" className="link" onClick={() => setShowAll(!showAll)}>
            {showAll ? "이 칸에 맞는 문구만 보기" : "다른 칸 문구도 보기 (위치 바꾸기)"}
          </button>
        )}
        <button type="button" className="link" style={{ marginLeft: "auto" }} onClick={close}>
          닫기
        </button>
      </div>
    </div>
  );
}
