import { useEffect, useState } from 'react';
import { fmtPrice } from '../lib/format.js';
import { SECTIONS } from '../lib/specs.js';
import { CctPicker, Toolbar } from './CompareParts.jsx';
import { Notes } from './ComparePage.jsx';
import { Icon } from './Icons.jsx';
import ProductImage from './ProductImage.jsx';
import { SpecCell } from './CompareParts.jsx';

// 手機比較（2e）：上方固定 4 個縮圖，點選決定並排哪 2 款；規格分組手風琴
export default function MobileCompare({ category, slots, entries, rows, onlyDiff, setOnlyDiff, collapsed, setCollapsed, setPicker, pickerEl, actions }) {
  const filled = entries.map((e, i) => (e ? i : null)).filter((i) => i != null);
  const [shown, setShown] = useState(() => filled.slice(0, 2));

  // 欄位變動時，保持顯示中的兩款都有機型
  useEffect(() => {
    setShown((cur) => {
      const keep = cur.filter((i) => entries[i]);
      for (const i of filled) if (keep.length < 2 && !keep.includes(i)) keep.push(i);
      return keep.sort((a, b) => a - b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  const tap = (i) => {
    if (!entries[i]) return setPicker(i);
    if (shown.includes(i)) return;
    setShown((cur) => [...cur.slice(-1), i].sort((a, b) => a - b));
  };

  const pair = shown.map((i) => entries[i]);
  const pairRows = rows.map((r) => {
    const cells = shown.map((i) => r.cells[i]);
    const differs = !r.noDiff && cells.length > 1 && new Set(cells.map((c) => c.key)).size > 1;
    return { ...r, cells, differs, hasData: cells.some((c) => c.text != null) };
  }).filter((r) => r.hasData);

  return (
    <div className="m-compare">
      <div className="m-thumbs">
        <div className="m-thumbs__row">
          {entries.map((e, i) => (
            <button type="button" key={i} className={`m-thumb ${shown.includes(i) ? 'is-on' : ''} ${e ? '' : 'is-empty'}`} onClick={() => tap(i)} aria-pressed={shown.includes(i)} aria-label={e ? e.group.name : `新增第 ${i + 1} 款`}>
              {e ? <ProductImage group={e.group} sku={e.sku} categoryId={category.id} size={44} /> : <span className="m-thumb__plus"><Icon name="plus" size={18} /></span>}
              <span className="m-thumb__label">{e ? e.group.descriptor || e.group.series : '新增'}</span>
            </button>
          ))}
        </div>
        <p className="m-thumbs__hint">{filled.length > 2 ? '點選 2 款並排比較' : `${category.label} · 已選 ${filled.length} 款`}</p>
      </div>

      <div className="m-heads">
        {pair.map((e, k) => (
          <div className="m-head" key={shown[k]}>
            <b>{e.group.series}</b>
            <span className="muted">{e.group.descriptor}</span>
            <CctPicker group={e.group} sku={e.sku} size="sm" onSelect={(cct) => actions.switchSku(shown[k], { cct })} />
            <span className="m-head__price">{fmtPrice(e.sku.price)}</span>
            <button type="button" className="link" onClick={() => setPicker(shown[k])} data-picker-trigger>更換</button>
          </div>
        ))}
        {pair.length === 1 && (
          <button type="button" className="m-head m-head--add" onClick={() => tap(entries.findIndex((e) => !e))}>
            <Icon name="plus" size={20} /> 再選一款
          </button>
        )}
      </div>

      <div className="m-filter" role="radiogroup" aria-label="顯示">
        <button type="button" role="radio" aria-checked={onlyDiff} className={`chip ${onlyDiff ? 'is-on' : ''}`} onClick={() => setOnlyDiff(true)}>只看差異</button>
        <button type="button" role="radio" aria-checked={!onlyDiff} className={`chip ${!onlyDiff ? 'is-on' : ''}`} onClick={() => setOnlyDiff(false)}>全部</button>
      </div>

      {SECTIONS.map((sec) => {
        const all = pairRows.filter((r) => r.section === sec.id);
        if (!all.length) return null;
        const shownRows = onlyDiff ? all.filter((r) => r.differs || r.noDiff) : all;
        const open = !(collapsed[sec.id] ?? sec.id !== 'light');
        return (
          <section className="m-acc" key={sec.id}>
            <button type="button" className="m-acc__head" aria-expanded={open} onClick={() => setCollapsed({ ...collapsed, [sec.id]: open })}>
              <b>{sec.label}</b>
              <span className="muted">{all.filter((r) => r.differs).length} 項不同</span>
              <Icon name="chevronDown" className={`chev ${open ? 'is-open' : ''}`} />
            </button>
            <div className={`m-acc__body ${open ? '' : 'is-collapsed'}`}>
              {shownRows.map((r) => (
                <div className={`m-row ${r.differs ? 'is-diff' : ''}`} key={r.id}>
                  <div className="m-row__label">{r.label}</div>
                  <div className="m-row__vals">
                    {r.cells.map((c, k) => (
                      <SpecCell key={k} row={r} cell={c} entry={pair[k]} compact onSku={(p) => actions.switchSku(shown[k], p)} />
                    ))}
                  </div>
                </div>
              ))}
              {!shownRows.length && <p className="muted m-row">兩款規格相同</p>}
            </div>
          </section>
        );
      })}

      <Toolbar onCopy={actions.copyList} onShare={actions.share} onPrint={actions.print} />
      <Notes />
      {pickerEl}
    </div>
  );
}
