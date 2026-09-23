import { MAX, categories } from '../lib/catalog.js';
import Hero from './Hero.jsx';
import { CategoryIcon } from './Icons.jsx';

// 首頁（2i）：先選類別
export default function Home({ onPick, onList }) {
  return (
    <>
    <Hero eyebrow="Product comparison" title="要比較哪一類燈具？" sub={`同類別最多比較 ${MAX} 款，瓦數、光通量、色溫、發光角度一次看清楚`} />
    <main className="page home">
      <div className="home__grid">
        {categories.map((c) => (
          <div className="home__card" key={c.id}>
            <button type="button" className="home__main" onClick={() => onPick(c.id)}>
              <CategoryIcon id={c.icon} size={56} />
              <b>{c.label}</b>
              <span className="muted">{c.groups.length} 款機型</span>
            </button>
            <button type="button" className="home__list link" onClick={() => onList(c.id)}>
              瀏覽列表
            </button>
          </div>
        ))}
      </div>
    </main>
    </>
  );
}
