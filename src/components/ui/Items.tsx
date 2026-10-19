import { Fragment } from "react";
import { Stepper } from "./Fields";
import type { ItemTarget } from "@/types/report";

export function Items({
  items,
  cols,
  onChange,
}: {
  items: ItemTarget[];
  cols: ("target" | "actual")[];
  onChange: (v: ItemTarget[]) => void;
}) {
  const L: Record<string, string> = { target: "목표", actual: "판매" };
  const set = (i: number, k: "target" | "actual", v: number) =>
    onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `minmax(0,1fr) ${cols.map(() => "auto").join(" ")}`,
        gap: "8px 12px",
        alignItems: "center",
      }}
    >
      <span />
      {cols.map((c) => (
        <span key={c} className="sub" style={{ textAlign: "center" }}>
          {L[c]}
        </span>
      ))}
      {items.map((it, i) => (
        <Fragment key={it.name}>
          <span style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {it.name}
            {cols.length === 2 && it.actual < it.target && <span className="tag warn">미달</span>}
          </span>
          {cols.map((c) => (
            <Stepper key={c} value={it[c]} onChange={(v) => set(i, c, v)} />
          ))}
        </Fragment>
      ))}
    </div>
  );
}
