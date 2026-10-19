export const pad = (n: number) => String(n).padStart(2, "0");

export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const today = () => ymd(new Date());

export const shift = (s: string, n: number) => {
  const [y, m, d] = s.split("-").map(Number);
  return ymd(new Date(y, m - 1, d + n));
};

export const parts = (s: string) => s.split("-").map(Number) as [number, number, number];

export function shiftMonth(ym: string, n: number) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function md(s: string) {
  const [y, m, d] = parts(s);
  return `${m}/${d}(${"일월화수목금토"[new Date(y, m - 1, d).getDay()]})`;
}

const WD = "일월화수목금토";

export function relDay(s: string): string {
  const t = today();
  if (s === t) return "오늘";
  if (s === shift(t, 1)) return "내일";
  if (s === shift(t, -1)) return "어제";
  return md(s);
}

export function dayLabel(s: string, holidayName: (s: string) => string) {
  const [y, m, d] = parts(s);
  const name = holidayName(s);
  return `${m}월 ${d}일 (${WD[new Date(y, m - 1, d).getDay()]})${name ? " · " + name : ""}`;
}

export const comma = (n: number) => Math.round(n || 0).toLocaleString("ko-KR");
export const won = (n: number) => comma(n) + "원";
export const pct = (a: number, b: number) => (b ? ((a / b) * 100).toFixed(1) + "%" : "0%");

export const uid = () => Math.random().toString(36).slice(2, 9);

/** e.g. 340000000 -> "3.4만" (man 단위, 소수 1자리) */
export function man(n: number | null): string {
  if (n == null) return "—";
  return n >= 10000 ? `${Math.round(n / 1000) / 10}만` : `${comma(n)}원`;
}

export function ago(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = (Date.now() - d.getTime()) / 1000;
  if (isNaN(s)) return "";
  if (s < 60) return "방금";
  if (s < 3600) return Math.floor(s / 60) + "분 전";
  if (s < 86400) return Math.floor(s / 3600) + "시간 전";
  if (s < 86400 * 7) return Math.floor(s / 86400) + "일 전";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export async function copyText(t: string) {
  try {
    await navigator.clipboard.writeText(t);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {
      // ignore — nothing more we can do without Clipboard API support
    }
    ta.remove();
  }
}
