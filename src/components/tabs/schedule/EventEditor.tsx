"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRequests } from "@/lib/use-requests";
import type { ScheduleEvent, EventKind } from "@/types/shared";
import type { useSchedule } from "@/lib/use-schedule";
import { schedActions } from "@/lib/use-schedule";
import { SKINDS } from "@/data/schedule-kinds";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

function emptyEv(kind: EventKind, date: string): Partial<ScheduleEvent> {
  return { kind, title: "", start: date, end: date, when: "open", items: "", lead: 2, time: "", memo: "", owner: "", due: "", status: "open" };
}

export function EventEditor({
  init,
  sched,
  onClose,
}: {
  init: Partial<ScheduleEvent> & { start?: string };
  sched: ReturnType<typeof useSchedule>;
  onClose: () => void;
}) {
  const { role, store, uid } = useAuth();
  const reqs = useRequests();
  const [f, setF] = useState<Partial<ScheduleEvent>>({ ...emptyEv(init.kind || "promo", init.start || store || ""), ...init });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const isAdmin = role === "admin";
  const set = (p: Partial<ScheduleEvent>) => setF({ ...f, ...p });
  const preview = f.title ? schedActions({ ...(f as ScheduleEvent), id: "preview", title: f.title }) : [];

  const save = async () => {
    if (!f.title?.trim()) {
      setErr(f.kind === "delivery" ? "제품을 적어주세요." : "제목을 적어주세요.");
      return;
    }
    if (f.kind === "wait" && !f.owner?.trim()) {
      setErr("담당자를 적어주세요.");
      return;
    }
    if (f.kind !== "wait" && !f.start) {
      setErr("날짜를 골라주세요.");
      return;
    }
    if (PHONE_RE.test([f.title, f.memo, f.owner].filter(Boolean).join(" "))) {
      setErr("전화번호처럼 보이는 내용이 있어요. 매장 직원 모두가 보는 일정에는 고객 연락처를 적을 수 없어요.");
      return;
    }
    setBusy(true);
    const ok = await sched.save(f);
    setBusy(false);
    if (ok) onClose();
    else setErr("저장하지 못했어요.");
  };

  const requestDelete = async () => {
    if (!f.id) return;
    await reqs.add({ kind: "event", target: f.id, label: f.title || "일정" });
    onClose();
  };

  const del = async () => {
    if (!f.id) return;
    setBusy(true);
    const ok = await sched.remove(f.id);
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <div className="sheet" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="evsheet">
        <div className="cardhead">
          <h2 style={{ fontSize: 16, margin: 0 }}>{f.id ? "일정 수정" : "일정 추가"}</h2>
          <button type="button" className="link" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="evbody">
          <div className="kindgrid" role="group" aria-label="종류">
            {(Object.keys(SKINDS) as EventKind[]).map((k) => (
              <button key={k} type="button" aria-pressed={f.kind === k} onClick={() => set({ kind: k })}>
                <b>{SKINDS[k].l}</b>
                <small>{SKINDS[k].desc}</small>
              </button>
            ))}
          </div>

          <label className="field" htmlFor="ev-title">
            <span>
              <span>{f.kind === "delivery" ? "제품 · 구분용 메모" : f.kind === "wait" ? "무엇을 챙기나요?" : "제목"}</span>
            </span>
            <input id="ev-title" className="inp" value={f.title || ""} onChange={(e) => set({ title: e.target.value })} />
          </label>

          {f.kind !== "wait" && (
            <div className="grid2">
              <label className="field" htmlFor="ev-start">
                <span>
                  <span>{f.kind === "delivery" ? "설치 희망일" : "시작일"}</span>
                </span>
                <input id="ev-start" className="inp" type="date" value={f.start || ""} onChange={(e) => set({ start: e.target.value, end: f.end && f.end > e.target.value ? f.end : e.target.value })} />
              </label>
              {(f.kind === "promo" || f.kind === "task") && (
                <label className="field" htmlFor="ev-end">
                  <span>
                    <span>종료일</span>
                  </span>
                  <input id="ev-end" className="inp" type="date" value={f.end || f.start || ""} min={f.start} onChange={(e) => set({ end: e.target.value })} />
                </label>
              )}
              {f.kind !== "promo" && (
                <label className="field" htmlFor="ev-time">
                  <span>
                    <span>
                      시간 <em className="opt">선택</em>
                    </span>
                  </span>
                  <input id="ev-time" className="inp" value={f.time || ""} onChange={(e) => set({ time: e.target.value })} />
                </label>
              )}
            </div>
          )}

          {f.kind === "promo" && (
            <>
              <label className="field" htmlFor="ev-items">
                <span>
                  <span>
                    가격표 바꿀 제품 <em className="opt">선택</em>
                  </span>
                </span>
                <input id="ev-items" className="inp" value={f.items || ""} onChange={(e) => set({ items: e.target.value })} />
              </label>
              <div className="field">
                <span>가격표 바꾸는 때</span>
                <div className="seg">
                  <button type="button" aria-pressed={f.when !== "close"} onClick={() => set({ when: "open" })}>
                    당일 오픈 전
                  </button>
                  <button type="button" aria-pressed={f.when === "close"} onClick={() => set({ when: "close" })}>
                    전날 마감 때
                  </button>
                </div>
              </div>
            </>
          )}

          {f.kind === "delivery" && (
            <div className="field">
              <span>며칠 전에 배송 요청?</span>
              <div className="seg">
                {[1, 2, 3, 5, 7].map((n) => (
                  <button key={n} type="button" aria-pressed={Number(f.lead) === n} onClick={() => set({ lead: n })}>
                    {n}일 전
                  </button>
                ))}
              </div>
            </div>
          )}

          {f.kind === "wait" && (
            <label className="field" htmlFor="ev-due">
              <span>
                <span>
                  확인할 날 <em className="opt">선택</em>
                </span>
              </span>
              <input id="ev-due" className="inp" type="date" value={f.due || ""} onChange={(e) => set({ due: e.target.value })} />
            </label>
          )}

          <label className="field" htmlFor="ev-owner">
            <span>
              <span>담당자 {f.kind === "wait" ? <em className="opt">필수</em> : <em className="opt">선택</em>}</span>
            </span>
            <input id="ev-owner" className="inp" value={f.owner || ""} onChange={(e) => set({ owner: e.target.value })} />
          </label>
          <label className="field" htmlFor="ev-memo">
            <span>
              <span>
                메모 <em className="opt">선택</em>
              </span>
            </span>
            <input id="ev-memo" className="inp" value={f.memo || ""} onChange={(e) => set({ memo: e.target.value })} />
          </label>
          <p className="hint">매장 직원 모두가 보는 일정이에요. 고객 이름·전화번호는 적지 마세요.</p>

          {preview.length > 0 && f.kind !== "task" && (
            <div className="soft">
              <span className="sub">자동으로 잡히는 할 일</span>
              {preview.map((a) => (
                <div key={a.key} className="pv">
                  <b>{a.date}</b>
                  <span>
                    {a.label}
                    <small>{a.hint}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
          {err && <div className="alert">{err}</div>}
        </div>
        {f.id && (
          <p className="hint" style={{ margin: 0 }}>
            만든 사람: {f.by === uid ? "나" : "동료"}
          </p>
        )}
        <div className="evfoot">
          {f.id && (isAdmin ? (
            <button type="button" className="btn" style={{ color: "var(--warn)" }} disabled={busy} onClick={del}>
              삭제
            </button>
          ) : (
            <button type="button" className="btn" onClick={requestDelete}>
              삭제 요청
            </button>
          ))}
          <button type="button" className="btn pri" style={{ flex: 1 }} disabled={busy || role === "guest"} onClick={save}>
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
