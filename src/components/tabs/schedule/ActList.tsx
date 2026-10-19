import { md, relDay, today } from "@/lib/format";
import { SKINDS } from "@/data/schedule-kinds";
import { aEnd, type ScheduleAction } from "@/lib/use-schedule";

export function ActRow({
  a,
  onToggle,
  onOpen,
  showDate,
}: {
  a: ScheduleAction;
  onToggle: () => void;
  onOpen: () => void;
  showDate: boolean;
}) {
  const late = !a.done && aEnd(a) < today();
  const ranged = aEnd(a) !== a.date;
  return (
    <div className={"act" + (a.done ? " done" : "")}>
      <button type="button" className="chk" aria-pressed={a.done} aria-label={(a.done ? "완료 취소: " : "완료 표시: ") + a.label} onClick={onToggle}>
        {a.done ? "✓" : ""}
      </button>
      <button type="button" className="actbody" onClick={onOpen}>
        <span className="atop">
          <i className={"ktag " + SKINDS[a.kind].c}>{SKINDS[a.kind].l}</i>
          {showDate && (
            <span className={"adate" + (late ? " late" : "")}>
              {ranged ? `${md(a.date)}~${md(aEnd(a))}` : relDay(a.date)}
              {late ? " · 놓침" : ""}
            </span>
          )}
          {a.ev.owner && <span className="owner">{a.ev.owner}</span>}
        </span>
        <b>{a.label}</b>
        {a.hint && <small>{a.hint}</small>}
      </button>
    </div>
  );
}

export function ActList({
  acts,
  onToggle,
  onOpen,
  showDate,
  empty,
}: {
  acts: ScheduleAction[];
  onToggle: (a: ScheduleAction) => void;
  onOpen: (a: ScheduleAction) => void;
  showDate: boolean;
  empty: string;
}) {
  if (!acts.length) return <p className="hint">{empty}</p>;
  return (
    <div className="acts">
      {acts.map((a) => (
        <ActRow key={a.id} a={a} showDate={showDate} onToggle={() => onToggle(a)} onOpen={() => onOpen(a)} />
      ))}
    </div>
  );
}
