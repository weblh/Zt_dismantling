# -*- coding: utf-8 -*-
from pathlib import Path
import re

p = Path(r"d:\E\project\Zt_dismantling\admin-app\src\layouts\index.tsx")
text = p.read_text(encoding="utf-8")

replacements = [
    (
        """  {
    key: '/home',
    icon: <DashboardOutlined />,
    label: '华成攒碳大屏',
  },
  {
    key: 'todo',
    icon: <ClockCircleOutlined />,
    label: '我的待办',
  },""",
        """  {
    key: '/jdy/app',
    icon: <AppstoreOutlined />,
    label: '简道云整站（收车）',
  },
  {
    key: '/home',
    icon: <DashboardOutlined />,
    label: '华成攒碳大屏',
  },
  {
    key: '/jdy/app?form=todo',
    icon: <ClockCircleOutlined />,
    label: '我的待办',
  },""",
    ),
    (
        """      { key: '/basic/salesman', icon: <UserOutlined />, label: '业务员' },
      { key: '/basic/supplier', icon: <TeamOutlined />, label: '供应商基础资料' },
      { key: '/basic/vehicle-model', icon: <CarOutlined />, label: '车辆型号' },
      { key: '/basic/warehouse', icon: <InboxOutlined />, label: '仓库' },
      { key: '/basic/product-name', icon: <TagOutlined />, label: '产品名称' },
      { key: '/basic/payee-info', icon: <PayCircleOutlined />, label: '收款人信息' },""",
        """      { key: '/jdy/app?form=salesman', icon: <UserOutlined />, label: '业务员' },
      { key: '/jdy/app?form=supplier', icon: <TeamOutlined />, label: '供应商基础资料' },
      { key: '/jdy/app?form=vehicle-model', icon: <CarOutlined />, label: '车辆型号' },
      { key: '/jdy/app?form=warehouse', icon: <InboxOutlined />, label: '仓库' },
      { key: '/jdy/app?form=product-name', icon: <TagOutlined />, label: '产品名称' },
      { key: '/jdy/app?form=payee-info', icon: <PayCircleOutlined />, label: '收款人信息' },""",
    ),
    (
        """      { key: '/recognition/vin', icon: <InboxOutlined />, label: 'VIN识别' },
      { key: '/recognition/vehicle-archive', icon: <FileTextOutlined />, label: '车辆档案识别' },""",
        """      { key: '/jdy/app?form=vin', icon: <InboxOutlined />, label: 'VIN识别' },
      { key: '/jdy/app?form=vehicle-archive', icon: <FileTextOutlined />, label: '车辆档案识别' },""",
    ),
    (
        """      { key: '/business/receipt', icon: <ShoppingFilled />, label: '1.业务收货' },
      { key: '/business/vehicle-photo', icon: <PictureOutlined />, label: '异地车固照片' },
      { key: '/business/settlement', icon: <FileTextOutlined />, label: '业务结账' },
      { key: '/business/payment-application', icon: <PayCircleOutlined />, label: '业务结账付款申请' },
      { key: '/business/price-change', icon: <TagOutlined />, label: '修改价格' },
      { key: '/business/vehicle-receipt-statistics', icon: <BarChartOutlined />, label: '业务收车统计表' },
      { key: '/business/repair-work-order', icon: <ToolOutlined />, label: '维修工单' },""",
        """      { key: '/jdy/app?form=receipt', icon: <ShoppingFilled />, label: '1.业务收货' },
      { key: '/jdy/app?form=vehicle-photo', icon: <PictureOutlined />, label: '异地车回车照片' },
      { key: '/jdy/app?form=settlement', icon: <FileTextOutlined />, label: '业务结账' },
      { key: '/jdy/app?form=payment-application', icon: <PayCircleOutlined />, label: '业务结账付款申请' },
      { key: '/jdy/app?form=price-change', icon: <TagOutlined />, label: '修改价格' },""",
    ),
    (
        """      { key: '/kingdee/voucher', icon: <DatabaseOutlined />, label: '1.过磅同步数据' },
      { key: '/production/weighing-inspection', icon: <UserOutlined />, label: '2.过磅查验' },
      { key: '/production/inspection-photo', icon: <HomeOutlined />, label: '3.查验照片' },
      { key: '/production/scrapped-vehicle', icon: <WarningOutlined />, label: '4.报废车入库' },
      { key: '/production/pick-top-photo', icon: <PictureOutlined />, label: '5.挑顶照片' },
      { key: '/production/disassembly', icon: <SettingOutlined />, label: '6.拆解' },
      { key: '/production/comprehensive-disassembly', icon: <AppstoreOutlined />, label: '7.综合拆解' },""",
        """      { key: '/jdy/app?form=weighing-sync', icon: <DatabaseOutlined />, label: '1.过磅同步数据' },
      { key: '/jdy/app?form=weighing-inspection', icon: <UserOutlined />, label: '2.过磅查验' },
      { key: '/jdy/app?form=inspection-photo', icon: <HomeOutlined />, label: '3.查验照片' },
      { key: '/jdy/app?form=scrapped-vehicle', icon: <WarningOutlined />, label: '4.报废车入库' },
      { key: '/jdy/app?form=pick-top-photo', icon: <PictureOutlined />, label: '5.挑顶照片' },
      { key: '/jdy/app?form=disassembly', icon: <SettingOutlined />, label: '6.拆解' },
      { key: '/jdy/app?form=comprehensive-disassembly', icon: <AppstoreOutlined />, label: '7.综合拆解' },""",
    ),
    (
        """      { key: '/jdy', icon: <CloudSyncOutlined />, label: '简道云同步' },""",
        """      { key: '/jdy', icon: <CloudSyncOutlined />, label: '简道云数据同步(本地库)' },""",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit("missing block:\n" + old[:120])
    text = text.replace(old, new, 1)

# selectedKeys should include query
# Find selectedKeys={
if "selectedKeys={[location.pathname]}" in text:
    text = text.replace(
        "selectedKeys={[location.pathname]}",
        "selectedKeys={[location.pathname + (location.search || '')]}",
    )

p.write_text(text, encoding="utf-8")
print("layout menus -> jdy embed")
