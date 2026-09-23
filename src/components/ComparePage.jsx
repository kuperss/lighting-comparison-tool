import { useEffect, useMemo, useRef, useState } from 'react';
import { MAX, lookup } from '../lib/catalog.js';
import { fmtPrice } from '../lib/format.js';
import { SECTIONS, buildRows } from '../lib/specs.js';
import { CctPicker, DiffSwitch, FinishPicker, SpecCell, Toolbar } from './CompareParts.jsx';
import { CategoryIcon, Icon } from './Icons.jsx';
import Hero from './Hero.jsx';
import MobileCompare from './MobileCompare.jsx';
import Picker from './Picker.jsx';
import ProductImage from './ProductImage.jsx';

function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

export default function ComparePage({ category, slots, actions }) {
  const mobile = useMedia('(max-width: 760px)');
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [collapsed, setCollapsed] = useState({});
  const [picker, setPicker] = useState(null);

  const entries = useMemo(() => slots.map((m) => lookup(m)), [slots]);
  const filledCount = entries.filter(Boolean).length;
  const rows = useMemo(() => buildRows(entries), [entries]);

  const pickerEl = picker != null && (
    <Picker
      category={category}
      slots={slots}
      slotIndex={picker}
      onPick={(g) => {
        actions.setSlot(picker, g.defaultSku);
        setPicker(null);
      }}
      onRemove={() => {
        actions.setSlot(picker, null);
        setPicker(null);
      }}
      onClose={() => setPicker(null)}
    />
  );

  const common = { category, slots, entries, rows, onlyDiff, setOnlyDiff, collapsed, setCollapsed, picker, setPicker, pickerEl, actions };

  return (
    <>
    <Hero
      compact={filledCount > 0}
      eyebrow="Compare"
      title={filledCount ? `比較${category.label}機型` : `比較${category.label}`}
      sub={filledCount ? null : `同類別最多選 ${MAX} 款，規格差異一目了然`}
    />
    <main className="page compare">
      <PrintHeader category={category} entries={entries} />
      {filledCount === 0 ? (
        <EmptyCompare {...common} />
      ) : mobile ? (
        <MobileCompare {...common} />
      ) : (
        <DesktopCompare {...common} filledCount={filledCount} />
      )}
    </main>
    </>
  );
}

function PrintHeader({ category, entries }) {
  return (
    <div className="print-only print-head">
      <b>{category.label}規格比較</b>
      <span>
        {entries.filter(Boolean).map((e) => e.sku.model).join('、')} · 列印日期 {new Date().toLocaleDateString('zh-TW')}
      </span>
      <span>{window.location.href}</span>
    </div>
  );
}

function sectionRows(rows, id, onlyDiff) {
  const all = rows.filter((r) => r.section === id);
  const shown = onlyDiff ? all.filter((r) => r.differs || r.noDiff) : all;
  return { all, shown, diffCount: all.filter((r) => r.differs).length };
}

function DesktopCompare({ category, slots, entries, rows, onlyDiff, setOnlyDiff, collapsed, setCollapsed, picker, setPicker, pickerEl, actions, filledCount }) {
  const headRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="compare__title">
        <span className="muted">{filledCount > 1 ? '有差異的規格會以橘色標示' : `再選 1 款即可比較，最多 ${MAX} 款`}</span>
        <div className="compare__tools">
          <DiffSwitch on={onlyDiff} onChange={setOnlyDiff} />
          <Toolbar onCopy={actions.copyList} onShare={actions.share} onPrint={actions.print} disabled={filledCount === 0} />
        </div>
      </div>

      <div className="grid grid--head" ref={headRef}>
        <div className="grid__label">
          <span className="muted">已選 {filledCount} / {MAX}</span>
          <button type="button" className="link" onClick={actions.clear}>全部清除</button>
        </div>
        {entries.map((e, i) => (
          <ColumnHead key={i} index={i} entry={e} category={category} open={picker === i} onToggle={() => setPicker(picker === i ? null : i)} pickerEl={picker === i ? pickerEl : null} actions={actions} />
        ))}
      </div>

      <div className={`sticky-bar ${stuck ? 'is-on' : ''}`} aria-hidden={!stuck}>
        <div className="grid grid--sticky">
          <div className="grid__label muted">比較中</div>
          {entries.map((e, i) =>
            e ? (
              <div className="mini" key={i}>
                <ProductImage group={e.group} sku={e.sku} categoryId={category.id} size={32} />
                <div>
                  <b>{e.group.series}</b>
                  <span>{[e.group.descriptor, e.sku.cct.length ? `${e.sku.cct.join('/')}K` : null].filter(Boolean).join(' · ')}</span>
                </div>
              </div>
            ) : (
              <button type="button" className="mini mini--empty" key={i} onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setPicker(i); }} tabIndex={stuck ? 0 : -1}>
                <Icon name="plus" size={14} /> 新增
              </button>
            ),
          )}
        </div>
      </div>

      {SECTIONS.map((sec) => {
        const { all, shown, diffCount } = sectionRows(rows, sec.id, onlyDiff);
        if (!all.length) return null;
        const isCollapsed = collapsed[sec.id] ?? false;
        const summary = onlyDiff && diffCount === 0 ? '相同，已隱藏' : filledCount > 1 ? `${all.length} 項中 ${diffCount} 項不同` : `${all.length} 項`;
        return (
          <section className="spec-section" key={sec.id}>
            <button type="button" className="spec-section__head" aria-expanded={!isCollapsed} onClick={() => setCollapsed({ ...collapsed, [sec.id]: !isCollapsed })}>
              <h2>{sec.label}</h2>
              <span className="muted">{summary}</span>
              <Icon name="chevronDown" className={`chev ${isCollapsed ? '' : 'is-open'}`} />
            </button>
            <div className={`spec-section__body ${isCollapsed ? 'is-collapsed' : ''}`}>
              {shown.map((row) => (
                <div className={`grid grid--row ${row.differs ? 'is-diff' : ''} ${row.type === 'beam' ? 'grid--beam' : ''}`} key={row.id}>
                  <div className="grid__label">
                    {row.label}
                    {row.type === 'beam' && <span className="grid__hint">光斑直徑依角度換算</span>}
                  </div>
                  {row.cells.map((c, i) => (
                    <SpecCell key={i} row={row} cell={c} entry={entries[i]} onSku={(p) => actions.switchSku(i, p)} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <Notes />
    </>
  );
}

function ColumnHead({ index, entry, category, open, onToggle, pickerEl, actions }) {
  if (!entry) {
    return (
      <div className="col col--empty">
        <button type="button" className="col__select col__select--empty" onClick={onToggle} data-picker-trigger aria-expanded={open}>
          <span>選擇機型</span>
          <Icon name="chevronDown" size={16} />
        </button>
        {pickerEl}
        <button type="button" className="col__add" onClick={onToggle} data-picker-trigger aria-label={`新增第 ${index + 1} 款`}>
          <Icon name="plus" size={28} strokeWidth={1.3} />
        </button>
        <span className="muted col__hint">第 {index + 1} 款（選填）</span>
      </div>
    );
  }
  const { group, sku } = entry;
  return (
    <div className="col">
      <button type="button" className="col__select" onClick={onToggle} data-picker-trigger aria-expanded={open} aria-label={`更換第 ${index + 1} 款：${group.name}`}>
        <span>{group.series}</span>
        <Icon name="chevronDown" size={16} />
      </button>
      {pickerEl}
      <ProductImage group={group} sku={sku} categoryId={category.id} size={120} />
      <div className="col__name">
        <b>{group.series}</b>
        {group.descriptor && <span>{group.descriptor}</span>}
      </div>
      <CctPicker group={group} sku={sku} onSelect={(cct) => actions.switchSku(index, { cct })} />
      <FinishPicker group={group} sku={sku} onSelect={(finish) => actions.switchSku(index, { finish })} />
      <div className="col__price">{fmtPrice(sku.price)}</div>
      <div className="col__model">
        {sku.model}
        {sku.catalogPage ? ` · 型錄 P.${sku.catalogPage}` : ''}
      </div>
      {sku.url && (
        <a className="col__link" href={sku.url} target="_blank" rel="noopener noreferrer">
          官網產品頁 ›
        </a>
      )}
    </div>
  );
}

function EmptyCompare({ category, slots, picker, setPicker, pickerEl, actions }) {
  return (
    <div className="empty">
      <div className="empty__slots">
        {slots.map((_, i) => (
          <div className="empty__slot-wrap" key={i}>
            <button type="button" className={`empty__slot ${i === 0 ? 'is-first' : ''}`} onClick={() => setPicker(picker === i ? null : i)} data-picker-trigger>
              <Icon name="plus" size={26} strokeWidth={1.3} />
              {i === 0 && <span>新增機型</span>}
            </button>
            {picker === i && pickerEl}
          </div>
        ))}
      </div>
      {category.popular?.length > 0 && (
        <div className="popular">
          <h2>熱門比較</h2>
          <ul>
            {category.popular.map((p) => (
              <li key={p.title}>
                <button type="button" onClick={() => actions.load(p.models)}>
                  <span>{p.title}</span>
                  <span className="popular__go">帶入 <Icon name="chevronRight" size={14} /></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button type="button" className="link empty__list" onClick={actions.toList}>
        <CategoryIcon id={category.id} size={20} /> 從{category.label}產品列表挑選 →
      </button>
    </div>
  );
}

export function Notes() {
  return (
    <ul className="notes">
      <li>規格以舞光官網為準，官網未列者採用型錄資料；「—」表示兩者皆未提供。</li>
      <li>光斑直徑 = 2 × 距離 × tan(發光角度 ÷ 2)，為幾何換算值，實際照明效果依現場而定。</li>
      <li>「調光 / 控制」依品名標示整理；† 表示該數值已依人工確認修正。</li>
    </ul>
  );
}
