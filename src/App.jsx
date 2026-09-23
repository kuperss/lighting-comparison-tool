import { useCallback, useEffect, useRef, useState } from 'react';
import ComparePage from './components/ComparePage.jsx';
import Home from './components/Home.jsx';
import { Icon } from './components/Icons.jsx';
import ListPage from './components/ListPage.jsx';
import { MAX, catalog, categories, getCategory, lookup, site, switchSku } from './lib/catalog.js';
import { fmtNum, fmtPrice } from './lib/format.js';
import { emptySlots, parseUrl, shareUrl, toSearch } from './lib/url.js';

const STORE = 'light-compare:slots';
const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(STORE));
    return Array.isArray(v) && v.length === MAX ? v.map((m) => (lookup(m) ? m : null)) : null;
  } catch {
    return null;
  }
};
const save = (slots) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(slots));
  } catch {
    /* 無痕模式等情況無法儲存，不影響使用 */
  }
};

const slotCategory = (slots) => lookup(slots.find(Boolean))?.category.id ?? null;

function initialState() {
  const s = parseUrl();
  if (!s.slots.some(Boolean) && s.view !== 'compare') s.slots = load() ?? s.slots;
  return s;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const pushNext = useRef(false);
  const { view, cat, slots } = state;
  const category = getCategory(cat);
  const slotCat = slotCategory(slots);

  // 狀態 → 網址：換頁用 push（上一頁可回來），調整欄位用 replace
  useEffect(() => {
    const search = toSearch(state);
    if (search !== window.location.search) {
      const method = pushNext.current ? 'pushState' : 'replaceState';
      window.history[method](null, '', `${window.location.pathname}${search}`);
    }
    pushNext.current = false;
    save(state.slots);
    const label = getCategory(state.cat)?.label;
    document.title = [state.view === 'list' ? `${label}系列` : label ? `${label}比較` : null, site.siteName, site.brand].filter(Boolean).join('｜');
  }, [state]);

  useEffect(() => {
    const onPop = () => setState((cur) => {
      const s = parseUrl();
      return { ...s, slots: s.view === 'compare' || s.slots.some(Boolean) ? s.slots : cur.slots };
    });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((next) => {
    pushNext.current = true;
    setState((cur) => ({ ...cur, ...next }));
    window.scrollTo({ top: 0 });
  }, []);

  const notify = useCallback((text) => {
    setToast({ text, id: Date.now() });
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const setSlots = (fn) => setState((cur) => ({ ...cur, slots: fn(cur.slots) }));

  const actions = {
    setSlot: (i, model) => setSlots((s) => s.map((m, k) => (k === i ? model : m))),
    switchSku: (i, change) =>
      setSlots((s) => {
        const e = lookup(s[i]);
        if (!e) return s;
        return s.map((m, k) => (k === i ? switchSku(e.group, e.sku, change).model : m));
      }),
    clear: () => setSlots(() => emptySlots()),
    load: (models) => setSlots(() => emptySlots().map((_, i) => models[i] ?? null)),
    toList: () => go({ view: 'list' }),
    toCompare: () => go({ view: 'compare', cat: slotCat }),
    toggleTray: (catId, group) => {
      const has = slots.findIndex((m) => m && group.skus.some((s) => s.model === m));
      if (has >= 0 && slotCat === catId) return actions.setSlot(has, null);
      if (slotCat && slotCat !== catId) {
        setDialog({
          text: `比較匣裡已有 ${slots.filter(Boolean).length} 款${getCategory(slotCat).label}。不同類別無法一起比較，要清空比較匣，改比較${getCategory(catId).label}嗎？`,
          confirm: '清空並加入',
          onConfirm: () => setSlots(() => emptySlots().map((_, i) => (i === 0 ? group.defaultSku : null))),
        });
        return;
      }
      const free = slots.findIndex((m) => !m);
      if (free < 0) return notify(`最多比較 ${MAX} 款`);
      actions.setSlot(free, group.defaultSku);
    },
    copyList: async () => {
      const lines = [`${site.brand ?? ''}${category.label}規格比較`];
      slots.forEach((m) => {
        const e = lookup(m);
        if (!e) return;
        const s = e.sku;
        lines.push(
          `${lines.length}. ${e.group.name}｜${[
            s.model,
            s.cct.length && `${s.cct.join('/')}K`,
            s.power.length && `${s.power.join('/')}W${s.perMeter ? '/m' : ''}`,
            s.lm.length && `${s.lm.map(fmtNum).join('/')}lm`,
            s.beam && `${s.beam}°`,
            s.cutout && `開孔${s.cutout}cm`,
            fmtPrice(s.price),
          ].filter(Boolean).join('｜')}`,
        );
      });
      lines.push(`比較連結：${shareUrl(state)}`);
      notify((await copyText(lines.join('\n'))) ? '已複製比較清單，可直接貼到 LINE 或 Email' : '無法複製，請手動選取');
    },
    share: async () => {
      const url = shareUrl(state);
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        try {
          await navigator.share({ title: document.title, url });
          return;
        } catch {
          /* 使用者取消分享時改為複製 */
        }
      }
      notify((await copyText(url)) ? '已複製分享連結' : '無法複製，請手動複製網址列');
    },
    print: () => window.print(),
  };

  const pickCategory = (id) => go({ view: 'compare', cat: id, slots: slotCat === id ? slots : emptySlots() });
  const listCategory = (id) => go({ view: 'list', cat: id });

  return (
    <>
      <a className="skip" href="#content">跳到主要內容</a>
      <header className="site-head">
        <div className="site-head__inner">
          <button type="button" className="brand" onClick={() => go({ view: 'home', cat: null })}>
            {site.logo ? <img src={site.logo} alt={site.brand} /> : (
              <span className="brand__word">
                <b>{site.brand}</b>
                <small>{site.brandEn}</small>
              </span>
            )}
            <span className="brand__site">{site.siteName}</span>
          </button>
          <nav className="site-nav" aria-label="主選單">
            <button type="button" className={view !== 'list' ? 'is-on' : ''} onClick={() => (cat ? pickCategory(cat) : go({ view: 'home' }))}>規格比較</button>
            <button type="button" className={view === 'list' ? 'is-on' : ''} onClick={() => listCategory(cat ?? slotCat ?? categories[0].id)}>產品列表</button>
          </nav>
        </div>
        {view !== 'home' && category && (
          <nav className="tabs" aria-label="燈具類別">
            <div className="tabs__inner">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={c.id === cat ? 'is-on' : ''}
                  aria-current={c.id === cat ? 'page' : undefined}
                  onClick={() => (view === 'list' ? listCategory(c.id) : pickCategory(c.id))}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <div id="content">
        {view === 'home' || !category ? (
          <Home onPick={pickCategory} onList={listCategory} />
        ) : view === 'list' ? (
          <ListPage category={category} slots={slots} slotCat={slotCat} actions={actions} />
        ) : (
          <ComparePage category={category} slots={slots} actions={actions} />
        )}
      </div>

      <footer className="site-foot">
        <span>
          資料來源：{catalog.source.name} v{catalog.source.version} · 驗證日期 {catalog.source.verifiedDate}
        </span>
        <span>規格與牌價以型錄為準，如有異動以原廠公告為準。</span>
      </footer>

      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.id}>
            <Icon name="check" size={16} /> {toast.text}
          </div>
        )}
      </div>

      {dialog && (
        <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-text">
          <div className="modal__box">
            <p id="dlg-text">{dialog.text}</p>
            <div className="modal__actions">
              <button type="button" className="pill" onClick={() => setDialog(null)} autoFocus>取消</button>
              <button type="button" className="btn-primary" onClick={() => { dialog.onConfirm(); setDialog(null); }}>{dialog.confirm}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
