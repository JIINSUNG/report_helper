import { pad, shiftMonth, today, dayLabel } from "@/lib/format";
import { holidayName } from "@/data/holidays";
import { SKINDS } from "@/data/schedule-kinds";
import { aEnd, onDay, type ScheduleAction } from "@/lib/use-schedule";
import type { ScheduleEvent } from "@/types/shared";

const WD = "일월화수목금토";

export function MonthCal({
  month,
  setMonth,
  sel,
  onPick,
  actions,
  evs,
}: {
  month: string;
  setMonth: (m: string) => void;
  sel: string;
  onPick: (d: string) => void;
  actions: ScheduleAction[];
  evs: ScheduleEvent[];
}) {
  const [y, m] = month.split("-").map(Number);
  const startW = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startW; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);

  const byDate: Record<string, ScheduleAction[]> = {};
  actions.forEach((a) => {
    (byDate[a.date] = byDate[a.date] || []).push(a);
  });
  const promos = evs.filter((e) => e.kind === "promo" && e.start);
  const tranges = actions.filter((a) => a.kind === "task" && aEnd(a) !== a.date);
  const td = today();

  return (
    <div className="cal">
      <div className="calhead">
        <button type="button" className="iconbtn" aria-label="이전 달" onClick={() => setMonth(shiftMonth(month, -1))}>
          ‹
        </button>
        <b>
          {y}년 {m}월
        </b>
        <button type="button" className="iconbtn" aria-label="다음 달" onClick={() => setMonth(shiftMonth(month, 1))}>
          ›
        </button>
      </div>
      <div className="calgrid">
        {[...WD].map((w, i) => (
          <span key={"w" + i} className={"wd" + (i === 0 ? " sun" : i === 6 ? " sat" : "")}>
            {w}
          </span>
        ))}
        {cells.map((s, i) => {
          if (!s) return <span key={"e" + i} className="cell empty" />;
          const acts = byDate[s] || [];
          const pr = promos.filter((e) => e.start! <= s && s <= (e.end || e.start!));
          const tr = tranges.filter((a) => onDay(a, s));
          const w = i % 7;
          const hol = holidayName(s);
          return (
            <button
              type="button"
              key={s}
              className={"cell" + (s === sel ? " sel" : "") + (s === td ? " today" : "")}
              onClick={() => onPick(s)}
              aria-label={`${dayLabel(s, holidayName)}${pr.length ? " · 행사 " + pr.map((e) => e.title).join(", ") : ""}${acts.length ? " · 할 일 " + acts.length + "개" : ""}${tr.length ? " · 기간 할 일 " + tr.map((a) => a.label).join(", ") : ""}`}
            >
              <span className={"dn" + (w === 0 || hol ? " sun" : w === 6 ? " sat" : "")}>{Number(s.slice(8))}</span>
              {pr.length ? (
                <i className={"rng" + (pr.some((e) => e.start === s) ? " st" : "") + (pr.some((e) => (e.end || e.start) === s) ? " en" : "")} />
              ) : (
                <i className="rng none" />
              )}
              {tr.length ? (
                <i className={"rng task" + (tr.some((a) => a.date === s) ? " st" : "") + (tr.some((a) => aEnd(a) === s) ? " en" : "") + (tr.every((a) => a.done) ? " done" : "")} />
              ) : null}
              <span className="labs">
                {acts.slice(0, 2).map((a) => (
                  <i key={a.id} className={"lab " + SKINDS[a.kind].c + (a.done ? " done" : "")}>
                    {a.short}
                  </i>
                ))}
                {acts.length > 2 && <i className="lab more">+{acts.length - 2}</i>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="legend cal-lg">
        <span>
          <i className="rngsw" />
          행사 기간
        </span>
        <span>
          <i className="sw k-promo" />
          가격표
        </span>
        <span>
          <i className="sw k-del" />
          배송·설치
        </span>
        <span>
          <i className="sw k-task" />
          일정(기간은 초록 막대)
        </span>
        <span>
          <i className="sw k-wait" />
          기한 없음 확인일
        </span>
      </div>
    </div>
  );
}
