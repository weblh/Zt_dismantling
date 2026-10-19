import type { CSSProperties } from 'react';
import { useSite } from '../WebsiteI18n';

export default function SiteProducts() {
  const { copy } = useSite();
  const page = copy.products;

  return (
    <section className="page">
      <p className="kicker">{page.kicker}</p>
      <h1>{page.title}</h1>
      <p className="lead">{page.lead}</p>
      <div className="card-grid">
        {page.items.map((item, index) => (
          <article key={item.title} className="card" data-reveal style={{ '--reveal': index } as CSSProperties}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
