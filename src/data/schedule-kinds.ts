import type { EventKind } from "@/types/shared";

export const SKINDS: Record<EventKind, { l: string; c: string; desc: string }> = {
  promo: { l: "행사", c: "k-promo", desc: "가격표 교체·원복 자동" },
  delivery: { l: "배송·설치", c: "k-del", desc: "배송 요청일 자동" },
  task: { l: "일정", c: "k-task", desc: "하루 또는 기간" },
  wait: { l: "기한 없음", c: "k-wait", desc: "담당자가 챙김" },
};
