import "server-only";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | null = null;

/** Lazy init — avoids failing at module-load time (e.g. during `next build`)
 * when FIREBASE_SERVICE_ACCOUNT isn't set yet. Only called from API routes. */
function getAdminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var가 없어요. .env.local에 Firebase 서비스 계정 JSON을 한 줄로 넣어주세요."
    );
  }
  const serviceAccount = JSON.parse(raw);
  app = initializeApp({
    credential: cert(serviceAccount),
  });
  return app;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
