import { useState } from 'react';
import { groupImage } from '../lib/catalog.js';
import { CategoryIcon } from './Icons.jsx';

// 產品圖：直接由瀏覽器向官網載入；沒有網址或載入失敗時顯示類別示意圖
export default function ProductImage({ group, sku, categoryId, size = 120, className = '' }) {
  const src = groupImage(group, sku);
  const [failed, setFailed] = useState(null);
  const ok = src && failed !== src;
  return (
    <div className={`pimg ${ok ? '' : 'pimg--ph'} ${className}`} style={{ width: size, height: size }}>
      {ok ? (
        <img
          src={src}
          alt={group.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
        />
      ) : (
        <CategoryIcon id={categoryId} size={Math.round(size * 0.5)} />
      )}
    </div>
  );
}
