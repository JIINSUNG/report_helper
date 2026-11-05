"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "./firebase-client";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_WAREHOUSE_ZONES, allCellIds, cellIdAt } from "@/data/warehouse-layout";
import type { WarehouseCell, WarehouseZone } from "@/types/shared";

const PHONE_RE = /01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/;
const LAYOUT_DOC = ["warehouse-layout", "main"] as const;

function uid(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

/** 창고 칸별 내용물 + 구역 구조(선반 이름·단/열 개수 등) — 전부 직원끼리 공유(Firestore). 게스트는 못 봄. */
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

  /** 행/열 구조를 넓힐 때, 그전까지 "안 나뉜 칸 하나"에 적혀 있던 내용이 새 구조에서 안 보이게 되지 않도록
   * (1,1)행렬 칸이었던 내용을 새 구조의 첫 칸으로 옮겨 둔다. 지우지는 않고 복사만 한다 — 실수로 구조를
   * 넓혔다 되돌려도 원래 칸에 내용이 그대로 남아 있다. */
  async function migrateIfNeeded(zone: WarehouseZone, nextTiers: number, nextCols: number) {
    const db = getFirebaseDb();
    const wasUnsplitArea = zone.kind === "area" && (zone.tiers ?? 1) <= 1 && (zone.cols ?? 1) <= 1;
    const willBeUnsplit = zone.kind === "area" && nextTiers <= 1 && nextCols <= 1;
    if (wasUnsplitArea && !willBeUnsplit) {
      const oldCell = cells[zone.id];
      if (oldCell?.text) {
        const newId = cellIdAt({ ...zone, tiers: nextTiers, cols: nextCols }, 1, 1);
        if (newId !== zone.id && !cells[newId]?.text) {
          await setDoc(doc(db, "warehouse", newId), { text: oldCell.text, by: oldCell.by, byName: oldCell.byName ?? null, at: oldCell.at });
        }
      }
      return;
    }
    const oldCols = zone.cols ?? 1;
    if (oldCols <= 1 && nextCols > 1) {
      const oldTiers = zone.tiers ?? (zone.kind === "shelf" ? 4 : 1);
      await Promise.all(
        Array.from({ length: oldTiers }, (_, i) => i + 1).map(async (row) => {
          const oldId = cellIdAt(zone, row, 1);
          const oldCellData = cells[oldId];
          if (!oldCellData?.text) return;
          const newId = cellIdAt({ ...zone, cols: nextCols }, row, 1);
          if (newId === oldId || cells[newId]?.text) return;
          await setDoc(doc(db, "warehouse", newId), { text: oldCellData.text, by: oldCellData.by, byName: oldCellData.byName ?? null, at: oldCellData.at });
        })
      );
    }
  }

  async function renameZone(zoneId: string, label: string) {
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, label: label.slice(0, 20) } : z)));
  }

  async function setZoneTiers(zoneId: string, tiers: number) {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const next = Math.min(8, Math.max(1, tiers));
    await migrateIfNeeded(zone, next, zoneCols(zone));
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, tiers: next } : z)));
  }

  async function setZoneCols(zoneId: string, cols: number) {
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    const next = Math.min(6, Math.max(1, cols));
    await migrateIfNeeded(zone, zoneTiersOf(zone), next);
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, cols: next } : z)));
  }

  function zoneTiersOf(zone: WarehouseZone) {
    return zone.tiers ?? (zone.kind === "shelf" ? 4 : 1);
  }
  function zoneCols(zone: WarehouseZone) {
    return zone.cols ?? 1;
  }

  async function setZoneHasTop(zoneId: string, hasTop: boolean) {
    await saveZones(zones.map((z) => (z.id === zoneId ? { ...z, hasTop } : z)));
  }

  async function setRowLabel(zoneId: string, row: number, label: string) {
    await saveZones(
      zones.map((z) => {
        if (z.id !== zoneId) return z;
        const rowLabels = { ...z.rowLabels };
        if (label.trim()) rowLabels[row] = label.trim().slice(0, 16);
        else delete rowLabels[row];
        return { ...z, rowLabels };
      })
    );
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

  return {
    cells,
    zones,
    layoutLoaded,
    canWrite,
    checkShare,
    setCell,
    renameZone,
    setZoneTiers,
    setZoneCols,
    setZoneHasTop,
    setRowLabel,
    moveZone,
    addZone,
    removeZone,
  };
}
