"use client";

import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import type { CatalogOverride, Rival, Tip } from "@/types/shared";
import type { CompetitorProduct } from "@/types/product";

/** 제품 가격 오버라이드·경쟁 제품 비교·팁 — 직원끼리 공유 (Firestore). */
export function useShared() {
  const { uid, role } = useAuth();
  const [overrides, setOverrides] = useState<Record<string, CatalogOverride>>({});
  const [tips, setTips] = useState<Tip[]>([]);
  const [rivals, setRivals] = useState<Rival[]>([]);

  useEffect(() => {
    const db = getFirebaseDb();
    const u1 = onSnapshot(collection(db, "catalog"), (snap) => {
      const m: Record<string, CatalogOverride> = {};
      snap.docs.forEach((d) => {
        m[d.id] = d.data() as CatalogOverride;
      });
      setOverrides(m);
    });
    const u2 = onSnapshot(query(collection(db, "tips"), orderBy("at", "desc")), (snap) =>
      setTips(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Tip))
    );
    const u3 = onSnapshot(collection(db, "rivals"), (snap) => setRivals(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Rival)));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const canWrite = role === "staff" || role === "admin";
  const isAdmin = role === "admin";

  async function saveProduct(pid: string, body: { price: number | null; note: string; comps: CompetitorProduct[]; hidden?: boolean }) {
    const db = getFirebaseDb();
    await setDoc(doc(db, "catalog", pid), { ...body, hidden: body.hidden ?? overrides[pid]?.hidden ?? false, by: uid, at: new Date().toISOString() });
  }

  async function setHidden(pid: string, hidden: boolean) {
    const db = getFirebaseDb();
    const cur = overrides[pid] || {};
    await setDoc(doc(db, "catalog", pid), { price: cur.price ?? null, note: cur.note ?? "", comps: cur.comps ?? [], hidden, by: uid, at: new Date().toISOString() });
  }

  async function resetProduct(pid: string) {
    await deleteDoc(doc(getFirebaseDb(), "catalog", pid));
  }

  async function addTip(pid: string, text: string) {
    await addDoc(collection(getFirebaseDb(), "tips"), { pid, text, by: uid, at: new Date().toISOString() });
  }
  async function editTip(id: string, text: string) {
    await updateDoc(doc(getFirebaseDb(), "tips", id), { text, editedAt: new Date().toISOString() });
  }
  async function deleteTip(id: string) {
    await deleteDoc(doc(getFirebaseDb(), "tips", id));
  }

  async function addRival(r: Omit<Rival, "id" | "by" | "at">) {
    await addDoc(collection(getFirebaseDb(), "rivals"), { ...r, by: uid, at: new Date().toISOString() });
  }
  async function editRival(id: string, p: Partial<Rival>) {
    await updateDoc(doc(getFirebaseDb(), "rivals", id), { ...p, editedAt: new Date().toISOString() });
  }
  async function deleteRival(id: string) {
    await deleteDoc(doc(getFirebaseDb(), "rivals", id));
  }

  return { overrides, tips, rivals, canWrite, isAdmin, saveProduct, setHidden, resetProduct, addTip, editTip, deleteTip, addRival, editRival, deleteRival };
}
