"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";

type Mode = "staff" | "guest" | "admin" | null;

export function LoginScreen() {
  const { loginStaff, loginAdmin, loginGuest } = useAuth();
  const [mode, setMode] = useState<Mode>(null);
  const [code, setCode] = useState("");
  const [posId, setPosId] = useState("");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const pick = (m: Mode) => {
    setMode(m);
    setErr("");
  };

  const submitStaff = async () => {
    setBusy(true);
    const result = await loginStaff(code, posId, name);
    setBusy(false);
    if (!result.ok) setErr(result.error ?? "로그인에 실패했어요.");
  };

  const submitAdmin = async () => {
    setBusy(true);
    const result = await loginAdmin(id, password);
    setBusy(false);
    if (!result.ok) setErr(result.error ?? "로그인에 실패했어요.");
  };

  const submitGuest = async () => {
    setBusy(true);
    const result = await loginGuest();
    setBusy(false);
    if (!result.ok) setErr(result.error ?? "입장에 실패했어요.");
  };

  return (
    <main className="wrap login">
      <div className="loginhead">
        <h1>
          매장 <span>보고 도우미</span>
        </h1>
        <p>어떻게 들어갈까요?</p>
      </div>

      <button type="button" className={`loginopt${mode === "staff" ? " on" : ""}`} onClick={() => pick("staff")}>
        <b>직원으로 로그인</b>
        <small>내 지점으로 바로 들어가요</small>
      </button>
      {mode === "staff" && (
        <div className="loginform">
          <label className="lbl" htmlFor="lg-code">
            매장 오픈일 <small>yymmdd 형식 · 예: 250101</small>
          </label>
          <input
            id="lg-code"
            className="inp"
            inputMode="numeric"
            maxLength={6}
            autoComplete="off"
            placeholder="yymmdd"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <label className="lbl" htmlFor="lg-pos">
            포스ID <small>4자리 숫자</small>
          </label>
          <input
            id="lg-pos"
            className="inp"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="예: 1004"
            value={posId}
            onChange={(e) => setPosId(e.target.value.replace(/\D/g, "").slice(0, 4))}
          />
          <label className="lbl" htmlFor="lg-name">
            이름 <small>선택 · 비워두면 자동으로 정해져요</small>
          </label>
          <input
            id="lg-name"
            className="inp"
            placeholder="비워두면 자동 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitStaff()}
          />
          <button type="button" className="btn pri" disabled={busy} onClick={submitStaff}>
            입장
          </button>
        </div>
      )}

      <button type="button" className={`loginopt${mode === "guest" ? " on" : ""}`} onClick={() => pick("guest")}>
        <b>게스트로 둘러보기</b>
        <small>제품 정보를 둘러볼 수 있어요</small>
      </button>
      {mode === "guest" && (
        <div className="loginform">
          <button type="button" className="btn pri" disabled={busy} onClick={submitGuest}>
            게스트로 입장
          </button>
        </div>
      )}

      <button type="button" className={`loginopt${mode === "admin" ? " on" : ""}`} onClick={() => pick("admin")}>
        <b>관리자 로그인</b>
        <small>관리자 전용</small>
      </button>
      {mode === "admin" && (
        <div className="loginform">
          <input
            id="lg-id"
            className="inp"
            placeholder="아이디"
            autoComplete="username"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <input
            id="lg-pw"
            className="inp"
            type="password"
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAdmin()}
          />
          <button type="button" className="btn pri" disabled={busy} onClick={submitAdmin}>
            로그인
          </button>
        </div>
      )}

      {err && <div className="alert">{err}</div>}
    </main>
  );
}
