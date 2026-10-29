"use client";

import { useRef, useState } from "react";
import { extractVars } from "@/lib/snippets";
import { SNIPPET_LOCATIONS } from "@/data/snippet-locations";

/**
 * 문구(틀) 추가·수정 폼. {변수} 를 직접 타이핑하지 않고도, 변수 이름을 입력해
 * 버튼을 누르면 커서 위치(또는 끝)에 {변수}가 자동으로 들어가게 해준다.
 * 어느 글쓰기 칸에 이 문구를 보여줄지(삽입 위치)도 함께 고를 수 있다.
 */
export function SnippetEditor({
  initialLabel = "",
  initialTemplate = "",
  initialLocations = [],
  initialPosition = "bottom",
  initialPinned = false,
  onSave,
  onCancel,
}: {
  initialLabel?: string;
  initialTemplate?: string;
  initialLocations?: string[];
  initialPosition?: "top" | "bottom";
  initialPinned?: boolean;
  onSave: (label: string, template: string, locations: string[], position: "top" | "bottom", pinned: boolean) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [template, setTemplate] = useState(initialTemplate);
  const [varName, setVarName] = useState("");
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [position, setPosition] = useState<"top" | "bottom">(initialPosition);
  const [pinned, setPinned] = useState(initialPinned);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const toggleLocation = (id: string) => {
    setLocations((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const vars = extractVars(template);

  const insertVar = (name: string) => {
    const v = name.trim();
    if (!v) return;
    const token = `{${v}}`;
    const ta = taRef.current;
    const start = ta?.selectionStart ?? template.length;
    const end = ta?.selectionEnd ?? template.length;
    const next = template.slice(0, start) + token + template.slice(end);
    setTemplate(next);
    const caret = start + token.length;
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(caret, caret);
    });
  };

  const addNewVar = () => {
    insertVar(varName);
    setVarName("");
  };

  return (
    <div className="box">
      <input className="inp" placeholder="문구 이름 (예: 특가 안내)" value={label} onChange={(e) => setLabel(e.target.value)} />
      <textarea
        ref={taRef}
        className="inp"
        rows={3}
        placeholder="문구 내용을 적어주세요. 값이 바뀌는 자리는 아래에서 변수로 넣어보세요"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
          변수
        </span>
        {vars.map((v) => (
          <button key={v} type="button" className="chip" onClick={() => insertVar(v)} title="커서 위치에 다시 넣기">
            {v}
          </button>
        ))}
        <input
          className="inp mini"
          style={{ maxWidth: 110 }}
          placeholder="새 변수 이름"
          value={varName}
          onChange={(e) => setVarName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewVar())}
        />
        <button type="button" className="btn sm" disabled={!varName.trim()} onClick={addNewVar}>
          + 변수 넣기
        </button>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        변수를 넣으면 이 문구를 쓸 때마다 그 자리에 들어갈 값을 따로 입력할 수 있어요.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
          어디에 보일까요
        </span>
        {SNIPPET_LOCATIONS.map(([id, locLabel]) => (
          <button key={id} type="button" className="chip" aria-pressed={locations.includes(id)} onClick={() => toggleLocation(id)}>
            {locLabel}
          </button>
        ))}
      </div>
      <p className="hint" style={{ margin: 0 }}>
        {locations.length === 0 ? "아무것도 안 고르면 모든 칸에서 보여요." : "고른 칸에서만 이 문구가 보여요."}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
          넣는 자리
        </span>
        <div className="seg" style={{ gridTemplateColumns: "repeat(2,1fr)", minWidth: 180 }}>
          <button type="button" aria-pressed={position === "top"} onClick={() => setPosition("top")}>
            맨 위(첫 줄)
          </button>
          <button type="button" aria-pressed={position === "bottom"} onClick={() => setPosition("bottom")}>
            맨 아래(마지막 줄)
          </button>
        </div>
      </div>
      <label className="tryrow" style={{ fontSize: 13 }}>
        <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
        <span style={{ textDecoration: "none", color: "var(--fg2)" }}>매일 반영(문구 불러오기 목록 맨 위에 고정) — 자동으로 들어가진 않고, 찾기 쉽게 고정만 돼요</span>
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn sm" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="btn pri sm"
          disabled={!label.trim() || !template.trim()}
          onClick={() => onSave(label.trim().slice(0, 40), template.trim().slice(0, 500), locations, position, pinned)}
        >
          저장
        </button>
      </div>
    </div>
  );
}
