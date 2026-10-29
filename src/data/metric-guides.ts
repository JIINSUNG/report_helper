// 흡입력(Pa/AW)·배터리(mAh) 같은 수치만 보면 고객이 "이게 좋은 건지" 감이 안 올 때 쓰는
// 참고용 실사용 가이드. login-demo.html에서 추출한 공식 스펙(metrics.ts)과는 달리 이 파일은
// 매장 직원이 공유한 일반적인 체감 기준을 손으로 정리한 것이라, 공식 수치처럼 다루지 않는다.
// key: "{그룹id}:{메트릭id}". 값(v) 이상이면 해당 설명을 보여준다(내림차순, 첫 매치 사용).
export interface MetricGuideTier {
  min: number;
  text: string;
}

export const METRIC_GUIDES: Record<string, MetricGuideTier[]> = {
  "robot:pa": [
    { min: 30000, text: "카펫 깊숙한 먼지, 반려동물 털까지 확실히 빨아들이는 최상위권" },
    { min: 20000, text: "카펫 위 먼지·머리카락도 무리 없이 처리" },
    { min: 15000, text: "마루 바닥 위주로 충분하고, 얇은 러그 정도도 커버" },
    { min: 0, text: "마루 바닥 위주의 가벼운 먼지 제거에 적합" },
  ],
  "mite:pa": [
    { min: 15000, text: "이불 속 진드기·각질까지 확실히 끌어내는 상위권" },
    { min: 13000, text: "일반적인 이불·매트리스 관리로 충분" },
    { min: 0, text: "가벼운 먼지 제거 위주" },
  ],
  "vacuum:aw": [
    { min: 150, text: "카펫까지 확실히 빨아들이는 메인 청소기급" },
    { min: 60, text: "마루 바닥 메인 청소기로 쓰기에 충분" },
    { min: 0, text: "차량·틈새 등 보조용으로 적합 (메인으로 쓰기엔 약한 편)" },
  ],
  "phone:battery": [
    { min: 6000, text: "게임·동영상 몰아보기 같은 헤비한 사용도 하루 종일 안심되는 대용량" },
    { min: 5000, text: "일반적인 사용이면 하루 종일 충전 걱정이 없는 수준" },
    { min: 4000, text: "가벼운 사용이면 하루, 많이 쓰는 날은 저녁에 보조배터리를 챙기는 게 안전" },
    { min: 0, text: "하루 중간에 한 번은 충전이 필요할 수 있음" },
  ],
  "tablet:battery": [
    { min: 10000, text: "영상 시청·필기 등으로 하루 종일 써도 넉넉한 대용량" },
    { min: 8000, text: "영상 시청·웹서핑 같은 일반적인 사용으로 하루 충분" },
    { min: 0, text: "가벼운 사용 위주로 적합, 장시간 외부 사용이면 보조배터리 권장" },
  ],
};

/** value 이상인 첫 구간의 설명을 돌려준다. 해당 그룹·메트릭에 가이드가 없으면 null. */
export function metricGuideText(groupId: string, metricId: string, value: number): string | null {
  const tiers = METRIC_GUIDES[`${groupId}:${metricId}`];
  if (!tiers) return null;
  return tiers.find((t) => value >= t.min)?.text ?? null;
}
