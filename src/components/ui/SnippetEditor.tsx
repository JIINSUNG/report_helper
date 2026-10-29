"use client";

import { useRef, useState } from "react";
import { extractVars } from "@/lib/snippets";
import { SNIPPET_LOCATIONS, supportsDaily } from "@/data/snippet-locations";

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
  initialFrequency = "optional",
  onSave,
  onCancel,
}: {
  initialLabel?: string;
  initialTemplate?: string;
  initialLocations?: string[];
  initialPosition?: "top" | "bottom";
  initialFrequency?: "daily" | "optional";
  onSave: (label: string, template: string, locations: string[], position: "top" | "bottom", frequency: "daily" | "optional") => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [template, setTemplate] = useState(initialTemplate);
  const [varName, setVarName] = useState("");
  const [locations, setLocations] = useState<string[]>(initialLocations);
  const [position, setPosition] = useState<"top" | "bottom">(initialPosition);
  const [frequency, setFrequency] = useState<"daily" | "optional">(initialFrequency);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const toggleLocation = (id: string) => {
    setLocations((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const vars = extractVars(template);
  const canBeDaily = locations.length === 1 && supportsDaily(locations[0]);

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
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span className="hint" style={{ margin: 0, whiteSpace: "nowrap" }}>
          언제 넣을까요
        </span>
        <div className="chips">
          <button type="button" className="chip" aria-pressed={frequency === "optional"} onClick={() => setFrequency("optional")}>
            필요할 때만
          </button>
          <button
            type="button"
            className="chip"
            aria-pressed={frequency === "daily" && canBeDaily}
            disabled={!canBeDaily}
            onClick={() => canBeDaily && setFrequency("daily")}
          >
            매일 반영
          </button>
        </div>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        {canBeDaily
          ? frequency === "daily"
            ? vars.length > 0
              ? "변수가 있어서 문구 텍스트 대신, 리테일·포스처럼 그 보고서에 변수 입력칸이 따로 생겨요. 거기에 그날 값을 넣으면 복사용 보고서 텍스트에 채워져 들어가요."
              : "그 칸이 있는 보고서를 쓸 때마다 이 문구가 기본으로 미리 들어가 있어요. 그날 필요 없으면 지우면 돼요."
            : "지금처럼 '문구 불러오기'를 눌러야 들어가요."
          : locations.length === 1 && !supportsDaily(locations[0])
            ? "'금일 판매 요약'은 자동으로 만들어지는 문장이라 '매일 반영'을 쓸 수 없어요."
            : "'매일 반영'은 보일 칸을 정확히 하나만 골라야 쓸 수 있어요(여러 칸이면 어디에 넣을지 알 수 없어서)."}
      </p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn sm" onClick={onCancel}>
          취소
        </button>
        <button
          type="button"
          className="btn pri sm"
          disabled={!label.trim() || !template.trim()}
          onClick={() => onSave(label.trim().slice(0, 40), template.trim().slice(0, 500), locations, position, canBeDaily ? frequency : "optional")}
        >
          저장
        </button>
      </div>
    </div>
  );
}
