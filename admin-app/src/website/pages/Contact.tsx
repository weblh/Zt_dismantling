import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { CONTACT } from '../content';
import { useSite } from '../WebsiteI18n';

export default function SiteContact() {
  const { lang, copy } = useSite();
  const page = copy.contact;
  const region = lang === 'en' ? CONTACT.regionEn : CONTACT.regionZh;
  const address = lang === 'en' ? CONTACT.addressEn : CONTACT.addressZh;
  const show = (value: string) => value.trim() || copy.pending;

  return (
    <section className="page">
      <p className="kicker">{page.kicker}</p>
      <h1>{page.title}</h1>
      <p className="lead">{page.lead}</p>
      <div className="hero-actions" style={{ marginTop: 20 }}>
        <Link className="btn btn-primary" to="/inquiry">{page.inquiryCta}</Link>
      </div>
      <dl className="contact-list">
        {[
          [page.region, region],
          [page.phone, show(CONTACT.phone)],
          [page.email, show(CONTACT.email)],
          [page.address, show(address)],
        ].map(([label, value], index) => (
          <div key={label} data-reveal style={{ '--reveal': index } as CSSProperties}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
