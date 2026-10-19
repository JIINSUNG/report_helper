import { man, won } from "@/lib/format";
import type { EffectiveProduct } from "@/lib/product-utils";

export function PriceChart({ items }: { items: EffectiveProduct[] }) {
  const rows = items.filter((p) => p.p && p.comps.some((c) => c.p));
  if (!rows.length) return <p className="hint">그래프로 비교할 경쟁 제품 국내가가 아직 없어요. 제품 카드의 &quot;가격 수정&quot;에서 경쟁 제품 가격을 넣으면 여기에 나와요.</p>;
  const max = Math.max(...rows.flatMap((p) => [p.p as number, ...p.comps.map((c) => c.p || 0)]));
  const w = (n: number) => `${Math.max(1.5, (n / max) * 100)}%`;
  return (
    <div className="pc" role="img" aria-label="샤오미 매장가와 경쟁 제품 가격 비교">
      <div className="legend">
        <span>
          <i className="sw x" />
          샤오미 매장가
        </span>
        <span>
          <i className="sw c" />
          경쟁 제품
        </span>
      </div>
      {rows.map((p) => {
        const priced = p.comps.filter((c) => c.p);
        const d = Math.min(...priced.map((c) => c.p as number)) - (p.p as number);
        return (
          <div className="pr" key={p.id}>
            <div className="ph">
              <b>{p.name}</b>
              <span className={"gapt " + (d >= 0 ? "ok" : "no")}>{d >= 0 ? `최저 경쟁가보다 ${man(d)} 저렴` : `최저 경쟁가보다 ${man(-d)} 비쌈`}</span>
            </div>
            <div className="bl">
              <span className="bn me">샤오미</span>
              <div className="tr">
                <div className="track">
                  <div className="b x" style={{ width: w(p.p as number) }} title={`${p.name} ${won(p.p as number)}`} />
                </div>
                <span className="bv">{man(p.p)}</span>
              </div>
              <small className="src">
                {won(p.p as number)}
                {p.note ? " · " + p.note : ""}
              </small>
            </div>
            {priced.map((c, i) => (
              <div className="bl" key={i}>
                <span className="bn">{c.n}</span>
                <div className="tr">
                  <div className="track">
                    <div className="b c" style={{ width: w(c.p as number) }} title={`${c.n} ${won(c.p as number)}${c.note ? " · " + c.note : ""}`} />
                  </div>
                  <span className="bv">{man(c.p)}</span>
                </div>
                <small className="src">
                  {won(c.p as number)}
                  {c.note ? " · " + c.note : ""}
                </small>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
