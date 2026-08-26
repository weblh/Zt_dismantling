import { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  InboxOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  ShoppingOutlined,
  TagOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AppSwitchTabs from '@/components/AppSwitchTabs';
import { getStoredUser } from '@/config/apps';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/home',
    icon: <DashboardOutlined />,
    label: '首页',
  },
  {
    key: 'inventory',
    icon: <InboxOutlined />,
    label: '库存台账',
    children: [
      { key: '/inventory/ledger', icon: <InboxOutlined />, label: '出入库台账' },
      {
        key: 'inventory-basic',
        icon: <DatabaseOutlined />,
        label: '基础数据',
        children: [
          { key: '/inventory/product-info', icon: <TagOutlined />, label: '产成品产品信息' },
          { key: '/inventory/finished-product', icon: <ShoppingOutlined />, label: '成品产品信息' },
          { key: '/inventory/warehouse-info', icon: <InboxOutlined />, label: '仓库信息' },
        ],
      },
      { key: '/inventory/dashboard', icon: <DashboardOutlined />, label: '经营看板' },
      {
        key: 'inventory-inout',
        icon: <SwapOutlined />,
        label: '出入库管理',
        children: [
          { key: '/inventory/product-inbound', icon: <InboxOutlined />, label: '产成品入库单' },
          { key: '/inventory/product-outbound', icon: <InboxOutlined />, label: '产成品出库单' },
          { key: '/inventory/other-inbound', icon: <InboxOutlined />, label: '其他入库单' },
          { key: '/inventory/other-outbound', icon: <InboxOutlined />, label: '其他出库单' },
        ],
      },
      { key: '/inventory/inout-statistics', icon: <BarChartOutlined />, label: '出入库统计' },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();
  const user = getStoredUser();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220} theme="light">
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#13227a',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 8px',
            textAlign: 'center',
            fontSize: collapsed ? 12 : 14,
          }}
        >
          {collapsed ? '议价' : '汽车拆解_收货议价'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['inventory', 'inventory-basic', 'inventory-inout']}
          items={menuItems}
          onClick={({ key }) => {
            if (key.startsWith('/')) navigate(key);
          }}
        />
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
          <AppSwitchTabs currentApp="pricing" />
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#13227a' }} />
              <span>{user.nickname || user.username || '用户'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, minHeight: 280, background: '#f0f2f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
