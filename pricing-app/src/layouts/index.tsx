import { useState } from 'react';
import { Layout, Dropdown, Avatar, theme } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AppSwitchTabs from '@/components/AppSwitchTabs';
import { getStoredUser } from '@/config/apps';

const { Header, Content } = Layout;

export default function AppLayout() {
  const navigate = useNavigate();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: '#13227a', whiteSpace: 'nowrap' }}>汽车拆解_收货议价</span>
          <AppSwitchTabs currentApp="pricing" />
        </div>
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
  );
}
