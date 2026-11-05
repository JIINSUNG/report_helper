"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useCommunity } from "@/lib/use-community";
import { CopyBlock } from "@/components/ui/CopyBlock";
import { briefingText, splitTodayTodos } from "@/lib/briefing";
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

export function BriefingSheet({ todo, date, shift, onClose }: { todo: TodoData; date: string; shift: string; onClose: () => void }) {
  const { store, role } = useAuth();
  const comm = useCommunity();
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [posted, setPosted] = useState(false);
  const isGuest = role === "guest";

  const { done, remaining } = splitTodayTodos(todo, date, shift);
  const storeLabel = store || "매장";
  const text = briefingText(storeLabel, date, done, remaining, note);

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
          <h2 style={{ fontSize: 16, margin: 0 }}>오늘 브리핑</h2>
          <button type="button" className="link" onClick={onClose}>
            닫기
          </button>
        </div>
        <p className="hint" style={{ margin: 0 }}>
          오늘 할일 체크리스트에서 한 일·해야 할 일을 자동으로 채웠어요. 특이사항만 적으면 돼요.
        </p>
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
        <CopyBlock text={text} label="복사하기" empty="할일이 없어도 브리핑은 만들어져요." />
        {!isGuest && (
          <button type="button" className="btn pri wide" onClick={post} disabled={posted}>
            {posted ? "공유방에 올렸어요 ✓" : "공유방에 공지로 올리기"}
          </button>
        )}
      </div>
    </div>
  );
}
