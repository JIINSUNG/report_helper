"use client";

import { useState, type CSSProperties } from "react";
import { Card } from "@/components/ui/Card";
import { SERVICE_COMMON_MISTAKES, SERVICE_STAGES } from "@/data/service-standard";

const listStyle: CSSProperties = { margin: "6px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 13.5 };

export function ServiceTab() {
  const [open, setOpen] = useState<string | null>(SERVICE_STAGES[0]?.id ?? null);

  return (
    <>
      <Card title="구매자와 신뢰를 쌓는 응대 5단계">
        <p className="hint" style={{ margin: 0 }}>
          특정 회사의 사내 응대 표준이 아니라, 매장 상담 경험을 바탕으로 정리한 응대 기준이에요. 판매 수치보다{" "}
          <b>고객과의 신뢰</b>를 먼저 두면 결국 전환도 따라와요. 단계를 눌러 펼쳐보세요.
        </p>
      </Card>

      {SERVICE_STAGES.map((s) => {
        const isOpen = open === s.id;
        return (
          <section className="card" key={s.id} style={{ gap: 10 }}>
            <button
              type="button"
              className="cardhead"
              style={{ width: "100%", textAlign: "left", background: "none" }}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : s.id)}
            >
              <h2>
                {s.n}. {s.title}
              </h2>
              <span className="link">{isOpen ? "접기" : "펼치기"}</span>
            </button>
            {isOpen && (
              <>
                <p className="hint" style={{ margin: 0 }}>
                  {s.goal}
                </p>
                <div className="grid2">
                  <div>
                    <b style={{ fontSize: 13.5, color: "var(--ok)" }}>이렇게 해요</b>
                    <ul style={listStyle}>
                      {s.dos.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <b style={{ fontSize: 13.5, color: "var(--warn)" }}>이건 피해요</b>
                    <ul style={listStyle}>
                      {s.donts.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {s.examples.map((ex, i) => (
                  <div className="box" key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span className="sub">상황 · {ex.situation}</span>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      <span className="tag ok">좋은 예</span> {ex.good}
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      <span className="tag warn">피해야 할 예</span> {ex.bad}
                    </p>
                  </div>
                ))}
              </>
            )}
          </section>
        );
      })}

      <Card title="자주 하는 실수">
        <ul style={listStyle}>
          {SERVICE_COMMON_MISTAKES.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Card>

      <p className="hint" style={{ textAlign: "center" }}>
        상황은 손님마다 다르니, 예시를 그대로 외우기보다 흐름과 태도를 참고해주세요.
      </p>
    </>
  );
}
