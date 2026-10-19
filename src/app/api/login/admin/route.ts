import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getClientIp, verifyIdTokenFromBody, safeEqual } from "@/lib/login-helpers";
import { checkLocked, rateLimitKey, recordFailure, recordSuccess } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = await verifyIdTokenFromBody(body.idToken);

    const key = rateLimitKey(getClientIp(req), `admin|${uid}`);
    const lock = checkLocked(key);
    if (lock.locked) {
      return NextResponse.json(
        { ok: false, error: "너무 여러 번 틀렸어요. 잠시 후 다시 시도해주세요.", retryAfterMs: lock.retryAfterMs },
        { status: 429 }
      );
    }

    const id: string = typeof body.id === "string" ? body.id : "";
    const password: string = typeof body.password === "string" ? body.password : "";
    const expectedId = process.env.ADMIN_ID ?? "";
    const expectedPassword = process.env.ADMIN_PASSWORD ?? "";

    const ok = expectedId.length > 0 && safeEqual(id, expectedId) && safeEqual(password, expectedPassword);
    if (!ok) {
      recordFailure(key);
      return NextResponse.json({ ok: false, error: "아이디 또는 비밀번호가 맞지 않아요." }, { status: 401 });
    }

    recordSuccess(key);
    await getAdminAuth().setCustomUserClaims(uid, { role: "admin" });
    await getAdminDb().doc(`users/${uid}`).set({
      name: "관리자",
      role: "admin",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "로그인에 실패했어요." },
      { status: 400 }
    );
  }
}
