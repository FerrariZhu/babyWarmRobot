# WarmRobot — 项目文件分类索引

> 最后更新：2026-07-07  
> 共 **178** 个源文件（不含 `node_modules`、`.next`、`dist`）

---

## 一、架构总览

```
warmrobot/                    ← 仓库根（monorepo 入口）
├── warmrobot/                  ← 主应用 monorepo
│   ├── packages/core/            ← 共享算法层
│   ├── web/                      ← Next.js 15 前端 + BFF API
│   ├── backend/                  ← NestJS 后端（课程排课，独立服务）
│   └── supabase/                 ← Supabase 本地 DB / 迁移 / 种子
├── docs/                         ← 文档与规范（本索引所在）
├── AGENTS.md                     ← Cursor Agent 运行说明
├── netlify.toml                  ← Netlify 部署配置
└── package.json                  ← 根级 npm 脚本代理
```

| 子系统 | 技术栈 | 职责 |
|--------|--------|------|
| **Web 前端** | Next.js 15, React 19, Tailwind v4 | 用户界面、页面路由、BFF API Routes |
| **共享算法** | TypeScript (`@warmrobot/core`) | 穿搭推荐、保暖计算、天气解析 |
| **Lessons 后端** | NestJS, Prisma, JWT | 课程排课、教师权限、代课 |
| **主数据仓库** | Supabase (PostgreSQL) | 用户、宝宝、衣柜、商品目录、枚举 |
| **Lessons 数据库** | PostgreSQL + Prisma | 课程表独立 schema |

---

## 二、前端（Web）

路径：`warmrobot/web/`

### 2.1 工程配置

| 文件 | 说明 |
|------|------|
| `package.json` | 依赖与脚本（dev / build / db:migrate / import:catalog） |
| `next.config.ts` | Next.js 配置，`transpilePackages: @warmrobot/core` |
| `tsconfig.json` | TypeScript 配置 |
| `eslint.config.mjs` | ESLint 规则 |
| `postcss.config.mjs` | PostCSS / Tailwind 入口 |
| `next-env.d.ts` | Next.js 类型声明 |
| `.env.local.example` | 环境变量模板 |
| `.env.local` | 本地密钥（**不提交**） |
| `.gitignore` | 忽略 `.next`、`.env.local` 等 |

### 2.2 页面路由（App Router）

| 路径 | 文件 | 功能 |
|------|------|------|
| `/` | `src/app/page.tsx` | 首页 / 今日推荐 Dashboard |
| `/login` | `src/app/login/page.tsx` | Supabase 邮箱登录 |
| `/wardrobe` | `src/app/wardrobe/page.tsx` | 衣柜列表 |
| `/add` | `src/app/add/page.tsx` | 添加衣物 |
| `/add/category` | `src/app/add/category/page.tsx` | 选择类别 |
| `/add/success` | `src/app/add/success/page.tsx` | 添加成功 |
| `/profile` | `src/app/profile/page.tsx` | 宝宝档案 |
| `/profile/add` | `src/app/profile/add/page.tsx` | 新增宝宝 |
| `/profile/edit` | `src/app/profile/edit/page.tsx` | 编辑宝宝 |
| `/lessons/login` | `src/app/lessons/login/page.tsx` | 课程系统登录 |
| `/lessons/day/[dayIndex]` | `src/app/lessons/day/[dayIndex]/page.tsx` | 课程日视图 |
| `/auth/callback` | `src/app/auth/callback/route.ts` | Supabase OAuth 回调 |

**布局与全局：**

| 文件 | 说明 |
|------|------|
| `src/app/layout.tsx` | 根布局 |
| `src/app/globals.css` | 全局样式 / Tailwind |
| `src/app/loading.tsx` | 全局 loading |
| `src/app/error.tsx` | 全局错误边界 |
| `src/app/lessons/layout.tsx` | 课程模块布局 |
| `src/middleware.ts` | Supabase session 中间件 |

### 2.3 UI 组件

#### Stitch 设计系统（主 UI）

路径：`src/components/stitch/`

| 组件 | 用途 |
|------|------|
| `app-shell.tsx` | 应用外壳（header + nav + content） |
| `app-header.tsx` | 顶栏 |
| `bottom-nav.tsx` | 底部导航 |
| `dashboard-recommendations.tsx` | 推荐卡片区域 |
| `outfit-card.tsx` | 单套穿搭卡片 |
| `scenario-tabs.tsx` | 室内/外出/睡眠场景切换 |
| `why-this-works.tsx` | 推荐理由说明 |
| `live-weather-section.tsx` | 实时天气区块 |
| `weather-widget.tsx` | 天气小组件 |
| `wardrobe-view.tsx` | 衣柜视图 |
| `add-clothing-form.tsx` | 添加衣物表单 |
| `add-baby-form.tsx` | 添加宝宝表单 |
| `edit-baby-form.tsx` | 编辑宝宝表单 |
| `baby-birth-date-field.tsx` | 出生日期选择 |
| `category-picker.tsx` | 类别选择器 |
| `size-picker.tsx` | 尺码选择器 |
| `option-chips.tsx` | 选项 Chip 组 |
| `material-icon.tsx` | 材质图标 |
| `page-loading-skeleton.tsx` | 页面骨架屏 |

#### 业务组件

| 路径 | 说明 |
|------|------|
| `src/components/dashboard-cards.tsx` | Dashboard 卡片 |
| `src/components/sign-out-button.tsx` | 登出按钮 |
| `src/components/lessons/lesson-list-item.tsx` | 课程列表项 |
| `src/components/lessons/lessons-day-page.tsx` | 课程日页面 |
| `src/components/lessons/schedule-context-banner.tsx` | 排课上下文横幅 |

#### 静态资源

| 路径 | 说明 |
|------|------|
| `public/avatars/baby-boy-default.jpg` | 默认男宝头像 |
| `public/avatars/baby-girl-default.jpg` | 默认女宝头像 |

### 2.4 BFF API Routes（Next.js 服务端）

路径：`src/app/api/`

| 路由 | 文件 | 功能 |
|------|------|------|
| `GET/POST /api/babies` | `babies/route.ts` | 宝宝 CRUD |
| `PATCH/DELETE /api/babies/[id]` | `babies/[id]/route.ts` | 单个宝宝 |
| `GET/POST /api/clothing` | `clothing/route.ts` | 衣柜 CRUD |
| `POST /api/clothing/parse-url` | `clothing/parse-url/route.ts` | 淘宝链接解析 |
| `POST /api/clothing/parse-image` | `clothing/parse-image/route.ts` | 图片识别解析 |
| `POST /api/clothing/preview-warmth` | `clothing/preview-warmth/route.ts` | 保暖预览 |
| `POST /api/clothing/[id]/favorite` | `clothing/[id]/favorite/route.ts` | 收藏切换 |
| `GET /api/weather` | `weather/route.ts` | Open-Meteo 天气代理 |
| `POST /api/profile/location` | `profile/location/route.ts` | 保存地理位置 |

### 2.5 前端业务逻辑（lib）

| 文件 | 分类 | 说明 |
|------|------|------|
| `lib/supabase/client.ts` | 基础设施 | 浏览器 Supabase 客户端 |
| `lib/supabase/server.ts` | 基础设施 | 服务端 Supabase 客户端 |
| `lib/supabase/middleware.ts` | 基础设施 | Session 刷新 |
| `lib/env.ts` | 基础设施 | 环境变量读取 |
| `lib/db/types.ts` | 数仓类型 | DB 行类型定义 |
| `lib/clothing-enums.ts` | 领域规范 | 枚举常量（对齐 specs） |
| `lib/clothing-categories.ts` | 领域规范 | 类别层级 |
| `lib/clothing-display.ts` | 领域逻辑 | 展示格式化 |
| `lib/clothing-weight.ts` | 领域逻辑 | 衣物重量/保暖 |
| `lib/warmth-score.ts` | 领域逻辑 | 保暖评分 |
| `lib/suggest-size.ts` | 领域逻辑 | 尺码推荐 |
| `lib/wardrobe.ts` | 领域逻辑 | 衣柜操作 |
| `lib/baby-profile.ts` | 领域逻辑 | 宝宝档案 |
| `lib/profile.ts` | 领域逻辑 | 用户 profile |
| `lib/dashboard.ts` | 领域逻辑 | Dashboard 数据聚合 |
| `lib/weather.ts` | 外部集成 | 天气 API |
| `lib/device-location.ts` | 外部集成 | 设备定位 |
| `lib/taobao-product-parser.ts` | 外部集成 | 淘宝商品解析 |
| `lib/vision-product-parser.ts` | 外部集成 | 视觉商品解析 |
| `lib/onebound-item-get.ts` | 外部集成 | OneBound API |
| `lib/product-catalog.ts` | 外部集成 | 商品目录 |
| `lib/product-parse-response.ts` | 外部集成 | 解析响应结构 |
| `lib/stitch-utils.ts` | UI 工具 | Stitch 组件辅助 |
| `lib/lessons/api.ts` | Lessons 集成 | 调用 NestJS 后端 |
| `lib/lessons/auth-context.tsx` | Lessons 集成 | JWT 认证上下文 |
| `lib/lessons/types.ts` | Lessons 集成 | 课程类型定义 |

### 2.6 Hooks

| 文件 | 说明 |
|------|------|
| `src/hooks/use-pull-to-refresh.ts` | 下拉刷新 |

### 2.7 运维脚本

路径：`web/scripts/`

| 脚本 | 说明 |
|------|------|
| `import-taobao-catalog.mjs` | 批量导入淘宝商品目录 |
| `apply-migration.mjs` | 手动执行 migration |
| `apply-migration-007.mjs` | 执行 007 商品目录 migration |
| `apply-migration-enum-spec.mjs` | 执行枚举 spec migration |
| `clear-dirty-data.mjs` | 清理脏数据 |
| `db-env.mjs` | 读取 DB 连接环境变量 |
| `db-ping.mjs` | 测试 DB 连通性 |

---

## 三、后端服务（NestJS 风格 NestJS Lessons API）

路径：`warmrobot/backend/`

> 独立 NestJS 服务，**未纳入** npm workspaces，需单独 `npm install && npm run dev`。

### 3.1 工程配置

| 文件 | 说明 |
|------|------|
| `package.json` | NestJS 依赖 |
| `tsconfig.json` | TS 配置 |
| `nest-cli.json` | Nest CLI |
| `.env.example` / `.env` | 数据库与 JWT 密钥 |
| `README-lessons.md` | 课程模块说明 |

### 3.2 应用入口

| 文件 | 说明 |
|------|------|
| `src/main.ts` | 启动入口 |
| `src/app.module.ts` | 根模块 |

### 3.3 认证模块（auth/）

| 文件 | 说明 |
|------|------|
| `auth.controller.ts` | 登录接口 |
| `auth.service.ts` | JWT 签发 |
| `auth.module.ts` | 模块定义 |
| `dto/login.dto.ts` | 登录 DTO |
| `guards/jwt-auth.guard.ts` | JWT 守卫 |
| `guards/roles.guard.ts` | 角色守卫 |
| `strategies/jwt.strategy.ts` | Passport JWT 策略 |
| `decorators/current-user.decorator.ts` | 当前用户装饰器 |
| `decorators/roles.decorator.ts` | 角色装饰器 |

### 3.4 课程模块（lessons/）

| 文件 | 说明 |
|------|------|
| `lessons.controller.ts` | REST 接口 |
| `lessons.service.ts` | 排课业务逻辑 |
| `lessons.module.ts` | 模块定义 |
| `types/lesson-schedule.types.ts` | 排课类型 |
| `dto/create-lesson.dto.ts` | 创建课程 |
| `dto/update-lesson.dto.ts` | 更新课程 |
| `dto/reorder-lessons.dto.ts` | 重排课程 |
| `dto/set-day-substitution.dto.ts` | 设置代课 |
| `dto/set-day-teacher-assignment.dto.ts` | 设置教师 |
| `dto/upsert-day-permissions.dto.ts` | 日权限 |

### 3.5 用户 & 数据库

| 文件 | 说明 |
|------|------|
| `users/users.service.ts` | 用户查询 |
| `users/users.module.ts` | 用户模块 |
| `prisma/prisma.service.ts` | Prisma 客户端 |
| `prisma/prisma.module.ts` | Prisma 模块 |
| `common/constants/roles.ts` | 角色常量 |

### 3.6 后端脚本

| 脚本 | 说明 |
|------|------|
| `scripts/run-dev.mjs` | 开发启动 |
| `scripts/prisma-with-env.mjs` | 带 env 的 Prisma CLI |
| `scripts/load-db-env.mjs` | 加载 DB 环境变量 |
| `scripts/apply-lessons-schema.mjs` | 应用 lessons schema |

---

## 四、共享算法层

路径：`warmrobot/packages/core/`

| 文件 | 说明 |
|------|------|
| `src/index.ts` | 导出入口 |
| `src/recommend-outfit.ts` | **核心**：三套穿搭推荐算法 |
| `src/required-warmth.ts` | 所需保暖量计算 |
| `src/weather.ts` | 天气数据解析 |
| `src/types.ts` | 共享类型（ClothingItem、Weather 等） |
| `package.json` | 包定义 |
| `tsconfig.json` | TS 配置 |

> 被 `web` 通过 workspace 依赖直接引用源码，无需单独 build。

---

## 五、数仓 / 数据库

### 5.1 Supabase 主库（宝宝穿衣业务）

路径：`warmrobot/supabase/`

| 文件 | 说明 |
|------|------|
| `config.toml` | 本地 Supabase 配置 |
| `.gitignore` | Supabase 本地状态忽略 |

#### 正式 Migrations（按时间戳，`supabase db reset` 使用）

| 文件 | 说明 |
|------|------|
| `20240101000001_initial_schema.sql` | 初始 schema（用户、宝宝、衣柜） |
| `20240101000002_storage_setup.sql` | Storage bucket |
| `20240101000003_materials.sql` | 材质表 |
| `20240101000004_fix_schema.sql` | Schema 修复 |
| `20240101000005_seed_mock_data.sql` | Mock 种子数据 |
| `20240101000006_stitch_ui_fields.sql` | Stitch UI 字段 |
| `20240101000007_product_catalog.sql` | 商品目录 |
| `20240101000008_baby_profile_fields.sql` | 宝宝档案扩展 |
| `20240101000009_clothing_fit_type.sql` | 版型枚举 |
| `20240101000010_clothing_category_enum_values.sql` | 类别枚举值 |
| `20240101000011_clothing_category_hierarchy.sql` | 类别层级 |
| `20240101000012_enum_spec_values.sql` | 枚举 spec 值（Step 1） |
| `20240101000013_enum_spec_sync.sql` | 枚举 spec 同步（Step 2） |
| `20240101000014_code_query_indexes.sql` | 应用查询对齐的索引 |

#### 已归档（旧版手动 SQL，勿用于 db reset）

路径：`_archive/legacy/` — 原 `001`–`006` 文件，内容与 timestamp 版重复。

#### 运维脚本

| 文件 | 说明 |
|------|------|
| `scripts/clear_dirty_data.sql` | 清理脏数据 SQL |

### 5.2 Lessons 独立库（Prisma）

路径：`warmrobot/backend/prisma/`

| 文件 | 说明 |
|------|------|
| `schema.prisma` | Prisma schema 定义 |
| `seed.ts` | 种子数据 |
| `lessons-schema.sql` | 原始 SQL schema |
| `migrations/20250706120000_lessons_schedule/migration.sql` | 排课 migration |

---

## 六、文档与规范

路径：`docs/`

| 文件 | 分类 | 说明 |
|------|------|------|
| `PROJECT-INDEX.md` | 架构 | **本文件** — 全项目分类索引 |
| `wardrobe-scan-feasibility.md` | 功能说明 | 衣柜拍照识别能力、堆叠场景局限、淘宝补全路径 |
| `specs/enums.md` | 领域规范 | 衣服枚举、尺码、材质白名单（原 `枚举.md`） |

| 文件 | 分类 | 说明 |
|------|------|------|
| `AGENTS.md` | 架构 | Cursor Cloud Agent 运行指南（保留在仓库根） |
| `warmrobot/README.md` | 架构 | 主应用快速开始 |

---

## 七、部署 / DevOps / 工程根

| 文件 | 分类 | 说明 |
|------|------|------|
| `package.json` | 工程 | 根脚本：`dev` / `build` / `import:catalog` 代理到 warmrobot |
| `netlify.toml` | 部署 | Netlify 构建：`warmrobot/web` + OpenNext |
| `.gitignore` | 工程 | 全局忽略规则 |
| `warmrobot/package.json` | 工程 | Workspaces 定义（core + web） |
| `warmrobot/package-lock.json` | 工程 | 锁文件 |

---

## 八、待清理 / 非应用代码

| 路径 | 状态 | 建议 |
|------|------|------|
| `brd/` | `.gitignore` 忽略，仅含 `node_modules` | 可安全删除整个目录 |
| `dev:clean` | 空文件，已 gitignore | 可删除 |
| `npm` | 空文件，已 gitignore | 可删除 |
| `warmrobot/backend/dist/` | 编译产物 | 不提交，可 `rm -rf` |
| `warmrobot/web/.next/` | 构建缓存 | 不提交 |
| `*.tsbuildinfo` | TS 增量缓存 | 不提交 |

---

## 九、按业务域快速查找

| 我想找… | 去这里 |
|---------|--------|
| 页面长什么样 | `web/src/app/` + `web/src/components/stitch/` |
| 推荐算法怎么算 | `packages/core/src/recommend-outfit.ts` |
| 枚举值定义 | `docs/specs/enums.md` + `web/src/lib/clothing-enums.ts` |
| 数据库表结构 | `supabase/migrations/` + `web/src/lib/db/types.ts` |
| 淘宝商品导入 | `web/scripts/import-taobao-catalog.mjs` |
| 课程排课 API | `backend/src/lessons/` |
| 登录鉴权 | Supabase: `web/src/lib/supabase/`；Lessons: `backend/src/auth/` |
| 环境变量 | `web/.env.local.example`、`backend/.env.example` |
| 本地启动 | `AGENTS.md` 或 `warmrobot/README.md` |
