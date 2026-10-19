import type { CSSProperties } from 'react';
import { useSite } from '../WebsiteI18n';

export default function SiteProcess() {
  const { copy } = useSite();
  const page = copy.process;

  return (
    <section className="page">
      <p className="kicker">{page.kicker}</p>
      <h1>{page.title}</h1>
      <p className="lead">{page.lead}</p>
      <ol className="timeline">
        {page.steps.map((step, index) => (
          <li key={step.title} data-reveal style={{ '--reveal': index } as CSSProperties}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
