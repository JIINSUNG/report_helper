"use client";

import { useEffect } from "react";

/** 설치 후 오프라인에서도 앱 셸(페이지·JS·CSS·아이콘)을 쓸 수 있도록 서비스 워커를 등록한다.
 * 로그인 API나 Firestore 요청은 캐시하지 않는다(public/sw.js 참고) — 로그인·실시간 데이터는 항상 네트워크가 필요하다. */
export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
