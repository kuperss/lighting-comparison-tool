import { useMemo, useState } from 'react';
import { MAX, lookup } from '../lib/catalog.js';
import { fmtNum, fmtPrice } from '../lib/format.js';
import { Icon } from './Icons.jsx';
import Hero from './Hero.jsx';
import ProductImage from './ProductImage.jsx';

// 產品列表（2g / 2h）：卡片勾選加入比較，底部比較匣（手機為浮動鈕 + 抽屜）
export default function ListPage({ category, slots, slotCat, actions }) {
  const [q, setQ] = useState('');
  const [cutout, setCutout] = useState(null);
  const [drawer, setDrawer] = useState(false);

  const trayEntries = slots.map((m) => lookup(m));
  const count = trayEntries.filter(Boolean).length;
  const sameCat = slotCat === category.id;

  const cutouts = useMemo(
    () => [...new Set(category.groups.map((g) => g.skus.find((s) => s.cutout)?.cutout).filter(Boolean))].sort((a, b) => a - b),
    [category],
  );

  const groups = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return category.groups.filter((g) => {
      if (cutout && g.skus.find((s) => s.cutout)?.cutout !== cutout) return false;
      const hay = `${g.name} ${g.skus.map((s) => s.model).join(' ')}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [category, q, cutout]);

  const inTray = (g) => sameCat && slots.some((m) => m && g.skus.some((s) => s.model === m));

  return (
    <>
    <Hero compact eyebrow="Product collection" title={`${category.label}系列`} sub={`共 ${category.groups.length} 款機型，勾選「比較」加入比較匣`} />
    <main className="page list">
      <div className="list__filters">
        <label className="search">
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜尋系列或型號" aria-label="搜尋" />
        </label>
        {cutouts.length > 1 && (
          <div className="chips" role="group" aria-label="開孔尺寸">
            <button type="button" className={`chip ${cutout == null ? 'is-on' : ''}`} onClick={() => setCutout(null)}>全部開孔</button>
            {cutouts.map((c) => (
              <button type="button" key={c} className={`chip ${cutout === c ? 'is-on' : ''}`} onClick={() => setCutout(c)}>{c}cm</button>
            ))}
          </div>
        )}
      </div>

      <div className="cards">
        {groups.map((g) => {
          const s = g.skus.find((x) => x.model === g.defaultSku);
          const prices = g.skus.map((x) => x.price).filter((p) => p != null);
          const checked = inTray(g);
          const full = sameCat && count >= MAX && !checked;
          return (
            <article className={`card ${checked ? 'is-on' : ''}`} key={g.id}>
              <ProductImage group={g} sku={s} categoryId={category.id} size={112} className="card__img" />
              <div className="card__body">
                <b>{g.series}</b>
                {g.descriptor && <span className="card__desc">{g.descriptor}</span>}
                <span className="card__spec muted">
                  {[
                    s.power.length && `${s.power.join(s.powerRange ? '~' : '/')}W${s.perMeter ? '/m' : ''}`,
                    s.lm.length && `${fmtNum(Math.max(...s.lm))}lm`,
                    s.beam && `${s.beam}°`,
                    s.cutout && `開孔 ${s.cutout}cm`,
                  ].filter(Boolean).join(' · ')}
                </span>
                <span className="card__price">{prices.length ? `${fmtPrice(Math.min(...prices))}${new Set(prices).size > 1 ? ' 起' : ''}` : '未列價'}</span>
              </div>
              <label className={`check ${full ? 'is-disabled' : ''}`} title={full ? `最多比較 ${MAX} 款` : undefined}>
                <input type="checkbox" checked={checked} disabled={full} onChange={() => actions.toggleTray(category.id, g)} />
                <span className="check__box"><Icon name="check" size={12} strokeWidth={2.6} /></span>
                {full ? `已滿 ${MAX} 款` : '比較'}
              </label>
            </article>
          );
        })}
        {!groups.length && <p className="muted">找不到符合的機型</p>}
      </div>

      {count > 0 && (
        <>
          <div className="tray" aria-label="比較匣">
            <div className="tray__inner">
              <span className="tray__title">
                比較匣 <span className="muted">{lookup(slots.find(Boolean))?.category.label} · {count} / {MAX}</span>
              </span>
              <div className="tray__slots">
                {trayEntries.map((e, i) =>
                  e ? (
                    <div className="tray__item" key={i}>
                      <ProductImage group={e.group} sku={e.sku} categoryId={e.category.id} size={28} />
                      <span className="tray__name">
                        <b>{e.group.series}</b>
                        <small>{e.group.descriptor}</small>
                      </span>
                      <button type="button" className="icon-btn" onClick={() => actions.setSlot(i, null)} aria-label={`移除 ${e.group.name}`}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="tray__item tray__item--empty" key={i}>空位</div>
                  ),
                )}
              </div>
              <button type="button" className="link" onClick={actions.clear}>清除</button>
              <button type="button" className="btn-primary" disabled={count < 2} onClick={actions.toCompare}>
                比較 {count} 款 →
              </button>
            </div>
          </div>

          <button type="button" className="fab" onClick={() => setDrawer(true)}>
            比較清單 {count} / {MAX}
          </button>
          {drawer && (
            <>
              <div className="sheet-backdrop is-on" onClick={() => setDrawer(false)} />
              <div className="drawer" role="dialog" aria-label="比較清單">
                <div className="drawer__grip" />
                <b>比較清單 {count} / {MAX}</b>
                <div className="drawer__slots">
                  {trayEntries.map((e, i) =>
                    e ? (
                      <div className="drawer__slot" key={i}>
                        <ProductImage group={e.group} sku={e.sku} categoryId={e.category.id} size={56} />
                        <span>{e.group.series}</span>
                        <small className="muted">{e.group.descriptor}</small>
                        <button type="button" className="icon-btn" onClick={() => actions.setSlot(i, null)} aria-label={`移除 ${e.group.name}`}>
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="drawer__slot drawer__slot--empty" key={i} />
                    ),
                  )}
                </div>
                <button type="button" className="btn-primary btn-block" disabled={count < 2} onClick={actions.toCompare}>
                  {count < 2 ? '再選 1 款即可比較' : '開始比較'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </main>
    </>
  );
}
