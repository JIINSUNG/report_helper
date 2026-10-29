import { Area } from "./Fields";
import type { Section } from "@/types/report";

export function Sections({
  list,
  onChange,
  idp,
}: {
  list: Section[];
  onChange: (v: Section[]) => void;
  idp: string;
}) {
  const set = (i: number, p: Partial<Section>) => onChange(list.map((s, j) => (j === i ? { ...s, ...p } : s)));
  let n = 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map((s, i) => {
        const numbered = s.numbered !== false;
        if (numbered) n++;
        return (
          <div className="box" key={i}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {numbered ? <b style={{ color: "var(--accent)" }}>{n}.</b> : <span className="sub">번호 없음</span>}
              <input
                id={`${idp}-t${i}`}
                className="inp"
                style={{ fontWeight: 600 }}
                placeholder="제목"
                value={s.t}
                onChange={(e) => set(i, { t: e.target.value })}
              />
            </div>
            <Area id={`${idp}-b${i}`} rows={4} value={s.b.join("\n")} ph="한 줄에 한 항목씩" onChange={(v) => set(i, { b: v.split("\n") })} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>
              <button type="button" className="link" onClick={() => set(i, { numbered: !numbered })}>
                {numbered ? "번호 빼기" : "번호 넣기"}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  if (!i) return;
                  const n2 = [...list];
                  [n2[i - 1], n2[i]] = [n2[i], n2[i - 1]];
                  onChange(n2);
                }}
              >
                위로
              </button>
              <button type="button" className="link danger" onClick={() => onChange(list.filter((_, j) => j !== i))}>
                삭제
              </button>
            </div>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn dash" style={{ flex: 1 }} onClick={() => onChange([...list, { t: "", b: [""] }])}>
          + 직접 추가
        </button>
        <button type="button" className="btn dash" style={{ flex: 1 }} onClick={() => onChange([...list, { t: "", b: [""], numbered: false }])}>
          + 번호 없이 추가
        </button>
      </div>
    </div>
  );
}
