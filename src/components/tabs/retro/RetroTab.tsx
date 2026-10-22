"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Area } from "@/components/ui/Fields";
import { getRetro, lines, prevRetro, didSummary, retroText } from "@/lib/retro-utils";
import { parts } from "@/lib/format";
import { MOODS, OFF_ACTS, RETRO_HINTS, RETRO_HINTS_OFF } from "@/data/retro-hints";
import type { LocalReportData, Retro } from "@/types/report";

function RetroField({
  id,
  label,
  sub,
  hints,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  label: string;
  sub?: string;
  hints?: string[];
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        <span style={{ fontWeight: 600, color: "var(--fg)" }}>{label}</span>
        {sub && <span>{sub}</span>}
      </span>
      {hints && <span className="rhint">{hints.join(" · ")}</span>}
      <Area id={id} rows={rows} value={value} onChange={onChange} ph="한 줄에 하나씩 적어도 좋아요" />
    </label>
  );
}

function MoodStrip({ data, date }: { data: LocalReportData; date: string }) {
  const days = [...Array(14)].map((_, i) => shiftDay(date, i - 13));
  const has = days.some((d) => getRetro(data, d).mood);
  if (!has) return null;
  return (
    <div className="mood">
      <div className="mstrip">
        {days.map((d) => {
          const m = getRetro(data, d).mood;
          const [, mm, dd] = parts(d);
          return (
            <div className="mcell" key={d} title={`${mm}/${dd} ${m ? MOODS[m - 1] : "기록 없음"}`}>
              <div className={"mdot" + (m ? "" : " empty") + (d === date ? " today" : "")} style={m ? { opacity: 0.25 + m * 0.15 } : undefined} />
              <span>{dd}</span>
            </div>
          );
        })}
      </div>
      <p className="hint" style={{ margin: 0 }}>
        최근 2주 기분 · 진할수록 좋았던 날
      </p>
    </div>
  );
}

function shiftDay(s: string, n: number) {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export function RetroTab({
  data,
  update,
  date,
  setDate,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
  setDate: (d: string) => void;
}) {
  const r = getRetro(data, date);
  const set = (p: Partial<Retro>) => update((d) => ({ ...d, retros: { ...(d.retros || {}), [date]: { ...getRetro(d, date), ...p } } }));
  const prev = prevRetro(data, date);
  const auto = didSummary(data, date);
  const off = r.dayType === "off";
  const H = off ? RETRO_HINTS_OFF : RETRO_HINTS;
  const addAct = (a: string) => set({ did: r.did.trim() ? r.did.trim() + "\n- " + a : "- " + a });
  const [showHist, setShowHist] = useState(false);
  const hist = Object.keys(data.retros || {})
    .filter((k) => k < date)
    .sort()
    .reverse()
    .slice(0, 10);
  const [pm, pd] = prev ? [parts(prev.date)[1], parts(prev.date)[2]] : [0, 0];

  return (
    <>
      <Card
        title="오늘 기분"
        right={
          <div className="seg">
            {(["work", "off"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={r.dayType === k} onClick={() => set({ dayType: k })}>
                {k === "work" ? "근무일" : "쉬는 날"}
              </button>
            ))}
          </div>
        }
      >
        <p className="hint" style={{ margin: 0 }}>
          {off ? "쉬는 날도 하루를 돌아보는 메모를 남길 수 있어요." : "근무한 날은 기록·마감 내용을 불러와서 쓸 수 있어요."} 나만 보는 메모예요.
        </p>
        <div className="chips">
          {MOODS.map((m, i) => (
            <button key={m} type="button" className="chip" aria-pressed={r.mood === i + 1} onClick={() => set({ mood: r.mood === i + 1 ? 0 : i + 1 })}>
              {m}
            </button>
          ))}
        </div>
        <MoodStrip data={data} date={date} />
      </Card>

      {prev && (
        <Card title={`${pm}월 ${pd}일에 정한 Try`} right={<span className="sub">해봤으면 체크</span>}>
          {lines(prev.r.try).map((t, i) => (
            <label className="tryrow" key={i}>
              <input type="checkbox" checked={!!r.triedPrev[i]} onChange={(e) => set({ triedPrev: { ...r.triedPrev, [i]: e.target.checked } })} />
              <span>{t}</span>
            </label>
          ))}
        </Card>
      )}

      <Card title="오늘 하루">
        <RetroField id="rt-day" label={off ? "쉬는 날을 어떻게 보냈나요" : "오늘은 어떻게 보냈나요"} hints={H.day} value={r.day} onChange={(v) => set({ day: v })} />
        <div className="field">
          <span>
            <span style={{ fontWeight: 600, color: "var(--fg)" }}>오늘 한 일</span>
            {!off && auto && (
              <button type="button" className="link" onClick={() => set({ did: r.did.trim() ? r.did.trim() + "\n" + auto : auto })}>
                기록·마감에서 불러오기
              </button>
            )}
          </span>
          {off && (
            <div className="chips">
              {OFF_ACTS.map((a) => (
                <button key={a} type="button" className="chip sm" onClick={() => addAct(a)}>
                  + {a}
                </button>
              ))}
            </div>
          )}
          <Area id="rt-did" rows={3} value={r.did} onChange={(v) => set({ did: v })} ph={off ? "운동, 공부, 약속 등 오늘 한 것" : "상담, 판매, 입고, 진열 등"} />
        </div>
        <RetroField
          id="rt-issues"
          label="걸리는 일 · 찜찜했던 일"
          sub="있을 때만 · 나만 보여요"
          hints={H.issues}
          value={r.issues}
          onChange={(v) => set({ issues: v })}
          rows={2}
        />
      </Card>

      <Card
        title="돌아보기"
        right={
          <div className="seg">
            {(["kpt", "star"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={r.mode === k} onClick={() => set({ mode: k })}>
                {k === "kpt" ? "KPT" : "STAR"}
              </button>
            ))}
          </div>
        }
      >
        {r.mode === "kpt" ? (
          <>
            <RetroField id="rt-keep" label="Keep" sub="잘된 점 · 계속할 것" hints={H.keep} value={r.keep} onChange={(v) => set({ keep: v })} />
            <RetroField id="rt-problem" label="Problem" sub="부족했던 점 · 아쉬운 점" hints={H.problem} value={r.problem} onChange={(v) => set({ problem: v })} />
            <RetroField id="rt-try" label="Try" sub="다음에 해볼 것" hints={H.try} value={r.try} onChange={(v) => set({ try: v })} />
            <p className="hint">Try에 적은 항목은 다음 회고 때 해봤는지 체크할 수 있게 다시 보여드려요.</p>
          </>
        ) : (
          <>
            <p className="hint" style={{ margin: 0 }}>
              오늘 가장 기억에 남는 일 하나를 골라 정리해보세요.
            </p>
            <RetroField id="rt-s" label="S 상황" rows={2} value={r.s} onChange={(v) => set({ s: v })} />
            <RetroField id="rt-t" label="T 과제" sub="해야 했던 것" rows={2} value={r.t} onChange={(v) => set({ t: v })} />
            <RetroField id="rt-a" label="A 행동" sub="내가 한 것" rows={2} value={r.a} onChange={(v) => set({ a: v })} />
            <RetroField id="rt-r" label="R 결과" rows={2} value={r.r} onChange={(v) => set({ r: v })} />
            <RetroField id="rt-learn" label="배운 점 · 다음엔" hints={H.learn} rows={2} value={r.learn} onChange={(v) => set({ learn: v })} />
          </>
        )}
      </Card>

      {hist.length > 0 && (
        <Card title="지난 회고" right={<button type="button" className="link" onClick={() => setShowHist(!showHist)}>{showHist ? "접기" : `${hist.length}개 보기`}</button>}>
          {showHist &&
            hist.map((k) => {
              const x = getRetro(data, k);
              const [, m, d] = parts(k);
              return (
                <button type="button" className="rec hist" key={k} onClick={() => setDate(k)}>
                  <div className="h">
                    <b>
                      {m}월 {d}일 <i className={"dtag " + (x.dayType === "off" ? "d-off" : "d-work")}>{x.dayType === "off" ? "쉬는 날" : "근무일"}</i>
                    </b>
                    <span className="sub">{x.mood ? MOODS[x.mood - 1] : ""}</span>
                  </div>
                  {x.day && <p>{x.day.length > 80 ? x.day.slice(0, 80) + "…" : x.day}</p>}
                </button>
              );
            })}
        </Card>
      )}
    </>
  );
}

export { retroText };
