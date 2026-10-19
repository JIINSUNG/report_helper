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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map((s, i) => (
        <div className="box" key={i}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <b style={{ color: "var(--accent)" }}>{i + 1}.</b>
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
            <button
              type="button"
              className="link"
              onClick={() => {
                if (!i) return;
                const n = [...list];
                [n[i - 1], n[i]] = [n[i], n[i - 1]];
                onChange(n);
              }}
            >
              위로
            </button>
            <button type="button" className="link danger" onClick={() => onChange(list.filter((_, j) => j !== i))}>
              삭제
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn dash" onClick={() => onChange([...list, { t: "", b: [""] }])}>
        + 직접 추가
      </button>
    </div>
  );
}
