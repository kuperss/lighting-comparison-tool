import { describe, expect, it } from 'vitest';
import { mergeSources, normalizeOfficial, officialFinish, officialSeries } from '../official.mjs';

const off = (model, name, specs, cat = '一體化崁燈') => ({ model, name, category: { name: cat }, specs, images: { main: `https://x/${model}.png` }, source_url: `https://x/${model}` });

describe('官網資料整理', () => {
  it('瓦數與光通量的範圍、兩段式', () => {
    const r = normalizeOfficial(off('A', 'a', { wattage: '3~45W', lumen: '30~4000 lm' }));
    expect(r.power_w).toEqual([3, 45]);
    expect(r.power_range).toBe(true);
    const t = normalizeOfficial(off('B', 'b', { wattage: '2W、24W', lumen: '150、2400 lm' }));
    expect(t.power_w).toEqual([2, 24]);
    expect(t.power_range).toBe(false);
  });
  it('演色性與 R9 分開解析', () => {
    const r = normalizeOfficial(off('A', 'a', { cri: '90；R9 >50' }));
    expect([r.cri_ra, r.r9_min]).toEqual([90, 50]);
    expect(normalizeOfficial(off('B', 'b', { cri: '≧ 90；R9 >0' })).cri_ra).toBe(90);
  });
  it('開孔：圓孔轉公分、方孔保留文字', () => {
    expect(normalizeOfficial(off('A', 'a', { cutout_size: '直徑95 mm' })).cutout).toBe('9.5cm');
    expect(normalizeOfficial(off('B', 'b', { cutout_size: '長170*寬170 mm' })).cutout_text).toBe('方孔 170×170 mm');
  });
  it('每米規格與色溫', () => {
    const r = normalizeOfficial(off('A', 'a', { wattage: '4W（每米）', color_temperature: '6500K／3000K／4000K' }));
    expect(r.power_per_meter).toBe(true);
    expect(r.color_temperature_k).toEqual([6500, 3000, 4000]);
  });
  it('系列名稱與外觀', () => {
    expect(officialSeries('黑鑽石軌道投射燈黑款 30W,白光')).toBe('黑鑽石軌道投射燈');
    expect(officialSeries('微笑軌道燈-貴族黑8W,白光')).toBe('微笑軌道燈');
    expect(officialFinish('9.5公分廣角浩瀚崁燈貴族黑,白光')).toBe('黑');
    expect(officialFinish('嫦娥壁切吸頂燈梧桐木紋,白光')).toBe('木紋');
  });
});

describe('合併', () => {
  const catalog = [
    { model: 'D-9DOB9D', product_name: '波爾', series_name: '波爾', catalog_section: '崁燈', record_type: 'product', cri_ra: 50, power_w: 9, list_price: 3000 },
    { model: 'D-NEW', product_name: '新品', series_name: '新品', catalog_section: '崁燈', record_type: 'product', power_w: 5 },
  ];
  const official = [
    off('D-9DOB9D', '波爾防眩崁燈9.5公分,白光', { cri: '90', lifespan: '15000小時' }),
    off('LED-X1', '官網新品,白光', { wattage: '8W' }),
    off('LED-X2', '吊燈,白光', { wattage: '8W' }, '質感餐吊燈'),
  ];
  const { products, conflicts } = mergeSources(catalog, official, new Set(['一體化崁燈']));
  it('衝突以官網為準並記錄；官網沒有的欄位沿用型錄', () => {
    const p = products.find((x) => x.model === 'D-9DOB9D');
    expect(p.cri_ra).toBe(90);
    expect(p.list_price).toBe(3000);
    expect(p.lifespan).toBe('15000小時');
    expect(p.official_image).toBe('https://x/D-9DOB9D.png');
    expect(conflicts).toEqual([{ model: 'D-9DOB9D', field: 'cri_ra', catalog: 50, official: 90 }]);
  });
  it('官網獨有產品只收指定分類，牌價為空', () => {
    expect(products.find((x) => x.model === 'LED-X1')).toMatchObject({ _source: 'official', list_price: null, series_name: '官網新品' });
    expect(products.find((x) => x.model === 'LED-X2')).toBeUndefined();
    expect(products.find((x) => x.model === 'D-NEW')._source).toBe('catalog');
  });
});
