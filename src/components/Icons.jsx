// 線條圖示。類別圖示同時當作沒有產品圖時的示意圖。
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const CATEGORY = {
  downlight: (
    <>
      <path d="M8 18h32" />
      <path d="M13 18v5a11 11 0 0 0 22 0v-5" />
      <circle cx="24" cy="24" r="5" />
      <path d="M16 37l-3 5M24 38v5M32 37l3 5" opacity=".55" />
    </>
  ),
  can: (
    <>
      <path d="M17 6h14v4H17z" />
      <path d="M16 10h16v20H16z" />
      <path d="M18 30h12" />
      <path d="M18 34l-5 9M30 34l5 9M24 34v9" opacity=".55" />
    </>
  ),
  track: (
    <>
      <path d="M4 8h40" />
      <path d="M14 8v6" />
      <path d="M10 14h8l4 10-10 4-5-9z" />
      <path d="M34 8v6" />
      <path d="M31 14h6v10h-6z" />
      <path d="M14 30l-4 12M34 26v16" opacity=".55" />
    </>
  ),
  panel: (
    <>
      <path d="M6 12h36v14H6z" />
      <path d="M10 16h28v6H10z" opacity=".5" />
      <path d="M12 30l-3 10M24 30v10M36 30l3 10" opacity=".55" />
    </>
  ),
  ceiling: (
    <>
      <path d="M6 12h36" />
      <path d="M8 12c0 7 7 12 16 12s16-5 16-12" />
      <path d="M13 29l-4 11M24 30v10M35 29l4 11" opacity=".55" />
    </>
  ),
  strip: (
    <>
      <path d="M4 30c8-14 14 8 22-6s14-12 18-10" />
      <path d="M4 34c8-14 14 8 22-6s14-12 18-10" opacity=".5" />
      <circle cx="10" cy="26" r="1.2" />
      <circle cx="20" cy="27" r="1.2" />
      <circle cx="30" cy="20" r="1.2" />
      <circle cx="39" cy="16" r="1.2" />
    </>
  ),
};

export function CategoryIcon({ id, size = 48, className }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true" {...base}>
      {CATEGORY[id] ?? CATEGORY.downlight}
    </svg>
  );
}

const UI = {
  chevronDown: <path d="M6 9l6 6 6-6" />,
  chevronRight: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  share: (
    <>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M5 12v7h14v-7" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="12" rx="2" />
      <path d="M5 16V5a1 1 0 0 1 1-1h9" />
    </>
  ),
  print: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="8" rx="2" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name, size = 18, className, strokeWidth = 1.7 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true" {...base} strokeWidth={strokeWidth}>
      {UI[name]}
    </svg>
  );
}
