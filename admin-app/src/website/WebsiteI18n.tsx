import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { COPY, type Lang, type SiteCopy } from './content';

const STORAGE_KEY = 'zt-site-lang';

type SiteContextValue = {
  lang: Lang;
  copy: SiteCopy;
  toggleLang: () => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);

function readLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'zh';
  } catch {
    return 'zh';
  }
}

export function WebsiteI18n({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(readLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore private mode */
    }
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = COPY[lang].brand;
  }, [lang]);

  const value = useMemo<SiteContextValue>(
    () => ({
      lang,
      copy: COPY[lang],
      toggleLang: () => setLang((current) => (current === 'zh' ? 'en' : 'zh')),
    }),
    [lang],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error('useSite must be used within WebsiteI18n');
  return value;
}
