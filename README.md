# 攒碳汽车拆解平台

自研低代码业务平台，目标替代简道云「汽车拆解-收车」：钉钉登录、表单设计/运行时、Flowable 审批、权限、打印与看板。

## 项目结构

```
Zt_dismantling/
├── admin-app/          # 前端 (React + Vite + Ant Design)
├── java-backend/       # 后端 (Spring Boot + MyBatis-Plus + Flowable)
└── README.md
```

## 功能特性

- **钉钉登录**：浏览器扫码/OAuth + 钉钉工作台免登，签发 JWT；账号密码仅作运维兜底
- **自研表单**：从简道云镜像导入 schema/数据；通用列表增删改查；拖拽式设计器与版本发布
- **流程**：Flowable 嵌入（待办/发起/处理/抄送）
- **权限 / 打印 / 看板**：表单 ACL、HTML 打印模板、统计看板
- **简道云镜像**：仅迁移期只读同步（默认关闭定时任务）；切流后可停用
- **钉钉 Stream / 金蝶**：原有 OA 与凭证能力保留

## 快速开始

### 环境要求

- JDK 8+、Maven 3.6+、Node.js 18+、MySQL 8.0+

### 数据库

```bash
mysql -uroot -p123456 < java-backend/src/main/resources/init.sql
```

库名：`dismantling_platform`。启动时 `DatabaseMigrationRunner` 会自动补齐 `biz_*` 表与钉钉用户字段。

### 启动后端

```bash
cd java-backend
mvn spring-boot:run
```

默认端口：**8084**。默认管理员：`admin` / `admin123`

### 启动前端

```bash
cd admin-app
npm install
npm run dev
```

默认端口：**5173**（`/api` 代理到后端）

登录后默认进入 `/app`。首次在「平台首页」点击 **从简道云镜像导入**，侧栏会生成业务表单菜单。

## 钉钉登录配置

**线上登录地址：** [https://www.zszy.cc/zt_dismantling/login](https://www.zszy.cc/zt_dismantling/login)

1. 开放平台应用使用现有 Client ID / Secret（见 `dingtalk.stream`）
2. 开通扫码登录，**回调地址必须与线上一致**：
   - 生产：`https://www.zszy.cc/zt_dismantling/login`
   - 本地：`http://localhost:5173/login`
3. 工作台应用首页改为：`https://www.zszy.cc/zt_dismantling/`（勿再指向简道云）
4. 生产配置见 `deploy/package/backend/application-prod.yml`（`dingtalk.login.redirect-uri`）

```bash
DINGTALK_CLIENT_ID=...
DINGTALK_CLIENT_SECRET=...
DINGTALK_CORP_ID=dingcb1f88f31ec617c6f5bf40eda33b7ba0
DINGTALK_LOGIN_REDIRECT=https://www.zszy.cc/zt_dismantling/login
```

Nginx 已将 `/zt_dismantling/` 指向静态站、`/zt_dismantling/api/` 反代后端 `5000`。

## 切流停费（M5）

1. 双轨验证业务数据与审批
2. 钉钉工作台入口指向本系统
3. 保持 `JDY_SYNC_ENABLED=false`，下线简道云嵌入；`/jdy` 仅作镜像归档
4. 确认稳定后取消简道云订阅

## 主要 API

| 接口 | 说明 |
|------|------|
| `POST /api/auth/login` | 账号密码 |
| `GET /api/auth/dingtalk/qr-config` | 扫码配置 |
| `POST /api/auth/dingtalk/qr-callback` | 扫码换票 |
| `POST /api/auth/dingtalk/free-login` | 免登 |
| `/api/platform/**` | 表单/数据/流程/ACL/打印/看板/迁移 |

## 技术栈

**前端**：React 19、TypeScript、Vite、Ant Design

**后端**：Spring Boot 2.7、MyBatis-Plus、MySQL 8、JWT、Flowable 6.8、钉钉 OpenAPI
