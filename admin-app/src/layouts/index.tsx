import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, theme, Spin } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AppSwitchTabs from '@/components/AppSwitchTabs';
import { getStoredUser, openAppInNewWindow, APP_ENTRIES } from '@/config/apps';
import { clearAuth } from '@/utils/authStorage';
import { listMyMenus, type MenuNode } from '@/api/menus';
import { menusToAntdItems } from '@/utils/menuTree';
import { MenuGuard } from '@/router/MenuGuard';
import { useMenuAccess } from '@/contexts/MenuAccessContext';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();
  const { refresh: refreshAccess } = useMenuAccess();

  const user = getStoredUser();

  useEffect(() => {
    let cancelled = false;
    setMenuLoading(true);
    listMyMenus()
      .then((res) => {
        if (!cancelled) setMenuTree(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setMenuTree([]);
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    refreshAccess();
    return () => {
      cancelled = true;
    };
  }, [user.role, user.id, refreshAccess]);

  const siderMenuItems = useMemo(() => menusToAntdItems(menuTree), [menuTree]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark" width={240}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 14 : 15,
            fontWeight: 600,
            padding: '0 12px',
            textAlign: 'center',
          }}
        >
          {collapsed ? '收车' : '汽车拆解-收车'}
        </div>
        {menuLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : (
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={[]}
            items={siderMenuItems}
            onClick={({ key }) => {
              if (key === 'open-pricing-inventory') {
                const pricing = APP_ENTRIES.find((a) => a.code === 'pricing');
                openAppInNewWindow(`${pricing?.url || '/zt_dismantling/pricing'}/inventory/ledger`);
                return;
              }
              const navMap: Record<string, string> = {
                'recycle-certificate': '/agriculture/recycle-certificate-ledger',
              };
              const target = navMap[key] || key;
              if (target.startsWith('/')) {
                navigate(target);
              }
            }}
            style={{ borderRight: 'none' }}
          />
        )}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: themeToken.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <AppSwitchTabs currentApp="receipt" />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#13227a' }} />
              <span>{user.nickname || user.username || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, minHeight: 280, background: '#f0f2f5' }}>
          <MenuGuard>
            <Outlet />
          </MenuGuard>
        </Content>
      </Layout>
    </Layout>
  );
}
