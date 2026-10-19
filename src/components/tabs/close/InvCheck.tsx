import { invLines } from "@/lib/report-text";
import type { CloseReport, InvCheckEntry } from "@/types/report";

const INV_LABEL: Record<string, string> = { phone: "휴대폰", tablet: "태블릿" };

export function InvCheck({
  inv,
  onChange,
  def,
}: {
  inv: Record<string, InvCheckEntry>;
  onChange: (v: Record<string, InvCheckEntry>) => void;
  def?: string;
}) {
  const set = (k: string, p: Partial<InvCheckEntry>) => onChange({ ...inv, [k]: { ...(inv[k] || { diff: 0, reason: "" }), ...p } });
  const lines = invLines({ inv } as CloseReport, def);
  return (
    <div className="field">
      <span>재고 확인</span>
      <div className="invs">
        {Object.keys(INV_LABEL).map((k) => {
          const v = inv[k] || { diff: 0, reason: "" };
          const bad = v.diff !== 0 || v.open;
          return (
            <div className="inv" key={k}>
              <div className="invh">
                <b>{INV_LABEL[k]}</b>
                <div className="seg">
                  <button type="button" aria-pressed={!bad} onClick={() => set(k, { diff: 0, reason: "", open: false })}>
                    이상 없음
                  </button>
                  <button type="button" aria-pressed={bad} onClick={() => set(k, { open: true })}>
                    이상 있음
                  </button>
                </div>
              </div>
              {bad && (
                <>
                  <div className="invb">
                    <div className="step">
                      <button type="button" aria-label="1대 빼기" onClick={() => set(k, { diff: v.diff - 1 })}>
                        −
                      </button>
                      <span style={{ width: 40 }}>
                        {v.diff > 0 ? "+" : ""}
                        {v.diff}
                      </span>
                      <button type="button" aria-label="1대 더하기" onClick={() => set(k, { diff: v.diff + 1 })}>
                        +
                      </button>
                    </div>
                    <span className="sub">{v.diff < 0 ? `${-v.diff}대 부족` : v.diff > 0 ? `${v.diff}대 많음` : "0이면 이상 없음으로 나가요"}</span>
                  </div>
                  <input
                    className="inp"
                    id={"c-inv-" + k}
                    placeholder="사유 (예: 개통 후 반품 처리 대기, 전산 미반영)"
                    value={v.reason}
                    onChange={(e) => set(k, { reason: e.target.value })}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="hint">보고서에는: {lines.join(" / ")}</p>
    </div>
  );
}
