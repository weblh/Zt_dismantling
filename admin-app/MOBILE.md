# 后台管理系统 · 移动端（H5）大适配指南

本文档约定 `admin-app` 在手机浏览器 / 钉钉内置浏览器中的适配标准、已落地能力、业务页改造清单与验收要点。后续新页面、改弹窗、改列表均按本文执行。

---

## 1. 目标

| 目标 | 说明 |
|------|------|
| 可登录、可导航 | 手机可完成登录、侧栏菜单、应用切换 |
| 可查可操作 | 列表筛选、翻页、详情、新增/编辑弹窗可在手机完成 |
| 不横向撑破 | 页面 / 弹窗 / 表格不出现整页横向滚动条（表格内部横滑允许） |
| 拇指可点 | 主操作按钮点击区域足够，底部操作区可换行或拉满 |
| 一套代码 | PC 与 H5 共用同一套页面，用断点与全局样式分流，不单独 fork 移动站 |

**不做：** 把桌面端改成原生 App；不要求复杂大屏看板在手机上像素级还原。

---

## 2. 断点约定

与 Ant Design `Grid.useBreakpoint()` 对齐：

| 断点 | 宽度 | 行为 |
|------|------|------|
| `< md` | `< 768px` | **移动端**：抽屉菜单、弹窗全宽、表单单列 |
| `≥ md` | `≥ 768px` | **桌面端**：固定侧栏，保持原布局 |
| `≤ 480px` | 超小屏 | 弹窗近全屏、底栏按钮纵向拉满 |

业务代码判断：

```tsx
import { Grid } from 'antd';
const { useBreakpoint } = Grid;

const screens = useBreakpoint();
const isMobile = !screens.md;
```

全局标记：移动端会给 `<html>` 加上 class `is-mobile`（见 `MobileConfigProvider`）。

---

## 3. 已落地的基础设施（优先复用，勿重复造轮子）

### 3.1 布局壳

| 文件 | 作用 |
|------|------|
| `src/layouts/index.tsx` | 移动端隐藏 `Sider`，汉堡按钮 + 左侧 `Drawer` 菜单；顶栏 sticky |
| `src/components/AppSwitchTabs.tsx` | `compact` 模式 + 横向滑动切换应用 |
| `index.html` | `viewport-fit=cover`，支持刘海安全区 |

### 3.2 全局样式

| 文件 | 作用 |
|------|------|
| `src/index.css` | `.page-container` 内边距、筛选表单单列、表格横滑、安全区 |
| `src/styles/mobile-overlay.css` | **全站弹层**：Modal / Confirm / Drawer / 图片预览 / Popconfirm |

### 3.3 全局配置

| 文件 | 作用 |
|------|------|
| `src/components/MobileConfigProvider.tsx` | 移动端 Modal 默认居中；挂载 `is-mobile` |
| `src/main.tsx` | 引入 `mobile-overlay.css` + 包裹 `MobileConfigProvider` |

**原则：** 写死的 `Modal width={720|980}` 不必逐页改，全局 CSS 会在移动端强制覆盖为近全宽。

---

## 4. 业务页大适配规范

每个业务模块按下面清单改造；能靠全局样式解决的，不要在页面里堆媒体查询。

### 4.1 页面容器

```tsx
<div className="page-container">
  <Card>...</Card>
</div>
```

- 统一使用 `.page-container`，不要自定义过大的固定 `padding` / `minWidth`。
- 禁止给根容器写死 `width: 1200px`、`minWidth: 1000px` 等。

### 4.2 筛选区 / 工具栏

| 要求 | 建议写法 |
|------|----------|
| 筛选项可换行 | `Space wrap` 或 `Row/Col`，移动端由全局 CSS 把 `Col` 拉成单列 |
| 查询 / 重置 / 导入按钮 | `Space wrap`，避免一排挤出屏幕 |
| 日期范围 | 移动端优先 `picker` 全宽；过长的 RangePicker 可 `isMobile` 时改为两个 DatePicker |

示例：

```tsx
const screens = Grid.useBreakpoint();
const isMobile = !screens.md;

<Space wrap style={{ width: '100%', marginBottom: 12 }}>
  <Button type="primary">查询</Button>
  <Button>重置</Button>
  {!isMobile && <Button>导出</Button>}
  {isMobile && <Button block>导出</Button>}
</Space>
```

### 4.3 表格（重点）

| 要求 | 做法 |
|------|------|
| 必须可横滑 | `scroll={{ x: 数字 }}`，数字 ≥ 列宽之和 |
| 操作列 | `fixed: 'right'` + `Space wrap`，链接按钮用 `size="small"` |
| 列过多 | 移动端隐藏次要列：`responsive: ['md']` 或 `isMobile` 时过滤 `columns` |
| 禁止 | 给 Table 外包一层固定宽度把页面撑破 |

推荐：

```tsx
const columns: ColumnsType<T> = [
  { title: '名称', dataIndex: 'name', width: 140, ellipsis: true },
  // ...
  {
    title: '操作',
    key: 'action',
    width: isMobile ? 120 : 220,
    fixed: 'right',
    render: (_, row) => (
      <Space size="small" wrap>
        <Button type="link" size="small" onClick={() => openDetail(row)}>详情</Button>
        <Button type="link" size="small" onClick={() => openEdit(row)}>编辑</Button>
      </Space>
    ),
  },
];

<Table
  rowKey="id"
  columns={columns}
  dataSource={list}
  scroll={{ x: isMobile ? 800 : 1200 }}
  pagination={{
    size: isMobile ? 'small' : 'default',
    showSizeChanger: !isMobile,
    simple: isMobile,
  }}
/>
```

### 4.4 弹窗 / 抽屉（全站已兜底）

| 类型 | 移动端表现 | 业务页注意点 |
|------|------------|--------------|
| `Modal` | 近全宽，body 内滚动 | 仍可写 `width={720}`，PC 生效、H5 被覆盖 |
| `Modal.confirm` | 按钮换行 / 小屏拉满 | 文案勿过长无换行 |
| 业务 `Drawer` | 宽度 100% | 侧栏菜单 Drawer 除外（`app-mobile-menu-drawer`） |
| 弹窗内表单 | 栅格强制单列 | 不要用 `labelCol` 写死过宽 |
| 弹窗内表格 | 内部横滑 | 同样补 `scroll.x` |

大表单弹窗建议：

```tsx
<Modal
  title="编辑"
  open={open}
  onCancel={onClose}
  width={720}
  destroyOnClose
  styles={isMobile ? { body: { padding: 12 } } : undefined}
  footer={
    <Space wrap style={{ width: '100%', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
      <Button onClick={onClose}>取消</Button>
      <Button type="primary" onClick={onOk}>确定</Button>
    </Space>
  }
>
  <Form layout="vertical">...</Form>
</Modal>
```

移动端优先 **`layout="vertical"`**，标签在上、控件在下，避免左右布局挤扁。

### 4.5 详情展示

- 优先 `Descriptions` + `column={isMobile ? 1 : 2}`（或 3）。
- 长文本、`pre`、JSON：加 `word-break: break-all`，参考 `.event-data-pre`。

### 4.6 上传 / 图片 / 附件

- 上传按钮与列表不要并排写死宽度。
- 预览走 Ant Design `Image`，全站预览层已做 H5 约束。
- 相机拍照场景优先复用 `CameraUpload` 等现有组件。

### 4.7 独立移动页（已有路由）

以下路由本身面向手机，保持独立，不必套后台 Layout：

- `/mobile/form`
- `/mobile/inspection-form`

后台业务页的 H5 适配 ≠ 这两类表单页；两者可并存。

---

## 5. 模块改造优先级（大适配排期建议）

按「使用频率 × 操作复杂度」推进：

### P0 · 必须可用

- [x] 登录 `pages/login`
- [x] 布局壳 + 菜单
- [x] 首页 / 工作台相关（手机可滚动浏览，并提示电脑查看完整大屏）
- [x] 系统管理：用户、角色、菜单、字典、组织
- [x] 金蝶：凭证、银行流水、供应商、账套

### P1 · 高频业务

- [x] 收车 / 结算 / 付款申请 / 费用报销 / 用款申请
- [x] 生产：过磅查验、拆解、挑顶照片、维修工单
- [x] 库存：出入库、产品信息、仓库
- [x] 钉钉表单配置与 OA 数据

### P2 · 列表查看为主

- [x] 农业机械 / 回收凭证相关台账
- [x] 销售台账与统计
- [x] 配件库存
- [x] 识别（VIN / 车辆档案）
- [x] 基础资料：仓库 / 车型 / 供应商 / 人员 / 业务员 / 产品名称 / 收款信息
- [x] 生产补充：报废车 / 查验照片 / 综合拆解
- [x] 库存补充：其他出入库 / 成品 / 经营看板
- [x] 业务补充：车辆照片 / 改价
- [x] 财务：出入库台账；我的应用

### P3 · 弱化或提示

- [x] 总部大屏 `headquarters-dashboard`：复用首页大屏（手机数字卡片 + 提示电脑查看）
- [x] 复杂统计图：移动端优先展示数字卡片，趋势图在电脑端保留

每完成一个模块，在对应项打勾，并在下方「验收」过一遍。

---

## 6. 编码约定（强制）

1. **不要**为移动端复制一整套 `pages-mobile/*`，除非交互差异极大。
2. **不要**在单个业务 CSS 里复制一套 Modal 宽度覆盖（统一走 `mobile-overlay.css`）。
3. **新增 Modal** 仍写 PC 宽度即可；若内容极多，再考虑移动端改 `Drawer` 从底部弹出（需单独评估）。
4. **新增表格** 必须带 `scroll.x`。
5. **新增筛选** 使用可换行布局，禁止单行 `inline` 且无 wrap。
6. 需要区分端能力时，只用 `isMobile = !Grid.useBreakpoint().md`，断点与全局一致。
7. 改全局移动样式时：
   - 页面级 → `src/index.css`
   - 弹层级 → `src/styles/mobile-overlay.css`
8. 侧栏菜单 Drawer 必须保留 class：`app-mobile-menu-drawer`，避免被「业务抽屉全宽」规则误伤。

---

## 7. 验收清单（每个模块）

在真机或 Chrome DevTools（iPhone / 390×844）检查：

- [ ] 菜单可打开、可进入本模块
- [ ] 筛选、查询、重置不溢出
- [ ] 表格可左右滑，操作列可点
- [ ] 新增 / 编辑 / 详情弹窗完整可见，可滚动到底，可关闭
- [ ] 确认框、删除确认可点到按钮
- [ ] 上传、预览图片不挡住关闭
- [ ] 横竖屏切换无永久错位（允许刷新）
- [ ] 钉钉内置浏览器打开无额外白边遮挡主按钮（安全区）

---

## 8. 本地调试

```bash
cd admin-app
npm run dev
```

- 浏览器 F12 → 切换设备工具栏 → 选 iPhone / 自己的机型宽度。
- 或用手机访问开发机局域网地址（`vite --host` 已开启）。
- 验证弹窗：打开任意 `width={980}` 的大弹窗（如业务联动 `BizLinkDataModal`），确认移动端被压成近全宽。

---

## 9. 相关文件速查

```
admin-app/
├── MOBILE.md                          ← 本文档
├── index.html                         ← viewport
├── src/
│   ├── main.tsx                       ← 引入移动样式 + MobileConfigProvider
│   ├── index.css                      ← 页面级移动样式
│   ├── styles/mobile-overlay.css      ← 弹层级移动样式
│   ├── hooks/useIsMobile.ts           ← 统一断点判断
│   ├── components/PageHeaderBar.tsx   ← 响应式页头
│   ├── components/MobileConfigProvider.tsx
│   ├── components/AppSwitchTabs.tsx
│   └── layouts/index.tsx              ← 抽屉菜单布局
```

---

## 10. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-03 | 初版：布局抽屉菜单、页面级 CSS、全站弹层 H5 覆盖、本文档 |
| 2026-03 | P0 业务页改造：系统管理五页、金蝶四页、BizLinkDataModal；新增 `useIsMobile` / `PageHeaderBar` |
| 2026-03 | P1 业务页改造：收车/结算/付款/报销/用款、生产四页、库存四页、钉钉三页；新增 `withMobilePagination` / `MobileListToolbar` |
| 2026-03 | P2 列表页批量适配（农业、销售、配件、识别）；首页大屏手机可滚动并提示用电脑查看 |
| 2026-03 | P3：首页大屏手机隐藏趋势图、改为经营数字卡片；成品/配件/库存/出入库/收车统计页增加汇总卡片 |
| 2026-10 | 缺口补齐：基础资料七页、生产/库存/业务补充页、出入库台账双栏改单列、经营看板 Col 响应式、我的应用两列网格；`tsc` 通过 |

后续模块点对点适配时，请同步更新第 5 节勾选状态与本表。
