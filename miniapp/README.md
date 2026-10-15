# 攒碳移动办公（UniApp 微信小程序）

复刻简道云**移动端**核心能力：表单填写、流程审批、我的。对接现有 `java-backend` 自研低代码平台 API。

## 功能

| 模块 | 说明 |
|------|------|
| 登录 | 手机号 + 密码/验证码；微信一键登录（需后端配置小程序 AppId/Secret） |
| 应用 | 按分组展示已发布表单，支持搜索，点击进入填写 |
| 填写 | 动态表单（文本/数字/日期/下拉/开关/图片），保存与提交审批 |
| 流程 | 待办 / 我发起的 / 我处理的 / 抄送，状态标签筛选 |
| 我的 | 个人信息、快捷功能、账号信息、设置、退出登录 |

## 技术栈

- **框架**: uni-app (Vue3 + Vite)
- **目标**: 微信小程序 / H5
- **状态管理**: 响应式 API (Vue Composition API)
- **UI 风格**: 简道云移动端设计

## 开发

```bash
cd miniapp
npm install

# H5 预览（端口 5176，/api 代理到 8084）
npm run dev:h5

# 微信小程序
npm run dev:mp-weixin
```

微信开发者工具导入目录：`miniapp/dist/dev/mp-weixin/`

## 构建

```bash
# 构建 H5
npm run build:h5

# 构建微信小程序
npm run build:mp-weixin
```

## 项目结构

```
miniapp/
├── src/
│   ├── pages/
│   │   ├── login/          # 登录页（密码 + 验证码 + 微信）
│   │   ├── home/           # 首页（搜索 + 表单分组网格）
│   │   ├── form-fill/      # 动态表单填写 + 提交记录
│   │   ├── workflow/       # 流程列表（待办/发起/处理/抄送）
│   │   ├── workflow-detail/# 流程详情与审批
│   │   └── mine/           # 个人中心
│   ├── components/
│   │   ├── DynamicField.vue # 动态表单字段组件
│   │   └── CustomTabBar.vue # 底部导航（应用/流程/我的）
│   ├── api/                # API 请求层
│   │   ├── request.js      # 统一请求封装
│   │   ├── auth.js         # 登录/认证接口
│   │   └── platform.js     # 平台业务接口
│   ├── utils/auth.js       # Token/用户信息管理
│   ├── config/index.js     # 配置项（API 地址）
│   ├── App.vue             # 应用入口
│   ├── main.js             # 启动文件
│   ├── pages.json          # 页面路由配置
│   ├── manifest.json       # uni-app 配置
│   └── uni.scss            # 全局样式变量
└── README.md
```

## API 接口

### 认证接口 (`/api/auth`)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/phone-login` | POST | 手机号密码/验证码登录 |
| `/wechat/login` | POST | 微信 code 登录 |
| `/wechat/bind` | POST | 绑定微信并登录 |

### 平台接口 (`/api/platform`)
| 接口 | 方法 | 说明 |
|------|------|------|
| `/apps` | GET | 应用列表 |
| `/forms` | GET | 表单列表 |
| `/forms/{id}` | GET | 表单详情（含 schema） |
| `/forms/{id}/data` | GET | 表单数据列表 |
| `/forms/{id}/data` | POST | 创建表单数据 |
| `/data/{id}` | PUT | 更新表单数据 |
| `/flow/todo` | GET | 待办流程 |
| `/flow/initiated` | GET | 我发起的流程 |
| `/flow/processed` | GET | 我处理的流程 |
| `/flow/cc` | GET | 抄送流程 |
| `/flow/approve/{taskId}` | POST | 同意审批 |
| `/flow/reject/{taskId}` | POST | 驳回审批 |

## 配置

### 前端 API 地址

- 开发：`.env.development` → `VITE_API_BASE_URL=http://localhost:8084/api`
- 生产：`.env.production` → `VITE_API_BASE_URL=https://www.zszy.cc/zt_dismantling/api`

### 微信小程序 AppId

1. 在 `src/manifest.json` → `mp-weixin.appid` 填入小程序 AppId
2. 在 `project.config.json` 同步 appid
3. 后端 `application.yml` 或环境变量：
   - `WECHAT_MINI_APP_ID`
   - `WECHAT_MINI_APP_SECRET`

### 用户手机号登录

后端 `sys_user` 表需有 `phone` 字段。用户可用手机号或用户名登录。
首次微信登录若未绑定，会提示用手机号密码完成绑定。

## UI 设计规范

### 主色调
- 品牌色：`#2b7fff` → `#5b9fff`（渐变）
- 背景色：`#f5f7fa`
- 文字色：`#1a1a1a` / `#666` / `#999`

### 状态色
- 成功：`#52c41a`
- 警告：`#faad14`
- 错误：`#ff4d4f`
- 信息：`#1890ff`

### 组件样式
- 圆角卡片：`border-radius: 20rpx`
- 阴影：`0 2rpx 16rpx rgba(0,0,0,0.04)`
- 主按钮：渐变背景 + 阴影
- 标签页：胶囊样式，激活态渐变背景

## 与 PC 端区别

本小程序面向**移动场景**，不包含 PC 管理端的设计器、看板配置、简道云同步等功能，仅保留简道云移动端的「填表 + 流程 + 个人中心」体验。
