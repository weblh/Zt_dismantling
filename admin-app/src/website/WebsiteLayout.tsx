import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { WebsiteI18n, useSite } from './WebsiteI18n';
import './website.css';

const LINKS = [
  { to: '/', key: 'home', end: true },
  { to: '/process', key: 'process', end: false },
  { to: '/products', key: 'products', end: false },
  { to: '/compliance', key: 'compliance', end: false },
  { to: '/about', key: 'about', end: false },
  { to: '/inquiry', key: 'inquiry', end: false },
  { to: '/contact', key: 'contact', end: false },
] as const;

function Shell() {
  const { copy, toggleLang } = useSite();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const nav = copy.nav;

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const root = document.querySelector('.site');
    if (!root || reduce) return;
    const nodes = root.querySelectorAll('[data-reveal]');
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-in');
      });
    }, { threshold: 0.16 });
    nodes.forEach((node) => seen.observe(node));
    return () => seen.disconnect();
  }, [location.pathname, copy.brand]);

  return (
    <div className="site motion">
      <header className="site-header">
        <Link className="site-brand" to="/" onClick={() => setOpen(false)}>
          <span className="site-mark" aria-hidden="true" />
          <span>
            <strong>{copy.brand}</strong>
            <em>{copy.brandEn}</em>
          </span>
        </Link>
        <button
          type="button"
          className="site-menu-btn"
          aria-expanded={open}
          aria-label={open ? copy.menuClose : copy.menuOpen}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav className={open ? 'site-nav open' : 'site-nav'}>
          {LINKS.filter((item) => item.key !== 'inquiry').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
            >
              {nav[item.key]}
            </NavLink>
          ))}
          <Link className="site-inquiry-cta" to="/inquiry" onClick={() => setOpen(false)}>
            {nav.inquiry}
          </Link>
          <button type="button" className="site-lang" onClick={toggleLang}>
            {copy.langLabel}
          </button>
        </nav>
      </header>
      <main key={location.pathname} className="page-stage">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <strong>{copy.brand}</strong>
          <p>{copy.footer.blurb}</p>
        </div>
        <div>
          <span>{copy.footer.visit}</span>
          {LINKS.map((item) => (
            <Link key={item.to} to={item.to}>
              {nav[item.key]}
            </Link>
          ))}
        </div>
        <div className="site-footer-meta">
          <span>© {new Date().getFullYear()} {copy.footer.rights}</span>
          <Link to="/login">{copy.footer.staff}</Link>
        </div>
      </footer>
    </div>
  );
}

export default function WebsiteLayout() {
  return (
    <WebsiteI18n>
      <Shell />
    </WebsiteI18n>
  );
}
