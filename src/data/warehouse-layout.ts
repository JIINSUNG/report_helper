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

export function zoneTiers(zone: WarehouseZone): number {
  return zone.tiers ?? (zone.kind === "shelf" ? 4 : 1);
}

export function zoneCols(zone: WarehouseZone): number {
  return zone.cols ?? 1;
}

/** 열로 안 나뉜(cols<=1) 공간(area)이면서 줄도 1개뿐이면, 지금까지 써온 "구역 id 그대로"가 그 하나뿐인 칸의 id다.
 * 기존에 저장된 칸 데이터를 그대로 가리키기 위해 이 조건일 때만 특별 취급한다. */
function isUnsplitArea(zone: WarehouseZone): boolean {
  return zone.kind === "area" && zoneTiers(zone) <= 1 && zoneCols(zone) <= 1;
}

export function shelfTopCellId(zoneId: string) {
  return `${zoneId}-top`;
}

/** row(1부터), col(1부터)에 대응하는 칸 id. cols<=1이면 기존 "zoneId-row" 스킴을 그대로 쓴다
 * (선반은 원래부터 이 스킴이었고, 공간도 처음 나눌 때는 이 스킴으로 시작해 기존 데이터와 어긋나지 않는다). */
export function cellIdAt(zone: WarehouseZone, row: number, col: number): string {
  if (isUnsplitArea(zone)) return zone.id;
  const cols = zoneCols(zone);
  return cols > 1 ? `${zone.id}-${row}-${col}` : `${zone.id}-${row}`;
}

/** row=0은 선반 맨 위 칸을 가리키는 특수 키. */
export function rowName(zone: WarehouseZone, row: number): string {
  const custom = zone.rowLabels?.[row];
  if (custom) return custom;
  if (row === 0) return "맨 위";
  return zone.kind === "shelf" ? `${row}단` : `${row}줄`;
}

export function cellLabelAt(zone: WarehouseZone, row: number, col: number): string {
  if (isUnsplitArea(zone)) return "";
  const cols = zoneCols(zone);
  const rn = rowName(zone, row);
  return cols > 1 ? `${zone.label} ${rn} ${col}열` : `${zone.label} ${rn}`;
}

/** 구역 하나가 가진 칸 id 전부(순서대로: 맨 위 → 1행 1~N열 → 2행 1~N열 → ...). */
export function zoneCellIds(zone: WarehouseZone): string[] {
  if (isUnsplitArea(zone)) return [zone.id];
  const tiers = zoneTiers(zone);
  const cols = zoneCols(zone);
  const ids: string[] = [];
  if (zone.kind === "shelf" && zone.hasTop) ids.push(shelfTopCellId(zone.id));
  for (let r = 1; r <= tiers; r++) for (let c = 1; c <= cols; c++) ids.push(cellIdAt(zone, r, c));
  return ids;
}

export function allCellIds(zones: WarehouseZone[]): string[] {
  return zones.flatMap(zoneCellIds);
}
