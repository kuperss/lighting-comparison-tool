import { useId } from 'react';
import { fmtMeters, spotDiameter } from '../lib/format.js';

const DISTANCES = [1, 2, 3];

// 光錐圖：以真實比例畫出 3m 內的光束，右側標示依角度換算的光斑直徑。
// 所有欄位用同一比例尺，寬光與聚光的差別一眼可見。
export default function BeamDiagram({ beam, compact = false }) {
  const id = useId().replace(/:/g, '');
  if (beam == null) return <span className="muted">—</span>;

  const W = compact ? 120 : 132;
  const PX = compact ? 18 : 24; // 每公尺像素
  const top = 12;
  const H = top + PX * 3 + 2;
  const cx = W / 2;
  const wide = beam >= 180;
  const half = ((Math.min(beam, 179.9) / 2) * Math.PI) / 180;
  const r = Math.tan(half) * PX * 3;
  const tag = beam <= 25 ? '窄角聚光' : beam <= 45 ? '聚光' : beam <= 90 ? '標準' : beam < 180 ? '寬光' : '廣角泛光';

  return (
    <figure className={`beam ${compact ? 'beam--compact' : ''}`} aria-label={`發光角度 ${beam} 度，${tag}`}>
      <figcaption className="beam__head">
        <b>{beam}°</b>
        <span className="muted">{tag}</span>
      </figcaption>
      <div className="beam__body">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-hidden="true">
          <defs>
            <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--beam)" stopOpacity=".95" />
              <stop offset="1" stopColor="var(--beam)" stopOpacity=".3" />
            </linearGradient>
            <clipPath id={`c${id}`}>
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>
          <g clipPath={`url(#c${id})`}>
            {wide ? (
              <path d={`M${cx} ${top} L${W} ${top} L${W} ${H} L0 ${H} L0 ${top} Z`} fill={`url(#g${id})`} />
            ) : (
              <path d={`M${cx} ${top} L${cx + r} ${top + PX * 3} L${cx - r} ${top + PX * 3} Z`} fill={`url(#g${id})`} />
            )}
          </g>
          {DISTANCES.map((d) => (
            <g key={d}>
              <line x1="0" x2={W} y1={top + PX * d} y2={top + PX * d} className="beam__line" />
              {!compact && <text x="0" y={top + PX * d - 3} className="beam__dist">{d}m</text>}
            </g>
          ))}
          <rect x={cx - 7} y={1} width={14} height={top - 1} rx={2.5} className="beam__lamp" />
        </svg>
        {!compact && (
          <div className="beam__axis beam__axis--r" style={{ paddingTop: top }}>
            {DISTANCES.map((d) => (
              <span key={d} style={{ height: PX }}>{wide ? '' : `Ø${fmtMeters(spotDiameter(beam, d))}`}</span>
            ))}
          </div>
        )}
      </div>
      {compact && !wide && <div className="beam__foot">2m 光斑 Ø{fmtMeters(spotDiameter(beam, 2))}</div>}
      {wide && <div className="beam__foot muted">廣角光型，不適用光斑換算</div>}
    </figure>
  );
}
