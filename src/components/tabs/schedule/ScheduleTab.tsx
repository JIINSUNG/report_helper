"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { useSchedule, aEnd, onDay, type ScheduleAction } from "@/lib/use-schedule";
import { today, shift, dayLabel } from "@/lib/format";
import { holidayName } from "@/data/holidays";
import { EventEditor } from "./EventEditor";
import { MonthCal } from "./MonthCal";
import { DaySheet } from "./DaySheet";
import { ActList } from "./ActList";
import type { ScheduleEvent, EventKind } from "@/types/shared";

export function ScheduleTab({ storeLabel }: { storeLabel: string }) {
  const sched = useSchedule(storeLabel);
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(date.slice(0, 7));
  const [edit, setEdit] = useState<(Partial<ScheduleEvent> & { start?: string }) | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [showDoneWait, setShowDoneWait] = useState(false);
  const [waitOwner, setWaitOwner] = useState("");
  const td = today();
  const wk = shift(td, 7);
  const missed = sched.actions.filter((a) => !a.done && aEnd(a) < td);
  const soon = sched.actions.filter((a) => aEnd(a) >= td && a.date <= wk && (!a.done || onDay(a, td)));
  const waits = sched.evs.filter((e) => e.kind === "wait");
  const waitOwners = [...new Set(waits.filter((e) => e.status !== "closed").map((e) => e.owner).filter(Boolean))] as string[];
  const waitList = waits.filter((e) => (showDoneWait ? e.status === "closed" : e.status !== "closed") && (!waitOwner || e.owner === waitOwner));
  const dayActs = sched.actions.filter((a: ScheduleAction) => onDay(a, date));
  const ongoing = sched.evs.filter((e) => e.kind === "promo" && e.start && e.start <= date && date <= (e.end || e.start));

  const openEdit = (ev: ScheduleEvent) => setEdit({ ...ev });
  const pick = (d: string) => {
    setDate(d);
    setDay(d);
  };

  return (
    <>
      {sched.err && <div className="alert">{sched.err}</div>}

      <Card title="다가오는 할 일" right={!sched.isGuest && <button type="button" className="btn sm pri" onClick={() => setEdit({ kind: "promo", start: td })}>+ 일정 추가</button>}>
        {missed.length > 0 && (
          <div className="missed">
            <span className="sub" style={{ color: "var(--warn)", fontWeight: 600 }}>
              놓친 할 일 {missed.length}개
            </span>
            <ActList acts={missed} onToggle={(a) => sched.toggle(a)} onOpen={(a) => openEdit(a.ev)} showDate empty="" />
          </div>
        )}
        <ActList acts={soon} onToggle={(a) => sched.toggle(a)} onOpen={(a) => openEdit(a.ev)} showDate empty="앞으로 7일 동안 잡힌 할 일이 없어요. 행사나 배송 일정을 추가하면 자동으로 잡혀요." />
      </Card>

      <Card title={`기한 없는 일 · ${waits.filter((e) => e.status !== "closed").length}건`} right={<button type="button" className="btn sm" onClick={() => setEdit({ kind: "wait" })}>+ 추가</button>}>
        <p className="hint">입고 연락, 재고 문의처럼 날짜가 안 정해진 일이에요.</p>
        {(waitOwners.length > 0 || showDoneWait) && (
          <div className="chips">
            <button type="button" className="chip" aria-pressed={!waitOwner} onClick={() => setWaitOwner("")}>
              전체
            </button>
            {waitOwners.map((o) => (
              <button key={o} type="button" className="chip" aria-pressed={waitOwner === o} onClick={() => setWaitOwner(o)}>
                {o}
              </button>
            ))}
            <button type="button" className="chip" aria-pressed={showDoneWait} onClick={() => setShowDoneWait(!showDoneWait)}>
              완료 보기
            </button>
          </div>
        )}
        {waitList.length === 0 && <p className="hint">{showDoneWait ? "완료된 일이 없어요." : "지금 챙길 일이 없어요."}</p>}
        <div className="acts">
          {waitList.map((e) => (
            <div key={e.id} className={"act wait" + (e.status === "closed" ? " done" : "")}>
              <button type="button" className="actbody" onClick={() => openEdit(e)}>
                <span className="atop">
                  <i className={"ktag " + (e.status === "doing" ? "k-del" : e.status === "closed" ? "k-task" : "k-wait")}>
                    {e.status === "doing" ? "진행 중" : e.status === "closed" ? "완료" : "대기"}
                  </i>
                  <span className="owner">{e.owner || "담당 없음"}</span>
                </span>
                <b>{e.title}</b>
                {(e.due || e.memo) && <small>{[e.due && "확인일 " + e.due, e.memo].filter(Boolean).join(" · ")}</small>}
              </button>
              {e.status !== "closed" && (
                <button type="button" className="btn sm" onClick={() => sched.patch(e, { status: e.status === "doing" ? "closed" : "doing" })}>
                  {e.status === "doing" ? "완료" : "시작"}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title="캘린더">
        <MonthCal month={month} setMonth={setMonth} sel={date} onPick={pick} actions={sched.actions} evs={sched.evs} />
        <p className="hint">날짜를 누르면 그날 일정을 보고 바로 추가할 수 있어요.</p>
      </Card>

      <Card title={dayLabel(date, holidayName)} right={!sched.isGuest && <button type="button" className="btn sm" onClick={() => setDay(date)}>+ 이 날 추가</button>}>
        {ongoing.length > 0 && (
          <div className="ongo">
            {ongoing.map((e) => (
              <button type="button" key={e.id} className="ongoing" onClick={() => openEdit(e)}>
                <i className="ktag k-promo">행사 중</i>
                <b>{e.title}</b>
                <small>
                  {e.start} ~ {e.end || e.start}
                  {e.items ? " · " + e.items : ""}
                </small>
              </button>
            ))}
          </div>
        )}
        <ActList acts={dayActs} onToggle={(a) => sched.toggle(a)} onOpen={(a) => openEdit(a.ev)} showDate={false} empty="이 날은 할 일이 없어요." />
      </Card>

      {day && !edit && (
        <DaySheet
          day={day}
          sched={sched}
          onClose={() => setDay(null)}
          onOpen={(ev) => setEdit({ ...ev })}
          onAdd={(k: EventKind) => setEdit({ kind: k, start: day, end: day, due: k === "wait" ? day : "" })}
        />
      )}
      {edit && <EventEditor init={edit} sched={sched} onClose={() => setEdit(null)} />}
    </>
  );
}
