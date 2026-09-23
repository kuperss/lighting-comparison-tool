// 型錄資料庫（＋官網資料）→ 前端 catalog 的純函式。只做整理、合併、分組與檢查，不自行推測數值。
import { mergeSources } from './official.mjs';

const REQUIRED_FIELDS = ['model', 'product_name', 'catalog_section', 'record_type'];

// 外觀字尾：型號只差這些字尾的 SKU 屬於同一機型
const FINISH_SUFFIX = [
  ['BK', '黑'],
  ['WH', '白'],
  ['LW', '木紋'],
];

const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// 電壓寫法統一：「100-240V (全電壓)」→「100-240V」（100-240V 即全電壓），「DC 24V」→「DC24V」，去掉結尾「另計」
export function voltage(text) {
  const t = tidy(text);
  if (!t) return null;
  return t
    .replace(/\s*[(（]\s*全電壓\s*[)）]/, '')
    .replace(/\s*另計$/, '')
    .replace(/\b(AC|DC)\s+(\d)/g, '$1$2')
    .replace(/\s*[(（]([^)）]*)[)）]/g, '（$1）')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// 清掉 PDF 轉出的空括號與結尾多餘標點
export function tidy(text) {
  if (!text) return null;
  const t = text.replace(/[(（]\s*[)）]/g, '').replace(/[;；,，、\s]+$/, '').replace(/\s{2,}/g, ' ').trim();
  return t || null;
}

export function cutoutCm(raw) {
  const m = typeof raw === 'string' && /^(\d+(?:\.\d+)?)\s*cm/.exec(raw);
  return m ? Number(m[1]) : null;
}

// 型號骨架：去掉外觀字尾，並把色溫字母 W/N/D 換成 *；同機型的 SKU 骨架相同
export function skeleton(model, finish = null) {
  const suffix = FINISH_SUFFIX.map(([s]) => s).join('|');
  // 官網黑款有時只在型號尾加 B（例如 LED-9DOHUB8DR2B）
  const half = model.normalize('NFKC');
  const base = finish === '黑' ? half.replace(/(?<=\d)B$/, '') : half;
  return base
    .replace(/^(LED|D)-/, '')
    .replace(new RegExp(`-?(${suffix})(?=-|DA$|$)`, 'g'), '')
    .replace(/(?<=[\d-]|\dS)[WND](?=[\dA-Z-]|$)/g, '*');
}

// 顯示用型號樣式：去掉外觀字尾，色溫字母以 □ 表示，例如 D-9DOB9□
export function modelPattern(model) {
  const finish = FINISH_SUFFIX.map(([s]) => s).join('|');
  return model
    .replace(new RegExp(`-?(${finish})(?=-|DA$|$)`, 'g'), '')
    .replace(/(?<=[\d-]|\dS)[WND](?=[\dA-Z-]|$)/, '□');
}

export function finishOf(p) {
  for (const [suf, label] of FINISH_SUFFIX) {
    if (new RegExp(`(-|\\d)${suf}(?=-|DA$|$)`).test(p.model)) return label;
  }
  return p.finish_from_name || p.body_color_raw || null;
}

// 調光 / 控制方式：只依品名、系列、變體中明確寫出的字樣整理
export function controls(p) {
  const text = [p.product_name, p.series_name, p.variant, p.official_name].filter(Boolean).join(' ');
  const out = [];
  if (p.dali_mentioned || /DALI|智慧燈控/.test(text)) out.push('DALI 智慧燈控');
  if (/壁切調光/.test(text)) out.push('壁切調光');
  if (/三段(壁切)?調色|壁切調色/.test(text)) out.push('三段調色');
  else if (/壁切/.test(text) && !/壁切調光/.test(text)) out.push('壁切切換');
  if (/調光/.test(text) && !out.some((c) => c.includes('調光') || c.startsWith('DALI'))) out.push('可調光');
  if (/撥碼/.test(text)) out.push('撥碼切換');
  if (/變焦/.test(text)) out.push('可變焦');
  if (/感應/.test(text)) out.push('微波感應');
  if (/可轉角|可擺角/.test(text)) out.push('可調角度');
  if (/幻彩|RGB|彩色/.test(text)) out.push('彩色 / RGB');
  return out;
}

export function validateSource(src) {
  const errors = [];
  if (!src || typeof src !== 'object') return ['資料庫不是 JSON 物件'];
  if (!Array.isArray(src.products)) return ['缺少 products 陣列'];
  const seen = new Set();
  src.products.forEach((p, i) => {
    for (const f of REQUIRED_FIELDS) {
      if (p[f] == null || p[f] === '') errors.push(`第 ${i + 1} 筆缺少必要欄位 ${f}`);
    }
    if (p.model) {
      if (seen.has(p.model)) errors.push(`型號重複：${p.model}`);
      seen.add(p.model);
    }
  });
  return errors;
}

const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

// 套用人工修正；回傳修正後的新陣列與報告
export function applyCorrections(products, corrections) {
  const byModel = new Map(products.map((p) => [p.model, { ...p, _corrected: [] }]));
  const notes = [];
  for (const c of corrections) {
    const p = byModel.get(c.model);
    if (!p) {
      notes.push({ level: 'warn', text: `修正對象 ${c.model} 已不在資料庫中，這筆修正可以刪除` });
      continue;
    }
    const current = p[c.field];
    if (same(current, c.to)) {
      notes.push({ level: 'info', text: `${c.model} ${c.field} 資料庫已是 ${JSON.stringify(c.to)}，這筆修正可以刪除` });
      continue;
    }
    if ('from' in c && !same(current, c.from)) {
      notes.push({
        level: 'warn',
        text: `${c.model} ${c.field} 資料庫值已從 ${JSON.stringify(c.from)} 變成 ${JSON.stringify(current)}，仍套用修正 ${JSON.stringify(c.to)}，請確認`,
      });
    }
    p[c.field] = c.to;
    p._corrected.push(c.field);
  }
  return { products: [...byModel.values()], notes };
}

export function matchesCategory(cat, p) {
  // 只在官網出現的產品依官網分類歸類；型錄產品依型錄分類
  if (p._source === 'official') return !!cat.officialCategories?.includes(p.official_category);
  if (cat.sections && cat.sections.includes(p.catalog_section)) return true;
  if (cat.nameIncludes && cat.nameIncludes.some((s) => p.product_name.includes(s))) return true;
  return false;
}

const hasLightSpec = (p) =>
  p.power_w != null || p.luminous_flux_lm != null || p.color_temperature_k != null;

export function toSku(p, images) {
  const cct = asList(p.color_temperature_k).map(Number).filter(Boolean);
  const lm = asList(p.luminous_flux_lm).map(Number).filter(Boolean);
  const power = asList(p.power_w).map(Number).filter(Boolean);
  const perMeter = p.power_per_meter === true;
  const lmMax = lm.length ? Math.max(...lm) : null;
  const pMax = power.length ? Math.max(...power) : null;
  const given = num(p.efficacy_lm_w);
  const efficacy = given ?? (pMax && lmMax ? Math.round(lmMax / pMax) : null);
  return {
    model: p.model,
    finish: finishOf(p),
    cct,
    rgb: !!p.rgb || /RGB|幻彩|彩色/.test(`${p.product_name}`),
    cri: num(p.cri_ra),
    r9: num(p.r9_min),
    power,
    powerRange: !!p.power_range,
    lm,
    lmRange: !!p.lumen_range,
    perMeter,
    efficacy,
    efficacyDerived: given == null && efficacy != null,
    ledDensity: num(p.led_density_pcs_per_m),
    beam: num(p.beam_angle_deg),
    cutout: cutoutCm(p.cutout),
    cutoutText: p.cutout_text || null,
    bodySize: p.body_size || p.size || null,
    length: p.length || null,
    voltage: voltage(p.input_voltage),
    material: tidy(p.material?.replace(/；/g, '、')),
    ip: p.ip_rating || null,
    lifespan: p.lifespan || null,
    driver: p.driver || null,
    mounting: p.mounting || null,
    certs: asList(p.certifications),
    energyLabel: /節標/.test(`${p.product_name} ${p.series_name}`),
    controls: controls(p),
    price: num(p.list_price),
    catalogPage: p.catalog_page ?? null,
    image: images[p.model] || p.official_image || null,
    url: p.official_url || null,
    source: p._source ?? 'catalog',
    corrected: p._corrected?.length ? p._corrected : undefined,
  };
}

const DESC_FIELDS = [
  ['variant', (r) => (r.variant ? r.variant.replace(/；/g, ' ') : null)],
  ['cutout', (r) => (cutoutCm(r.cutout) ? `${cutoutCm(r.cutout)}cm` : r.cutout_text || null)],
  ['power', (r) => (r.power_w != null ? `${asList(r.power_w).join(r.power_range ? '~' : '/')}W` : null)],
  ['beam', (r) => (r.beam_angle_deg != null ? `${r.beam_angle_deg}°` : null)],
  ['length', (r) => r.length || null],
  ['ip', (r) => r.ip_rating || null],
];

// 預設顯示的 SKU：優先 4000K、非黑色外觀
function defaultSku(skus) {
  const score = (s) => (s.cct.includes(4000) ? 2 : 0) + (s.finish ? 0 : 1);
  return [...skus].sort((a, b) => score(b) - score(a))[0].model;
}

export function buildCategory(cat, products, images) {
  const items = products.filter(
    (p) => p.record_type === 'product' && hasLightSpec(p) && matchesCategory(cat, p),
  );
  const groups = new Map();
  for (const p of items) {
    const key = `${p.series_name}|${skeleton(p.model, finishOf(p))}`;
    if (!groups.has(key)) groups.set(key, { series: p.series_name || p.product_name, rows: [] });
    groups.get(key).rows.push(p);
  }
  // 同機型各 SKU 取第一個非空值當機型代表值（型錄部分 SKU 欄位留空）
  for (const g of groups.values()) {
    g.rep = {};
    for (const f of ['variant', 'cutout', 'cutout_text', 'power_w', 'power_range', 'beam_angle_deg', 'length', 'ip_rating']) {
      g.rep[f] = g.rows.map((r) => r[f]).find((v) => v != null) ?? null;
    }
  }
  const bySeries = new Map();
  for (const g of groups.values()) {
    if (!bySeries.has(g.series)) bySeries.set(g.series, []);
    bySeries.get(g.series).push(g);
  }
  const out = [];
  for (const [series, gs] of bySeries) {
    // 同系列內有差異的欄位才放進機型名稱
    const varying = DESC_FIELDS.filter(([, f]) => new Set(gs.map((g) => f(g.rep))).size > 1);
    const fields = varying.length ? varying : DESC_FIELDS.filter(([k]) => k === 'power');
    const descs = gs.map((g) => [...new Set(fields.map(([, f]) => f(g.rep)).filter(Boolean))].join(' · '));
    gs.forEach((g, i) => {
      let descriptor = descs[i];
      // 描述相同時補上型號，避免同名
      if (descs.filter((d) => d === descriptor).length > 1) {
        descriptor = [descriptor, modelPattern(g.rows[0].model)].filter(Boolean).join(' · ');
      }
      const skus = g.rows
        .map((r) => toSku(r, images))
        .sort((a, b) => (a.cct[0] ?? 0) - (b.cct[0] ?? 0) || (a.finish ?? '').localeCompare(b.finish ?? ''));
      out.push({
        id: skeleton(skus[0].model),
        series,
        descriptor,
        name: descriptor ? `${series} ${descriptor}` : series,
        catalogPage: skus[0].catalogPage,
        defaultSku: defaultSku(skus),
        skus,
      });
    });
  }
  // 型錄產品依型錄頁碼，官網新增的排在後面並依系列排序
  out.sort((a, b) => (a.catalogPage ?? 1e6) - (b.catalogPage ?? 1e6) || a.series.localeCompare(b.series, 'zh-Hant'));
  const ids = new Map();
  for (const g of out) {
    const n = ids.get(g.id) ?? 0;
    ids.set(g.id, n + 1);
    if (n) g.id = `${g.id}~${n}`;
  }
  return { id: cat.id, label: cat.label, icon: cat.icon || cat.id, groups: out };
}

// 熱門比較：自動產生，指定的（featured）優先
export function popularComparisons(category, featured = []) {
  const list = [];
  const modelToGroup = new Map();
  for (const g of category.groups) for (const s of g.skus) modelToGroup.set(s.model, g);

  for (const f of featured.filter((f) => f.category === category.id)) {
    const models = f.models.filter((m) => modelToGroup.has(m)).slice(0, 4);
    if (models.length >= 2) list.push({ title: f.title, models, featured: true });
  }

  // 同系列不同規格
  const bySeries = new Map();
  for (const g of category.groups) {
    if (!bySeries.has(g.series)) bySeries.set(g.series, []);
    bySeries.get(g.series).push(g);
  }
  const multi = [...bySeries.entries()].filter(([, gs]) => gs.length >= 2 && gs.length <= 6);
  multi.sort((a, b) => b[1].length - a[1].length);
  for (const [series, gs] of multi.slice(0, 2)) {
    const pick = gs.slice(0, 4);
    list.push({ title: `${series}：${pick.length} 種規格比一比`, models: pick.map((g) => g.defaultSku) });
  }

  // 同開孔不同系列（崁燈）
  const byCutout = new Map();
  for (const g of category.groups) {
    const c = g.skus.find((s) => s.cutout)?.cutout;
    if (!c) continue;
    if (!byCutout.has(c)) byCutout.set(c, new Map());
    const m = byCutout.get(c);
    if (!m.has(g.series)) m.set(g.series, g);
  }
  const bestCutout = [...byCutout.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  if (bestCutout && bestCutout[1].size >= 2) {
    const pick = [...bestCutout[1].values()].slice(0, 4);
    list.push({ title: `開孔 ${bestCutout[0]}cm：${pick.length} 個系列比一比`, models: pick.map((g) => g.defaultSku) });
  }

  // 防水 vs 一般
  // 防水 vs 一般：只在防水款夠多的類別產生，並挑瓦數最接近的一般款
  const wets = category.groups.filter((g) => g.skus.some((s) => s.ip));
  const drys = category.groups.filter((g) => g.skus.every((s) => !s.ip));
  if (wets.length >= 2 && drys.length) {
    const w = wets[0];
    const pw = (g) => g.skus[0].power[0] ?? 0;
    const d = [...drys].sort((a, b) => Math.abs(pw(a) - pw(w)) - Math.abs(pw(b) - pw(w)))[0];
    list.push({ title: `室內 vs 戶外防水（${w.skus.find((s) => s.ip).ip}）`, models: [d.defaultSku, w.defaultSku] });
  }

  const seen = new Set();
  return list
    .filter((p) => {
      const k = [...p.models].sort().join();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 4);
}

// 機型內各 SKU 的瓦數差異過大 → 可疑
export function suspiciousGroups(category) {
  const out = [];
  for (const g of category.groups) {
    // 比較各 SKU 的最大瓦數（調光款、兩段式的單一 SKU 本來就有多個瓦數）
    const ps = g.skus.filter((s) => s.power.length).map((s) => Math.max(...s.power));
    if (ps.length >= 2 && Math.max(...ps) / Math.min(...ps) > 2) {
      out.push(`${category.label}「${g.name}」各 SKU 瓦數差異大：${g.skus.map((s) => `${s.model}=${s.power.join('/') || '空'}W`).join('、')}`);
    }
  }
  return out;
}

export function parseImages(text, kind) {
  if (!text || !text.trim()) return {};
  if (kind === 'json') {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return Object.fromEntries(obj.map((r) => [r.model, r.image || r.url]));
    return obj;
  }
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const [model, url] = line.split(/[,\t]/).map((s) => s?.trim().replace(/^"|"$/g, ''));
    if (model && url && /^https?:\/\//.test(url)) out[model] = url;
  }
  return out;
}

export function buildCatalog({ src, official = null, categories, corrections = [], images = {}, featured = [] }) {
  const errors = validateSource(src);
  if (official && !Array.isArray(official.products)) errors.push('官網資料缺少 products 陣列');
  if (errors.length) return { errors };
  const officialCats = new Set(categories.flatMap((c) => c.officialCategories ?? []));
  const { products: merged, conflicts } = official
    ? mergeSources(src.products, official.products, officialCats)
    : { products: src.products, conflicts: [] };
  const { products, notes } = applyCorrections(merged, corrections);
  const cats = categories.map((c) => buildCategory(c, products, images));
  const warnings = notes.map((n) => n.text);
  for (const c of cats) {
    if (c.groups.length < 2) errors.push(`類別「${c.label}」少於 2 個機型，無法比較（請檢查 categories.config.json）`);
    warnings.push(...suspiciousGroups(c));
  }
  const allModels = cats.flatMap((c) => c.groups.flatMap((g) => g.skus.map((s) => s.model)));
  const withImage = new Set(cats.flatMap((c) => c.groups.flatMap((g) => g.skus.filter((s) => s.image).map((s) => s.model))));
  const missingImages = allModels.filter((m) => !withImage.has(m));
  for (const c of cats) c.popular = popularComparisons(c, featured);
  const md = src.metadata || {};
  return {
    errors,
    warnings,
    conflicts,
    missingImages,
    catalog: {
      source: {
        name: md.database_name ?? null,
        version: md.database_version ?? null,
        verifiedDate: md.verified_date ?? null,
        sourceFile: md.source_file ?? null,
        official: official?.metadata ? { name: official.metadata.title ?? null, date: official.metadata.generated_at ?? null } : null,
      },
      categories: cats,
    },
  };
}
