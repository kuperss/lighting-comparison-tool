// 畫面狀態 ↔ 網址參數。只用 query string，GitHub Pages 重新整理也不會 404。
//   ?                       首頁（選類別）
//   ?v=list&c=downlight     產品列表
//   ?c=downlight&m=A,B,,D   比較頁（m 依欄位順序，空欄留空）
import { MAX, getCategory, lookup } from './catalog.js';

export const emptySlots = () => Array(MAX).fill(null);

export function parseUrl(search = window.location.search) {
  const q = new URLSearchParams(search);
  const cat = getCategory(q.get('c'))?.id ?? null;
  const view = q.get('v') === 'list' ? 'list' : cat ? 'compare' : 'home';
  const slots = emptySlots();
  (q.get('m') ?? '').split(',').slice(0, MAX).forEach((m, i) => {
    const hit = lookup(m.trim());
    if (hit && hit.category.id === cat) slots[i] = hit.sku.model;
  });
  return { view, cat, slots };
}

export function toSearch({ view, cat, slots }) {
  const q = new URLSearchParams();
  if (view === 'list') q.set('v', 'list');
  if (cat && view !== 'home') q.set('c', cat);
  if (view === 'compare' && slots.some(Boolean)) {
    q.set('m', slots.map((s) => s ?? '').join(',').replace(/,+$/, ''));
  }
  const s = q.toString().replace(/%2C/g, ',');
  return s ? `?${s}` : '';
}

export const shareUrl = (state) =>
  `${window.location.origin}${window.location.pathname}${toSearch({ ...state, view: 'compare' })}`;
