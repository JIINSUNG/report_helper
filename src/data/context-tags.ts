// 이 파일은 scripts/extract-data.mjs + scripts/gen-ts.mjs로 login-demo.html 원본에서
// 그대로 추출해 생성했습니다. 값을 고칠 땐 원본도 함께 고치거나, 이 파일만 직접 수정하세요.
export interface ContextTag {
  id: string;
  label: string;
  auto?: number;
  g?: string;
}

export const TAGS: ContextTag[] = [
  {
    "id": "weekday",
    "label": "평일",
    "auto": 1,
    "g": "day"
  },
  {
    "id": "weekend",
    "label": "주말·공휴일",
    "auto": 1,
    "g": "day"
  },
  {
    "id": "holiday",
    "label": "대체공휴일·연휴",
    "g": "day"
  },
  {
    "id": "low",
    "label": "목표 미달",
    "auto": 1,
    "g": "res"
  },
  {
    "id": "high",
    "label": "목표 달성",
    "auto": 1,
    "g": "res"
  },
  {
    "id": "itemMiss",
    "label": "미달 품목",
    "auto": 1
  },
  {
    "id": "promo",
    "label": "프로모션 진행"
  },
  {
    "id": "promoEnd",
    "label": "프로모션 종료일"
  },
  {
    "id": "newLaunch",
    "label": "신제품 출시"
  },
  {
    "id": "stockIn",
    "label": "입고일"
  },
  {
    "id": "highPrice",
    "label": "고단가 상담"
  },
  {
    "id": "revisit",
    "label": "재방문 리드"
  },
  {
    "id": "bundle",
    "label": "연계 구매"
  },
  {
    "id": "family",
    "label": "가족 고객"
  },
  {
    "id": "parents",
    "label": "부모님·시니어 고객"
  },
  {
    "id": "student",
    "label": "학생·신학기"
  },
  {
    "id": "gift",
    "label": "선물 수요"
  },
  {
    "id": "busy",
    "label": "붐비는 시간"
  },
  {
    "id": "quiet",
    "label": "한산한 시간"
  },
  {
    "id": "rain",
    "label": "비·궂은 날씨"
  },
  {
    "id": "staffShort",
    "label": "인력 부족"
  },
  {
    "id": "monthStart",
    "label": "월초"
  },
  {
    "id": "monthEnd",
    "label": "월말 마감"
  },
  {
    "id": "vmd",
    "label": "진열·POP 교체"
  },
  {
    "id": "complaint",
    "label": "불량·컴플레인 응대"
  }
];

export const TAG_GROUP: Record<string, string> = {
  "weekday": "day",
  "weekend": "day",
  "holiday": "day",
  "low": "res",
  "high": "res"
};
