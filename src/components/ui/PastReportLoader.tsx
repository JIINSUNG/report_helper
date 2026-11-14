"use client";

// 오픈·마감 탭 맨 위의 "지난 보고서 불러오기" — 날짜를 고르고, 가져올 칸을 고르고, 덧붙일지/바꿀지 정해서
// 한 번에 가져온다. 잘못 가져왔으면 바로 되돌릴 수 있다.
import { useState } from "react";
import { md } from "@/lib/format";
import type { CopyMode } from "@/lib/past-report";

export interface PartDef<P extends string> {
  id: P;
  label: string;
  hint?: string;
}

// md()가 이미 "11/13(금)"처럼 요일까지 붙여준다.
const shortDay = md;

export function PastReportLoader<P extends string>({
  dates,
  parts,
  count,
  preview,
  apply,
}: {
  /** 가져올 게 있는 지난 날짜들(최근 순). */
  dates: string[];
  parts: PartDef<P>[];
  count: (date: string, part: P) => number;
  /** 고른 날짜·칸에서 가져올 내용 미리보기(텍스트). */
  preview: (date: string, part: P) => string;
  /** 적용하고, 되돌리는 함수를 돌려준다. */
  apply: (date: string, parts: P[], mode: CopyMode) => () => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<P[]>([]);
  const [mode, setMode] = useState<CopyMode>("append");
  const [undo, setUndo] = useState<(() => void) | null>(null);
  const [done, setDone] = useState("");

  const cur = date && dates.includes(date) ? date : dates[0] ?? null;
  const available = cur ? parts.filter((p) => count(cur, p.id) > 0) : [];
  // 처음 열었거나 날짜를 바꾸면, 가져올 게 있는 칸을 기본으로 다 골라둔다.
  const sel = picked.filter((p) => available.some((a) => a.id === p));

  const pickDate = (d: string) => {
    setDate(d);
    setPicked(parts.filter((p) => count(d, p.id) > 0).map((p) => p.id));
  };

  const toggle = (p: P) => setPicked((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const run = () => {
    if (!cur || !sel.length) return;
    if (mode === "replace" && !confirm("고른 칸의 지금 내용을 지난 보고서 내용으로 바꿀까요?")) return;
    const u = apply(cur, sel, mode);
    setUndo(() => u);
    setDone(`${shortDay(cur)} 보고서에서 ${sel.length}개 칸을 가져왔어요.`);
    setOpen(false);
  };

  if (!dates.length) return null;

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn sm"
          onClick={() => {
            setOpen(true);
            setDone("");
            setUndo(null);
            if (!date) pickDate(dates[0]);
          }}
        >
          📂 지난 보고서 불러오기
        </button>
        {done && (
          <span className="hint" style={{ color: "var(--ok)" }}>
            ✓ {done}{" "}
            {undo && (
              <button
                type="button"
                className="link"
                style={{ textDecoration: "underline", padding: 0, background: "none" }}
                onClick={() => {
                  undo();
                  setUndo(null);
                  setDone("되돌렸어요.");
                }}
              >
                되돌리기
              </button>
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="card" style={{ gap: 12 }}>
      <div className="cardhead">
        <h2>📂 지난 보고서 불러오기</h2>
        <button type="button" className="link" onClick={() => setOpen(false)}>
          닫기
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span className="sub">어느 날 보고서에서 가져올까요?</span>
        <div className="chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
          {dates.map((d) => (
            <button key={d} type="button" className="chip sm" aria-pressed={d === cur} onClick={() => pickDate(d)} style={{ flexShrink: 0 }}>
              {shortDay(d)}
            </button>
          ))}
        </div>
      </div>

      {cur && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="sub">가져올 칸</span>
          {parts.map((p) => {
            const n = count(cur, p.id);
            const on = sel.includes(p.id);
            return (
              <label key={p.id} className="box" style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, opacity: n ? 1 : 0.45 }}>
                <input type="checkbox" checked={on} disabled={!n} onChange={() => toggle(p.id)} style={{ marginTop: 3, width: 18, height: 18 }} />
                <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 13.5 }}>
                    {p.label}
                    <span className="sub" style={{ fontWeight: 400 }}>
                      {" "}
                      {n ? (n > 1 ? `${n}개 항목` : "") : "· 비어 있음"}
                    </span>
                  </b>
                  {on && (
                    <span className="hint" style={{ whiteSpace: "pre-wrap", maxHeight: 96, overflow: "hidden", wordBreak: "break-word" }}>
                      {preview(cur, p.id)}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div className="seg" role="group" aria-label="가져오는 방법">
          <button type="button" aria-pressed={mode === "append"} onClick={() => setMode("append")}>
            뒤에 덧붙이기
          </button>
          <button type="button" aria-pressed={mode === "replace"} onClick={() => setMode("replace")}>
            바꾸기
          </button>
        </div>
        <button type="button" className="btn pri sm" disabled={!sel.length} onClick={run}>
          가져오기
        </button>
      </div>
    </section>
  );
}
