# Baby Outfit — 宝宝穿衣助手

Web 端应用：根据天气和宝宝衣柜推荐今日穿搭。

## 前置条件

- Node.js 18+
- Supabase 项目（001–005 migration 已执行）

## 快速开始

```bash
cd baby-outfit

# 1. 配置环境变量
cp web/.env.local.example web/.env.local
# 编辑 web/.env.local，填入 Supabase URL 和 anon key

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开 http://localhost:3000 ，使用 demo 账号登录：

```
demo_user_1@baby-outfit.dev
password123
```

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
