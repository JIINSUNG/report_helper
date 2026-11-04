/** 실제 창고 구조를 그대로 옮긴 레이아웃. 칸(cell) id는 Firestore 문서 id로도 쓰인다. */
export interface WarehouseShelf {
  id: string;
  label: string;
  tiers: number;
}

export const WAREHOUSE_SHELVES: WarehouseShelf[] = [
  { id: "shelf-a", label: "A선반", tiers: 4 },
  { id: "shelf-b", label: "B선반", tiers: 4 },
  { id: "shelf-c", label: "C선반", tiers: 4 },
  { id: "shelf-d", label: "D선반", tiers: 4 },
];

export function shelfCellId(shelfId: string, tier: number) {
  return `${shelfId}-${tier}`;
}

export function shelfCellLabel(shelf: WarehouseShelf, tier: number) {
  return `${shelf.label} ${tier}단`;
}

export const WAREHOUSE_CORNER = { id: "corner", label: "구석 공간" };
export const WAREHOUSE_MIDDLE = { id: "middle", label: "가운데 공간", sub: "선반 2개 크기" };
export const WAREHOUSE_RIGHT_FLOOR = { id: "right-floor", label: "오른쪽 바닥", sub: "선반 3개 크기" };

/** 모든 칸 id를 한 번에 — 안내 문구·빈 상태 계산 등에 쓴다. */
export const ALL_CELL_IDS: string[] = [
  WAREHOUSE_CORNER.id,
  ...WAREHOUSE_SHELVES.flatMap((s) => [1, 2, 3, 4].map((t) => shelfCellId(s.id, t))),
  WAREHOUSE_MIDDLE.id,
  WAREHOUSE_RIGHT_FLOOR.id,
];
