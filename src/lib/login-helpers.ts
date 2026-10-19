import "server-only";
import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { getAdminAuth } from "./firebase-admin";

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function verifyIdTokenFromBody(idToken: unknown): Promise<string> {
  if (typeof idToken !== "string" || !idToken) {
    throw new Error("idToken이 없어요.");
  }
  const decoded = await getAdminAuth().verifyIdToken(idToken);
  return decoded.uid;
}

/** 길이가 달라도 타이밍 공격 단서를 주지 않도록, 먼저 같은 길이로 맞춘 뒤 비교한다. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // 길이가 다르면 무조건 false지만, 비교 자체는 같은 시간이 걸리도록 더미 비교를 한 번 수행
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** "수지점" -> "김수지12" 같은 매장 기준 랜덤 기본 이름 */
export function defaultStaffName(store: string): string {
  const base = store.replace(/점$/, "");
  const n = 1 + Math.floor(Math.random() * 99);
  return `김${base}${n}`;
}
