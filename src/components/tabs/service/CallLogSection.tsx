"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Area, Chips } from "@/components/ui/Fields";
import { uid } from "@/lib/format";
import { callLogText } from "@/lib/call-log-utils";
import type { CallLog, LocalReportData } from "@/types/report";

const emptyLog = (): Omit<CallLog, "id" | "time"> => ({
  kind: "inquiry",
  s: "",
  t: "",
  a: "",
  r: "",
  resolved: true,
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function StarField({ id, label, sub, value, onChange }: { id: string; label: string; sub?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field" htmlFor={id}>
      <span>
        <span style={{ fontWeight: 600, color: "var(--fg)" }}>{label}</span>
        {sub && <span>{sub}</span>}
      </span>
      <Area id={id} rows={2} value={value} onChange={onChange} />
    </label>
  );
}

export function CallLogSection({
  data,
  update,
  date,
}: {
  data: LocalReportData;
  update: (fn: (d: LocalReportData) => LocalReportData) => void;
  date: string;
}) {
  const [f, setF] = useState(emptyLog());
  const [copied, setCopied] = useState<string | null>(null);
  const logs = data.calls[date] || [];
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p });

  const save = () => {
    if (!f.s.trim() && !f.t.trim()) return;
    const now = new Date();
    const log: CallLog = { ...f, id: uid(), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
    update((d) => ({ ...d, calls: { ...d.calls, [date]: [...(d.calls[date] || []), log] } }));
    setF(emptyLog());
  };

  const patch = (id: string, p: Partial<CallLog>) =>
    update((d) => ({ ...d, calls: { ...d.calls, [date]: (d.calls[date] || []).map((c) => (c.id === id ? { ...c, ...p } : c)) } }));
  const del = (id: string) =>
    update((d) => ({ ...d, calls: { ...d.calls, [date]: (d.calls[date] || []).filter((c) => c.id !== id) } }));

  const copy = async (c: CallLog) => {
    try {
      await navigator.clipboard.writeText(callLogText(c));
      setCopied(c.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <Card title="전화 응대 정리" right={<span className="sub">STAR로 바로 정리</span>}>
        <p className="hint" style={{ margin: 0 }}>
          전화 끊고 바로 상황·문제·조치·결과만 짧게 적어두면, 나중에 매니저 보고나 인수인계할 때 그대로 쓸 수 있어요.
        </p>
        <div className="field">
          <span>종류</span>
          <Chips options={["inquiry", "complaint"]} labels={{ inquiry: "문의", complaint: "컴플레인" }} value={f.kind} onChange={(v) => set({ kind: v as "inquiry" | "complaint" })} />
        </div>
        <StarField id="cl-s" label="S 상황" sub="어떤 전화였는지" value={f.s} onChange={(v) => set({ s: v })} />
        <StarField id="cl-t" label="T 문제" sub="고객이 원한 것·핵심 불만" value={f.t} onChange={(v) => set({ t: v })} />
        <StarField id="cl-a" label="A 조치" sub="내가 한 것" value={f.a} onChange={(v) => set({ a: v })} />
        <StarField id="cl-r" label="R 결과" sub="어떻게 마무리됐는지" value={f.r} onChange={(v) => set({ r: v })} />
        <div className="field">
          <span>처리 상태</span>
          <Chips options={["resolved", "followup"]} labels={{ resolved: "해결됨", followup: "후속 필요" }} value={f.resolved ? "resolved" : "followup"} onChange={(v) => set({ resolved: v === "resolved" })} />
        </div>
        <button type="button" className="btn pri wide" onClick={save} disabled={!f.s.trim() && !f.t.trim()}>
          저장
        </button>
      </Card>

      {logs.length > 0 && (
        <Card title="오늘 응대 기록" right={<span className="sub">{logs.length}건</span>}>
          {logs
            .slice()
            .reverse()
            .map((c) => (
              <div className="rec" key={c.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className="h">
                  <b>
                    {c.time} <span className={"tag " + (c.kind === "complaint" ? "warn" : "ok")}>{c.kind === "complaint" ? "컴플레인" : "문의"}</span>
                  </b>
                  <span className="sub">{c.resolved ? "해결됨" : "후속 필요"}</span>
                </div>
                {c.s && <p style={{ margin: 0 }}>S {c.s}</p>}
                {c.t && <p style={{ margin: 0 }}>T {c.t}</p>}
                {c.a && <p style={{ margin: 0 }}>A {c.a}</p>}
                {c.r && <p style={{ margin: 0 }}>R {c.r}</p>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="link sm" onClick={() => copy(c)}>
                    {copied === c.id ? "복사됨" : "복사"}
                  </button>
                  <button type="button" className="link sm" onClick={() => patch(c.id, { resolved: !c.resolved })}>
                    {c.resolved ? "후속 필요로 바꾸기" : "해결됨으로 바꾸기"}
                  </button>
                  <button type="button" className="link sm" onClick={() => del(c.id)}>
                    삭제
                  </button>
                </div>
              </div>
            ))}
        </Card>
      )}
    </>
  );
}
