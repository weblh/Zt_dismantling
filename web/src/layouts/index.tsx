import { useState } from 'react';
import { Layout, Menu, Input, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  MailOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  TruckOutlined,
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  PayCircleOutlined,
  TagOutlined,
  ShoppingFilled,
  HomeOutlined,
  WarningOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  WalletOutlined,
  ArrowLeftOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import MyApps from '@/pages/my-apps';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: 'todo',
    icon: <ClockCircleOutlined />,
    label: '我的待办',
  },
  {
    key: 'initiated',
    icon: <SendOutlined />,
    label: '我发起的',
  },
  {
    key: 'processed',
    icon: <CheckCircleOutlined />,
    label: '我处理的',
  },
  {
    key: 'copied',
    icon: <MailOutlined />,
    label: '抄送我的',
  },
  {
    type: 'divider',
  },
  {
    key: 'search',
    label: (
      <Input
        placeholder="输入名称来搜索"
        prefix={<SearchOutlined />}
        style={{ width: '100%' }}
        allowClear
      />
    ),
  },
  {
    type: 'divider',
  },
  {
    key: 'business',
    icon: <FolderOpenOutlined />,
    label: '业务',
    children: [
      { key: '/business/receipt', icon: <ShoppingFilled />, label: '1.业务收货' },
      { key: '/business/vehicle-photo', icon: <PictureOutlined />, label: '异地车固照片' },
      { key: '/business/settlement', icon: <FileTextOutlined />, label: '业务结账' },
      { key: '/business/payment-application', icon: <PayCircleOutlined />, label: '业务结账付款申请' },
      { key: '/business/price-change', icon: <TagOutlined />, label: '修改价格' },
      { key: '/business/vehicle-receipt-statistics', icon: <BarChartOutlined />, label: '业务收车统计表' },
    ],
  },
  {
    key: '/inspection-location',
    icon: <EnvironmentOutlined />,
    label: '巡检地点',
  },
  {
    key: 'production',
    icon: <DatabaseOutlined />,
    label: '生产',
    children: [
      { key: '/kingdee/voucher', icon: <DatabaseOutlined />, label: '1.过磅同步数据' },
      { key: '/production/weighing-inspection', icon: <UserOutlined />, label: '2.过磅查验' },
      { key: '/production/inspection-photo', icon: <HomeOutlined />, label: '3.查验照片' },
      { key: '/production/scrapped-vehicle', icon: <WarningOutlined />, label: '4.报废车入库' },
      { key: '/production/pick-top-photo', icon: <PictureOutlined />, label: '5.挑顶照片' },
      { key: '/production/disassembly', icon: <SettingOutlined />, label: '6.拆解' },
      { key: '/production/comprehensive-disassembly', icon: <AppstoreOutlined />, label: '7.综合拆解' },
    ],
  },
  {
    key: 'sales',
    icon: <ShoppingOutlined />,
    label: '销售',
    children: [
      { key: '/sales/finished-product-approval', icon: <InboxOutlined />, label: '成品销售审批单' },
      { key: '/sales/finished-product-ledger', icon: <InboxOutlined />, label: '成品销售台账' },
      { key: '/sales/part-approval', icon: <InboxOutlined />, label: '配件销售审批单' },
      { key: '/sales/part-ledger', icon: <InboxOutlined />, label: '配件销售台账' },
      { key: '/sales/modify-shipping-price', icon: <TagOutlined />, label: '修改出货价格' },
      { key: '/sales/finished-product-statistics', icon: <BarChartOutlined />, label: '成品销售统计' },
      { key: '/sales/part-statistics', icon: <BarChartOutlined />, label: '配件销售统计' },
    ],
  },
  {
    key: 'finance',
    icon: <WalletOutlined />,
    label: '财务',
    children: [
      { key: '/finance/inventory-ledger', icon: <InboxOutlined />, label: '出入库台账' },
    ],
  },
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '展示看板',
    children: [
      { key: '/home', icon: <DashboardOutlined />, label: '业务看板' },
    ],
  },
  {
    key: 'agriculture',
    icon: <TruckOutlined />,
    label: '农机业务',
    children: [
      { key: '/agriculture/machinery-inbound', icon: <InboxOutlined />, label: '原材料-农机入库' },
      { key: '/agriculture/machinery-outbound', icon: <InboxOutlined />, label: '原材料-农机出库' },
      { key: '/agriculture/machinery-stock', icon: <InboxOutlined />, label: '原材料-农机剩余库存' },
      { key: '/agriculture/finished-product-inbound', icon: <InboxOutlined />, label: '农机成品入库' },
      { key: '/agriculture/finished-product-outbound', icon: <InboxOutlined />, label: '农机成品出库' },
      { key: '/agriculture/finished-remaining', icon: <InboxOutlined />, label: '成品剩余' },
    ],
  },
  {
    key: 'procedures',
    icon: <FileTextOutlined />,
    label: '手续',
    children: [
      { key: 'recycle-certificate', icon: <FileTextOutlined />, label: '回收证明' },
      { key: '/agriculture/recycle-certificate-daily', icon: <InboxOutlined />, label: '山西华成攒碳回收证明台账' },
      { key: '/agriculture/recycle-certificate-void', icon: <InboxOutlined />, label: '回收证明作废台账' },
      { key: '/agriculture/ouhai-formalities', icon: <InboxOutlined />, label: '欧海手续详情' },
      { key: '/agriculture/recycle-statistics', icon: <BarChartOutlined />, label: '回收证明统计看板' },
    ],
  },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  theme.useToken();

  const handleSelectApp = (appId: string) => {
    setCurrentApp(appId);
    navigate('/home');
  };

  const handleBackToApps = () => {
    setCurrentApp(null);
    navigate('/my-apps');
  };

  const appName = currentApp === 'car-disassembly' ? '汽车拆解-收车' : '汽车拆解_收货议价';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        width={260}
        style={{
          borderRight: '1px solid #E0F4FF',
          background: '#F0F9FF',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 50,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
          }}
        >
          {currentApp ? (
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}
              onClick={handleBackToApps}
            >
              <ArrowLeftOutlined style={{ fontSize: 16, color: '#666', marginRight: 8 }} />
              <CarOutlined style={{ fontSize: 20, color: '#ff4d4f', marginRight: 8 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>{appName}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <CarOutlined style={{ fontSize: 20, color: '#ff4d4f', marginRight: 8 }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>我的应用</span>
            </div>
          )}
        </div>

        {/* Content area */}
        {currentApp ? (
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              const navMap: Record<string, string> = {
                'recycle-certificate': '/agriculture/recycle-certificate-ledger',
              };
              const target = navMap[key] || key;
              if (target.startsWith('/')) {
                navigate(target);
              }
            }}
            style={{
              background: '#F0F9FF',
              borderRight: 'none',
            }}
          />
        ) : null}
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
        </Header>
        <Content style={{ margin: 0, minHeight: 280, background: '#fafafa', overflow: 'visible' }}>
          {currentApp ? <Outlet /> : <MyApps onSelectApp={handleSelectApp} />}
        </Content>
      </Layout>
    </Layout>
  );
}
