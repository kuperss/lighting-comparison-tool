// 比較頁共用小元件：色溫選擇、規格格、工具列、只顯示差異開關
import { cctColor, cctName } from '../lib/format.js';
import BeamDiagram from './BeamDiagram.jsx';
import { Icon } from './Icons.jsx';

// 機型內可選色溫；點選切換到該色溫的 SKU
export function CctPicker({ group, sku, onSelect, size = 'md' }) {
  const opts = [];
  const seen = new Set();
  for (const s of group.skus) {
    const k = s.cct.join('/');
    if (!k || seen.has(k)) continue;
    seen.add(k);
    opts.push(s.cct);
  }
  if (!opts.length) return sku.rgb ? <div className="cct-text muted">RGB 彩色</div> : null;
  const cur = sku.cct.join('/');
  return (
    <div className={`cct cct--${size}`}>
      <div className="cct__dots" role="radiogroup" aria-label="色溫">
        {opts.map((c) => {
          const k = c.join('/');
          const multi = c.length > 1;
          const style = multi
            ? { background: `linear-gradient(90deg, ${[...c].sort((a, b) => a - b).map(cctColor).join(',')})` }
            : { background: cctColor(c[0]) };
          return (
            <button
              type="button"
              key={k}
              role="radio"
              aria-checked={k === cur}
              className={`cct__dot ${multi ? 'cct__dot--multi' : ''} ${k === cur ? 'is-on' : ''}`}
              style={style}
              title={multi ? `${[...c].sort((a, b) => a - b).join(' / ')}K 可切換` : `${c[0]}K ${cctName(c[0])}`}
              onClick={() => onSelect?.(k)}
            />
          );
        })}
      </div>
      <div className="cct-text">
        {sku.cct.length > 1
          ? `${[...sku.cct].sort((a, b) => a - b).join(' / ')}K 切換`
          : sku.cct.length
            ? `${sku.cct[0]}K ${cctName(sku.cct[0])}`
            : '—'}
      </div>
    </div>
  );
}

export function FinishPicker({ group, sku, onSelect }) {
  const opts = [...new Set(group.skus.map((s) => s.finish ?? null))];
  if (opts.length < 2) return sku.finish ? <div className="finish muted">{sku.finish}款</div> : null;
  return (
    <div className="finish" role="radiogroup" aria-label="外觀">
      {opts.map((f) => (
        <button
          type="button"
          key={f ?? 'std'}
          role="radio"
          aria-checked={sku.finish === f}
          className={`finish__opt ${sku.finish === f ? 'is-on' : ''}`}
          onClick={() => onSelect?.(f)}
        >
          <span className={`finish__swatch finish__swatch--${f === '黑' ? 'bk' : f === '木紋' ? 'wood' : 'wh'}`} />
          {f ?? '標準'}
        </button>
      ))}
    </div>
  );
}

export function SpecCell({ row, cell, entry, compact, onSku }) {
  if (!cell) return <div className="cell cell--empty" />;
  let body;
  if (row.type === 'beam') body = <BeamDiagram beam={entry.sku.beam} compact={compact} />;
  else if (row.type === 'cct')
    body = cell.text == null ? <span className="muted">—</span> : <CctPicker group={entry.group} sku={entry.sku} size="sm" onSelect={(cct) => onSku?.({ cct })} />;
  else
    body = (
      <span className={row.emphasis ? 'cell__big' : ''}>
        {cell.text ?? <span className="muted">—</span>}
        {cell.corrected && (
          <sup className="corrected" title="此數值已依人工確認修正">†</sup>
        )}
      </span>
    );
  return (
    <div className="cell">
      {body}
      {cell.note && cell.text != null && <div className="cell__note">{cell.note}</div>}
    </div>
  );
}

export function DiffSwitch({ on, onChange, label = '只顯示差異' }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`switch ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      <span className="switch__track"><span className="switch__thumb" /></span>
      {label}
    </button>
  );
}

export function Toolbar({ onCopy, onShare, onPrint, disabled }) {
  return (
    <div className="toolbar">
      <button type="button" className="pill" onClick={onCopy} disabled={disabled}>
        <Icon name="copy" size={16} /> 複製比較清單
      </button>
      <button type="button" className="pill" onClick={onShare} disabled={disabled}>
        <Icon name="share" size={16} /> 分享連結
      </button>
      <button type="button" className="pill" onClick={onPrint} disabled={disabled}>
        <Icon name="print" size={16} /> 列印 / PDF
      </button>
    </div>
  );
}
