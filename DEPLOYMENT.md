# HD术后随访系统 - 独立部署指南

本文档介绍如何将本应用从妙搭平台迁出，部署到完全免费的第三方平台，获得自定义域名访问地址（不含 doubao / miaoda 字样）。

## 最终访问地址格式

部署成功后，你的访问地址将是：

| 部署平台 | 地址格式 | 示例 |
|---------|---------|------|
| **Render** | `https://<你的服务名>.onrender.com` | `https://hd-followup.onrender.com` |
| **Railway** | `https://<你的服务名>.up.railway.app` | `https://hd-followup.up.railway.app` |
| **Fly.io** | `https://<你的应用名>.fly.dev` | `https://hd-followup.fly.dev` |
| **Vercel（前端）+ Neon（数据库）** | `https://<项目名>.vercel.app` | `https://hd-followup.vercel.app` |

**推荐方案：Render + Render PostgreSQL（全免费，一键部署）**

---

## 方案一：Render 一键部署（推荐，完全免费）

### 免费额度
- Web 服务：750 小时/月（单个实例够一直跑）、512MB RAM
- PostgreSQL：1 个免费数据库、1GB 存储、90 天有效期（到期可重建）

### 前置准备
1. **GitHub 账号**（免费注册：https://github.com）
2. **Render 账号**（免费注册：https://render.com，用 GitHub 登录即可）
3. 将本项目代码推送到你自己的 GitHub 仓库

### 部署步骤

#### 第 1 步：代码推送到 GitHub
将项目代码推送到你自己的 GitHub 仓库（public 或 private 均可）。

#### 第 2 步：一键部署
点击下面按钮（或手动按以下步骤操作）：

手动部署步骤：

1. 登录 https://dashboard.render.com
2. 点击右上角 **New +** → **PostgreSQL**
   - Name: `hd-followup-db`
   - Database: `hd_followup`
   - User: `hd_followup`
   - Region: 选 Singapore 或 Oregon
   - Plan: 选 **Free**
   - 点击 **Create Database**
   - 等待创建完成，复制 `Internal Database URL` 备用

3. 回到 Dashboard，点击 **New +** → **Web Service**
   - 选择你刚才推送代码的 GitHub 仓库
   - Name: `hd-followup`（这个会出现在网址里）
   - Runtime: **Docker**
   - Dockerfile Path: `./standalone.Dockerfile`
   - Region: 选和数据库同一个区域
   - Plan: 选 **Free**
   - 点击 **Advanced** → 添加环境变量：
     - `DATABASE_URL`: 粘贴第 2 步复制的 Internal Database URL
     - `JWT_SECRET`: 点击 **Generate** 自动生成一个随机密钥
     - `NODE_ENV`: `production`
     - `PORT`: `3000`
   - 点击 **Create Web Service**

4. 等待构建和部署完成（第一次约 5-10 分钟）
5. 部署成功后，你会看到一个类似 `https://hd-followup.onrender.com` 的地址

> 注意：Render 免费层的 Web 服务在 15 分钟无流量后会休眠，首次访问需等待约 30 秒唤醒。生产环境建议升级到 Starter 套餐（$7/月）。

#### 第 3 步：初始化医生账号
部署完成后，数据库中已预置 2 个测试医生账号：
- 医生：`13800138000` / `123456`（张医生）
- 医生：`13800138001` / `123456`（李医生）

家长账号可直接在登录页注册。

---

## 方案二：Railway 部署

### 免费额度
- 新用户 $5 试用金（约可用 1-2 个月）
- 无永久免费层，适合短期测试

### 部署步骤
1. 注册 https://railway.app
2. New Project → Deploy from GitHub repo
3. 选择你的仓库
4. 添加服务：PostgreSQL
5. 在服务设置中设置环境变量（同 Render）
6. 部署后访问地址格式：`https://xxx.up.railway.app`

---

## 方案三：Fly.io 部署

### 免费额度
- 每月免费额度：3 个共享 CPU 实例、160GB 流量
- 需要绑信用卡验证（防止滥用，不超额度不收费）

### 部署步骤
1. 注册 https://fly.io
2. 安装 flyctl 命令行工具
3. 在项目目录执行 `fly launch`
4. 按提示配置，选择创建 PostgreSQL
5. 设置环境变量：`flyctl secrets set JWT_SECRET=<你的密钥>`
6. 部署：`fly deploy`
7. 访问地址：`https://<app-name>.fly.dev`

---

## 方案四：Vercel 前端 + Neon 数据库（纯前端+后端分离）

适合对访问速度要求高的场景。Vercel 全球 CDN + Neon Serverless Postgres。

### 免费额度
- Vercel：个人版免费，100GB 流量/月
- Neon：免费层 1 个项目、500MB 存储、每月 100 小时活跃

### 部署步骤

#### 后端部署到 Render/Railway
- 同上，部署后端 API 服务

#### 前端部署到 Vercel
1. 注册 https://vercel.com
2. New Project → Import Git 仓库
3. Framework Preset: **Vite**
4. Build Command: `vite build --config vite.standalone.config.ts`
5. Output Directory: `client/dist`
6. 环境变量：
   - `VITE_API_BASE_URL`: 你的后端 API 地址（如 `https://hd-followup.onrender.com`）
7. 部署后地址：`https://<项目名>.vercel.app`

---

## 环境变量说明

| 变量名 | 必填 | 说明 | 示例值 |
|--------|------|------|--------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接字符串 | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | ✅ | JWT 签名密钥（生产环境务必使用随机字符串） | `your-random-secret-key-32chars` |
| `PORT` | ❌ | 服务监听端口，默认 3000 | `3000` |
| `NODE_ENV` | ❌ | 运行环境，默认 production | `production` |
| `CORS_ORIGIN` | ❌ | 允许的 CORS 源，逗号分隔，默认允许所有 | `https://yourdomain.com` |

---

## 本地开发运行

如果你想在本地先测试：

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 安装独立部署额外依赖
npm install @nestjs/jwt @nestjs/serve-static postgres @vitejs/plugin-react --legacy-peer-deps
npm install -D drizzle-kit --legacy-peer-deps

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你本地的 PostgreSQL 连接信息

# 4. 初始化数据库
npx drizzle-kit push

# 5. 启动后端
npx nest start --watch --entryFile main.standalone

# 6. 启动前端（另开一个终端）
npx vite --config vite.standalone.config.ts
```

然后访问 http://localhost:5173

---

## 功能说明

部署后所有原有功能保持不变：

### 家长端 H5（移动端）
- ✅ 手机号注册 / 登录
- ✅ 每日红旗征自查（自动风险分级）
- ✅ 排便日记记录（Bristol 分型）
- ✅ Rintala 排便功能评分
- ✅ 复诊提醒
- ✅ 健康教育文章

### 医生端后台（PC 端）
- ✅ 医生账号登录
- ✅ 患者列表（按风险分级筛选）
- ✅ 患者详情（排便趋势图、红旗征记录、Rintala 历史）
- ✅ 随访备注记录
- ✅ 批量随访提醒
- ✅ 数据看板（风险分布、趋势统计）

### 预置测试账号
| 角色 | 手机号 | 密码 |
|------|--------|------|
| 医生 | 13800138000 | 123456 |
| 医生 | 13800138001 | 123456 |
| 家长 | 注册页自行注册 | - |

---

## 自定义域名（可选）

如果你想用自己的域名（如 `followup.yourhospital.com`），以上平台都支持绑定自定义域名：

- **Render**：Settings → Custom Domains → 添加域名 → 按提示配置 DNS CNAME 记录
- **Vercel**：Settings → Domains → 添加域名 → 配置 DNS
- **Fly.io**：`flyctl certs add yourdomain.com`

绑定后即可通过你的域名访问，完全看不出平台痕迹。

---

## 技术架构

去平台化改造后的技术栈：

| 层 | 技术 |
|----|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS + ECharts |
| 后端 | NestJS 10 + Drizzle ORM + JWT 认证 |
| 数据库 | PostgreSQL（兼容 Neon / Supabase / Render / Railway 等） |
| 部署 | Docker 容器化，支持任何支持 Docker 的平台 |

### 与平台版的差异
- 认证方式：平台用户体系 → 自建 JWT + 手机号密码
- 数据库：平台托管 PG → 标准 PostgreSQL 直连
- 前端 SDK：`@lark-apaas/client-toolkit` → 原生 axios + localStorage
- 部署：妙搭平台 → Docker 容器（任意云平台）
- 域名：`doubao.link` → 平台子域名或自定义域名
