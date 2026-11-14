"use client";

// 응대 탭의 "잘 먹힌 멘트" 노트 — 손님한테 해봤더니 반응이 좋았던 말을 상황별로 모아두고,
// 다시 먹힐 때마다 +1 해서 진짜 잘 통하는 멘트가 위로 올라오게 한다. 이 기기에만 저장.
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  addPitch,
  filterPitches,
  PITCH_STAGE_LABEL,
  PITCH_STAGES,
  pitchCategories,
  removePitch,
  togglePinPitch,
  updatePitch,
  winPitch,
  type PitchInput,
  type PitchSort,
} from "@/lib/pitches";
import { md } from "@/lib/format";
import type { LocalReportData, Pitch, PitchStage } from "@/types/report";

const PREVIEW = 6;

export function PitchNotes({
  data,
  update,
  date,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
}) {
  const pitches = data.pitches ?? [];
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [stage, setStage] = useState<PitchStage | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<PitchSort>("wins");
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const usedCats = pitchCategories(pitches);
  const catOptions = [...new Set([...usedCats, ...data.settings.items.map((i) => i.cat)])];
  const list = filterPitches(pitches, { stage, cat, q, sort });
  const shown = showAll ? list : list.slice(0, PREVIEW);

  const copy = async (p: Pitch) => {
    try {
      await navigator.clipboard.writeText(p.text);
      setCopied(p.id);
      setTimeout(() => setCopied((c) => (c === p.id ? null : c)), 1500);
    } catch {
      /* 클립보드 권한이 없으면 조용히 무시 — 길게 눌러 직접 복사 가능 */
    }
  };

  return (
    <Card title="💬 잘 먹힌 멘트" right={pitches.length > 0 && <span className="sub">{pitches.length}개 · 이 기기에만 저장</span>}>
      <p className="hint">손님 반응이 좋았던 말을 상황별로 모아두세요. 또 통하면 &lsquo;+1&rsquo;을 눌러 잘 먹히는 멘트가 위로 올라와요.</p>

      {adding ? (
        <PitchForm
          catOptions={catOptions}
          onSave={(input) => {
            update((d) => addPitch(d, input, date));
            setAdding(false);
          }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button type="button" className="btn pri sm" style={{ alignSelf: "flex-start" }} onClick={() => setAdding(true)}>
          + 멘트 기록하기
        </button>
      )}

      {pitches.length > 0 && (
        <>
          <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 멘트·메모 검색" aria-label="멘트 검색" />
          <div className="chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
            <button type="button" className="chip sm" aria-pressed={!stage} onClick={() => setStage(null)} style={{ flexShrink: 0 }}>
              전체
            </button>
            {PITCH_STAGES.filter((s) => pitches.some((p) => p.stage === s.id)).map((s) => (
              <button key={s.id} type="button" className="chip sm" aria-pressed={stage === s.id} onClick={() => setStage(stage === s.id ? null : s.id)} style={{ flexShrink: 0 }}>
                {s.label}
              </button>
            ))}
          </div>
          {usedCats.length > 1 && (
            <div className="chips" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 2 }}>
              {usedCats.map((c) => (
                <button key={c} type="button" className="chip sm" aria-pressed={cat === c} onClick={() => setCat(cat === c ? null : c)} style={{ flexShrink: 0 }}>
                  {c}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="sub">{list.length}개</span>
            <div className="seg" role="group" aria-label="정렬">
              <button type="button" aria-pressed={sort === "wins"} onClick={() => setSort("wins")}>
                많이 먹힌 순
              </button>
              <button type="button" aria-pressed={sort === "recent"} onClick={() => setSort("recent")}>
                최근 순
              </button>
            </div>
          </div>

          {list.length === 0 && <p className="hint">조건에 맞는 멘트가 없어요.</p>}
          {shown.map((p) =>
            editId === p.id ? (
              <PitchForm
                key={p.id}
                initial={p}
                catOptions={catOptions}
                onSave={(input) => {
                  update((d) => updatePitch(d, p.id, input));
                  setEditId(null);
                }}
                onCancel={() => setEditId(null)}
                onRemove={() => {
                  if (!confirm("이 멘트를 지울까요?")) return;
                  update((d) => removePitch(d, p.id));
                  setEditId(null);
                }}
              />
            ) : (
              <div key={p.id} className="box" style={{ gap: 8 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {p.pinned && <span aria-label="고정">📌</span>}
                  <span className="tag ok">{PITCH_STAGE_LABEL[p.stage]}</span>
                  {p.cat && <span className="sub">{p.cat}</span>}
                  <span className="sub" style={{ marginLeft: "auto" }}>
                    {md(p.lastWin)}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, fontWeight: 600, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>&ldquo;{p.text}&rdquo;</p>
                {p.note && <p className="hint" style={{ fontSize: 12.5, whiteSpace: "pre-wrap" }}>💡 {p.note}</p>}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" className="btn sm pri" onClick={() => update((d) => winPitch(d, p.id, date))} aria-label={`또 먹혔어요, 지금 ${p.wins}번`}>
                    👍 또 먹혔어요 · {p.wins}
                  </button>
                  <button type="button" className="btn sm" onClick={() => copy(p)}>
                    {copied === p.id ? "복사됨 ✓" : "복사"}
                  </button>
                  <button type="button" className="link" style={{ marginLeft: "auto" }} onClick={() => update((d) => togglePinPitch(d, p.id))}>
                    {p.pinned ? "고정 해제" : "고정"}
                  </button>
                  <button type="button" className="link" onClick={() => setEditId(p.id)}>
                    수정
                  </button>
                </div>
              </div>
            )
          )}
          {list.length > PREVIEW && (
            <button type="button" className="btn dash sm" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "접기" : `${list.length - PREVIEW}개 더 보기`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function PitchForm({
  initial,
  catOptions,
  onSave,
  onCancel,
  onRemove,
}: {
  initial?: Pitch;
  catOptions: string[];
  onSave: (input: PitchInput) => void;
  onCancel: () => void;
  onRemove?: () => void;
}) {
  const [text, setText] = useState(initial?.text ?? "");
  const [stage, setStage] = useState<PitchStage>(initial?.stage ?? "explain");
  const [cat, setCat] = useState(initial?.cat ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const ok = text.trim().length > 0;

  return (
    <div className="box" style={{ gap: 10, boxShadow: "inset 0 0 0 1.5px var(--accent)" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="sub">멘트</span>
        <textarea
          className="inp"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'예: "지금 쓰시는 폰보다 사진이 확실히 밝게 나와요. 한번 찍어보실래요?"'}
          aria-label="멘트"
          autoFocus
        />
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="sub">어떤 상황에서?</span>
        <div className="chips">
          {PITCH_STAGES.map((s) => (
            <button key={s.id} type="button" className="chip sm" aria-pressed={stage === s.id} onClick={() => setStage(s.id)} title={s.hint}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="sub">제품·카테고리 (선택)</span>
        <input className="inp" value={cat} onChange={(e) => setCat(e.target.value)} placeholder="예: 스마트폰, 로봇청소기" list="pitch-cats" aria-label="제품·카테고리" />
        <datalist id="pitch-cats">
          {catOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span className="sub">손님 반응·쓰는 요령 (선택)</span>
        <input className="inp" value={note} onChange={(e) => setNote(e.target.value)} placeholder="예: 직접 찍어보게 하면 바로 관심 보임" aria-label="손님 반응·요령" />
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {onRemove && (
          <button type="button" className="link danger" onClick={onRemove}>
            삭제
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" className="btn sm" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="btn sm pri" disabled={!ok} onClick={() => ok && onSave({ text, stage, cat, note })}>
          저장
        </button>
      </div>
    </div>
  );
}
