import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT, getToken } from '@/utils/authStorage';
import { getStoredUser } from '@/config/apps';

export type VisitedView = {
  path: string;
  title: string;
  /** Affixed tabs cannot be closed */
  affix?: boolean;
};

type VisitedViewsContextValue = {
  views: VisitedView[];
  activePath: string;
  addView: (path: string, title?: string) => void;
  removeView: (path: string) => void;
  closeOthers: (path: string) => void;
  closeAll: () => void;
};

const STORAGE_PREFIX = 'zt_visited_views_';
const EXCLUDED = new Set(['/login', '/403', '/']);

const VisitedViewsContext = createContext<VisitedViewsContextValue | null>(null);

function normalizePath(pathname: string) {
  if (!pathname) return '/';
  const p = pathname.split('?')[0].replace(/\/+$/, '');
  return p || '/';
}

function fallbackTitle(path: string) {
  const seg = path.split('/').filter(Boolean).pop();
  return seg || '页面';
}

function resolveTitle(path: string, titleMap: Record<string, string>, explicit?: string) {
  if (explicit?.trim()) return explicit.trim();
  return titleMap[path] || fallbackTitle(path);
}

function storageKey() {
  const user = getStoredUser();
  return `${STORAGE_PREFIX}${user.id || user.username || 'guest'}`;
}

function loadStoredViews(): VisitedView[] {
  try {
    const raw = sessionStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VisitedView[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v) => v && typeof v.path === 'string' && v.path.startsWith('/'));
  } catch {
    return [];
  }
}

function persistViews(views: VisitedView[]) {
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(views));
  } catch {
    /* ignore quota */
  }
}

function clearStoredViews() {
  try {
    sessionStorage.removeItem(storageKey());
  } catch {
    /* ignore */
  }
}

const HOME_VIEW: VisitedView = { path: '/home', title: '华成攒碳大屏', affix: true };

function ensureHome(views: VisitedView[]): VisitedView[] {
  if (views.some((v) => v.path === HOME_VIEW.path)) {
    return views.map((v) => (v.path === HOME_VIEW.path ? { ...v, affix: true, title: v.title || HOME_VIEW.title } : v));
  }
  return [HOME_VIEW, ...views];
}

type ProviderProps = {
  children: ReactNode;
  titleMap: Record<string, string>;
};

export function VisitedViewsProvider({ children, titleMap }: ProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const titleMapRef = useRef(titleMap);
  titleMapRef.current = titleMap;

  const [views, setViews] = useState<VisitedView[]>(() => ensureHome(loadStoredViews()));
  const viewsRef = useRef(views);
  viewsRef.current = views;
  const activePath = normalizePath(location.pathname);

  // Persist
  useEffect(() => {
    persistViews(views);
  }, [views]);

  // Refresh titles when menu titles load / change
  useEffect(() => {
    setViews((prev) => {
      let changed = false;
      const next = prev.map((v) => {
        const title = resolveTitle(v.path, titleMap, v.path === '/home' ? '华成攒碳大屏' : undefined);
        if (title !== v.title) {
          changed = true;
          return { ...v, title };
        }
        return v;
      });
      return changed ? next : prev;
    });
  }, [titleMap]);

  // Clear on logout
  useEffect(() => {
    const onAuth = () => {
      if (!getToken()) {
        clearStoredViews();
        setViews([HOME_VIEW]);
      }
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, []);

  const addView = useCallback((rawPath: string, title?: string) => {
    const path = normalizePath(rawPath);
    if (!path.startsWith('/') || EXCLUDED.has(path)) return;

    setViews((prev) => {
      const existing = prev.find((v) => v.path === path);
      const resolved = resolveTitle(path, titleMapRef.current, title || (path === '/home' ? '华成攒碳大屏' : undefined));
      if (existing) {
        if (existing.title === resolved) return prev;
        return prev.map((v) => (v.path === path ? { ...v, title: resolved } : v));
      }
      const next = ensureHome([...prev, { path, title: resolved, affix: path === '/home' }]);
      return next;
    });
  }, []);

  // Sync current route into tabs (prefer title from navigate state when provided)
  useEffect(() => {
    const stateTitle =
      location.state && typeof location.state === 'object' && 'tabTitle' in location.state
        ? String((location.state as { tabTitle?: string }).tabTitle || '')
        : undefined;
    addView(activePath, stateTitle || undefined);
  }, [activePath, location.state, addView]);

  const removeView = useCallback(
    (rawPath: string) => {
      const path = normalizePath(rawPath);
      const prev = viewsRef.current;
      const target = prev.find((v) => v.path === path);
      if (!target || target.affix) return;

      const idx = prev.findIndex((v) => v.path === path);
      const next = ensureHome(prev.filter((v) => v.path !== path));
      setViews(next);

      if (normalizePath(location.pathname) === path) {
        const neighbor = next[Math.min(idx, next.length - 1)] || next[next.length - 1] || HOME_VIEW;
        navigate(neighbor.path);
      }
    },
    [location.pathname, navigate],
  );

  const closeOthers = useCallback(
    (rawPath: string) => {
      const path = normalizePath(rawPath);
      const kept = ensureHome(viewsRef.current.filter((v) => v.affix || v.path === path));
      setViews(kept);
      if (normalizePath(location.pathname) !== path) {
        navigate(path);
      }
    },
    [location.pathname, navigate],
  );

  const closeAll = useCallback(() => {
    setViews([HOME_VIEW]);
    if (normalizePath(location.pathname) !== HOME_VIEW.path) {
      navigate(HOME_VIEW.path);
    }
  }, [location.pathname, navigate]);

  const value = useMemo(
    () => ({ views, activePath, addView, removeView, closeOthers, closeAll }),
    [views, activePath, addView, removeView, closeOthers, closeAll],
  );

  return <VisitedViewsContext.Provider value={value}>{children}</VisitedViewsContext.Provider>;
}

export function useVisitedViews() {
  const ctx = useContext(VisitedViewsContext);
  if (!ctx) {
    throw new Error('useVisitedViews must be used within VisitedViewsProvider');
  }
  return ctx;
}
