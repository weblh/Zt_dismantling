import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMenuAccessPaths } from '@/api/menus';
import { getStoredUser } from '@/config/apps';
import { AUTH_CHANGED_EVENT, getToken } from '@/utils/authStorage';
import { hydrateAllDictsFromServer } from '@/utils/dictHydrate';

type MenuAccessContextValue = {
  loading: boolean;
  allowedPaths: string[];
  protectedPaths: string[];
  canAccessPath: (pathname: string) => boolean;
  refresh: () => Promise<void>;
};

const MenuAccessContext = createContext<MenuAccessContextValue>({
  loading: false,
  allowedPaths: [],
  protectedPaths: [],
  canAccessPath: () => true,
  refresh: async () => undefined,
});

function normalizePath(pathname: string) {
  if (!pathname) return '/';
  const p = pathname.split('?')[0].replace(/\/+$/, '');
  return p || '/';
}

function pathAllowed(pathname: string, allowed: string[], protectedPaths: string[], isSuperAdmin: boolean) {
  if (isSuperAdmin) return true;
  const path = normalizePath(pathname);
  if (path === '/403' || path === '/login') return true;
  const isProtected = protectedPaths.some((p) => {
    const base = normalizePath(p);
    return path === base || path.startsWith(`${base}/`);
  });
  if (!isProtected) {
    return true;
  }
  return allowed.some((p) => {
    const base = normalizePath(p);
    return path === base || path.startsWith(`${base}/`);
  });
}

export function MenuAccessProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!!getToken());
  const [allowedPaths, setAllowedPaths] = useState<string[]>([]);
  const [protectedPaths, setProtectedPaths] = useState<string[]>([]);
  const [role, setRole] = useState<string | undefined>(getStoredUser().role);

  const refresh = useCallback(async () => {
    const token = getToken();
    const user = getStoredUser();
    setRole(user.role);
    if (!token) {
      setAllowedPaths([]);
      setProtectedPaths([]);
      setLoading(false);
      return;
    }
    // 登录后预热简道云字典到本地下拉
    hydrateAllDictsFromServer().catch(() => {});
    if (user.role === 'SUPER_ADMIN') {
      setAllowedPaths([]);
      setProtectedPaths([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getMenuAccessPaths();
      setAllowedPaths(res.data?.allowedPaths || []);
      setProtectedPaths(res.data?.protectedPaths || []);
    } catch {
      setAllowedPaths([]);
      setProtectedPaths([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onAuth = () => {
      refresh();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    window.addEventListener('storage', onAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuth);
      window.removeEventListener('storage', onAuth);
    };
  }, [refresh]);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const canAccessPath = useCallback(
    (pathname: string) => pathAllowed(pathname, allowedPaths, protectedPaths, !!isSuperAdmin),
    [allowedPaths, protectedPaths, isSuperAdmin],
  );

  const value = useMemo(
    () => ({ loading, allowedPaths, protectedPaths, canAccessPath, refresh }),
    [loading, allowedPaths, protectedPaths, canAccessPath, refresh],
  );

  return <MenuAccessContext.Provider value={value}>{children}</MenuAccessContext.Provider>;
}

export function useMenuAccess() {
  return useContext(MenuAccessContext);
}
