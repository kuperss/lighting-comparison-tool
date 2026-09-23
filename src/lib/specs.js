// 規格列定義：每列回傳 { text, key }；text 為 null 代表型錄沒有資料。
// 全部欄位都沒資料的列自動隱藏；key 不同的列視為「有差異」。
import { cctName, fmtNum, fmtPrice } from './format.js';

const v = (text, key = text) => ({ text, key: key ?? '' });
const none = { text: null, key: '' };

export const SECTIONS = [
  { id: 'light', label: '光源' },
  { id: 'install', label: '安裝' },
  { id: 'function', label: '功能 · 調光 / IP' },
  { id: 'cert', label: '認證與保固' },
  { id: 'price', label: '價格與型錄' },
];

export const ROWS = [
  {
    id: 'power', section: 'light', label: '消耗功率', corrected: 'power_w',
    get: (s) => (s.power.length ? v(`${s.power.join(s.powerRange ? '~' : ' / ')}W${s.perMeter ? '/m' : ''}`) : none),
  },
  {
    id: 'lm', section: 'light', label: '光通量', corrected: 'luminous_flux_lm', emphasis: true,
    get: (s) => (s.lm.length ? v(`${s.lm.map(fmtNum).join(s.lmRange ? '~' : ' / ')} lm${s.perMeter ? '/m' : ''}`) : none),
  },
  {
    id: 'efficacy', section: 'light', label: '光效',
    get: (s) => (s.efficacy ? v(`${s.efficacy} lm/W`) : none),
    note: (s) => (s.efficacyDerived ? '依光通量 ÷ 瓦數換算' : null),
  },
  {
    id: 'cct', section: 'light', label: '色溫', type: 'cct',
    // 比較機型可選的色溫；目前選的 SKU 另外標示
    get: (s, g) => {
      const all = [...new Set(g.skus.flatMap((x) => (x.cct.length > 1 ? [x.cct.join('/')] : x.cct)))];
      if (!all.length) return s.rgb ? v('RGB 彩色') : none;
      return v(all.map((k) => `${k}K`).join('、'), all.join('|'));
    },
  },
  {
    id: 'cri', section: 'light', label: '演色性',
    get: (s) => (s.cri ? v(`Ra ${s.cri}${s.r9 ? ` · R9 > ${s.r9}` : ''}`) : none),
  },
  {
    id: 'beam', section: 'light', label: '發光角度', type: 'beam',
    get: (s) => (s.beam ? v(`${s.beam}°`) : none),
  },
  {
    id: 'cutout', section: 'install', label: '開孔尺寸',
    get: (s) => (s.cutout ? v(`Ø ${s.cutout} cm`) : s.cutoutText ? v(s.cutoutText) : none),
  },
  { id: 'bodySize', section: 'install', label: '燈體尺寸', get: (s) => (s.bodySize ? v(s.bodySize) : none) },
  { id: 'length', section: 'install', label: '長度', get: (s) => (s.length ? v(s.length) : none) },
  { id: 'mounting', section: 'install', label: '安裝方式', get: (s) => (s.mounting ? v(s.mounting) : none) },
  { id: 'voltage', section: 'install', label: '輸入電壓', get: (s) => (s.voltage ? v(s.voltage) : none) },
  { id: 'driver', section: 'install', label: '驅動器', get: (s) => (s.driver ? v(s.driver.replace(/；/g, '、')) : none) },
  { id: 'material', section: 'install', label: '燈體材質', get: (s) => (s.material ? v(s.material) : none) },
  {
    id: 'finish', section: 'install', label: '外觀選項',
    get: (s, g) => {
      const f = [...new Set(g.skus.map((x) => x.finish ?? '標準'))];
      return f.length > 1 || f[0] !== '標準' ? v(f.join('、')) : none;
    },
  },
  {
    id: 'controls', section: 'function', label: '調光 / 控制',
    get: (s) => (s.controls.length ? v(s.controls.join('、')) : none),
    note: () => '依品名標示整理',
  },
  { id: 'ip', section: 'function', label: '防水等級', get: (s) => (s.ip ? v(s.ip) : none) },
  { id: 'led', section: 'function', label: 'LED 密度', get: (s) => (s.ledDensity ? v(`${s.ledDensity} 顆/m`) : none) },
  {
    id: 'certs', section: 'cert', label: '商品檢驗',
    get: (s) => (s.certs.length ? v(s.certs.join('、')) : none),
  },
  { id: 'energy', section: 'cert', label: '節能標章', get: (s) => (s.energyLabel ? v('✓ 節能標章') : none) },
  { id: 'lifespan', section: 'cert', label: '壽命', get: (s) => (s.lifespan ? v(s.lifespan.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')) : none) },
  { id: 'price', section: 'price', label: '牌價', emphasis: true, get: (s) => v(fmtPrice(s.price)) },
  { id: 'model', section: 'price', label: '型號', get: (s) => v(s.model), noDiff: true },
  { id: 'page', section: 'price', label: '型錄頁碼', get: (s) => (s.catalogPage ? v(`P.${s.catalogPage}`) : none), noDiff: true },
];

// 依目前欄位算出每列的值、是否有資料、是否有差異
export function buildRows(entries) {
  const filled = entries.filter(Boolean);
  return ROWS.map((row) => {
    const cells = entries.map((e) => (e ? { ...row.get(e.sku, e.group), note: row.note?.(e.sku) ?? null, corrected: row.corrected && e.sku.corrected?.includes(row.corrected) } : null));
    const vals = cells.filter(Boolean);
    const hasData = vals.some((c) => c.text != null);
    const differs = !row.noDiff && filled.length > 1 && new Set(vals.map((c) => c.key)).size > 1;
    return { ...row, cells, hasData, differs };
  }).filter((r) => r.hasData);
}

export function cctLabel(k) {
  return `${k}K ${cctName(k)}`;
}
