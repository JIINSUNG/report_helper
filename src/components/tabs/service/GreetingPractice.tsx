"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { GREETING_CUSTOMER_TYPES } from "@/data/greeting-practice";
import { GROUPS } from "@/data/groups";
import { won } from "@/lib/format";

const PRODUCTS = GROUPS.flatMap((g) => g.items.map((item) => ({ item, group: g })));
const TIMER_SECONDS = 30;

function pickOther<T>(list: T[], current: T | null, pick: (i: number) => T): T {
  if (list.length <= 1) return pick(0);
  let next = current;
  while (next === current) next = pick(Math.floor(Math.random() * list.length));
  return next!;
}

export function GreetingPractice() {
  const [customer, setCustomer] = useState<(typeof GREETING_CUSTOMER_TYPES)[number] | null>(null);
  const [product, setProduct] = useState<(typeof PRODUCTS)[number] | null>(null);
  const [showPitch, setShowPitch] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const drawCustomer = () => {
    setCustomer((prev) => pickOther(GREETING_CUSTOMER_TYPES, prev, (i) => GREETING_CUSTOMER_TYPES[i]));
  };

  const drawProduct = () => {
    setProduct((prev) => pickOther(PRODUCTS, prev, (i) => PRODUCTS[i]));
    setShowPitch(false);
    setSecondsLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSecondsLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null || s <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  return (
    <>
      <Card title="손님 첫마디 연습" right={<span className="sub">먼저 다가가는 게 어려울 때 연습용</span>}>
        <p className="hint" style={{ margin: 0 }}>
          손님 유형을 뽑아서, 그 상황이라면 뭐라고 먼저 말 걸지 소리 내어 연습해보세요. 꼭 예시 그대로 안 해도 돼요.
        </p>
        <button type="button" className="btn pri" onClick={drawCustomer}>
          {customer ? "다른 손님 뽑기" : "손님 유형 뽑기"}
        </button>
        {customer && (
          <div className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <b style={{ fontSize: 15 }}>{customer.title}</b>
            <p style={{ margin: 0, fontSize: 14 }}>{customer.situation}</p>
            <div>
              <span className="sub">첫마디 예시</span>
              <ul style={{ margin: "4px 0 0", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 14 }}>
                {customer.openers.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ul>
            </div>
            <p className="hint" style={{ margin: 0 }}>
              💡 {customer.tip}
            </p>
          </div>
        )}
      </Card>

      <Card title="상품 30초 설명 연습" right={<span className="sub">실제 제품으로 연습</span>}>
        <p className="hint" style={{ margin: 0 }}>
          제품을 뽑고, 30초 안에 이 제품을 소리 내어 설명해보세요. 끝나면 모범 설명과 비교해봐요.
        </p>
        <button type="button" className="btn pri" onClick={drawProduct}>
          {product ? "다른 상품 뽑기" : "상품 뽑기"}
        </button>
        {product && (
          <div className="box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="rh">
              <b style={{ fontSize: 15 }}>{product.item.name}</b>
              <span className="sub">{product.item.p != null ? won(product.item.p) : ""}</span>
            </div>
            <p className="hint" style={{ margin: 0 }}>{product.item.spec}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {secondsLeft === null ? (
                <button type="button" className="btn sm" onClick={startTimer}>
                  ⏱ 30초 타이머 시작
                </button>
              ) : (
                <span className="tag" style={{ fontSize: 16, fontWeight: 700 }}>
                  {secondsLeft}초{secondsLeft === 0 ? " · 끝!" : ""}
                </span>
              )}
              <button type="button" className="link" onClick={() => setShowPitch(!showPitch)}>
                {showPitch ? "모범 설명 닫기" : "모범 설명 보기"}
              </button>
            </div>
            {showPitch && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ margin: 0, fontSize: 14 }}>{product.item.pitch}</p>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 13.5 }}>
                  {product.item.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </>
  );
}
