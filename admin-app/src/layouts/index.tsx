import { useState } from 'react';
import { Layout, Menu, Dropdown, Avatar, theme } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  CheckCircleOutlined,
  MailOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  TruckOutlined,
  InboxOutlined,
  FileTextOutlined,
  UserOutlined,
  PictureOutlined,
  PayCircleOutlined,
  TagOutlined,
  ShoppingFilled,
  HomeOutlined,
  WarningOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  ToolOutlined,
  ScanOutlined,
  TeamOutlined,
  SwapOutlined,
  FormOutlined,
  AccountBookOutlined,
  FundOutlined,
  ShopOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import AppSwitchTabs from '@/components/AppSwitchTabs';
import { getStoredUser, openAppInNewWindow, APP_ENTRIES } from '@/config/apps';
import { clearAuth } from '@/utils/authStorage';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/home',
    icon: <DashboardOutlined />,
    label: '华成攒碳大屏',
  },
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
    key: 'basic',
    icon: <DatabaseOutlined />,
    label: '基础',
    children: [
      { key: '/basic/salesman', icon: <UserOutlined />, label: '业务员' },
      { key: '/basic/supplier', icon: <TeamOutlined />, label: '供应商基础资料' },
      { key: '/basic/vehicle-model', icon: <CarOutlined />, label: '车辆型号' },
      { key: '/basic/warehouse', icon: <InboxOutlined />, label: '仓库' },
      { key: '/basic/product-name', icon: <TagOutlined />, label: '产品名称' },
      { key: '/basic/payee-info', icon: <PayCircleOutlined />, label: '收款人信息' },
      { key: '/basic/staff', icon: <UserOutlined />, label: '生产人员' },
    ],
  },
  {
    key: 'recognition',
    icon: <ScanOutlined />,
    label: '识别',
    children: [
      { key: '/recognition/vin', icon: <InboxOutlined />, label: 'VIN识别' },
      { key: '/recognition/vehicle-archive', icon: <FileTextOutlined />, label: '车辆档案识别' },
    ],
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
      { key: '/production/repair-work-order', icon: <ToolOutlined />, label: '8.维修工单' },
    ],
  },
  {
    key: 'dingtalk',
    icon: <SendOutlined />,
    label: '钉钉',
    children: [
      { key: '/dingtalk', icon: <DatabaseOutlined />, label: 'Stream通道' },
      { key: '/dingtalk/form-config', icon: <FormOutlined />, label: '表单配置' },
      { key: '/dingtalk/oa-form-data', icon: <FileTextOutlined />, label: 'OA表单数据' },
    ],
  },
  {
    key: 'finance',
    icon: <AccountBookOutlined />,
    label: '财务',
    children: [
      {
        key: 'kingdee',
        icon: <AccountBookOutlined />,
        label: '金蝶',
        children: [
          { key: '/kingdee/account', icon: <SettingOutlined />, label: '账套配置' },
          { key: '/kingdee/supplier', icon: <ShopOutlined />, label: '供应商' },
          {
            key: 'kingdee-write',
            icon: <SendOutlined />,
            label: '写入金蝶',
            children: [
              { key: '/business/expense-reimbursement', icon: <AccountBookOutlined />, label: '费用报销明细' },
              { key: '/business/fund-usage-application', icon: <FundOutlined />, label: '资金使用申请' },
            ],
          },
        ],
      },
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
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '展示看板',
    children: [
      { key: '/dashboard/business-staff', icon: <UserOutlined />, label: '各业务人员统计' },
      { key: '/dashboard/vehicle-query', icon: <ScanOutlined />, label: '车辆编号查询' },
      { key: '/dashboard/disassembly-dashboard', icon: <ToolOutlined />, label: '拆解展示看板' },
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
  {
    key: 'pricing-inventory',
    icon: <InboxOutlined />,
    label: '议价-库存台账',
    children: [
      {
        key: 'open-pricing-inventory',
        icon: <InboxOutlined />,
        label: '打开议价端库存台账',
      },
      { key: '/part/part-stock', icon: <InboxOutlined />, label: '配件库存' },
      { key: '/part/part-info-customer', icon: <UserOutlined />, label: '配件客户信息' },
    ],
  },
];

const systemMenuItem: NonNullable<MenuProps['items']>[number] = {
  key: 'system',
  icon: <SafetyCertificateOutlined />,
  label: '系统管理',
  children: [
    { key: '/system/users', icon: <TeamOutlined />, label: '用户权限' },
  ],
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: themeToken } = theme.useToken();

  const user = getStoredUser();
  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const siderMenuItems = isSuperAdmin ? [...(menuItems || []), systemMenuItem] : menuItems;

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
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['business', 'production', 'dingtalk', 'finance', 'kingdee', 'kingdee-write', 'system']}
          items={siderMenuItems}
          onClick={({ key }) => {
            if (key === 'open-pricing-inventory') {
              const pricing = APP_ENTRIES.find((a) => a.code === 'pricing');
              openAppInNewWindow(`${pricing?.url || 'http://localhost:5174'}/inventory/ledger`);
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
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
