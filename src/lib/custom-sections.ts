import type { CloseReport, CustomAmountValue, CustomSectionDef, OpenReport } from "@/types/report";

export function blankCustomDef(): Omit<CustomSectionDef, "id"> {
  return { label: "", appliesTo: "close", type: "sections" };
}

export function blankCustomAmount(): CustomAmountValue {
  return { amount: 0, note: "" };
}

type AmountMap = Record<string, { customAmount?: Record<string, CustomAmountValue> }>;

export function amountUsed(maps: AmountMap[], defId: string, uptoDate: string): number {
  let used = 0;
  for (const map of maps) {
    for (const [d, r] of Object.entries(map)) {
      if (d > uptoDate) continue;
      used += r.customAmount?.[defId]?.amount || 0;
    }
  }
  return used;
}

export function amountRemaining(maps: AmountMap[], defId: string, totalBudget: number, uptoDate: string): number {
  return totalBudget - amountUsed(maps, defId, uptoDate);
}

/** amount 타입 정의가 어떤 리포트(오픈/마감/둘 다)를 스캔해야 하는지. */
export function mapsFor(def: CustomSectionDef, opens: Record<string, OpenReport>, closes: Record<string, CloseReport>): AmountMap[] {
  if (def.appliesTo === "both") return [opens, closes];
  if (def.appliesTo === "open") return [opens];
  return [closes];
}
