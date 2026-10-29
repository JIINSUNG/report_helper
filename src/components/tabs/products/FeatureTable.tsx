import type { FeatureGroup } from "@/types/product";

export function FeatureTable({ data }: { data: FeatureGroup }) {
  return (
    <div className="ftablewrap">
      <table className="ftable">
        <thead>
          <tr>
            <th>제품</th>
            {data.features.map((f) => (
              <th key={f.id}>{f.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.n} className={r.x ? "me" : ""}>
              <td className="fname">{r.n}</td>
              {data.features.map((f) => {
                const v = r.values[f.id] ?? "-";
                const cls = v.startsWith("O") ? "ok" : v.startsWith("X") ? "no" : "";
                return (
                  <td key={f.id} className={cls}>
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {data.notes && data.notes.length > 0 && (
        <ul className="fnotes">
          {data.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
