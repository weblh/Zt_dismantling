import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useMenuAccess } from '@/contexts/MenuAccessContext';

/** 拦截「已登记菜单但当前角色无权限」的直链访问 */
export function MenuGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { loading, canAccessPath } = useMenuAccess();

  if (loading) {
    return (
      <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip="校验权限..." />
      </div>
    );
  }

  if (!canAccessPath(location.pathname)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
