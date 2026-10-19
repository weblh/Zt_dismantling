import { useState, type CSSProperties, type FormEvent } from 'react';
import { apiUrl } from '@/config/api';
import { useSite } from '../WebsiteI18n';

type FormState = {
  contactName: string;
  phone: string;
  email: string;
  company: string;
  category: string;
  content: string;
};

const EMPTY: FormState = {
  contactName: '',
  phone: '',
  email: '',
  company: '',
  category: 'VEHICLE',
  content: '',
};

export default function SiteInquiry() {
  const { copy } = useSite();
  const page = copy.inquiry;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/website/inquiry'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const res = (await response.json()) as { code: number; message?: string };
      if (res.code !== 0) {
        setError(res.message || page.error);
        return;
      }
      setDone(true);
      setForm(EMPTY);
    } catch {
      setError(page.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page inquiry-page">
      <p className="kicker">{page.kicker}</p>
      <h1>{page.title}</h1>
      <p className="lead">{page.lead}</p>

      {done ? (
        <div className="inquiry-success" data-reveal>
          <strong>{page.successTitle}</strong>
          <p>{page.successBody}</p>
          <button type="button" className="btn btn-primary" onClick={() => setDone(false)}>
            {page.again}
          </button>
        </div>
      ) : (
        <form className="inquiry-form" onSubmit={onSubmit} data-reveal>
          <label>
            <span>{page.name} *</span>
            <input
              value={form.contactName}
              onChange={(e) => setField('contactName', e.target.value)}
              maxLength={64}
              required
              autoComplete="name"
            />
          </label>
          <label>
            <span>{page.phone} *</span>
            <input
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              maxLength={32}
              required
              autoComplete="tel"
              inputMode="tel"
            />
          </label>
          <label>
            <span>{page.email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              maxLength={128}
              autoComplete="email"
            />
          </label>
          <label>
            <span>{page.company}</span>
            <input
              value={form.company}
              onChange={(e) => setField('company', e.target.value)}
              maxLength={128}
              autoComplete="organization"
            />
          </label>
          <label className="inquiry-span-2">
            <span>{page.category} *</span>
            <select
              value={form.category}
              onChange={(e) => setField('category', e.target.value)}
              required
            >
              {page.categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inquiry-span-2">
            <span>{page.content} *</span>
            <textarea
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
              maxLength={2000}
              rows={5}
              required
              placeholder={page.contentHint}
            />
          </label>
          {error ? <p className="inquiry-error inquiry-span-2">{error}</p> : null}
          <div className="inquiry-actions inquiry-span-2" style={{ '--reveal': 1 } as CSSProperties}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? page.submitting : page.submit}
            </button>
            <p>{page.note}</p>
          </div>
        </form>
      )}
    </section>
  );
}
