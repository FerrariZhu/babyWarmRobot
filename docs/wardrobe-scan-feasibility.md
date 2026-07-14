# 堆叠衣柜照片识别与淘宝补全 — 可行方案说明

> 最后更新：2026-07-08

## 结论

**可以识别，但衣架挂放、大量重叠属于最难场景。** 项目已有完整流程（`/add/scan`），用 **Qwen3-VL** 从一张衣柜照片拆出多件婴儿服装，并尝试补全类别、厚度、材质等。此类照片**能识别部分衣物，但漏检、框不准、材质/版型猜测会明显变弱**。

**淘宝可以补细节，但目前只做了「文本相似匹配」，没有「以图搜图」。** 若找到对应商品链接或商品库里有相似 SKU，可以补全材质；**版型（`fit_type`）目前任何外部来源都不会自动填入**。

---

## 1. 已有能力（可直接用）

### 入口与配置

| 项目 | 路径 / 命令 |
|------|-------------|
| 统一照片入口 | `/add` → 「拍照 / 选图识别」（自动判断商品截图 vs 衣柜照片） |
| 多件审核页 | `/add/scan` → `warmrobot/web/src/components/stitch/scan-wardrobe-form.tsx`（衣柜照片可从此直达，或从 `/add` 自动跳转） |
| 场景分类 API | `POST /api/clothing/classify-photo-scene` |
| 扫描 API | `POST /api/clothing/scan-wardrobe` |
| CLI 测试 | `cd warmrobot/web && npm run test:wardrobe-vision -- photo.jpg` |
| 环境变量 | `warmrobot/web/.env.local.example` |

必需：

- `VISION_API_KEY`
- `VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct`（硅基流动）

可选：

- `BEAUTIFY_ENABLED=auto` — 裁剪后生成白底商品图
- `EMBEDDING_*` 或复用 `VISION_API_KEY` — 商品库文本匹配

### 端到端流程

```
/add 拍照/选图 → 场景分类（classify-photo-scene）
  → 商品页截图 → parse-image → 预填 /add 表单（单件）
  → 衣柜/平铺照片 → scan-wardrobe → /add/scan 审核 → bulk 入库
  → 无法判断 → 用户二选一后走对应分支

/add/scan 直达 → 缩放到长边 1280px → Qwen3-VL 多物品识别
  → items[]（名称/类别/厚度/材质/颜色/置信度/bounding_box）
  → [可选] 文本向量匹配 product_catalog
  → 按 bounding_box 裁剪 → [可选] Qwen-Image-Edit 白底美化
  → 用户审核 → POST /api/clothing/bulk 批量入库
```

核心文件：

- `warmrobot/web/src/lib/vision-photo-scene.ts` — 照片场景分类（商品截图 vs 衣柜）
- `warmrobot/web/src/lib/vision-wardrobe-parser.ts` — 视觉识别 prompt 与解析
- `warmrobot/web/src/lib/wardrobe-scan-pipeline.ts` — 商品库匹配、裁剪、美化
- `warmrobot/web/src/lib/multimodal-vision.ts` — SiliconFlow API 调用

### 能自动填的字段

| 字段 | 来源 | 堆叠场景可靠度 |
|------|------|----------------|
| 名称 | 视觉模型 | 中 |
| 类别（~25 种） | 视觉 + 可选商品库 | 中 |
| 厚度 | 视觉 + 可选商品库 | 低–中 |
| 材质 | 视觉猜测 或 商品库 → 关键词匹配 | 低 |
| 颜色 | 视觉 | 中 |
| 尺码 | 宝宝年龄推算（与照片无关） | — |
| **版型 fit_type** | **默认 regular，不自动识别** | 无 |
| fill_type / bodysuit_style 等 | 类别默认值 | 无 |

后处理阈值（`wardrobe-scan-pipeline.ts`）：

- 置信度 ≥ 0.85 → 自动勾选入库
- 商品库匹配：查询 ≥ 0.72；覆盖 vision 需 ≥ 0.78 且 vision 置信度 < 0.65

---

## 2. 堆叠/挂放样张预期

典型难点：衣架横向排满、大量遮挡、只能看到局部轮廓。

| 方面 | 预期 |
|------|------|
| 检出数量 | 可能 5–12 件，中间被挡住的易漏检 |
| bounding_box | 框可能偏大、跨越多件 |
| 类别 | 条纹 T 恤、牛仔等大致可判，连体/外套易混淆 |
| 材质 | 多为「棉质」等泛化猜测 |
| 版型 | 不会自动填 |
| 白底预览 | 重叠严重时 beautify 效果差 |

**不改代码也能提升识别率：**

1. 平铺在床/桌上，尽量单件不重叠
2. 分批拍，每次 5–8 件
3. 正对拍摄、自然光

---

## 3. 淘宝等方式补全细节

### 路径 A：已有 — 商品库文本匹配（扫描时）

- 导入：`npm run import:catalog -w web`
- Embedding：`npm run import:catalog:embeddings -w web`
- 用「名称+类别+颜色+材质猜测」做文本向量相似度，**不是图片搜索**

能补：标题、参考图、类别/厚度/材质 hint  
不能补：版型；且只有 catalog 里有的 SKU 能匹配

### 路径 B：已有 — 粘贴淘宝链接（单件）

- `/add` 粘贴 URL → OneBound `item_get`
- 适合认出某件后，有购买链接时单件精确补全

### 路径 C：未实现 — 以图搜图（拍立淘式）

```
裁剪单件 → 淘宝/第三方以图搜图 → Top-K 候选 → item_get 拉详情 → 映射字段 → 用户确认
```

可行选项（按难度）：OneBound 图片搜索 API、CLIP 视觉 embedding、裁剪图二次 VLM、审核页「搜索淘宝」深链 + 用户粘贴链接。

版型补全需从 OneBound `props` 解析「版型/宽松/修身」→ `fit_type` enum，当前 `product-parse-inference.ts` 未实现。

---

## 4. 技术架构对比

**当前方案：** 单一 VLM 整图识别 → 矩形 bounding_box → Sharp 裁剪 → 可选生成式去背景。无像素级分割（无 SAM）。

**理想方案（堆叠场景）：** 专用检测（GroundingDINO/YOLO）→ SAM2 实例分割 → 干净 crop → 以图搜图 + 详情 API。

重叠时瓶颈在 **检测/分割**，不在材质字段映射。

---

## 5. 推荐使用方式

1. 配置 `warmrobot/web/.env.local` 中的 `VISION_API_KEY` 与 `VISION_MODEL=Qwen/Qwen3-VL-8B-Instruct`
2. 打开 `/add`，使用「拍照 / 选图识别」上传（衣柜照片会自动跳转 `/add/scan`）；或直接打开 `/add/scan`
3. 审核低置信度条目，手动改类别/材质
4. 有购买链接的单件用 `/add` 粘贴淘宝 URL
5. 已导入商品库时，关注审核页「参考商品 · 相似度 XX%」

```bash
cd warmrobot/web
npm run test:wardrobe-vision -- /path/to/closet-photo.jpg
```

---

## 6. 本地验证记录（2026-07-08）

对衣架挂放、大量重叠的婴儿衣柜样张运行 `test:wardrobe-vision`：

| 配置 | 结果 |
|------|------|
| `DeepSeek/DeepSeek-V4-Pro` | API 400 — Model does not exist |
| `Qwen/Qwen3-VL-8B-Instruct`（修复前，无 max_tokens） | 响应 JSON 被截断，解析失败 |
| `Qwen/Qwen3-VL-8B-Instruct` + `max_tokens: 8192` | 成功返回 54 条；前 ~12 条合理（条纹/印花/牛仔上衣、长裤等），后续出现重复幻觉（交替「深色/浅色长裤」且置信度递减至 0.01）。场景说明：「衣物密集重叠，难以完全分辨」。**结论：可用但需人工审核，堆叠挂放不宜直接批量入库。** |

> **注意：** 请使用 `Qwen/Qwen3-VL-8B-Instruct`，勿使用 SiliconFlow 上不存在的模型 ID。

---

## 7. 未来增强（未实现，按投入产出排序）

1. 拍摄引导 + 低置信度警告（扫描页已增加挂放重叠提示）
2. 裁剪图二次 VLM 识别
3. 商品库视觉匹配（CLIP vs `pic_url`）
4. OneBound 以图搜图 + props 解析 fit_type
5. 专用检测+分割模型

---

## 相关文件

| 用途 | 文件 |
|------|------|
| 视觉 prompt | `warmrobot/web/src/lib/vision-wardrobe-parser.ts` |
| 扫描后处理 | `warmrobot/web/src/lib/wardrobe-scan-pipeline.ts` |
| 扫描 UI | `warmrobot/web/src/components/stitch/scan-wardrobe-form.tsx` |
| 淘宝 URL 解析 | `warmrobot/web/src/lib/taobao-product-parser.ts` |
| 商品库导入 | `warmrobot/web/scripts/import-taobao-catalog.mjs` |
| Agent 运行说明 | `AGENTS.md` |
