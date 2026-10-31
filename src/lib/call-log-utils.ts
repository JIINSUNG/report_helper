import type { CallLog } from "@/types/report";

export function callLogText(c: CallLog): string {
  const lines = [
    `[${c.kind === "complaint" ? "컴플레인" : "문의"}] ${c.time}${c.resolved ? " · 해결됨" : " · 후속 필요"}`,
    c.s.trim() && `상황: ${c.s.trim()}`,
    c.t.trim() && `문제: ${c.t.trim()}`,
    c.a.trim() && `조치: ${c.a.trim()}`,
    c.r.trim() && `결과: ${c.r.trim()}`,
  ].filter(Boolean);
  return lines.join("\n");
}
