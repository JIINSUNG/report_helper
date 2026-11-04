"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_WAREHOUSE_ZONES, allCellIds } from "@/data/warehouse-layout";
import type { WarehouseCell, WarehouseZone } from "@/types/shared";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const LAYOUT_DOC = ["warehouse-layout", "main"] as const;

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/** 창고 칸별 내용물 + 구역 구조(선반 이름·단 개수 등) — 전부 직원끼리 공유(Firestore). 게스트는 못 봄. */
export function useWarehouse() {
  const { uid: myUid, name, role } = useAuth();
  const [cells, setCells] = useState<Record<string, WarehouseCell>>({});
  const [zones, setZones] = useState<WarehouseZone[]>(DEFAULT_WAREHOUSE_ZONES);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const canWrite = role === "staff" || role === "admin";

  useEffect(() => {
    if (!canWrite) return;
    const db = getFirebaseDb();
    const u1 = onSnapshot(collection(db, "warehouse"), (snap) => {
      const m: Record<string, WarehouseCell> = {};
      snap.docs.forEach((d) => {
        m[d.id] = { id: d.id, ...(d.data() as Omit<WarehouseCell, "id">) };
      });
      setCells(m);
    });
    const u2 = onSnapshot(doc(db, ...LAYOUT_DOC), (snap) => {
      const data = snap.data() as { zones?: WarehouseZone[] } | undefined;
      setZones(data?.zones?.length ? data.zones : DEFAULT_WAREHOUSE_ZONES);
      setLayoutLoaded(true);
    });
    return () => {
      u1();
      u2();
    };
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
    await setDoc(doc(db, "warehouse", id), { text: text.trim(), by: myUid, byName: name, at: new Date().toISOString() });
  }

  async function saveZones(next: WarehouseZone[]) {
    const db = getFirebaseDb();
    await setDoc(doc(db, ...LAYOUT_DOC), { zones: next });
  }

  async function renameZone(zoneId: string, label: string) {
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, label: label.slice(0, 20) } : z)));
  }

  async function setZoneTiers(zoneId: string, tiers: number) {
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, tiers: Math.min(8, Math.max(1, tiers)) } : z)));
  }

  async function setZoneHasTop(zoneId: string, hasTop: boolean) {
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, hasTop } : z)));
  }

  async function moveZone(zoneId: string, dir: -1 | 1) {
    const i = zones.findIndex((z) => z.id === zoneId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= zones.length) return;
    const next = [...zones];
    [next[i], next[j]] = [next[j], next[i]];
    await saveZones(next);
  }

  async function addZone(kind: "shelf" | "area") {
    const zone: WarehouseZone =
      kind === "shelf"
        ? { id: uid("shelf"), kind: "shelf", label: "새 선반", tiers: 4, hasTop: true }
        : { id: uid("area"), kind: "area", label: "새 공간" };
    await saveZones([...zones, zone]);
  }

  /** 구역을 지우면 그 안에 있던 칸(물건 메모)도 같이 지운다. */
  async function removeZone(zoneId: string) {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;
    const db = getFirebaseDb();
    await Promise.all(allCellIds([target]).map((cid) => deleteDoc(doc(db, "warehouse", cid)).catch(() => {})));
    await saveZones(zones.filter((z) => z.id !== zoneId));
  }

  return { cells, zones, layoutLoaded, canWrite, checkShare, setCell, renameZone, setZoneTiers, setZoneHasTop, moveZone, addZone, removeZone };
}
