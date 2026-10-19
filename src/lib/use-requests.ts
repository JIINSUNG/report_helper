"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, addDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import type { DelReqKind, DelRequest } from "@/types/shared";

export function useRequests() {
  const { uid, role } = useAuth();
  const [list, setList] = useState<DelRequest[]>([]);
  const canRead = role === "staff" || role === "admin";

  useEffect(() => {
    if (!canRead) return;
    const u = onSnapshot(query(collection(getFirebaseDb(), "delreq"), orderBy("at", "desc")), (snap) => setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DelRequest)));
    return () => u();
  }, [canRead]);

  const effectiveList = canRead ? list : [];

  async function add(q: { kind: DelReqKind; target: string; label: string; reason?: string }) {
    try {
      await addDoc(collection(getFirebaseDb(), "delreq"), { ...q, by: uid, at: new Date().toISOString(), status: "open" });
      return true;
    } catch {
      return false;
    }
  }
  async function close(id: string, status: "done" | "rejected") {
    try {
      await updateDoc(doc(getFirebaseDb(), "delreq", id), { status, doneAt: new Date().toISOString(), doneBy: uid });
      return true;
    } catch {
      return false;
    }
  }
  async function remove(id: string) {
    await deleteDoc(doc(getFirebaseDb(), "delreq", id));
  }

  const pendingFor = (kind: DelReqKind, target: string) => effectiveList.some((r) => r.kind === kind && r.target === target && r.status === "open");

  return { list: effectiveList, add, close, remove, pendingFor };
}
