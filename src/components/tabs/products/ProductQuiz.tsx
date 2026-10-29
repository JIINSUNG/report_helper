"use client";

import { useState } from "react";
import { buildQuizQuestions, type QuizQuestion } from "@/lib/product-quiz";

const QUESTION_COUNT = 8;

export function ProductQuiz({ groupId, groupLabel, onClose }: { groupId: string | null; groupLabel: string; onClose: () => void }) {
  const [qs] = useState<QuizQuestion[]>(() => buildQuizQuestions(groupId, QUESTION_COUNT));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  if (qs.length === 0) {
    return (
      <div className="card quizcard">
        <p className="hint">아직 이 카테고리엔 우리 제품의 수치 비교 데이터가 없어서 퀴즈를 만들 수 없어요.</p>
        <button type="button" className="btn" onClick={onClose}>
          닫기
        </button>
      </div>
    );
  }

  const q = qs[i];
  const fmt = (v: number) => `${v.toLocaleString("ko-KR")}${q.unit === "점" ? "" : q.unit}`;

  const answer = (idx: number) => {
    if (picked != null) return;
    setPicked(idx);
    if (idx === q.correct) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (i + 1 >= qs.length) {
      setDone(true);
      return;
    }
    setPicked(null);
    setI(i + 1);
  };

  if (done) {
    return (
      <div className="card quizcard">
        <span className="sub">{groupLabel} 퀴즈 완료</span>
        <p className="quizscore">
          {correct} / {qs.length}
        </p>
        <button type="button" className="btn pri" style={{ width: "100%" }} onClick={onClose}>
          닫기
        </button>
      </div>
    );
  }

  return (
    <div className="card quizcard">
      <div className="quizhead">
        <span className="sub">
          {groupLabel} 퀴즈 · {i + 1}/{qs.length}
        </span>
        <button type="button" className="link" onClick={onClose}>
          그만하기
        </button>
      </div>
      <p className="quizq">
        {q.productName}
        {q.sub ? ` (${q.sub})` : ""}의 {q.metricLabel}은?
      </p>
      <div className="quizopts">
        {q.options.map((v, k) => (
          <button
            key={k}
            type="button"
            className={"quizopt" + (picked != null && k === q.correct ? " right" : "") + (picked === k && k !== q.correct ? " wrong" : "")}
            disabled={picked != null}
            onClick={() => answer(k)}
          >
            {fmt(v)}
          </button>
        ))}
      </div>
      {picked != null && (
        <>
          <p className="quizfb">
            {picked === q.correct ? "정답이에요!" : "틀렸어요."} 정답은 {fmt(q.options[q.correct])}예요.
          </p>
          <button type="button" className="btn pri" style={{ width: "100%" }} onClick={next}>
            {i + 1 >= qs.length ? "결과 보기" : "다음 문제"}
          </button>
        </>
      )}
    </div>
  );
}
