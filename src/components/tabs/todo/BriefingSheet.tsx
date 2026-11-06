"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCommunity } from "@/lib/use-community";
import { copyText } from "@/lib/format";
import { briefingEligibleSections, briefingText, splitTodayTodos } from "@/lib/briefing";
import type { TodoData } from "@/data/todo-seed";

// CommunityTab·use-warehouse.ts의 checkShare와 같은 패턴 — 공유방에 올리는 글은 전화번호·매출
// 금액이 섞여 들어가지 않게 막는다.
const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const MONEY_RE = /\d[\d,]{4,}\s*원|\d+(\.\d+)?\s*(만|억)\s*원?\s*(매출|달성|실적)|매출\s*\d/;

function checkShare(t: string): string {
  if (PHONE_RE.test(t)) return "전화번호처럼 보이는 내용이 있어요. 고객 연락처는 공유방에 적을 수 없어요.";
  if (MONEY_RE.test(t)) return "매출·실적 금액처럼 보이는 내용이 있어요. 회사 기밀이라 공유방에는 적지 말아주세요.";
  return "";
}

function dateLabel(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function BriefingSheet({
  todo,
  date,
  shift,
  onClose,
  onUpdateTodo,
}: {
  todo: TodoData;
  date: string;
  shift: string;
  onClose: () => void;
  onUpdateTodo: (fn: (prev: TodoData | null) => TodoData | null) => void;
}) {
  const { store, role } = useAuth();
  const comm = useCommunity();
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [posted, setPosted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remainingOpen, setRemainingOpen] = useState(false);
  const isGuest = role === "guest";

  const eligible = briefingEligibleSections(todo, shift);
  const picked = todo.briefingSections ?? eligible.map((s) => s.id);

  const { done, remaining } = splitTodayTodos(todo, date, shift);
  const storeLabel = store || "매장";
  const text = briefingText(storeLabel, date, done, remaining, note);

  const toggleSection = (id: string) => {
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id];
    onUpdateTodo((prev) => (prev ? { ...prev, briefingSections: next } : prev));
  };

  const copy = async () => {
    await copyText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const post = async () => {
    const e = checkShare(note);
    if (e) {
      setErr(e);
      return;
    }
    setErr("");
    const ok = await comm.add({ tag: "notice", text, store: store ?? undefined });
    if (ok) setPosted(true);
    else setErr("올리는 데 실패했어요. 다시 시도해주세요.");
  };

  return (
    <div className="sheet" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <div className="cardhead">
          <h2 style={{ fontSize: 16, margin: 0 }}>
            오늘 브리핑 <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>· {dateLabel(date)} {storeLabel}</span>
          </h2>
          <button type="button" className="link" onClick={onClose}>
            닫기
          </button>
        </div>

        {eligible.length > 1 && (
          <div>
            <p className="hint" style={{ margin: "0 0 6px" }}>
              포함할 묶음
            </p>
            <div className="chips">
              {eligible.map((s) => (
                <button key={s.id} type="button" className="chip sm" aria-pressed={picked.includes(s.id)} onClick={() => toggleSection(s.id)}>
                  {picked.includes(s.id) ? "✓ " : ""}
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>✅ 오늘 한 일 ({done.length})</p>
            {done.length === 0 ? (
              <p className="hint" style={{ margin: 0 }}>
                아직 체크한 항목이 없어요.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 2 }}>
                {done.map((t, i) => (
                  <li key={i} style={{ fontSize: 13.5 }}>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            {remaining.length === 0 ? (
              <>
                <p style={{ margin: "0 0 4px", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}>⬜ 해야 할 일 (0)</p>
                <p className="hint" style={{ margin: 0 }}>
                  남은 항목이 없어요.
                </p>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="link"
                  style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 12.5, fontWeight: 600, color: "var(--fg2)" }}
                  onClick={() => setRemainingOpen((v) => !v)}
                >
                  <span>⬜ 해야 할 일 ({remaining.length})</span>
                  <span>{remainingOpen ? "접기 ▲" : "펼치기 ▼"}</span>
                </button>
                {remainingOpen && (
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 2 }}>
                    {remaining.map((t, i) => (
                      <li key={i} style={{ fontSize: 13.5 }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        <label className="lbl" htmlFor="briefing-note">
          특이사항 <small>선택 · 없으면 비워두세요</small>
        </label>
        <textarea
          id="briefing-note"
          className="inp"
          rows={3}
          placeholder="예: 에어컨 필터 교체 요청함, 품절 임박 품목 있음"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setPosted(false);
          }}
        />
        {err && (
          <p className="hint" style={{ color: "var(--warn)" }}>
            {err}
          </p>
        )}

        <button type="button" className="btn pri wide" onClick={copy}>
          {copied ? "복사했어요 ✓" : "브리핑 복사하기"}
        </button>
        {!isGuest && (
          <button type="button" className="btn wide" onClick={post} disabled={posted}>
            {posted ? "공유방에 올렸어요 ✓" : "공유방에 공지로 올리기"}
          </button>
        )}
      </div>
    </div>
  );
}
