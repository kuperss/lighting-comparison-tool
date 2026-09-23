import { describe, expect, it } from 'vitest';
import {
  applyCorrections, buildCatalog, controls, cutoutCm, finishOf, modelPattern, parseImages, skeleton, validateSource,
} from '../catalog.mjs';

const base = {
  record_type: 'product', catalog_section: '崁燈', series_name: '波爾防眩崁燈', product_name: '波爾防眩崁燈',
  power_w: 9, luminous_flux_lm: 900, color_temperature_k: 4000, cri_ra: 80, cutout: '9.5cm', catalog_page: 10,
};
const p = (model, extra = {}) => ({ ...base, model, ...extra });

describe('skeleton / 機型分組', () => {
  it('色溫字母與外觀字尾不同的 SKU 骨架相同', () => {
    const models = ['D-9DOB9W', 'D-9DOB9N', 'D-9DOB9D', 'D-9DOB9N-BK'];
    expect(new Set(models.map(skeleton)).size).toBe(1);
  });
  it('LED- 與 D- 前綴視為同一機型、-WH 為白色款', () => {
    expect(skeleton('LED-MTTR15N')).toBe(skeleton('D-MTTR15N-WH'));
  });
  it('角度或 DALI 不同的型號分開', () => {
    expect(skeleton('D-3DOIV1N15')).not.toBe(skeleton('D-3DOIV1N24'));
    expect(skeleton('D-12DOB12N')).not.toBe(skeleton('D-12DOB12N-DA'));
  });
  it('軟條燈 10SW / 10SN / 10SD 同機型', () => {
    expect(skeleton('D-35NA24V10SW')).toBe(skeleton('D-35NA24V10SD'));
  });
  it('型號樣式以 □ 表示色溫字母', () => {
    expect(modelPattern('D-25138N')).toBe('D-25138□');
    expect(modelPattern('D-TRCP15WR3-BK')).toBe('D-TRCP15□R3');
  });
});

describe('欄位整理', () => {
  it('外觀', () => {
    expect(finishOf({ model: 'D-9DOB9N-BK' })).toBe('黑');
    expect(finishOf({ model: 'D-9DOM12N-BK-DA' })).toBe('黑');
    expect(finishOf({ model: 'D-15DOO16NR3BK' })).toBe('黑');
    expect(finishOf({ model: 'D-CEC24DSW-LW' })).toBe('木紋');
    expect(finishOf({ model: 'D-9DOB9N' })).toBe(null);
  });
  it('開孔只取開頭的公分數', () => {
    expect(cutoutCm('9.5cm')).toBe(9.5);
    expect(cutoutCm('7.5cm 4000K')).toBe(7.5);
    expect(cutoutCm('ghQ')).toBe(null);
  });
  it('控制方式只依品名字樣', () => {
    expect(controls({ product_name: 'T5 調光支架燈' })).toEqual(['可調光']);
    expect(controls({ product_name: '雪晴全光譜壁切調光吸頂燈' })).toEqual(['壁切調光']);
    expect(controls({ product_name: '波爾防眩崁燈', variant: 'DALI智慧燈控版' })).toEqual(['DALI 智慧燈控']);
    expect(controls({ product_name: '波爾防眩崁燈' })).toEqual([]);
  });
});

describe('檢查與修正', () => {
  it('型號重複與缺欄位為錯誤', () => {
    const errs = validateSource({ products: [p('A'), p('A'), { model: 'B' }] });
    expect(errs.some((e) => e.includes('型號重複'))).toBe(true);
    expect(errs.some((e) => e.includes('product_name'))).toBe(true);
  });
  it('套用修正並回報可刪除 / 值已變更', () => {
    const { products, notes } = applyCorrections(
      [p('A', { power_w: 3 }), p('B', { power_w: 24 }), p('C', { power_w: 5 })],
      [
        { model: 'A', field: 'power_w', from: 3, to: 45 },
        { model: 'B', field: 'power_w', from: null, to: 24 },
        { model: 'C', field: 'power_w', from: 2, to: 24 },
        { model: 'Z', field: 'power_w', to: 1 },
      ],
    );
    expect(products.find((x) => x.model === 'A').power_w).toBe(45);
    expect(products.find((x) => x.model === 'A')._corrected).toEqual(['power_w']);
    expect(notes.map((n) => n.text).join()).toMatch(/B power_w 資料庫已是 24/);
    expect(notes.map((n) => n.text).join()).toMatch(/C power_w 資料庫值已從 2 變成 5/);
    expect(notes.map((n) => n.text).join()).toMatch(/Z 已不在資料庫/);
  });
  it('圖片對照：JSON 物件、JSON 陣列、CSV', () => {
    expect(parseImages('{"A":"https://x/a.jpg"}', 'json')).toEqual({ A: 'https://x/a.jpg' });
    expect(parseImages('[{"model":"A","image":"https://x/a.jpg"}]', 'json')).toEqual({ A: 'https://x/a.jpg' });
    expect(parseImages('model,url\nA,https://x/a.jpg\nB,not-a-url', 'csv')).toEqual({ A: 'https://x/a.jpg' });
  });
});

describe('buildCatalog', () => {
  const src = {
    metadata: { database_version: '1.0.0' },
    products: [
      p('D-9DOB9W', { color_temperature_k: 3000 }), p('D-9DOB9N'), p('D-9DOB9N-BK'),
      p('D-12DOB12N', { cutout: '12cm', power_w: 12 }),
      p('X-ACC', { record_type: 'accessory' }),
    ],
  };
  const cats = [{ id: 'downlight', label: '崁燈', sections: ['崁燈'] }];
  it('依機型分組，預設 SKU 為 4000K 非黑款', () => {
    const r = buildCatalog({ src, categories: cats, images: { 'D-9DOB9N': 'https://x/a.jpg' } });
    expect(r.errors).toEqual([]);
    const g = r.catalog.categories[0].groups;
    expect(g).toHaveLength(2);
    expect(g[0].skus.map((s) => s.model)).toEqual(['D-9DOB9W', 'D-9DOB9N', 'D-9DOB9N-BK']);
    expect(g[0].defaultSku).toBe('D-9DOB9N');
    expect(g[0].name).toBe('波爾防眩崁燈 9.5cm · 9W');
    expect(r.missingImages).toContain('D-9DOB9W');
  });
  it('類別少於 2 個機型為錯誤', () => {
    const r = buildCatalog({ src: { products: [p('D-9DOB9N')] }, categories: cats });
    expect(r.errors[0]).toMatch(/少於 2 個機型/);
  });
});

describe('電壓寫法統一', () => {
  it('全電壓與 DC 空格', async () => {
    const { voltage } = await import('../catalog.mjs');
    expect(voltage('100-240V (全電壓)')).toBe('100-240V');
    expect(voltage('100-240V(全電壓)')).toBe('100-240V');
    expect(voltage('DC24V (需外接驅動器) 另計')).toBe('DC24V（需外接驅動器）');
    expect(voltage('DC 24V')).toBe('DC24V');
  });
});
