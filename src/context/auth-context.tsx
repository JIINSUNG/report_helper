"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onIdTokenChanged,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase-client";
import type { Role } from "@/types/auth";

type Status = "loading" | "needs-role" | "ready";

interface AuthState {
  status: Status;
  uid: string | null;
  role: Role | null;
  store: string | null;
  name: string;
}

interface AuthContextValue extends AuthState {
  loginStaff: (code: string, posId: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  loginAdmin: (id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginGuest: () => Promise<{ ok: boolean; error?: string }>;
  setName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function postLogin(path: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/login/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: !!data.ok, error: data.error as string | undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    uid: null,
    role: null,
    store: null,
    name: "",
  });

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubProfile: (() => void) | null = null;

    const unsub = onIdTokenChanged(auth, async (user: User | null) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch {
          setState((s) => ({ ...s, status: "needs-role" }));
        }
        return;
      }
      const tokenResult = await user.getIdTokenResult();
      const role = tokenResult.claims.role as Role | undefined;
      const store = (tokenResult.claims.store as string | undefined) ?? null;
      if (!role) {
        setState({ status: "needs-role", uid: user.uid, role: null, store: null, name: "" });
        return;
      }
      unsubProfile = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
        const name = (snap.data()?.name as string | undefined) ?? "";
        setState({ status: "ready", uid: user.uid, role, store, name });
      });
    });

    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const getIdToken = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (!user) throw new Error("로그인 세션이 없어요. 새로고침해주세요.");
    return user.getIdToken();
  }, []);

  const refreshClaims = useCallback(async () => {
    const user = getFirebaseAuth().currentUser;
    if (user) await user.getIdToken(true);
  }, []);

  const loginStaff = useCallback(
    async (code: string, posId: string, name: string) => {
      const idToken = await getIdToken();
      const result = await postLogin("staff", { idToken, code, posId, name });
      if (result.ok) await refreshClaims();
      return result;
    },
    [getIdToken, refreshClaims]
  );

  const loginAdmin = useCallback(
    async (id: string, password: string) => {
      const idToken = await getIdToken();
      const result = await postLogin("admin", { idToken, id, password });
      if (result.ok) await refreshClaims();
      return result;
    },
    [getIdToken, refreshClaims]
  );

  const loginGuest = useCallback(async () => {
    const idToken = await getIdToken();
    const result = await postLogin("guest", { idToken });
    if (result.ok) await refreshClaims();
    return result;
  }, [getIdToken, refreshClaims]);

  const setName = useCallback(async (name: string) => {
    const user = getFirebaseAuth().currentUser;
    if (!user) return;
    await setDoc(
      doc(getFirebaseDb(), "users", user.uid),
      { name: name.trim().slice(0, 20), updatedAt: new Date().toISOString() },
      { merge: true }
    );
  }, []);

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, loginStaff, loginAdmin, loginGuest, setName, logout }),
    [state, loginStaff, loginAdmin, loginGuest, setName, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 안에서만 쓸 수 있어요.");
  return ctx;
}
