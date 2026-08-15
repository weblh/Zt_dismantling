# 攒碳汽车拆解平台

汽车拆解业务管理平台，包含简单登录认证与钉钉 Stream 模式事件推送接入。

## 项目结构

```
automotive_dismantling_platform/
├── admin-app/          # 前端 (React + Vite + Ant Design)
├── java-backend/       # 后端 (Spring Boot + MyBatis-Plus)
└── dismantling_platform.svg
```

## 功能特性

- **登录认证**：用户名密码登录，JWT Token 鉴权（无多级权限）
- **首页**：平台概览与快速开始指引
- **钉钉数据**：Stream 模式事件推送接入、通道管理、事件记录查询

## 快速开始

### 环境要求

- JDK 8+
- Maven 3.6+
- Node.js 18+
- MySQL 8.0+

### 创建数据库

在 MySQL 中执行初始化脚本（与 `reverse_invoicing` 同一实例，默认 root/123456）：

```bash
mysql -uroot -p123456 < java-backend/src/main/resources/init.sql
```

数据库名：`dismantling_platform`

包含表：`sys_user`、`dingtalk_event`、`dingtalk_config`

### 启动后端

```bash
cd java-backend
mvn spring-boot:run
```

后端默认端口：`8080`

默认管理员账号：`admin` / `admin123`

### 启动前端

```bash
cd admin-app
npm install
npm run dev
```

前端默认端口：`5173`（已配置 `/api` 代理到后端）

## 钉钉 Stream 模式配置

1. 在 [钉钉开放平台](https://open.dingtalk.com/) 创建企业内部应用
2. 获取 **Client ID**（AppKey）和 **Client Secret**（AppSecret）
3. 在应用「事件订阅」中选择 **Stream 模式**
4. 登录平台 → **钉钉数据** 菜单 → 填写凭证 → 启动 Stream 通道
5. 在钉钉开放平台点击「验证 Stream 模式通道」完成连接验证
6. 订阅所需事件，推送数据将自动保存到本地数据库

参考文档：[开发 Stream 模式推送服务端](https://open.dingtalk.com/document/development/develop-stream-mode-push-server)

### 环境变量（可选）

也可通过环境变量配置钉钉凭证：

```bash
DINGTALK_CLIENT_ID=your_client_id
DINGTALK_CLIENT_SECRET=your_client_secret
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/login` | POST | 登录 |
| `/api/dingtalk/status` | GET | Stream 通道状态 |
| `/api/dingtalk/config` | POST | 保存钉钉配置 |
| `/api/dingtalk/start` | POST | 启动 Stream 通道 |
| `/api/dingtalk/stop` | POST | 停止 Stream 通道 |
| `/api/dingtalk/events` | GET | 事件列表（分页） |
| `/api/dingtalk/events/{id}` | GET | 事件详情 |

## 技术栈

**前端**：React 19、TypeScript、Vite、Ant Design、React Router、Axios

**后端**：Spring Boot 2.7、MyBatis-Plus、MySQL 8、JWT、钉钉 app-stream-client SDK
