import { dayLabel } from "@/lib/format";
import { holidayName } from "@/data/holidays";
import { SKINDS } from "@/data/schedule-kinds";
import { ActList } from "./ActList";
import { onDay, type ScheduleAction, type useSchedule } from "@/lib/use-schedule";
import type { EventKind, ScheduleEvent } from "@/types/shared";

export function DaySheet({
  day,
  sched,
  onClose,
  onAdd,
  onOpen,
}: {
  day: string;
  sched: ReturnType<typeof useSchedule>;
  onClose: () => void;
  onAdd: (kind: EventKind) => void;
  onOpen: (ev: ScheduleEvent) => void;
}) {
  const acts = sched.actions.filter((a: ScheduleAction) => onDay(a, day));
  const ongoing = sched.evs.filter((e) => e.kind === "promo" && e.start && e.start <= day && day <= (e.end || e.start));

  return (
    <div className="sheet" onClick={onClose}>
      <div className="daysheet" onClick={(e) => e.stopPropagation()}>
        <div className="cardhead">
          <h2 style={{ fontSize: 17, margin: 0 }}>{dayLabel(day, holidayName)}</h2>
          <button type="button" className="link" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="evbody">
          {ongoing.map((e) => (
            <button type="button" key={e.id} className="ongoing" onClick={() => onOpen(e)}>
              <i className="ktag k-promo">행사 중</i>
              <b>{e.title}</b>
              <small>
                {e.start} ~ {e.end || e.start}
                {e.items ? " · " + e.items : ""}
              </small>
            </button>
          ))}
          <ActList acts={acts} onToggle={(a) => sched.toggle(a)} onOpen={(a) => onOpen(a.ev)} showDate={false} empty={ongoing.length ? "" : "이 날은 잡힌 일정이 없어요."} />
          <div className="sub" style={{ marginTop: 4 }}>
            이 날에 추가
          </div>
          <div className="kindgrid">
            {(Object.keys(SKINDS) as EventKind[]).map((k) => (
              <button key={k} type="button" onClick={() => onAdd(k)}>
                <b>+ {SKINDS[k].l}</b>
                <small>{SKINDS[k].desc}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
