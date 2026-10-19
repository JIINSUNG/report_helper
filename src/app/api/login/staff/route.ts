import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getClientIp, verifyIdTokenFromBody, defaultStaffName } from "@/lib/login-helpers";
import { checkLocked, rateLimitKey, recordFailure, recordSuccess } from "@/lib/rate-limit";

function storeCodes(): Record<string, string> {
  const raw = process.env.STORE_CODES;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    const body = await req.json();
    uid = await verifyIdTokenFromBody(body.idToken);

    const key = rateLimitKey(getClientIp(req), `staff|${uid}`);
    const lock = checkLocked(key);
    if (lock.locked) {
      return NextResponse.json(
        { ok: false, error: "너무 여러 번 틀렸어요. 잠시 후 다시 시도해주세요.", retryAfterMs: lock.retryAfterMs },
        { status: 429 }
      );
    }

    const code: string = typeof body.code === "string" ? body.code.trim() : "";
    if (!/^\d{6}$/.test(code)) {
      recordFailure(key);
      return NextResponse.json({ ok: false, error: "yymmdd 형식 6자리 숫자로 입력해주세요." }, { status: 400 });
    }

    const store = storeCodes()[code];
    if (!store) {
      recordFailure(key);
      return NextResponse.json({ ok: false, error: "일치하는 매장이 없어요." }, { status: 401 });
    }

    recordSuccess(key);
    const name = (typeof body.name === "string" ? body.name.trim() : "").slice(0, 20) || defaultStaffName(store);

    await getAdminAuth().setCustomUserClaims(uid, { role: "staff", store });

    await getAdminDb().doc(`users/${uid}`).set({
      name,
      role: "staff",
      store,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, store, name });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "로그인에 실패했어요." },
      { status: 400 }
    );
  }
}
