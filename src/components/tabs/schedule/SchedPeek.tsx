"use client";

import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/auth-context";
import { useSchedule, onDay } from "@/lib/use-schedule";
import { ActList } from "./ActList";

export function SchedPeek({ storeLabel, date, title, goSchedule }: { storeLabel: string; date: string; title: string; goSchedule: () => void }) {
  const { role } = useAuth();
  const sched = useSchedule(storeLabel);
  if (role === "guest") return null;
  const acts = sched.actions.filter((a) => onDay(a, date));
  const promos = sched.evs.filter((e) => e.kind === "promo" && e.start && e.start <= date && date <= (e.end || e.start));
  const waits = sched.evs.filter((e) => e.kind === "wait" && e.status !== "closed");
  if (!acts.length && !promos.length && !waits.length) return null;
  return (
    <Card title={title} right={<button type="button" className="link" onClick={goSchedule}>캘린더 ›</button>}>
      {promos.length > 0 && (
        <p className="hint" style={{ fontSize: 13, color: "var(--fg2)" }}>
          진행 중인 행사: {promos.map((e) => e.title).join(", ")}
        </p>
      )}
      <ActList acts={acts} onToggle={(a) => sched.toggle(a)} onOpen={() => {}} showDate={false} empty="" />
      {waits.length > 0 && (
        <button type="button" className="ongoing" style={{ background: "var(--viobg)" }} onClick={goSchedule}>
          <b>기한 없는 일 {waits.length}건</b>
          <small>
            {waits
              .slice(0, 3)
              .map((e) => `${e.owner || "담당 없음"} · ${e.title}`)
              .join(" / ")}
            {waits.length > 3 ? " …" : ""}
          </small>
        </button>
      )}
    </Card>
  );
}
