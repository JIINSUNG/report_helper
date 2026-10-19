"use client";

import { Card } from "@/components/ui/Card";
import { Num, Txt, Area } from "@/components/ui/Fields";
import { Items } from "@/components/ui/Items";
import { ItemPicker } from "@/components/ui/ItemPicker";
import { getOpen, itemTarget, latestBefore } from "@/lib/local-reports";
import { isOffDay } from "@/data/holidays";
import { SchedPeek } from "@/components/tabs/schedule/SchedPeek";
import type { LocalReportData } from "@/types/report";

export function OpenTab({
  data,
  update,
  date,
  storeLabel,
  isGuest,
  goSchedule,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
  storeLabel: string;
  isGuest: boolean;
  goSchedule: () => void;
}) {
  const r = getOpen(data, date);
  const set = (p: Partial<typeof r>) =>
    update((d) => ({ ...d, opens: { ...d.opens, [date]: { ...getOpen(d, date), ...p } } }));
  const pc = latestBefore(data.closes, date);
  const off = isOffDay(date, (data.settings.extraHolidays || "").split(/[,\s]+/).filter(Boolean));

  return (
    <>
      <Card title="전일 실적" right={pc && <span className="sub">{pc.date} 마감보고에서 가져옴</span>}>
        <Txt id="o-pc" label="전일 전환율" value={r.prevConversion} onChange={(v) => set({ prevConversion: v })} suf="%" mode="decimal" />
        <Items items={r.prevSales} cols={["actual"]} onChange={(v) => set({ prevSales: v })} />
        <ItemPicker
          items={r.prevSales}
          onChange={(v) => set({ prevSales: v })}
          make={(n) => ({ name: n, target: 0, actual: pc?.items.find((i) => i.name === n)?.actual ?? 0 })}
        />
      </Card>

      <Card title="금일 목표" right={<span className="sub">{off ? "주말·공휴일" : "평일"} 기본 목표 적용</span>}>
        <div className="grid2">
          <Num id="o-gmv" label="GMV" value={r.targetGMV} onChange={(v) => set({ targetGMV: v })} suf="원" />
          <Txt id="o-cv" label="전환율" value={r.targetConversion} onChange={(v) => set({ targetConversion: v })} suf="%" mode="decimal" />
        </div>
        <Items items={r.targetItems} cols={["target"]} onChange={(v) => set({ targetItems: v })} />
        <ItemPicker
          items={r.targetItems}
          onChange={(v) => set({ targetItems: v })}
          make={(n) => ({ name: n, target: itemTarget(data.settings, n, off), actual: 0 })}
        />
      </Card>

      <Card title="코멘트">
        <Area id="o-cm" rows={4} value={r.comment} ph="오늘 상담에서 집중할 점을 적어주세요" onChange={(v) => set({ comment: v })} />
      </Card>

      {!isGuest && <SchedPeek storeLabel={storeLabel} date={date} title="오늘 일정" goSchedule={goSchedule} />}
    </>
  );
}
