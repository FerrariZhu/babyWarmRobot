# LittleCompass 宝宝穿衣助手 — 商业需求文档（BRD）

> **文档版本**：v1.0  
> **产品代号**：LittleCompass / Baby Outfit  
> **载体形态**：小程序（主传播渠道）+ Web（当前 MVP）  
> **整理日期**：2026 年 6 月

---

## 一、文档摘要

LittleCompass 是一款面向 **0–3 岁婴幼儿家庭** 的智能穿衣决策工具。产品通过 **虚拟衣柜 + 天气感知 + 保暖值算法**，为新手爸妈（尤其是宝妈）提供科学、可执行的每日穿搭建议（OOTD），解决「今天该给宝宝穿几件、穿什么」的日常焦虑。

**一句话定位**：用数据和算法，把爸妈对宝宝的爱，翻译成每一天刚刚好、不冷不热的穿衣方案。

---

## 二、立项背景与初衷

### 2.1 真实痛点来源

项目源于创始人家庭的真实经历：家中迎来新生儿后，在 0–3 岁阶段，家长几乎每天都会面临同一个难题——**不知道该怎么给宝宝穿衣服**。

典型场景：

| 条件 | 家长困惑 |
|------|----------|
| 气温 16°C，但风力较大 | 穿少了怕着凉，穿多了怕出汗感冒 |
| 当天有较多户外活动 | 静止和活动时的保暖需求差异大 |
| 室内室外频繁切换 | 同一套衣服很难兼顾两种场景 |
| 宝宝不会表达冷热 | 只能靠家长「猜」，试错成本高 |

理想方案往往是 **洋葱式分层穿搭**：打底棉衣 + 薄外套 + 防风外层，既保暖又便于根据活动量增减。但这种经验依赖长期摸索，新手父母很难快速掌握。

### 2.2 立项动机

- **情感驱动**：出于父母对孩子的关爱，希望把个人经验产品化，帮助更多家庭
- **决策工具缺失**：市场上缺少专注婴幼儿、结合天气与衣柜的穿衣决策产品
- **科学育儿趋势**：年轻父母更愿意接受数据化、可解释的建议，而非纯经验主义

---

## 三、目标用户

### 3.1 核心用户画像

| 维度 | 描述 |
|------|------|
| **角色** | 0–3 岁宝宝的家长，决策主导者为 **宝妈** |
| **年龄** | 约 20–30 岁年轻女性 |
| **特征** | 新手父母、关注宝宝健康、有较强消费意愿与购买力 |
| **痛点** | 穿衣决策焦虑、信息碎片化、缺乏可量化参考 |
| **爸爸参与度** | 相对较低，产品交互与文案优先服务妈妈视角 |

### 3.2 扩展用户（中长期）

- 关注穿搭与生活方式的 **全年龄段女性用户**
- 对「今日运势 / 幸运色 / 场景穿搭」有兴趣的用户（星座、黄历、约会、面试等场景）
- 可复用同一套「衣柜 + 场景 + 推荐」引擎，横向扩展至成人穿搭

---

## 四、产品愿景与价值主张

### 4.1 愿景

成为 **婴幼儿家庭最信赖的每日穿衣决策助手**，未来延伸至全人群智能穿搭平台。

### 4.2 核心价值主张

```
真实天气  →  计算「当日所需温度值」
虚拟衣柜  →  计算「每件衣服保暖贡献」
智能搭配  →  推荐最接近目标温度值的 OOTD
```

用户无需记住复杂规则，打开 App 即可获得 **科学、可执行、可解释** 的穿搭方案。

### 4.3 产品形态

- **短期**：Web 应用验证核心算法与录入流程（当前 MVP：LittleCompass）
- **中期**：微信小程序，便于分享传播与日常使用
- **长期**：穿搭社区、电商导流、场景化增值服务

---

## 五、核心产品逻辑

### 5.1 关键概念定义

| 术语 | 定义 |
|------|------|
| **温度值** | 基于当日天气（气温、体感、湿度、风力、降水等）、宝宝档案（月龄、活动量、怕冷/怕热偏好）、使用场景（室内/外出/睡眠）综合计算出的 **目标保暖指数**（0–100） |
| **保暖值** | 单件衣物基于材质、厚度、类目、尺码、版型、克重等属性计算出的 **单品保暖贡献** |
| **OOTD** | 从虚拟衣柜中选取若干单品，使其保暖值之和 **最接近当日温度值** 的推荐搭配方案 |
| **洋葱式穿搭** | 按内层 → 中层 → 外层 → 配件分层组合，避免「一件厚棉袄打天下」 |

### 5.2 推荐流程

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  精准定位    │ ──▶ │  实时天气数据  │ ──▶ │ 计算温度值   │
│ （小区级）   │     │ Open-Meteo 等 │     │  例：30     │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                 │
┌─────────────┐     ┌──────────────┐            ▼
│  虚拟衣柜    │ ──▶ │ 单品保暖值    │     ┌─────────────┐
│ 全部衣物属性  │     │ 材质/版型/尺码 │ ──▶ │ 分层搭配算法  │
└─────────────┘     └──────────────┘     │  目标 ≈ 30   │
                                          └──────┬──────┘
                                                 ▼
                                          ┌─────────────┐
                                          │ 今日 OOTD   │
                                          │ 标准/偏暖/偏凉│
                                          └─────────────┘
```

### 5.3 场景支持

- **室内**：活动量低，偏舒适透气
- **外出**：考虑风力、降水，倾向防风防水外层
- **睡眠**：睡袋/连体衣优先，安全保暖

### 5.4 推荐变体

同一天气下提供三套方案：**标准 / 偏暖 / 偏凉**，适配不同体质与家长偏好。

---

## 六、功能规划

### 6.1 MVP 功能（已实现 / 进行中）

| 模块 | 功能 | 状态 |
|------|------|------|
| 用户体系 | 邮箱登录、宝宝档案 | ✅ |
| 宝宝档案 | 姓名、性别、生日、身高体重、温度偏好 | ✅ |
| 虚拟衣柜 | 衣物录入、分类（7 一级 / 23 二级）、材质/厚度/版型 | ✅ |
| 天气服务 | 定位 + Open-Meteo 实时天气 | ✅ |
| 推荐引擎 | 温度值计算、洋葱式分层、三套变体 | ✅ |
| 衣物录入 | 淘宝链接解析、分享文案解析、截图 AI 识别、手动录入 | ✅ |
| 商品数据 | 万邦 API 聚合商品信息 | ✅ |

### 6.2 近期规划

- [ ] 衣柜 CRUD 完整体验优化
- [ ] 用户反馈闭环（太冷 / 刚好 / 太热）
- [ ] 衣物图片上传（Supabase Storage）
- [ ] 微信小程序版本
- [ ] 衣柜缺口推荐（温度值无法满足时推荐购买）

### 6.3 中长期规划

- 黄历 / 幸运色 / 星座穿搭建议（创造需求、提升粘性）
- 场景穿搭（约会、面试、聚会等）
- 电商导流与广告变现
- 扩展至成人女性穿搭市场

---

## 七、三大核心难点与应对策略

### 难点一：如何让用户低成本录入虚拟衣柜？

**挑战**：

- 一个宝宝完整衣柜可达 **上百件**（含帽子、围巾、手套、袜子、鞋子等）
- 存量衣物录入成本极高，决定产品能否真正可用
- 新增衣物需养成「买完就录」习惯，门槛仍不低

**调研过的路径**：

| 方案 | 结论 |
|------|------|
| 爬虫直接抓取淘宝 | ❌ 反爬极强，不可行 |
| AI 截图识别 | ⚠️ 可行但准确率有限，作补充 |
| 淘宝开放 API 直连 | ❌ 倾向服务商家 ERP，不对第三方开放 |
| **万邦等聚合 API 供应商** | ✅ 当前选用，按链接获取材质/价格等 |

**产品策略（三路并行）**：

1. **商品链接导入**（主路径）：淘宝/天猫链接 → 万邦 API → 自动填充名称、材质、类目等
2. **分享文案 + 截图识别**（辅路径）：淘宝分享文案含商品信息 + AI 识图，满足约 80% 信息收集
3. **极简手动录入**（兜底）：压缩枚举、全屏分类选择、自动估算重量与保暖值，降低理解成本

**成本参考**：万邦 API 最低消费约 ¥1000+，对小体量产品可接受。

---

### 难点二：如何精确计算「当日温度值」？

**挑战**：

- 城市级天气预报不够精确（如上海报小雨，嘉定南翔实际不下雨）
- 风力、湿度、气压、降水概率等都会影响体感
- 同一温度下，室内 / 室外 / 睡眠需求差异大

**应对策略**：

- **精确定位**到区/街道级，获取局部天气
- 综合 **体感温度、湿度、风速、降水概率** 修正
- 叠加 **宝宝月龄、活动量、家长设置的温度偏好**
- 区分 **室内 / 外出 / 睡眠** 三大场景
- 输出统一术语 **「温度值」**，便于用户理解与算法对齐

---

### 难点三：如何计算每件衣服的保暖值？

**挑战**：

- 材质、厚度、类目、尺码、版型、克重均影响保暖
- 同款棉服：宽松版保暖弱于修身版——需量化
- 配件（帽子、袜子、手套）有 **加分项** 而非简单叠穿
- 需避免「一件棉袄保暖值 30，当天只推这一件」的荒谬结果

**应对策略**：

- 建立 **类目系数 × 材质基础分 × 厚度系数 × 版型系数 + 配件加分 + 克重修正** 公式
- 强制 **洋葱式分层**：内层 + 中层 + 外层 + 必要配件
- 单品保暖值可预览，录入时即可看到 TOG 等效值
- 枚举压缩：7 一级分类 + 23 二级分类，覆盖真实育儿场景

---

## 八、商业模式与变现思路

| 方向 | 说明 |
|------|------|
| **电商导流** | 衣柜无法满足温度值时，推荐购买缺口单品（创造需求） |
| **广告** | 母婴品牌、服饰品牌定向投放 |
| **增值服务** | 场景穿搭、玄学/运势穿搭、会员专属推荐 |
| **数据价值** | 脱敏后的穿搭偏好与消费趋势 |

---

## 九、技术实现路径

> 本节面向「如何把想法变成能跑的产品」——尤其适合非全职研发背景、借助 AI 工具落地的团队。

### 9.1 总体思路：先看见，再储存，最后算清楚

传统研发从后端数据库起手；本项目采用 **「前端可视化优先」** 路径：

1. **聊清楚**：用 ChatGPT 把零散想法整理成 BRD、用户故事和提示词  
2. **看得见**：用 Google Stitch 生成可点击原型，确定页面与交互  
3. **写得动**：用 Cursor / Trae 根据原型写 Next.js 前端  
4. **存得住**：把业务场景描述给 AI，生成 Supabase 表结构与 migration SQL  
5. **跑得通**：接入天气、商品、识图等 API，封装核心算法包  

**原则**：不会写接口时，讲清业务场景让 AI 生成 API 路由与时序图；能接第三方 API 就不自建；能缓存就不重复调用。

### 9.2 产品设计工具链

| 工具 | 用途 |
|------|------|
| **ChatGPT** | 需求梳理、提示词优化、BRD 结构化 |
| **Google Stitch** | 产品原型 / Demo 生成，接近 Figma 的交互迭代 |
| **Stitch MCP** | 设计稿与编程工具对接，减少「想象界面」成本 |

### 9.3 开发工具链

| 工具 | 用途 |
|------|------|
| **Cursor / Trae** | AI 辅助编程（Trae 约 $10/月，Token 更充裕） |
| **Next.js 15** | Web 前端 + API Routes（当前 MVP 载体） |
| **Supabase** | PostgreSQL 数据库 + Auth + Storage（小体量近乎免费） |
| **Open-Meteo** | 免费天气数据 |
| **万邦 API** | 淘宝/天猫商品信息聚合 |
| **OpenAI Vision** | 商品截图识别（可选） |

### 9.4 项目结构（当前仓库）

```
baby-outfit/
├── packages/core/     # 推荐算法（Web + 未来小程序复用）
├── web/               # Next.js 前端与 API
└── supabase/          # 数据库 migration 脚本
```

### 9.5 数据架构（核心表）

| 表 | 存什么 |
|----|--------|
| `babies` | 宝宝档案（生日、性别、身高体重、尺码） |
| `baby_warmth_preferences` | 温度偏好（怕冷/怕热） |
| `clothing_items` | 衣柜单品（类目、材质、厚度、版型、保暖值） |
| `categories` / `materials` / `thicknesses` | 枚举常量（7 一级 + 23 二级分类） |
| `outfit_recommendations` | 推荐记录与反馈 |
| `product_catalog` | 淘宝商品缓存，降低万邦 API 调用 |

**建表方式**：向 AI 描述业务场景（如「用户录入一件衣服需要哪些字段」），生成 migration SQL，在 Supabase SQL Editor 执行。

### 9.6 核心算法包（`packages/core`）

与 UI 解耦，供 Web 与未来微信小程序复用：

| 函数 | 作用 |
|------|------|
| `calcRequiredWarmth()` | 根据天气 + 宝宝 + 场景 → **温度值** |
| `recommendOutfit()` | 洋葱式分层，从衣柜凑出 OOTD |
| `recommendAllVariants()` | 标准 / 偏暖 / 偏凉 三套方案 |

### 9.7 从零到 MVP 的实际步骤

1. 语音/文字记录痛点 → ChatGPT 整理 BRD  
2. Stitch 出可点击原型（首页、衣柜、录入、档案）  
3. Next.js 实现前端页面与组件  
4. AI 生成 Supabase schema + migration（001–011 迭代）  
5. 接入 Open-Meteo 天气、万邦商品解析、OpenAI 截图识别  
6. `packages/core` 封装推荐算法，前后端联调  
7. 持续打磨：分类体系、版型、录入体验、全屏分类选择页  

### 9.8 外部依赖与成本（参考）

| 服务 | 用途 | 成本量级 |
|------|------|----------|
| Supabase | 数据库 + 登录 | 小体量免费 |
| 万邦 API | 商品链接解析 | 约 ¥1000 起 |
| OpenAI API | 截图识别 | 按量计费 |
| Trae / Cursor | AI 编程 | $10–20/月 |
| Open-Meteo | 天气 | 免费 |

---

## 十、代码实现详解

本节基于当前仓库 `baby-outfit/` 的真实代码，说明「从请求到推荐」的完整链路。

### 10.1 仓库结构与职责划分

```
baby-outfit/
├── packages/core/          # 纯 TypeScript 算法包，无 React/DB 依赖
│   ├── required-warmth.ts  # 温度值计算
│   ├── recommend-outfit.ts # 洋葱式搭配推荐
│   ├── weather.ts          # Open-Meteo 封装
│   └── types.ts            # 共享类型（ClothingCategory 等）
├── web/                    # Next.js 15 App Router
│   ├── src/app/            # 页面 + API Routes
│   ├── src/components/     # UI 组件（Stitch 风格）
│   └── src/lib/            # 数据访问、解析器、工具函数
└── supabase/migrations/    # PostgreSQL schema（001–011）
```

**设计原则**：

- **算法与 UI 解耦**：`packages/core` 可被 Web 和未来微信小程序直接 `import`
- **常量表在 DB**：材质、厚度、类目系数存在 `materials` / `thicknesses` / `categories`，改系数不必发版
- **保暖值双轨计算**：数据库 trigger 自动算入库分值；前端预览用 TS 镜像函数 `computeWarmthScore()`

### 10.2 技术栈与运行时

| 层 | 技术 | 说明 |
|----|------|------|
| 前端 | Next.js 15 + React 19 | App Router，Server Component 拉数据 |
| 样式 | Tailwind CSS 4 + 自定义 CSS | Stitch 设计 token（`globals.css`） |
| 认证 | Supabase Auth | 邮箱登录，`middleware.ts` 刷新 session |
| 数据库 | Supabase PostgreSQL | RLS 行级安全，migration 版本管理 |
| 天气 | Open-Meteo | `packages/core/weather.ts`，服务端 30 分钟缓存 |
| 商品 | 万邦 OneBound API | `onebound-item-get.ts` |
| 识图 | OpenAI Vision | `vision-product-parser.ts`（可选） |

### 10.3 首页推荐：端到端数据流

用户打开首页 `/` 时，服务端执行 `getDashboardData()`（`web/src/lib/dashboard.ts`）：

```
1. supabase.auth.getUser()           → 鉴权
2. 并行查询：
   - profiles（城市/经纬度）
   - babies（当前宝宝档案）
   - baby_warmth_preferences（怕冷/怕热偏移）
   - clothing_items（衣柜，按 warmth_score 排序）
   - getWeatherForProfile()         → Open-Meteo
3. 组装 BabyProfile + WardrobeItem[]
4. recommendAllVariants({ weather, baby, wardrobe, scenario })
   → 返回 [标准, 偏暖, 偏凉] 三套 RecommendResult
5. 页面组件渲染天气卡片 + OOTD 卡片
```

**关键代码路径**：

- 页面：`web/src/app/page.tsx`
- 数据聚合：`web/src/lib/dashboard.ts`
- 推荐算法：`packages/core/src/recommend-outfit.ts`

### 10.4 温度值算法（`calcRequiredWarmth`）

文件：`packages/core/src/required-warmth.ts`

**输入**：天气快照、宝宝档案（生日、活动量、warmthOffset）、场景、时段、变体

**计算逻辑（简化）**：

```
score = 体感温度映射基础分（feelsLike → 10~95）
      + 湿度修正（>80% +5，<30% -3）
      + 风力修正（windSpeed × 1.5，上限 +10）
      + 降水概率修正（>50% +3）
      + 月龄修正（<3月 +8，<6月 +4）
      + 活动量修正（low +3，high -5）
      + 场景修正（室内 -10，外出 +5，睡眠 -5）
      + 时段修正（早晚 +2~5）
      + 变体修正（偏暖 +10，偏凉 -10）
      + 家长偏好 warmthOffset
→ clamp(0, 100)
```

### 10.5 搭配推荐算法（`recommendOutfit`）

文件：`packages/core/src/recommend-outfit.ts`

**分层映射**（`LAYER_BY_CATEGORY`）：

| 层级 | 类目示例 |
|------|----------|
| 1 内层 | 连体、打底、长裤 |
| 2 中层 | 毛衣、卫衣、马甲 |
| 3 外层 | 羽绒服、棉服、雨衣 |
| 0 配件 | 帽子、袜子、手套、围巾 |

**推荐流程**：

1. `filterWardrobe()`：过滤不可用、尺码不匹配单品  
2. 非睡眠场景：按层 1→2→3 各选一件，目标 warmth 按 35% / 35% / 30% 分配  
3. 睡眠场景：从睡袋/睡衣/连体中挑最接近目标的一件  
4. 天气附加规则：  
   - 体感 < 15°C → 尝试加帽子  
   - 体感 < 10°C → 尝试加袜子  
   - 体感 < 5°C → 尝试加手套  
   - 大风或下雨 → 优先推防风/雨衣外层  
5. `recommendAllVariants()` 分别以 default / warmer / cooler 调用，偏暖 +10、偏凉 -10  

### 10.6 单品保暖值：公式与双轨实现

**公式**（DB 函数 `compute_warmth_score` 与 TS `computeWarmthScore` 一致）：

```
保暖值 = 材质基础分 × 厚度系数 × 类目覆盖系数 + 配件加分 + 重量修正
重量修正 = (weight_grams - 500) / 100 × 2
```

**数据库自动计算**（`004_fix_schema.sql`）：

- `clothing_items` 表有 `BEFORE INSERT/UPDATE` trigger
- 写入时自动根据 `category + material_id + thickness + weight_grams` 填 `warmth_score`

**前端实时预览**（录入表单）：

- 用户选手动字段 → `POST /api/clothing/preview-warmth`
- 查 `materials.base_warmth`、`thicknesses.multiplier`、`categories.coverage_multiplier`
- 重量可用 `estimateClothingWeightGrams()` 按类目+尺码+材质+厚度+版型估算
- 返回 `warmth_score` + `weight_grams`，表单展示 TOG 等效值

### 10.7 衣物录入：三条代码路径

#### 路径 A：淘宝链接解析

```
用户粘贴链接/分享文案
  → POST /api/clothing/parse-url
  → splitPastedProductInput() 拆出 URL + 「商品名」
  → parseTaobaoProductUrl()
       1. extractTaobaoItemId()
       2. fetchOneboundItem()（万邦 API，需 ONEBOUND_API_KEY）
       3. 失败则 fetchTaobaoHtml() + parseProductHtml()
       4. inferCategoryFromTitle() / inferThicknessFromTitle()（正则规则）
  → recordParseJob() 写入 url_parse_jobs
  → 返回 { name, category, material_id, thickness, ... }
  → 用户确认后 POST /api/clothing 入库
```

核心文件：`taobao-product-parser.ts`、`onebound-item-get.ts`、`parse-url/route.ts`

#### 路径 B：截图 AI 识别

```
用户上传图片
  → POST /api/clothing/parse-image（multipart）
  → extractProductFromScreenshot()（OpenAI Vision JSON 模式）
  → normalizeCategory() 校验 23 类类目
  → 同样走 applyParseData → POST /api/clothing
```

#### 路径 C：手动录入

```
/add 页面 AddClothingForm
  → /add/category 全屏分类选择（7 一级 / 23 二级）
  → 选手动字段，实时 preview-warmth
  → POST /api/clothing
       - isClothingCategory() 校验
       - estimateClothingWeightGrams() 估重
       - insert clothing_items（trigger 自动算 warmth_score）
```

### 10.8 API 路由一览

| 路由 | 方法 | 作用 |
|------|------|------|
| `/api/babies` | POST | 创建宝宝档案 |
| `/api/babies/[id]` | PATCH | 更新档案/温度偏好 |
| `/api/clothing` | POST | 新增衣柜单品 |
| `/api/clothing/parse-url` | POST | 解析淘宝链接 |
| `/api/clothing/parse-image` | POST | 截图 AI 识别 |
| `/api/clothing/preview-warmth` | POST | 录入时保暖值预览 |
| `/api/clothing/[id]/favorite` | PATCH | 收藏切换 |
| `/api/weather` | GET | 天气查询（定位/城市） |
| `/api/profile/location` | PATCH | 更新用户经纬度 |

### 10.9 数据库核心 Schema（Migration 演进）

| Migration | 内容 |
|-----------|------|
| 001 | 初始 schema：babies、clothing_items、enum 类型 |
| 004 | categories/materials 常量表、`compute_warmth_score`、trigger |
| 007 | product_catalog 商品缓存表 |
| 008 | 宝宝性别/身高体重、warmth_preference |
| 009 | clothing_items.fit_type 版型字段 |
| 010–011 | 23 二级类目 enum + categories 分组 |

**RLS 策略**：用户只能读写自己的 `clothing_items`、`babies`；常量表（categories 等）全员只读。

### 10.10 认证与中间件

- `web/src/middleware.ts`：除静态资源外，所有页面请求走 `updateSession()`
- Supabase SSR cookie 模式：`@supabase/ssr` 的 server/client 双端 client
- 未登录用户访问受保护页 → 重定向 `/login`

### 10.11 关键类型共享（`packages/core/types.ts`）

```typescript
ClothingCategory  // 23 个二级类目 code
WardrobeItem        // { id, name, category, warmthScore, sizeLabel, ... }
WeatherSnapshot     // { temp, feelsLike, humidity, windSpeed, ... }
RecommendResult     // { requiredWarmth, actualWarmth, pieces[], reason }
```

Web 层 `clothing-categories.ts` 提供 UI 用分组数据，与 DB `categories` 表保持 code 一致。

### 10.12 本地开发与部署

```bash
cd baby-outfit
npm install
cp web/.env.local.example web/.env.local
# 填入 SUPABASE_URL, SUPABASE_ANON_KEY, ONEBOUND_API_KEY 等
npm run dev          # 启动 Web
npm run db:migrate   # 执行 migration
npm run db:clear     # 清脏数据（开发用）
```

环境变量见 `web/.env.local.example`：Supabase、万邦 API、OpenAI（可选）、数据库直连（migration 脚本用）。

---

## 十一、竞争与差异化

| 维度 | 传统做法 | LittleCompass |
|------|----------|---------------|
| 决策依据 | 家长经验 / 搜索攻略 | 天气数据 + 衣柜实物的算法匹配 |
| 衣物管理 | 脑海记忆 / 相册 | 结构化虚拟衣柜 |
| 输出形式 | 模糊建议「多穿点」 | 具体 OOTD + 保暖指数 + 可解释原因 |
| 扩展性 | 无 | 可延伸至场景穿搭、玄学、电商 |

---

## 十二、风险与应对

| 风险 | 应对 |
|------|------|
| 衣柜录入门槛高 | 多路径录入 + 极简手动 + 批量导入 |
| 第三方 API 成本 | 万邦按量计费，缓存商品目录 |
| 算法准确度 | 用户反馈闭环持续校准 |
| 天气精度不足 | 定位细化 + 用户手动修正城市 |
| 市场体量 | 先深耕 0–3 岁垂直场景，再横向扩展 |

---

## 十三、里程碑路线图

```
Phase 1 — MVP 验证（当前）
  ├── Web 端核心闭环
  ├── 虚拟衣柜 + 推荐算法
  └── 淘宝链接 / 手动录入

Phase 2 — 体验打磨
  ├── 反馈闭环、图片上传
  ├── 衣柜缺口购买推荐
  └── 录入体验优化

Phase 3 — 小程序上线
  ├── 微信生态传播
  └── 分享 / 裂变机制

Phase 4 — 增长与变现
  ├── 场景穿搭 / 玄学玩法
  ├── 电商导流
  └── 成人穿搭扩展
```

---

## 十四、成功指标（建议）

| 指标 | 目标（上线 6 个月） |
|------|---------------------|
| 注册用户 | 5,000+ |
| 衣柜录入完成率 | ≥ 60% 用户录入 ≥ 10 件 |
| 日活推荐使用率 | ≥ 30% |
| 反馈「刚好」占比 | ≥ 50% |
| 次日留存 | ≥ 40% |

---

## 附录 A：术语表

| 术语 | 英文 | 说明 |
|------|------|------|
| 温度值 | Required Warmth | 当日目标保暖指数 |
| 保暖值 | Warmth Score | 单品保暖贡献 |
| OOTD | Outfit of the Day | 每日推荐穿搭 |
| 洋葱式穿搭 | Layering | 多层叠穿策略 |
| 虚拟衣柜 | Digital Wardrobe | 用户衣物数字档案 |

---

*本文档由语音转写稿整理，结合当前 MVP 实现状态更新。*
