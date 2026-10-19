import { GROUPS } from "@/data/groups";
import { OFFICIAL, PRODUCT_LINKS } from "@/data/official";
import type { ProductGroup, ProductItem } from "@/types/product";
import type { CatalogOverride } from "@/types/shared";

export interface EffectiveProduct extends ProductItem {
  group: string;
  cat: string;
  hidden: boolean;
  edited: CatalogOverride | null;
}

export const ALL_PRODUCTS: (ProductItem & { group: string; cat: string })[] = GROUPS.flatMap((g: ProductGroup) =>
  g.items.map((it) => ({ ...it, group: g.id, cat: g.cat, link: it.link || PRODUCT_LINKS[it.id] || null }))
);

export function effectiveProduct(p: ProductItem & { group: string; cat: string }, overrides: Record<string, CatalogOverride>): EffectiveProduct {
  const o = overrides[p.id];
  if (!o) return { ...p, hidden: false, edited: null };
  const changed = o.price !== undefined || o.note !== undefined || Array.isArray(o.comps);
  return {
    ...p,
    p: o.price === undefined ? p.p : o.price,
    note: o.note !== undefined ? o.note : p.note,
    comps: Array.isArray(o.comps) ? o.comps : p.comps,
    hidden: !!o.hidden,
    edited: changed ? o : null,
  };
}

export interface OfficialGuideRow {
  n: string;
  u: string;
  c: string;
  s: string;
  a: boolean;
  guide: (ProductItem & { group: string; cat: string }) | null;
  extra?: boolean;
}

export function officialRows(): OfficialGuideRow[] {
  const guideByLink: Record<string, (ProductItem & { group: string; cat: string }) | undefined> = {};
  ALL_PRODUCTS.forEach((p) => {
    if (p.link) guideByLink[p.link] = guideByLink[p.link] || p;
  });
  const urls = new Set(OFFICIAL.map((r) => r.u));
  const rows: OfficialGuideRow[] = OFFICIAL.map((r) => ({ ...r, guide: guideByLink[r.u] || null }));
  ALL_PRODUCTS.filter((p) => !p.link || !urls.has(p.link)).forEach((p) => {
    const g = GROUPS.find((x) => x.id === p.group)!;
    rows.push({ n: p.name, u: p.link || "", c: g.label, s: "매장 가이드", a: false, guide: p, extra: true });
  });
  return rows;
}
