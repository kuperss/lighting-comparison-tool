export const fmtNum = (n) => (n == null ? '' : Number(n).toLocaleString('zh-TW'));
export const fmtPrice = (n) => (n == null ? '未列價' : `NT$ ${fmtNum(n)}`);

export function cctName(k) {
  if (k <= 3000) return '暖白';
  if (k <= 4500) return '自然白';
  return '晝白';
}

// 色溫 → 示意色（暖 → 冷）
export function cctColor(k) {
  const stops = [
    [2700, [242, 178, 84]],
    [3000, [246, 196, 112]],
    [4000, [252, 236, 204]],
    [5000, [246, 246, 240]],
    [6500, [220, 234, 252]],
  ];
  if (k <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    const [k1, c1] = stops[i];
    const [k0, c0] = stops[i - 1];
    if (k <= k1) {
      const t = (k - k0) / (k1 - k0);
      return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * t))})`;
    }
  }
  return `rgb(${stops.at(-1)[1]})`;
}

// 光斑直徑（公尺）= 2 × 距離 × tan(角度/2)；180° 以上不適用
export function spotDiameter(beam, distance) {
  if (beam == null || beam >= 180) return null;
  return 2 * distance * Math.tan(((beam / 2) * Math.PI) / 180);
}

export function fmtMeters(d) {
  if (d == null) return '—';
  return d < 1 ? `${d.toFixed(2)}m` : `${d.toFixed(1)}m`;
}
