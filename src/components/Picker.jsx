import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtNum } from '../lib/format.js';
import { Icon } from './Icons.jsx';

// 機型選擇器（2c）：鎖定目前類別，搜尋 + 開孔篩選，依系列分組。
// 桌機為欄位下方的浮層，手機為底部抽屜（由 CSS 切換）。
export default function Picker({ category, slots, slotIndex, onPick, onRemove, onClose }) {
  const [q, setQ] = useState('');
  const [cutout, setCutout] = useState(null);
  const ref = useRef(null);
  const input = useRef(null);
  const current = slots[slotIndex];

  const used = useMemo(() => {
    const m = new Map();
    slots.forEach((model, i) => {
      if (!model || i === slotIndex) return;
      const g = category.groups.find((g) => g.skus.some((s) => s.model === model));
      if (g) m.set(g.id, i);
    });
    return m;
  }, [slots, slotIndex, category]);

  const cutouts = useMemo(
    () => [...new Set(category.groups.map((g) => g.skus.find((s) => s.cutout)?.cutout).filter(Boolean))].sort((a, b) => a - b),
    [category],
  );

  const list = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (g) => {
      if (cutout && g.skus.find((s) => s.cutout)?.cutout !== cutout) return false;
      const hay = `${g.name} ${g.skus.map((s) => `${s.model} ${s.power.join('W ')}W`).join(' ')}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    };
    const bySeries = new Map();
    for (const g of category.groups.filter(hit)) {
      if (!bySeries.has(g.series)) bySeries.set(g.series, []);
      bySeries.get(g.series).push(g);
    }
    return [...bySeries.entries()];
  }, [category, q, cutout]);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && onClose();
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.('[data-picker-trigger]')) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [onClose]);

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="picker" ref={ref} role="dialog" aria-label={`選擇${category.label}機型`}>
        <div className="picker__head">
          <b>選擇第 {slotIndex + 1} 款{category.label}</b>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="關閉">
            <Icon name="close" />
          </button>
        </div>
        <p className="picker__note">類別：{category.label}（其他類別請由上方分頁切換）</p>
        <label className="search">
          <Icon name="search" size={16} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋系列、型號或瓦數"
            aria-label="搜尋機型"
          />
        </label>
        {cutouts.length > 1 && (
          <div className="chips" role="group" aria-label="開孔尺寸">
            <button type="button" className={`chip ${cutout == null ? 'is-on' : ''}`} onClick={() => setCutout(null)}>全部</button>
            {cutouts.map((c) => (
              <button type="button" key={c} className={`chip ${cutout === c ? 'is-on' : ''}`} onClick={() => setCutout(c)}>
                {c}cm
              </button>
            ))}
          </div>
        )}
        <div className="picker__list">
          {list.length === 0 && <p className="muted picker__empty">找不到符合的機型</p>}
          {list.map(([series, gs]) => (
            <section key={series}>
              <h4>{series}</h4>
              {gs.map((g) => {
                const inCol = used.get(g.id);
                const selected = g.skus.some((s) => s.model === current);
                const s = g.skus.find((x) => x.model === g.defaultSku);
                return (
                  <button
                    type="button"
                    key={g.id}
                    className={`picker__item ${selected ? 'is-selected' : ''}`}
                    disabled={inCol != null}
                    onClick={() => onPick(g)}
                  >
                    <span className="picker__radio" aria-hidden="true">{selected && <Icon name="check" size={12} strokeWidth={2.5} />}</span>
                    <span className="picker__name">{g.descriptor || g.series}</span>
                    <span className="picker__meta">
                      {inCol != null
                        ? `已在第 ${inCol + 1} 欄`
                        : [s.power.length && `${s.power.join(s.powerRange ? '~' : '/')}W`, s.lm.length && `${fmtNum(Math.max(...s.lm))}lm`].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                );
              })}
            </section>
          ))}
        </div>
        {current && (
          <button type="button" className="picker__remove" onClick={onRemove}>
            <Icon name="close" size={14} /> 從比較中移除
          </button>
        )}
      </div>
    </>
  );
}
