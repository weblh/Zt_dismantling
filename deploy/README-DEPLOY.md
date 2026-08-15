# 攒碳汽车拆解平台 - 部署指南

将本项目部署到另一台 Windows 电脑，使用 **Nginx** 代理前端静态资源，并将 `/api` 转发到 **Spring Boot** 后端。

## 架构

```
浏览器 → Nginx:80 → 前端静态文件 (package/frontend)
                 └→ /api/* → 后端 Java:8080
                              └→ MySQL:3306
```

## 环境要求（目标服务器）

| 组件 | 版本 |
|------|------|
| Windows | 10/11 或 Windows Server |
| Java | JRE/JDK 8+（运行后端） |
| MySQL | 8.0+ |
| Nginx | 1.20+（脚本自动下载便携版） |

## 一、在开发机打包

### 1. 安装 JDK 8+（必须，不能只有 JRE）

确认 `javac -version` 可用。

### 2. 执行打包脚本

```powershell
cd D:\E\project\automotive_dismantling_platform\automotive_dismantling_platform\deploy
.\build-package.ps1
```

生成目录 `deploy\package\`：

```
package/
├── frontend/          # 前端构建产物
├── backend/
│   ├── dismantling-backend-1.0.0.jar
│   ├── application-prod.yml
│   ├── start-backend.bat
│   └── stop-backend.bat
├── sql/
│   ├── init.sql
│   └── schema.sql
└── nginx/
    └── dismantling-platform.conf
```

### 3. 复制到目标机器

将整个 `deploy` 文件夹（或至少 `deploy\package` + 脚本）复制到目标电脑，例如：

```
D:\apps\dismantling-platform\deploy\
```

## 二、在目标服务器部署

### 1. 初始化 MySQL 数据库

```powershell
mysql -uroot -p < D:\apps\dismantling-platform\deploy\package\sql\init.sql
```

数据库名：`dismantling_platform`

### 2. 修改数据库 / 钉钉配置（如需要）

推荐：复制 `package\backend\env.example.bat` 为 `env.bat`，修改其中的数据库密码、钉钉凭证等。`start-backend.bat` 启动时会自动加载。

也可直接编辑 `package\backend\application-prod.yml`，或通过环境变量：

```powershell
$env:DB_HOST = "127.0.0.1"
$env:DB_PORT = "3306"
$env:DB_NAME = "dismantling_platform"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "你的密码"
$env:DINGTALK_CLIENT_ID = "钉钉ClientId"
$env:DINGTALK_CLIENT_SECRET = "钉钉ClientSecret"
```

> 说明：后端使用 `--spring.config.additional-location` 加载 `application-prod.yml`，会与 JAR 内配置合并，**无需拷贝 `java-backend\target` 目录**。钉钉 Stream 默认自动启动并监听审批事件写入数据库。

### 3. 一键安装并启动

以管理员身份打开 PowerShell（80 端口需要权限，或改用 `-Port 8088`）：

```powershell
cd D:\apps\dismantling-platform\deploy
.\install-and-start.ps1
```

指定端口示例：

```powershell
.\install-and-start.ps1 -Port 8088
```

### 4. 访问系统

- 地址：`http://localhost` 或 `http://服务器IP`
- 默认账号：`admin` / `admin123`

## 三、手动分步启动

```powershell
# 1. 启动后端
cd deploy\package\backend
.\start-backend.bat

# 2. 安装并配置 Nginx
cd deploy
.\install-nginx.ps1
# 将 package\nginx\dismantling-platform.conf 中 DEPLOY_ROOT 替换为 package 目录绝对路径（正斜杠）
# 复制到 tools\nginx\conf\ 并在 nginx.conf 的 http {} 中加入:
#   include dismantling-platform.conf;
cd tools\nginx
.\nginx.exe -t
.\nginx.exe
```

## 四、停止服务

```powershell
cd deploy
.\stop-all.ps1
```

## 五、Linux 部署（可选）

若目标机为 Linux，将 `package/frontend` 放到 `/var/www/dismantling`，Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/dismantling;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

后端启动：

```bash
cd /opt/dismantling/backend
nohup java -jar dismantling-backend-1.0.0.jar --spring.config.additional-location=./application-prod.yml > logs/backend.log 2>&1 &
```

## 常见问题

**Q: 前端能打开但 API 502**  
A: 502 表示 Nginx 正常，但 Java 后端（8080）未启动或启动失败。按顺序排查：

1. 在内网电脑运行 `deploy\status.bat`，确认 `[ OK ] Backend : port 8080 listening`
2. **替换文件后必须重启**：双击 `deploy\restart.bat`（不要只覆盖文件不重启）
3. 查看 `package\backend\logs\backend.log` 末尾报错，常见原因：
   - MySQL 未启动或密码不对（复制 `env.example.bat` 为 `env.bat` 修改 `DB_PASSWORD`）
   - Java 未安装或未加入 PATH
   - 8080 端口被其他程序占用
4. 手动验证：`netstat -ano | findstr 8080`

**Q: 打包时提示 No compiler is provided**  
A: 需要安装 JDK（含 javac），不能只用 JRE。

**Q: 80 端口被占用**  
A: 使用 `.\install-and-start.ps1 -Port 8088`，访问 `http://localhost:8088`。

**Q: 页面刷新 404**  
A: 确认 Nginx 配置了 `try_files $uri $uri/ /index.html;`。

**Q: 钉钉审批数据没有写入数据库**  
A: 查看 `package\backend\logs\backend.log`，确认有「钉钉 Stream 通道已自动启动」。若启动失败，检查 `env.bat` 或 `application-prod.yml` 中的 `DINGTALK_CLIENT_ID` / `DINGTALK_CLIENT_SECRET`，并确认目标服务器能访问钉钉外网 API。
