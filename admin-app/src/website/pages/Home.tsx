import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../WebsiteI18n';

function delay(index: number): CSSProperties {
  return { '--reveal': index } as CSSProperties;
}

export default function SiteHome() {
  const { copy } = useSite();
  const home = copy.home;
  const preview = copy.process.steps.slice(0, 4);
  const products = copy.products.items.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-copy" data-reveal>
          <p className="kicker">{home.kicker}</p>
          <h1>{home.title}</h1>
          <p className="lead">{home.lead}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/inquiry">{home.ctaInquiry}</Link>
            <Link className="btn btn-ghost" to="/process">{home.ctaProcess}</Link>
          </div>
        </div>
        <div className="hero-panel" data-reveal aria-hidden="true">
          <div className="chassis">
            <span className="chassis-roof" />
            <span className="chassis-body" />
            <span className="chassis-wheel left" />
            <span className="chassis-wheel right" />
          </div>
          <ol>
            {preview.map((step, index) => (
              <li key={step.title}>
                <b>0{index + 1}</b>
                {step.title}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band">
        {home.stats.map((item, index) => (
          <article key={item.label} data-reveal style={delay(index)}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <p className="kicker">{copy.process.kicker}</p>
            <h2>{home.flowTitle}</h2>
            <p>{home.flowLead}</p>
          </div>
          <Link to="/process">{home.flowMore}</Link>
        </div>
        <ol className="step-row">
          {copy.process.steps.map((step, index) => (
            <li key={step.title} data-reveal style={delay(index)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step.title}
            </li>
          ))}
        </ol>
      </section>

      <section className="section section-tint">
        <div className="section-head">
          <div>
            <p className="kicker">{copy.products.kicker}</p>
            <h2>{home.productTitle}</h2>
            <p>{home.productLead}</p>
          </div>
          <Link to="/products">{home.productMore}</Link>
        </div>
        <div className="card-grid">
          {products.map((item, index) => (
            <article key={item.title} className="card" data-reveal style={delay(index)}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
