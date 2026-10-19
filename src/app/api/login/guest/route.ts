import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { verifyIdTokenFromBody } from "@/lib/login-helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uid = await verifyIdTokenFromBody(body.idToken);

    await getAdminAuth().setCustomUserClaims(uid, { role: "guest" });
    await getAdminDb().doc(`users/${uid}`).set({
      name: "게스트",
      role: "guest",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "입장에 실패했어요." },
      { status: 400 }
    );
  }
}
