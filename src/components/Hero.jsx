// 頁頭標題區：暖灰漸層底、橘色英文小標、中文大標（參考舞光官網產品專區）
export default function Hero({ eyebrow, title, sub, compact = false, children }) {
  return (
    <section className={`hero ${compact ? 'hero--compact' : ''}`}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        {eyebrow && <p className="hero__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {sub && <p className="hero__sub">{sub}</p>}
        {children}
      </div>
    </section>
  );
}
