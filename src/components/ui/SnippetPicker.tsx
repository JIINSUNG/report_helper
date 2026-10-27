"use client";

import { useState } from "react";
import { SnippetEditor } from "@/components/ui/SnippetEditor";
import { extractVars, fillSnippet } from "@/lib/snippets";
import { uid } from "@/lib/format";
import type { LocalReportData, Snippet } from "@/types/report";

export function SnippetPicker({
  snippets,
  onInsert,
  update,
}: {
  snippets: Snippet[];
  onInsert: (text: string) => void;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editTarget, setEditTarget] = useState<Snippet | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Snippet | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});

  const close = () => {
    setOpen(false);
    setMode("list");
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
    onInsert(fillSnippet(picked.template, vars));
    close();
  };

  const addSnippet = (label: string, template: string) => {
    const s: Snippet = { id: uid(), label, template };
    update((d) => ({ ...d, settings: { ...d.settings, snippets: [...(d.settings.snippets || []), s] } }));
    setMode("list");
  };

  const editSnippet = (id: string, label: string, template: string) => {
    update((d) => ({
      ...d,
      settings: { ...d.settings, snippets: (d.settings.snippets || []).map((s) => (s.id === id ? { ...s, label, template } : s)) },
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
    return <SnippetEditor onCancel={() => setMode("list")} onSave={addSnippet} />;
  }

  if (mode === "edit" && editTarget) {
    return (
      <SnippetEditor
        initialLabel={editTarget.label}
        initialTemplate={editTarget.template}
        onCancel={() => {
          setMode("list");
          setEditTarget(null);
        }}
        onSave={(label, template) => editSnippet(editTarget.id, label, template)}
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
      {snippets.length === 0 && (
        <p className="hint" style={{ margin: 0 }}>
          아직 저장한 문구가 없어요. 바로 만들어볼까요?
        </p>
      )}
      {snippets.map((s) =>
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
              {s.label}
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
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button type="button" className="link" onClick={() => setMode("add")}>
          + 새 문구 만들기
        </button>
        <button type="button" className="link" style={{ marginLeft: "auto" }} onClick={close}>
          닫기
        </button>
      </div>
    </div>
  );
}
