// 讀取 data/ 內的型錄資料庫與設定檔，檢查後產出 src/data/catalog.json 與 data-report.md。
// 有錯誤（格式錯、型號重複、類別不足）時以非 0 結束，GitHub Actions 就不會發布。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog, parseImages } from './lib/catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolve(root, 'data');
const read = (name) => readFileSync(resolve(dataDir, name), 'utf8');
const readJson = (name, fallback) => {
  if (!existsSync(resolve(dataDir, name))) return fallback;
  try {
    return JSON.parse(read(name));
  } catch (e) {
    console.error(`✗ ${name} 不是有效的 JSON：${e.message}`);
    process.exit(1);
  }
};

const src = readJson('source/products-db.json', null);
if (!src) {
  console.error('✗ 找不到 data/source/products-db.json');
  process.exit(1);
}

let images = {};
if (existsSync(resolve(dataDir, 'images.json'))) images = { ...images, ...parseImages(read('images.json'), 'json') };
if (existsSync(resolve(dataDir, 'images.csv'))) images = { ...images, ...parseImages(read('images.csv'), 'csv') };

const result = buildCatalog({
  src,
  categories: readJson('categories.config.json', []),
  corrections: readJson('corrections.json', []),
  featured: readJson('featured.json', []),
  images,
});

const site = readJson('site.config.json', {});
const lines = [`# 資料檢查報告`, '', `產生時間：${new Date().toISOString()}`, ''];
if (result.catalog) {
  const s = result.catalog.source;
  lines.push(`資料庫：${s.name ?? '（未命名）'} v${s.version ?? '?'}，驗證日期 ${s.verifiedDate ?? '?'}`, '');
  lines.push('| 類別 | 機型 | SKU |', '|---|---|---|');
  for (const c of result.catalog.categories) {
    lines.push(`| ${c.label} | ${c.groups.length} | ${c.groups.reduce((n, g) => n + g.skus.length, 0)} |`);
  }
  lines.push('');
}
lines.push(`## 錯誤（${result.errors.length}）`, '', ...(result.errors.length ? result.errors.map((e) => `- ${e}`) : ['無']), '');
if (result.warnings) {
  lines.push(`## 提醒（${result.warnings.length}）`, '', ...(result.warnings.length ? result.warnings.map((e) => `- ${e}`) : ['無']), '');
  lines.push(`## 沒有圖片網址的型號（${result.missingImages.length}）`, '', result.missingImages.join('、') || '無', '');
}
writeFileSync(resolve(root, 'data-report.md'), lines.join('\n'));

if (result.errors.length) {
  console.error('✗ 資料檢查未通過：');
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

const dest = resolve(root, 'src/data/catalog.json');
mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify({ ...result.catalog, site }));

for (const c of result.catalog.categories) {
  console.log(`✓ ${c.label}：${c.groups.length} 機型 / ${c.groups.reduce((n, g) => n + g.skus.length, 0)} SKU`);
}
if (result.warnings.length) console.log(`! ${result.warnings.length} 則提醒，詳見 data-report.md`);
console.log(`! ${result.missingImages.length} 個型號沒有圖片網址`);
