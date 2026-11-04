import type { WarehouseZone } from "@/types/shared";

/** 처음 쓸 때 보여줄 기본 구조(실제 창고 그대로). Firestore에 구조 문서가 없을 때만 이 값을 쓴다 —
 * 한 번이라도 구조를 고치면 그 뒤로는 Firestore 쪽 값이 기준이 된다. */
export const DEFAULT_WAREHOUSE_ZONES: WarehouseZone[] = [
  { id: "corner", kind: "area", label: "구석 공간" },
  { id: "shelf-a", kind: "shelf", label: "A선반", tiers: 4, hasTop: true },
  { id: "shelf-b", kind: "shelf", label: "B선반", tiers: 4, hasTop: true },
  { id: "shelf-c", kind: "shelf", label: "C선반", tiers: 4, hasTop: true },
  { id: "shelf-d", kind: "shelf", label: "D선반", tiers: 4, hasTop: true },
  { id: "middle", kind: "area", label: "가운데 공간", sub: "선반 2개 크기" },
  { id: "right-floor", kind: "area", label: "오른쪽 바닥", sub: "선반 3개 크기" },
];

export function shelfCellId(zoneId: string, tier: number) {
  return `${zoneId}-${tier}`;
}

export function shelfCellLabel(zone: WarehouseZone, tier: number) {
  return `${zone.label} ${tier}단`;
}

export function shelfTopCellId(zoneId: string) {
  return `${zoneId}-top`;
}

export function shelfTopCellLabel(zone: WarehouseZone) {
  return `${zone.label} 맨 위`;
}

/** 구역 하나가 가진 칸 id 전부(선반이면 맨 위+각 단, 넓은 공간이면 구역 id 자체 하나). */
export function zoneCellIds(zone: WarehouseZone): string[] {
  if (zone.kind === "area") return [zone.id];
  const tiers = zone.tiers ?? 4;
  return [...(zone.hasTop ? [shelfTopCellId(zone.id)] : []), ...Array.from({ length: tiers }, (_, i) => shelfCellId(zone.id, i + 1))];
}

export function allCellIds(zones: WarehouseZone[]): string[] {
  return zones.flatMap(zoneCellIds);
}
