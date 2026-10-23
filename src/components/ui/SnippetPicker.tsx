"use client";

import { useState } from "react";
import { extractVars, fillSnippet } from "@/lib/snippets";
import type { Snippet } from "@/types/report";

export function SnippetPicker({ snippets, onInsert }: { snippets: Snippet[]; onInsert: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Snippet | null>(null);
  const [vars, setVars] = useState<Record<string, string>>({});

  if (!snippets.length) return null;

  const pick = (s: Snippet) => {
    setPicked(s);
    setVars(Object.fromEntries(extractVars(s.template).map((v) => [v, ""])));
  };

  const insert = () => {
    if (!picked) return;
    onInsert(fillSnippet(picked.template, vars));
    setOpen(false);
    setPicked(null);
    setVars({});
  };

  if (!open) {
    return (
      <button type="button" className="link" onClick={() => setOpen(true)}>
        문구 불러오기
      </button>
    );
  }

  return (
    <div className="box">
      {!picked ? (
        <>
          <span className="sub">어떤 문구를 쓸까요?</span>
          <div className="chips">
            {snippets.map((s) => (
              <button key={s.id} type="button" className="chip" onClick={() => pick(s)}>
                {s.label}
              </button>
            ))}
          </div>
          <button type="button" className="link" style={{ alignSelf: "flex-start" }} onClick={() => setOpen(false)}>
            취소
          </button>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
