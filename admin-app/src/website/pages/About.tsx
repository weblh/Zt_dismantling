import type { CSSProperties } from 'react';
import { useSite } from '../WebsiteI18n';

export default function SiteAbout() {
  const { copy } = useSite();
  const page = copy.about;

  return (
    <section className="page">
      <p className="kicker">{page.kicker}</p>
      <h1>{page.title}</h1>
      {page.paragraphs.map((text) => (
        <p key={text} className="lead">{text}</p>
      ))}
      <div className="card-grid">
        {page.points.map((item, index) => (
          <article key={item.title} className="card" data-reveal style={{ '--reveal': index } as CSSProperties}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
