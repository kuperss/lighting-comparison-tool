// 官網資料（data/source/official-db.json）→ 與型錄相同欄位名稱的紀錄，並與型錄合併。
// 合併規則：兩邊都有值且不同時以官網為準；官網沒有的欄位（牌價、型錄頁碼等）沿用型錄。

const nums = (s) =>
  [...String(s ?? '').replace(/,/g, '').replace(/[（(][^）)]*[）)]/g, '').matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
const one = (a) => (a.length === 0 ? null : a.length === 1 ? a[0] : a);
const isRange = (s) => /[~～]/.test(s ?? '');
const perMeter = (s) => /每米|\/米|\/m\b/.test(s ?? '');

// 官網品名中的外觀字樣
const FINISH_WORDS = [
  [/貴族黑|黑款|黑殼|黑色/, '黑'],
  [/梧桐木紋|木紋/, '木紋'],
  [/香檳金/, '香檳金'],
];

export function officialFinish(name) {
  for (const [re, label] of FINISH_WORDS) if (re.test(name)) return label;
  return null;
}

// 官網品名 → 系列名稱：去掉逗號後的光色、外觀字樣與瓦數
export function officialSeries(name) {
  return name
    .split(/[,，]/)[0]
    .replace(/[-－\s]*(時尚白|貴族黑|白款|黑款|白殼|黑殼|白色|黑色|梧桐木紋)/g, '')
    .replace(/(白光|黃光|自然光)$/, '')
    .replace(/[-－\s]*\d+(?:\.\d+)?W/g, '')
    .replace(/[-－\s]+$/, '')
    .trim();
}

export function normalizeOfficial(o) {
  const sp = o.specs ?? {};
  const cct = nums(sp.color_temperature).filter((k) => k >= 1800);
  const r9 = /R9\s*[>≧]\s*(\d+)/.exec(sp.cri ?? '');
  const ra = /(\d+)/.exec((sp.cri ?? '').replace(/R9.*$/, ''));
  let cutout = null;
  let cutoutText = null;
  if (sp.cutout_size) {
    const d = /直徑\s*(\d+(?:\.\d+)?)\s*mm/.exec(sp.cutout_size);
    const sq = /長\s*(\d+)\s*[*×xX]\s*寬\s*(\d+)\s*mm/.exec(sp.cutout_size);
    if (d) cutout = `${Number(d[1]) / 10}cm`;
    else if (sq) cutoutText = `方孔 ${sq[1]}×${sq[2]} mm`;
    else cutoutText = sp.cutout_size;
  }
  const power = nums(sp.wattage);
  const lm = nums(sp.lumen);
  return {
    model: o.model,
    official_name: o.name,
    official_category: o.category?.name ?? null,
    official_url: o.source_url ?? null,
    official_image: o.images?.main ?? null,
    finish_from_name: officialFinish(o.name ?? ''),
    power_w: one(power),
    power_range: isRange(sp.wattage),
    power_per_meter: perMeter(sp.wattage) || undefined,
    luminous_flux_lm: one(lm),
    lumen_range: isRange(sp.lumen),
    color_temperature_k: one(cct),
    cri_ra: ra ? Number(ra[1]) : null,
    r9_min: r9 ? Number(r9[1]) : null,
    beam_angle_deg: nums(sp.beam_angle)[0] ?? null,
    cutout,
    cutout_text: cutoutText,
    ip_rating: sp.ip_rating ?? null,
    input_voltage: sp.voltage ?? null,
    material: sp.material ?? null,
    body_size: sp.dimensions ?? null,
    lifespan: sp.lifespan ?? null,
    driver: sp.driver ?? null,
    mounting: sp.mounting ?? null,
  };
}

// 會拿來比對衝突的欄位（其餘官網欄位只在型錄空白時補上，或型錄本來就沒有）
const COMPARE = ['power_w', 'luminous_flux_lm', 'color_temperature_k', 'cri_ra', 'beam_angle_deg', 'cutout', 'ip_rating'];
const OVERRIDE = [...COMPARE, 'r9_min', 'input_voltage', 'material', 'body_size', 'power_per_meter'];
const EXTRA = ['official_name', 'official_category', 'official_url', 'official_image', 'finish_from_name', 'power_range', 'lumen_range', 'cutout_text', 'lifespan', 'driver', 'mounting'];

const norm = (v) => JSON.stringify(Array.isArray(v) ? [...v].map(Number).sort((a, b) => a - b) : v ?? null);

// 回傳合併後的產品清單與衝突紀錄
export function mergeSources(catalogProducts, officialProducts, officialCategoryIds) {
  const official = new Map();
  for (const o of officialProducts) if (o.model && !official.has(o.model)) official.set(o.model, normalizeOfficial(o));

  const conflicts = [];
  const merged = catalogProducts.map((p) => {
    const o = official.get(p.model);
    if (!o) return { ...p, _source: 'catalog' };
    const out = { ...p, _source: 'both' };
    for (const f of OVERRIDE) {
      const ov = o[f];
      if (ov == null || ov === undefined || (Array.isArray(ov) && !ov.length)) continue;
      if (COMPARE.includes(f) && p[f] != null && norm(p[f]) !== norm(ov)) {
        conflicts.push({ model: p.model, field: f, catalog: p[f], official: ov });
      }
      out[f] = ov;
    }
    for (const f of EXTRA) if (o[f] != null) out[f] = o[f];
    return out;
  });

  // 官網有、型錄沒有：只收設定檔指定的官網分類
  const inCatalog = new Set(catalogProducts.map((p) => p.model));
  for (const o of official.values()) {
    if (inCatalog.has(o.model) || !officialCategoryIds.has(o.official_category)) continue;
    merged.push({
      ...o,
      product_name: o.official_name,
      series_name: officialSeries(o.official_name),
      catalog_section: null,
      record_type: 'product',
      list_price: null,
      catalog_page: null,
      _source: 'official',
    });
  }
  return { products: merged, conflicts };
}
