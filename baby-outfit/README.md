# Baby Outfit — 宝宝穿衣助手

Web 端应用：根据天气和宝宝衣柜推荐今日穿搭。

仓库地址：[github.com/ferrarizhu/babywarmrobot](https://github.com/ferrarizhu/babywarmrobot)

## 前置条件

- **Node.js 18+**
- **Docker Desktop**（用于本地 Supabase，[安装指南](https://docs.docker.com/get-docker/)）
- 可选：**Supabase CLI**（一键脚本会自动安装）

## 本地部署（推荐）

### 方式一：一键脚本

```bash
cd baby-outfit
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
npm run dev
```

脚本会自动：安装依赖 → 启动本地 Supabase → 执行 migration 与 demo 数据 → 生成 `web/.env.local`。

### 方式二：手动步骤

```bash
cd baby-outfit

# 1. 安装 Supabase CLI（如未安装）
# macOS: brew install supabase/tap/supabase
# Linux: 见 https://supabase.com/docs/guides/cli/getting-started

# 2. 安装依赖
npm install

# 3. 启动本地 Supabase（需 Docker 已运行）
supabase start
supabase db reset

# 4. 配置环境变量
cp web/.env.local.example web/.env.local
# 将 ANON_KEY 替换为 supabase status -o env 输出的值：
# NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>

# 5. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 ，使用 demo 账号登录：

```
demo_user_1@baby-outfit.dev
password123
```

Supabase Studio（数据库管理界面）：http://127.0.0.1:54323

### 使用云端 Supabase（可选）

若不想在本地跑 Docker，可在 [supabase.com](https://supabase.com) 创建项目，在 SQL Editor 中依次执行 `supabase/migrations/` 下的 SQL 文件，然后在 `web/.env.local` 填入项目的 URL 和 anon key。

## 项目结构

```
baby-outfit/
├── packages/core/     # 推荐算法（Web + 未来小程序复用）
├── web/             # Next.js 前端
└── supabase/        # 数据库 migration
```

## 功能（当前 MVP）

- [x] 邮箱登录（Supabase Auth）
- [x] 读取宝宝档案、衣柜、偏好
- [x] Open-Meteo 天气
- [x] 三套推荐（标准 / 偏暖 / 偏凉）
- [x] 室内 / 外出 / 睡眠场景切换

## 下一步

- 衣柜 CRUD 页面
- 反馈（太冷/刚好/太热）写入数据库
- 图片上传到 Supabase Storage
