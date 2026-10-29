// 매장 직원이 우리(샤오미) 제품 스펙을 정확히 외웠는지 확인하는 객관식 퀴즈 문제 생성기.
// METRICS(metrics.ts)에서 x:true(우리 제품) 행만 골라, 같은 지표의 다른 수치를 오답으로 섞는다.
import { GROUPS } from "@/data/groups";
import { METRICS } from "@/data/metrics";
import type { Metric, MetricRow } from "@/types/product";

export interface QuizQuestion {
  groupLabel: string;
  metricLabel: string;
  unit: string;
  productName: string;
  sub: string;
  options: number[];
  correct: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PoolEntry {
  groupId: string;
  metric: Metric;
  row: MetricRow;
}

/** value와 다르면서, 서로도 겹치지 않는 오답 후보를 뽑는다. 부족하면 value 근처 값을 만들어 채운다. */
function pickDecoys(value: number, candidates: number[]): number[] {
  const seen = new Set([value]);
  const decoys: number[] = [];
  for (const v of shuffle(candidates)) {
    if (decoys.length >= 3) break;
    if (seen.has(v)) continue;
    seen.add(v);
    decoys.push(v);
  }
  let mul = 1.3;
  while (decoys.length < 3) {
    const alt = Math.max(1, Math.round(value * mul));
    if (!seen.has(alt)) {
      seen.add(alt);
      decoys.push(alt);
    }
    mul = mul > 1 ? 1 / mul : mul + 0.4;
  }
  return decoys;
}

/**
 * 우리 제품의 스펙 수치를 묻는 객관식 문제를 만든다.
 * groupId를 주면 그 카테고리에서만, null이면 전체 카테고리에서 고른다.
 */
export function buildQuizQuestions(groupId: string | null, count: number): QuizQuestion[] {
  const groupIds = groupId ? [groupId] : GROUPS.map((g) => g.id);
  const pool: PoolEntry[] = [];
  groupIds.forEach((gid) => {
    (METRICS[gid] || []).forEach((metric) => {
      metric.rows.filter((r) => r.x && r.v > 0).forEach((row) => pool.push({ groupId: gid, metric, row }));
    });
  });

  const n = Math.min(count, pool.length);
  return shuffle(pool)
    .slice(0, n)
    .map(({ groupId: gid, metric, row }) => {
      const group = GROUPS.find((g) => g.id === gid)!;
      const candidates = metric.rows.filter((r) => r !== row).map((r) => r.v);
      const options = shuffle([row.v, ...pickDecoys(row.v, candidates)]);
      return {
        groupLabel: group.label,
        metricLabel: metric.label,
        unit: metric.unit,
        productName: row.n,
        sub: row.sub,
        options,
        correct: options.indexOf(row.v),
      };
    });
}
