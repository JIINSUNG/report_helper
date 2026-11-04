"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import type { WarehouseCell } from "@/types/shared";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;

/** 창고 칸별 내용물 — 직원끼리 공유(Firestore), 게스트는 못 봄. */
export function useWarehouse() {
  const { uid, name, role } = useAuth();
  const [cells, setCells] = useState<Record<string, WarehouseCell>>({});
  const canWrite = role === "staff" || role === "admin";

  useEffect(() => {
    if (!canWrite) return;
    const db = getFirebaseDb();
    const unsub = onSnapshot(collection(db, "warehouse"), (snap) => {
      const m: Record<string, WarehouseCell> = {};
      snap.docs.forEach((d) => {
        m[d.id] = { id: d.id, ...(d.data() as Omit<WarehouseCell, "id">) };
      });
      setCells(m);
    });
    return unsub;
  }, [canWrite]);

  function checkShare(text: string): string | null {
    if (PHONE_RE.test(text)) return "전화번호처럼 보이는 내용이 있어요. 고객 정보는 창고 메모에 적을 수 없어요.";
    return null;
  }

  async function setCell(id: string, text: string) {
    const db = getFirebaseDb();
    if (!text.trim()) {
      await deleteDoc(doc(db, "warehouse", id));
      return;
    }
    await setDoc(doc(db, "warehouse", id), { text: text.trim(), by: uid, byName: name, at: new Date().toISOString() });
  }

  return { cells, canWrite, checkShare, setCell };
}
