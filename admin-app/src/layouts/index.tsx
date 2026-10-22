import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, theme, Spin, Drawer, Grid, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AppSwitchTabs from '@/components/AppSwitchTabs';
import TagsView from '@/components/TagsView';
import { getStoredUser } from '@/config/apps';
import { clearAuth } from '@/utils/authStorage';
import { listMyMenus, type MenuNode } from '@/api/menus';
import {
  buildMenuPathTitleMap,
  findMenuOpenKeys,
  findMenuTitleByKey,
  menusToAntdItems,
} from '@/utils/menuTree';
import { MenuGuard } from '@/router/MenuGuard';
import { useMenuAccess } from '@/contexts/MenuAccessContext';
import { VisitedViewsProvider } from '@/contexts/VisitedViewsContext';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuTree, setMenuTree] = useState<MenuNode[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();
  const { refresh: refreshAccess } = useMenuAccess();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const siderMenuItems = useMemo(() => menusToAntdItems(menuTree), [menuTree]);
  const pathTitleMap = useMemo(() => {
    const map = buildMenuPathTitleMap(menuTree);
    map['/home'] = map['/home'] || '华成攒碳大屏';
    map['/workbench'] = map['/workbench'] || '工作台';
    map['/workbench/flow'] = map['/workbench/flow'] || '流程中心';
    return map;
  }, [menuTree]);

  // Keep parent menus expanded for the active route
  useEffect(() => {
    if (!menuTree.length) return;
    const keys = findMenuOpenKeys(menuTree, location.pathname);
    if (keys.length) {
      setOpenKeys((prev) => Array.from(new Set([...prev, ...keys])));
    }
  }, [menuTree, location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    const navMap: Record<string, string> = {
      'recycle-certificate': '/agriculture/recycle-certificate-ledger',
    };
    const target = navMap[key] || key;
    if (target.startsWith('/')) {
      const tabTitle = findMenuTitleByKey(menuTree, key) || pathTitleMap[target];
      navigate(target, tabTitle ? { state: { tabTitle } } : undefined);
    }
    setMobileMenuOpen(false);
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const brandTitle = (
    <div
      style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: collapsed && !isMobile ? 14 : 15,
        fontWeight: 600,
        padding: '0 12px',
        textAlign: 'center',
      }}
    >
      {collapsed && !isMobile ? '收车' : '汽车拆解-收车'}
    </div>
  );

  const sideMenu = menuLoading ? (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <Spin size="small" />
    </div>
  ) : (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      openKeys={collapsed && !isMobile ? [] : openKeys}
      onOpenChange={setOpenKeys}
      items={siderMenuItems}
      onClick={handleMenuClick}
      style={{ borderRight: 'none' }}
    />
  );

  return (
    <Layout className="app-shell" style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={240}
          className="app-sider"
        >
          {brandTitle}
          {sideMenu}
        </Sider>
      )}

      <Drawer
        title="汽车拆解-收车"
        placement="left"
        size={280}
        open={isMobile && mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{
          body: {
            padding: 0,
            background: '#001529',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          },
          header: {
            background: '#001529',
            color: '#fff',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          },
        }}
        className="app-mobile-menu-drawer"
      >
        {sideMenu}
      </Drawer>

      <Layout className="app-main">
        <VisitedViewsProvider titleMap={pathTitleMap}>
          <Header
            className="app-header"
            style={{
              padding: isMobile ? '0 12px' : '0 24px',
              background: themeToken.colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: isMobile ? 8 : 16,
              borderBottom: '1px solid #f0f0f0',
              position: 'sticky',
              top: 0,
              zIndex: 100,
              height: isMobile ? 56 : 64,
              lineHeight: isMobile ? '56px' : '64px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {isMobile && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="打开菜单"
                  style={{ flexShrink: 0, fontSize: 18 }}
                />
              )}
              <AppSwitchTabs currentApp="receipt" compact={isMobile} />
            </div>
            <Dropdown menu={{ items: userMenu }} placement="bottomRight">
              <div
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <Avatar
                  size={isMobile ? 28 : 32}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#13227a' }}
                />
                {!isMobile && <span>{user.nickname || user.username || '用户'}</span>}
              </div>
            </Dropdown>
          </Header>
          <TagsView />
          <Content
            className="app-content"
            style={{ margin: 0, minHeight: 280, background: '#f0f2f5' }}
          >
            <MenuGuard>
              <Outlet />
            </MenuGuard>
          </Content>
        </VisitedViewsProvider>
      </Layout>
    </Layout>
  );
}
