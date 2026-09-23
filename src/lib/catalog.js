import data from '../data/catalog.json';

export const catalog = data;
export const site = data.site ?? {};
export const MAX = site.maxCompare ?? 4;
export const categories = data.categories;

// 型號 → { category, group, sku }
const index = new Map();
for (const category of categories) {
  for (const group of category.groups) {
    for (const sku of group.skus) index.set(sku.model, { category, group, sku });
  }
}

export const lookup = (model) => (model ? index.get(model) ?? null : null);
export const getCategory = (id) => categories.find((c) => c.id === id) ?? null;

// 同機型內換色溫 / 外觀：盡量保留另一個條件
export function switchSku(group, current, { cct, finish }) {
  const want = {
    cct: cct ?? current.cct.join('/'),
    finish: finish !== undefined ? finish : current.finish,
  };
  const key = (s) => s.cct.join('/');
  return (
    group.skus.find((s) => key(s) === want.cct && s.finish === want.finish) ??
    group.skus.find((s) => (cct != null ? key(s) === want.cct : s.finish === want.finish)) ??
    current
  );
}

export const groupImage = (group, sku) => sku?.image ?? group.skus.find((s) => s.image)?.image ?? null;
