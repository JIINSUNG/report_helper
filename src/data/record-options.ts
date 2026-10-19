export const CATS = ["스마트폰", "태블릿", "TV", "웨어러블", "생활가전", "청소가전", "음향", "액세서리", "기타"];
export const AGES = ["10대", "20대", "30대", "40대", "50대", "60대+"];
export const GENDERS = ["여성", "남성"];
export const PARTIES = ["혼자", "커플", "가족", "친구"];
export const NEEDS = ["가성비", "선물", "업무·학습", "반려동물", "아이", "부모님", "기기 교체", "디자인", "게임", "건강"];

export const ACTIONS: Record<string, [string, string]> = {
  demo: ["시연", "제품을 직접 시연하며 체감도를 높임"],
  compare: ["비교 안내", "라인업·경쟁 제품과 비교해 선택 기준을 정리해드림"],
  promo: ["프로모션 안내", "진행 중인 프로모션 혜택을 안내함"],
  bundle: ["연관 제품 제안", "함께 쓰기 좋은 연관 제품을 추가로 제안함"],
  needs: ["니즈 질문", "사용 환경과 고민을 먼저 질문해 니즈를 파악함"],
  revisit: ["재방문 안내", "재방문 시 이어서 상담할 수 있도록 혜택과 일정을 안내함"],
};

export const RESULTS: Record<string, string> = { buy: "구매", revisit: "재방문 약속", none: "미구매" };

export interface DiffType {
  id: string;
  label: string;
  side: "retail" | "pos";
  hint: string;
}

export const DIFF_TYPES: DiffType[] = [
  { id: "bulk", label: "대량주문", side: "retail", hint: "예시 보고서 기준 리테일에 더 잡힘" },
  { id: "discount", label: "할인가 판매", side: "retail", hint: "예시 보고서 기준 리테일에 더 잡힘" },
  { id: "rounding", label: "프로모션 % 할인 단수차이", side: "pos", hint: "예시 보고서 기준 포스기에 더 잡힘" },
  { id: "custom", label: "직접 입력", side: "retail", hint: "어느 쪽에 더 잡혔는지 직접 골라주세요" },
];

export const NOTE_CHIPS = ["기기 불량 문의", "고객 컴플레인", "시스템 오류", "재고 이슈", "입고", "인력 변동"];
