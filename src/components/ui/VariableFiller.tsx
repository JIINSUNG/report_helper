"use client";

import { useState } from "react";
import { extractVars, fillSnippet } from "@/lib/snippets";

/** 미리 저장한 문구가 아니라, 글 쓰다가 직접 적은 {변수}도 채울 수 있게 해준다. */
export function VariableFiller({ text, onApply }: { text: string; onApply: (filled: string) => void }) {
  const [open, setOpen] = useState(false);
  const [vars, setVars] = useState<Record<string, string>>({});
  const names = extractVars(text);

  if (!names.length) return null;

  const apply = () => {
    onApply(fillSnippet(text, vars));
    setOpen(false);
    setVars({});
  };

  if (!open) {
    return (
      <button
        type="button"
        className="link"
        onClick={() => {
          setOpen(true);
          setVars(Object.fromEntries(names.map((v) => [v, ""])));
        }}
      >
        변수 채우기 ({names.length})
      </button>
    );
  }

  return (
    <div className="box">
      <span className="sub">직접 적은 중괄호 변수에 값을 채워요</span>
      {names.map((v) => (
        <label className="field" key={v} htmlFor={`var-${v}`}>
          <span>
            <span>{v}</span>
          </span>
          <input id={`var-${v}`} className="inp" value={vars[v] || ""} onChange={(e) => setVars({ ...vars, [v]: e.target.value })} />
        </label>
      ))}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn sm" onClick={() => setOpen(false)}>
          취소
        </button>
        <button type="button" className="btn pri sm" onClick={apply}>
          적용
        </button>
      </div>
    </div>
  );
}
