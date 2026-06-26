#!/usr/bin/env node
/**
 * 生成故事化 brd.pptx（20 页英雄之旅叙事结构）
 * 运行：cd brd && npm run pptx
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let PptxGenJS;
try {
  PptxGenJS = (await import("pptxgenjs")).default;
} catch {
  console.error("请先安装依赖：npm install pptxgenjs");
  process.exit(1);
}

const C = {
  primary: "3E6658",
  primaryLight: "8FB9A8",
  primaryPale: "C0ECDA",
  secondary: "8B4E38",
  bg: "FBF9F5",
  text: "1B1C1A",
  muted: "717975",
  white: "FFFFFF",
  dark: "2A4A3E",
  warn: "5C3D2E",
};

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9";
pptx.author = "LittleCompass";
pptx.title = "LittleCompass — 故事化 BRD 汇报";

function actLabel(act) {
  return act ? { text: act, options: { fontSize: 11, color: C.muted, italic: true } } : null;
}

/** 故事页：标题 + 金句 + 要点 + 演讲者备注 */
function storySlide({ act, title, quote, bullets = [], footer, notes, dark = false }) {
  const s = pptx.addSlide();
  s.background = { color: dark ? C.dark : C.bg };

  const titleColor = dark ? C.white : C.primary;
  const quoteColor = dark ? C.primaryPale : C.secondary;
  const textColor = dark ? "E8E6E2" : C.text;
  const mutedColor = dark ? C.primaryLight : C.muted;

  if (act) {
    s.addText(act, {
      x: 0.55, y: 0.28, w: 9, h: 0.35,
      fontSize: 11, italic: true, color: mutedColor, fontFace: "Arial",
    });
  }

  s.addText(title, {
    x: 0.55, y: act ? 0.62 : 0.4, w: 9, h: 0.85,
    fontSize: 26, bold: true, color: titleColor, fontFace: "Arial",
  });

  s.addShape(pptx.ShapeType.rect, {
    x: 0.55, y: act ? 1.42 : 1.2, w: 1.4, h: 0.05,
    fill: { color: C.secondary },
  });

  // 金句区
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55, y: act ? 1.6 : 1.38, w: 8.9, h: 0.95,
    fill: { color: dark ? "364F44" : C.white },
    line: { color: dark ? C.primaryLight : C.primaryPale, width: 1 },
    rectRadius: 0.06,
  });
  s.addText(`"${quote}"`, {
    x: 0.75, y: act ? 1.78 : 1.56, w: 8.5, h: 0.7,
    fontSize: 15, italic: true, bold: true, color: quoteColor, fontFace: "Arial",
    valign: "middle",
  });

  if (bullets.length) {
    s.addText(
      bullets.map((b) => ({ text: b, options: { bullet: { code: "2022" }, breakLine: true } })),
      {
        x: 0.55, y: act ? 2.75 : 2.53, w: 5.5, h: 2.5,
        fontSize: 14, color: textColor, fontFace: "Arial", paraSpaceAfter: 8,
      }
    );
  }

  if (footer) {
    s.addText(footer, {
      x: 0.55, y: 5.05, w: 9, h: 0.4,
      fontSize: 11, italic: true, color: mutedColor, fontFace: "Arial",
    });
  }

  if (notes) s.addNotes(notes);
  return s;
}

/** 右侧视觉装饰区 */
function addVisualPanel(slide, { emoji, lines, x = 6.3, y = 2.7, w = 3.2, h = 2.4 }) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: C.primaryPale },
    line: { color: C.primaryLight, width: 1 },
    rectRadius: 0.1,
  });
  if (emoji) {
    slide.addText(emoji, {
      x, y: y + 0.15, w, h: 0.7, fontSize: 36, align: "center", fontFace: "Arial",
    });
  }
  if (lines?.length) {
    slide.addText(
      lines.map((l) => ({ text: l, options: { breakLine: true, align: "center" } })),
      {
        x: x + 0.15, y: y + (emoji ? 0.85 : 0.3), w: w - 0.3, h: h - 1,
        fontSize: 12, color: C.primary, fontFace: "Arial", align: "center",
      }
    );
  }
}

/** 封面 */
function coverSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.primary };
  s.addShape(pptx.ShapeType.ellipse, {
    x: 6.5, y: -0.5, w: 4, h: 4,
    fill: { color: C.primaryLight, transparency: 70 },
  });
  s.addText("🧭", {
    x: 0.6, y: 1.2, w: 1.2, h: 1, fontSize: 48, fontFace: "Arial",
  });
  s.addText("LittleCompass", {
    x: 0.6, y: 2.0, w: 8.8, h: 0.9,
    fontSize: 44, bold: true, color: C.white, fontFace: "Arial",
  });
  s.addText("把爱，翻译成刚刚好的温度", {
    x: 0.6, y: 2.95, w: 8.8, h: 0.55,
    fontSize: 22, color: C.primaryPale, fontFace: "Arial",
  });
  s.addText("故事化商业需求汇报  ·  2026", {
    x: 0.6, y: 4.85, w: 8.8, h: 0.4,
    fontSize: 13, color: C.primaryLight, fontFace: "Arial",
  });
  s.addNotes(
    "语气平静、温柔。不要像发布会，更像坐下来聊一件发生在我家的事。\n" +
      "金句：这不是一个 App，是一个爸爸想把「别冻着孩子」这件事，变得不那么靠猜。"
  );
}

/** 幕间分隔 */
function actSlide(act, subtitle) {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 10, h: 5.625,
    fill: { color: C.primary, transparency: 92 },
  });
  s.addShape(pptx.ShapeType.rect, {
    x: 0.8, y: 2.1, w: 0.12, h: 1.4, fill: { color: C.secondary },
  });
  s.addText(act, {
    x: 1.1, y: 2.15, w: 8, h: 0.9,
    fontSize: 32, bold: true, color: C.primary, fontFace: "Arial",
  });
  s.addText(subtitle, {
    x: 1.1, y: 3.05, w: 8, h: 0.55,
    fontSize: 16, color: C.muted, fontFace: "Arial",
  });
}

/** 大数字指标页 */
function metricsSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第一幕 · 未来", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("成功不是下载量，是妈妈说：「刚刚好」", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const metrics = [
    { num: "5,000", label: "注册用户" },
    { num: "60%", label: "录入 10 件+" },
    { num: "50%", label: "反馈「刚好」" },
    { num: "40%", label: "次日留存" },
  ];
  metrics.forEach((m, i) => {
    const x = 0.55 + (i % 2) * 4.6;
    const y = 1.8 + Math.floor(i / 2) * 1.85;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.2, h: 1.55,
      fill: { color: C.white }, line: { color: C.primaryLight, width: 1 }, rectRadius: 0.1,
    });
    s.addText(m.num, {
      x, y: y + 0.25, w: 4.2, h: 0.7, fontSize: 36, bold: true, color: C.secondary, align: "center",
    });
    s.addText(m.label, {
      x, y: y + 0.95, w: 4.2, h: 0.4, fontSize: 13, color: C.muted, align: "center",
    });
  });
  s.addText("6 个月目标 · 证明算法真的有用，而不只是好看", {
    x: 0.55, y: 5.05, w: 9, h: 0.4, fontSize: 11, italic: true, color: C.muted,
  });
  s.addNotes("语气真诚。强调「刚好」反馈占比——这是最动人的成功标准。停顿 2 秒。");
}

/** 路线图 */
function roadmapSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第五幕 · 蓝图", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("Phase 1 证明有用，Phase 3 才能传播", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const phases = [
    { phase: "Phase 1", label: "MVP 验证", sub: "现在 · Web 闭环", current: true },
    { phase: "Phase 2", label: "体验打磨", sub: "反馈 / 图片 / 缺口推荐", current: false },
    { phase: "Phase 3", label: "小程序上线", sub: "微信生态 + 裂变", current: false },
    { phase: "Phase 4", label: "增长变现", sub: "电商 / 成人市场", current: false },
  ];
  phases.forEach((p, i) => {
    const x = 0.55 + i * 2.35;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.9, w: 2.15, h: 2.6,
      fill: { color: p.current ? C.primary : C.white },
      line: { color: C.primaryLight, width: 1.5 },
      rectRadius: 0.08,
    });
    s.addText(p.phase, {
      x, y: 2.1, w: 2.15, h: 0.4, fontSize: 12, bold: true,
      color: p.current ? C.primaryPale : C.muted, align: "center",
    });
    s.addText(p.label, {
      x, y: 2.55, w: 2.15, h: 0.55, fontSize: 15, bold: true,
      color: p.current ? C.white : C.primary, align: "center",
    });
    s.addText(p.sub, {
      x: x + 0.1, y: 3.2, w: 1.95, h: 0.9, fontSize: 10,
      color: p.current ? C.primaryLight : C.muted, align: "center",
    });
    if (i < 3) {
      s.addText("→", {
        x: x + 2.18, y: 2.85, w: 0.25, h: 0.4, fontSize: 16, color: C.secondary,
      });
    }
  });
  s.addNotes("语气踏实。路线图不是 KPI 表，是一条可信的旅程。");
}

/** 洋葱分层视觉页 */
function onionSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 拆解", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("绝不会：「今天一件棉袄就够了」", {
    x: 0.55, y: 0.62, w: 5.5, h: 0.85, fontSize: 24, bold: true, color: C.primary,
  });
  const layers = [
    { label: "外层", sub: "防风外套", w: 3.8, color: C.primary },
    { label: "中层", sub: "毛衣", w: 3.2, color: C.primaryLight },
    { label: "内层", sub: "打底", w: 2.6, color: C.primaryPale },
    { label: "配件", sub: "帽袜", w: 2.0, color: "E4E2DE" },
  ];
  layers.forEach((l, i) => {
    const y = 1.6 + i * 0.85;
    const x = 5.8 - l.w / 2;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: l.w, h: 0.7,
      fill: { color: l.color },
      line: { color: C.primary, width: 1 },
      rectRadius: 0.06,
    });
    s.addText(`${l.label} · ${l.sub}`, {
      x, y: y + 0.15, w: l.w, h: 0.45,
      fontSize: 13, bold: true, color: i < 2 ? C.white : C.primary, align: "center",
    });
  });
  s.addText(
    [
      "场景切换：室内 / 外出 / 睡眠",
      "风大 → 加外层；天冷 → 加配件",
      "标准 / 偏暖 / 偏凉 三套可选",
    ].map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
    { x: 0.55, y: 2.0, w: 4.5, h: 2.5, fontSize: 14, color: C.text }
  );
  s.addNotes("用通俗语言讲算法。像是在跟奶奶解释，但奶奶也能听懂。");
}

/** Aha 温度值页 */
function ahaSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  s.addText("第三幕 · 曙光", {
    x: 0.55, y: 0.35, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.primaryLight,
  });
  s.addText("问题不是「穿几件」，是「今天需要多少度」", {
    x: 0.55, y: 0.75, w: 9, h: 0.9, fontSize: 28, bold: true, color: C.white,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 1.5, y: 2.0, w: 7, h: 2.2,
    fill: { color: "364F44" }, line: { color: C.primaryLight, width: 2 }, rectRadius: 0.12,
  });
  s.addText("天气 + 宝宝 + 场景", {
    x: 1.5, y: 2.25, w: 2.2, h: 0.5, fontSize: 13, color: C.primaryPale, align: "center",
  });
  s.addText("→", { x: 3.6, y: 2.35, w: 0.5, h: 0.5, fontSize: 28, color: C.secondary });
  s.addText("温度值 30", {
    x: 4.0, y: 2.1, w: 2.2, h: 0.8, fontSize: 28, bold: true, color: C.white, align: "center",
  });
  s.addText("→", { x: 6.1, y: 2.35, w: 0.5, h: 0.5, fontSize: 28, color: C.secondary });
  s.addText("从衣柜捞出 ≈30 的搭配", {
    x: 6.4, y: 2.25, w: 2.2, h: 0.5, fontSize: 13, color: C.primaryPale, align: "center",
  });
  s.addText('"把「今天穿什么」翻译成「今天需要 30 度保暖」——答案就清晰了。"', {
    x: 0.8, y: 4.5, w: 8.5, h: 0.7, fontSize: 16, italic: true, bold: true, color: C.primaryPale, align: "center",
  });
  s.addNotes("全场 Aha Moment！语气骤然明亮，停顿 2 秒再说金句。");
}

/** MVP 九宫格 */
function mvpSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 证据", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("不是 PPT 产品，是已经能跑起来的产品", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const items = [
    "✅ 宝宝档案", "✅ 虚拟衣柜", "✅ 7+23 分类",
    "✅ 天气定位", "✅ 推荐引擎", "✅ 链接导入",
    "✅ 截图识别", "✅ 手动录入", "✅ 保暖预览",
  ];
  items.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.55 + col * 3.1;
    const y = 1.75 + row * 1.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 2.85, h: 0.95,
      fill: { color: C.white }, line: { color: C.primaryLight, width: 1 }, rectRadius: 0.08,
    });
    s.addText(item, {
      x, y: y + 0.28, w: 2.85, h: 0.45, fontSize: 14, color: C.primary, align: "center",
    });
  });
  s.addText("Web MVP 已上线验证  ·  算法在跑，推荐能出", {
    x: 0.55, y: 5.05, w: 9, h: 0.4, fontSize: 12, italic: true, bold: true, color: C.secondary,
  });
  s.addNotes("语气兴奋、有底气。这是证据页，让怀疑的人闭嘴。");
}

/** 实现路径：建造流水线 */
function buildPipelineSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 建造", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("先看见，再储存，最后算清楚", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const steps = [
    { n: "1", label: "聊清楚", sub: "ChatGPT 梳需求" },
    { n: "2", label: "看得见", sub: "Stitch 出原型" },
    { n: "3", label: "写得动", sub: "Cursor / Trae 写代码" },
    { n: "4", label: "存得住", sub: "Supabase 建表" },
    { n: "5", label: "跑得通", sub: "API + 算法上线" },
  ];
  steps.forEach((st, i) => {
    const x = 0.4 + i * 1.85;
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.55, y: 1.85, w: 0.55, h: 0.55,
      fill: { color: i === 4 ? C.primary : C.white },
      line: { color: C.primary, width: 1.5 },
    });
    s.addText(st.n, {
      x: x + 0.55, y: 1.93, w: 0.55, h: 0.45, fontSize: 14, bold: true,
      color: i === 4 ? C.white : C.primary, align: "center",
    });
    s.addText(st.label, {
      x: x + 0.1, y: 2.55, w: 1.55, h: 0.4, fontSize: 14, bold: true, color: C.secondary, align: "center",
    });
    s.addText(st.sub, {
      x: x + 0.05, y: 2.95, w: 1.65, h: 0.45, fontSize: 10, color: C.muted, align: "center",
    });
    if (i < 4) {
      s.addText("→", { x: x + 1.65, y: 2.0, w: 0.3, h: 0.4, fontSize: 16, color: C.secondary });
    }
  });
  s.addText('"我不是工程师，但我能让 AI 帮我把画面一行行变成能用的产品。"', {
    x: 0.55, y: 4.2, w: 8.9, h: 0.65, fontSize: 14, italic: true, bold: true, color: C.secondary, align: "center",
  });
  s.addNotes(
    "语气坦诚、有感染力。强调「非开发者路径」：从可视化出发，反推后端需要什么。\n" +
      "跟 ChatGPT 聊需求 → Stitch 画原型 → AI 写前端 → 告诉 AI 业务场景出 SQL → Supabase 落库。"
  );
}

/** 工具链 */
function toolchainSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 建造", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("一个人也能拉起一支「AI 施工队」", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const tools = [
    { emoji: "💬", name: "ChatGPT", role: "需求梳理\n提示词优化" },
    { emoji: "🎨", name: "Stitch", role: "产品原型\nMCP 对接" },
    { emoji: "⌨️", name: "Cursor / Trae", role: "AI 写代码\nTrae ≈$10/月" },
    { emoji: "🗄️", name: "Supabase", role: "数据库\nAuth · 小体量免费" },
  ];
  tools.forEach((t, i) => {
    const x = 0.45 + i * 2.35;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.7, w: 2.15, h: 2.5,
      fill: { color: C.white }, line: { color: C.primaryLight, width: 1 }, rectRadius: 0.1,
    });
    s.addText(t.emoji, { x, y: 1.85, w: 2.15, h: 0.6, fontSize: 28, align: "center" });
    s.addText(t.name, { x, y: 2.5, w: 2.15, h: 0.4, fontSize: 14, bold: true, color: C.primary, align: "center" });
    s.addText(t.role, { x: x + 0.1, y: 2.95, w: 1.95, h: 0.9, fontSize: 10, color: C.muted, align: "center" });
  });
  s.addText("Stitch MCP → 设计稿直接喂给编程工具，少走「想象界面」的弯路", {
    x: 0.55, y: 4.55, w: 9, h: 0.5, fontSize: 12, italic: true, color: C.muted,
  });
  s.addNotes("不要念工具名单，像介绍你实际在用的施工队：谁画图、谁写码、谁记账。");
}

/** 技术架构 */
function archSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 建造", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("今天长这样，明天小程序能复用同一颗大脑", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 24, bold: true, color: C.primary,
  });
  // 三层架构
  const layers = [
    { y: 1.55, label: "用户层", items: "Web（Next.js）→ 未来微信小程序", color: C.primaryPale, text: C.primary },
    { y: 2.55, label: "算法层", items: "packages/core：温度值 · 推荐 · 三套变体", color: C.primaryLight, text: C.white },
    { y: 3.55, label: "数据层", items: "Supabase：宝宝 · 衣柜 · 天气记录 · 商品缓存", color: C.primary, text: C.white },
  ];
  layers.forEach((l) => {
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.55, y: l.y, w: 5.8, h: 0.8,
      fill: { color: l.color }, line: { color: C.primary, width: 1 }, rectRadius: 0.06,
    });
    s.addText(`${l.label}  ·  ${l.items}`, {
      x: 0.75, y: l.y + 0.18, w: 5.4, h: 0.5, fontSize: 12, bold: true, color: l.text,
    });
  });
  // 外部服务
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.6, y: 1.55, w: 3.0, h: 2.8,
    fill: { color: C.white }, line: { color: C.secondary, width: 1 }, rectRadius: 0.1,
  });
  s.addText("外部服务", { x: 6.6, y: 1.7, w: 3.0, h: 0.4, fontSize: 13, bold: true, color: C.secondary, align: "center" });
  ["Open-Meteo 天气", "万邦 商品 API", "OpenAI 截图识别"].forEach((item, i) => {
    s.addText(`• ${item}`, { x: 6.75, y: 2.2 + i * 0.55, w: 2.7, h: 0.45, fontSize: 11, color: C.text });
  });
  s.addText("告诉 AI 业务场景 → 它写 API 路由和时序图 → 前端直接调用", {
    x: 0.55, y: 4.55, w: 9, h: 0.5, fontSize: 12, italic: true, color: C.muted,
  });
  s.addNotes(
    "给技术听众信心：不是空中楼阁，架构清晰。\n" +
      "核心表：babies, clothing_items, categories, baby_warmth_preferences, product_catalog。\n" +
      "算法与 UI 解耦，小程序上线时复用 packages/core。"
  );
}

/** 实现步骤清单 */
function implStepsSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 建造", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("从零到 MVP：我们实际走过的步骤", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const steps = [
    "语音/文字记录痛点 → ChatGPT 整理成 BRD 和提示词",
    "Stitch 生成可点击原型，确定页面结构和交互",
    "Next.js 搭前端：首页推荐、衣柜录入、宝宝档案",
    "描述业务场景给 AI → 生成 Supabase 表结构和 migration",
    "接入天气 API、万邦商品 API、截图识别 API",
    "packages/core 封装算法，Web 与未来小程序共用",
    "持续迭代：分类体系、版型、温度偏好、录入体验",
  ];
  s.addText(
    steps.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
    { x: 0.55, y: 1.55, w: 5.8, h: 3.5, fontSize: 13, color: C.text, paraSpaceAfter: 6 }
  );
  addVisualPanel(s, {
    emoji: "✅",
    lines: ["MVP", "已跑通"],
    x: 6.5, y: 2.0, w: 3.0, h: 2.2,
  });
  s.addNotes("这页给想复制这条路的人一张「施工图纸」。语气务实，不炫技。");
}

/** 代码：仓库结构 */
function codeRepoSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.dark };
  s.addText("第四幕 · 续 · 代码", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.primaryLight });
  s.addText("三块积木：算法包 · Web 应用 · 数据库", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 24, bold: true, color: C.white,
  });
  const blocks = [
    { title: "packages/core", lines: ["required-warmth.ts", "recommend-outfit.ts", "weather.ts", "→ 小程序可复用"] },
    { title: "web/", lines: ["Next.js App Router", "API Routes + 页面", "解析器 / dashboard.ts"] },
    { title: "supabase/", lines: ["migrations 001–011", "trigger 自动算保暖值", "RLS 行级安全"] },
  ];
  blocks.forEach((b, i) => {
    const x = 0.45 + i * 3.15;
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.65, w: 2.95, h: 2.9,
      fill: { color: "364F44" }, line: { color: C.primaryLight, width: 1 }, rectRadius: 0.08,
    });
    s.addText(b.title, { x: x + 0.1, y: 1.85, w: 2.75, h: 0.45, fontSize: 13, bold: true, color: C.primaryPale });
    b.lines.forEach((line, j) => {
      s.addText(line, { x: x + 0.15, y: 2.4 + j * 0.42, w: 2.65, h: 0.38, fontSize: 10, color: "C0C8C3" });
    });
  });
  s.addText("算法与 UI 解耦 · 常量系数在 DB · 改规则不必发版", {
    x: 0.55, y: 4.75, w: 9, h: 0.45, fontSize: 12, italic: true, color: C.primaryLight, align: "center",
  });
  s.addNotes("给技术听众看目录结构。强调 core 包可被小程序直接 import。");
}

/** 代码：首页推荐数据流 */
function codeRecommendFlowSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 代码", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("打开首页时，后台实际跑了什么？", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 24, bold: true, color: C.primary,
  });
  const flow = [
    "page.tsx → getDashboardData()",
    "Supabase：宝宝档案 + 衣柜 + 偏好",
    "Open-Meteo：profile 经纬度 → 天气",
    "calcRequiredWarmth() → 温度值",
    "recommendAllVariants() → 三套 OOTD",
    "dashboard-recommendations 渲染卡片",
  ];
  flow.forEach((step, i) => {
    const y = 1.55 + i * 0.58;
    s.addShape(pptx.ShapeType.ellipse, {
      x: 0.55, y: y + 0.05, w: 0.35, h: 0.35, fill: { color: C.primary },
    });
    s.addText(String(i + 1), {
      x: 0.55, y: y + 0.08, w: 0.35, h: 0.3, fontSize: 10, bold: true, color: C.white, align: "center",
    });
    s.addText(step, { x: 1.05, y, w: 5.5, h: 0.45, fontSize: 13, color: C.text });
    if (i < flow.length - 1) {
      s.addText("↓", { x: 0.62, y: y + 0.42, w: 0.2, h: 0.2, fontSize: 10, color: C.muted });
    }
  });
  addVisualPanel(s, {
    emoji: "🧅",
    lines: ["层1 35%", "层2 35%", "层3 30%"],
    x: 6.4, y: 2.0, w: 3.2, h: 2.0,
  });
  s.addNotes("用代码路径讲清楚推荐不是魔法。dashboard.ts + recommend-outfit.ts。");
}

/** 代码：保暖值公式 */
function codeWarmthSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 代码", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("一件衣服的保暖值，怎么算出来？", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 24, bold: true, color: C.primary,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.55, y: 1.55, w: 8.9, h: 1.1,
    fill: { color: C.white }, line: { color: C.primary, width: 1.5 }, rectRadius: 0.08,
  });
  s.addText("保暖值 = 材质基础分 × 厚度系数 × 类目系数 + 配件加分 + 重量修正", {
    x: 0.75, y: 1.85, w: 8.5, h: 0.55, fontSize: 14, bold: true, color: C.primary, align: "center",
  });
  s.addText(
    [
      "数据库 trigger：INSERT/UPDATE 时自动写入 warmth_score",
      "前端预览：POST /api/clothing/preview-warmth",
      "TS 镜像：warmth-score.ts ≡ SQL compute_warmth_score()",
      "估重：clothing-weight.ts（类目+尺码+材质+版型）",
    ].map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
    { x: 0.55, y: 2.85, w: 5.5, h: 2.2, fontSize: 13, color: C.text }
  );
  addVisualPanel(s, {
    emoji: "🔢",
    lines: ["录入即见", "TOG 等效"],
    x: 6.4, y: 2.85, w: 3.2, h: 1.8,
  });
  s.addNotes("双轨计算是工程亮点：DB 保证一致性，API 保证录入体验。");
}

/** 代码：链接解析管线 */
function codeParseSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 代码", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("粘贴淘宝链接后，代码走了哪几条路？", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 22, bold: true, color: C.primary,
  });
  const paths = [
    { label: "① 万邦 API", sub: "fetchOneboundItem()", ok: true },
    { label: "② HTML 抓取", sub: "parseProductHtml()", ok: true },
    { label: "③ 标题推断", sub: "inferCategoryFromTitle()", ok: true },
  ];
  paths.forEach((p, i) => {
    const y = 1.6 + i * 1.05;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.55, y, w: 4.2, h: 0.85,
      fill: { color: C.white }, line: { color: C.primaryLight, width: 1 }, rectRadius: 0.06,
    });
    s.addText(p.label, { x: 0.75, y: y + 0.12, w: 3.8, h: 0.35, fontSize: 14, bold: true, color: C.primary });
    s.addText(p.sub, { x: 0.75, y: y + 0.48, w: 3.8, h: 0.3, fontSize: 11, color: C.muted });
  });
  s.addText("分享文案「...」→ splitPastedProductInput() 拆商品名", {
    x: 5.0, y: 1.75, w: 4.5, h: 0.45, fontSize: 12, color: C.text,
  });
  s.addText("截图 → OpenAI Vision → normalizeCategory() 校验 23 类", {
    x: 5.0, y: 2.35, w: 4.5, h: 0.45, fontSize: 12, color: C.text,
  });
  s.addText("确认 → POST /api/clothing → trigger 算 warmth_score 入库", {
    x: 5.0, y: 2.95, w: 4.5, h: 0.45, fontSize: 12, color: C.text,
  });
  s.addNotes("三路降级策略是录入体验的核心工程实现。");
}

/** 代码：API 一览 */
function codeApiSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addText("第四幕 · 续 · 代码", { x: 0.55, y: 0.28, w: 9, h: 0.35, fontSize: 11, italic: true, color: C.muted });
  s.addText("9 个 API，撑起整个 MVP", {
    x: 0.55, y: 0.62, w: 9, h: 0.85, fontSize: 26, bold: true, color: C.primary,
  });
  const rows = [
    ["POST /api/clothing", "新增衣柜单品"],
    ["POST /api/clothing/parse-url", "淘宝链接解析"],
    ["POST /api/clothing/parse-image", "截图 AI 识别"],
    ["POST /api/clothing/preview-warmth", "保暖值实时预览"],
    ["POST /api/babies", "创建宝宝档案"],
    ["PATCH /api/profile/location", "更新定位"],
    ["GET /api/weather", "天气查询"],
  ];
  rows.forEach(([api, desc], i) => {
    const y = 1.45 + i * 0.52;
    s.addText(api, {
      x: 0.55, y, w: 4.2, h: 0.42, fontSize: 11, bold: true, color: C.primary, fontFace: "Courier New",
    });
    s.addText(desc, { x: 4.9, y, w: 4.5, h: 0.42, fontSize: 11, color: C.text });
    if (i < rows.length - 1) {
      s.addShape(pptx.ShapeType.rect, {
        x: 0.55, y: y + 0.48, w: 8.8, h: 0.01, fill: { color: "E4E2DE" },
      });
    }
  });
  s.addText("middleware.ts 刷新 Supabase session · 页面走 Server Component 直读 DB", {
    x: 0.55, y: 5.05, w: 9, h: 0.4, fontSize: 11, italic: true, color: C.muted,
  });
  s.addNotes("API 表给想对接或评审的人一张清单。不必逐条念。");
}

/** 结语 */
function endSlide() {
  const s = pptx.addSlide();
  s.background = { color: C.primary };
  s.addText("🧭", { x: 0.6, y: 1.5, w: 1, h: 0.8, fontSize: 44 });
  s.addText("把爱，翻译成刚刚好的温度", {
    x: 0.6, y: 2.4, w: 8.8, h: 0.9, fontSize: 36, bold: true, color: C.white, align: "center",
  });
  s.addText("让每一次穿衣，都是一次刚刚好的拥抱", {
    x: 0.6, y: 3.35, w: 8.8, h: 0.55, fontSize: 18, color: C.primaryPale, align: "center",
  });
  s.addText("下一步：小程序内测  ·  欢迎加入", {
    x: 0.6, y: 4.7, w: 8.8, h: 0.4, fontSize: 14, color: C.primaryLight, align: "center",
  });
  s.addNotes("回到第一页情绪，首尾呼应。语速放慢，停顿，结束。谢谢。");
}

// ═══════════════════════════════════════
//  20 页故事线
// ═══════════════════════════════════════

coverSlide(); // 1

const s2 = storySlide({
  act: "第一幕 · 序幕",
  title: "16 度，有风，要出门——穿几件？",
  quote: "天气预报说 16 度，但宝宝不会告诉你，他到底冷不冷。",
  bullets: [
    "家里刚有宝宝，0–3 岁每天都面临穿衣决策",
    "16°C + 大风 → 穿少怕着凉，穿多怕出汗",
    "室内室外切换、户外活动多 → 一套衣服难兼顾",
    "宝宝不会表达 → 家长只能靠「猜」",
  ],
  footer: "气温 16°C  ·  风力 4 级  ·  下午要户外",
  notes: "语速放慢，带代入感。像在描述你我都见过的画面。",
});
addVisualPanel(s2, { emoji: "🌡️", lines: ["冷？", "热？", "猜？"] });

const s3 = storySlide({
  act: "第一幕 · 序幕",
  title: "她，才是那个每天做决定的人",
  quote: "爸爸也在，但那个清晨站在衣柜前的，通常是妈妈。",
  bullets: [
    "核心用户：0–3 岁宝宝的宝妈，20–30 岁",
    "有消费力，但信息碎片化",
    "小红书、妈妈群、奶奶电话——越多越不知道听谁的",
  ],
  notes: "语气带理解和敬意。不是用户画像 PPT，是替她们说句话。",
});
addVisualPanel(s3, { emoji: "👩", lines: ["攻略", "群消息", "天气App", "……"] });

actSlide("第二幕 · 冲突", "那个让人抓狂的「反派」登场");

const s4 = storySlide({
  title: "经验主义 —— 育儿里最贵的学费",
  quote: "我们不是不会爱孩子，我们是没有一把靠谱的尺子。",
  bullets: [
    "市场缺口：没有「婴幼儿 + 天气 + 自家衣柜」的工具",
    "现有方案：搜攻略、问长辈、凭感觉",
    "洋葱穿衣法人人都听过，但没人在你出门前告诉你穿哪几件",
  ],
  notes: "语气转沉。把「没有好工具」塑造成反派，不是指责父母。",
});
addVisualPanel(s4, { emoji: "📏", lines: ["刻度全是", "？？？"] });

const s5 = storySlide({
  title: "一次穿错，代价不只是感冒",
  quote: "穿多穿少，表面是衣服的事，底下是「我是不是个好爸妈」的拷问。",
  bullets: [
    "身体：着凉、出汗后吹风感冒",
    "情绪：妈妈自责、家庭摩擦",
    "信任：对育儿建议越来越不信，越来越累",
  ],
  dark: true,
  notes: "轻轻推危机感，但不要恐吓。重点是情感代价。",
});
addVisualPanel(s5, { emoji: "🌙", lines: ["愧疚", "疲惫", "怀疑"] });

const s6 = storySlide({
  title: "做对产品，得先翻过这三座山",
  quote: "最难的不是算法，是让用户愿意把第 87 件小袜子录进系统。",
  bullets: [
    "山 1：上百件衣服，怎么低成本录入？",
    "山 2：同城不同区，怎么算准今天需要多少保暖？",
    "山 3：宽松棉服和修身棉服，怎么给每件衣服一个数？",
  ],
  notes: "坦诚亮出难点，反而赢得信任。",
});
addVisualPanel(s6, { emoji: "⛰️", lines: ["录入", "算准", "量化"] });

actSlide("第三幕 · 曙光", "灯泡亮起来的那一刻");

ahaSlide(); // 7

const s8 = storySlide({
  act: "第三幕 · 曙光",
  title: "虚拟衣柜 × 真实天气 × 一件一件算清楚",
  quote: "打开 App，不是看一堆数据，而是：今天这样穿，刚刚好。",
  bullets: [
    "虚拟衣柜：宝宝所有衣服数字化",
    "天气感知：定位到小区级",
    "智能搭配：洋葱式分层，标准/偏暖/偏凉",
    "科学、可执行、能解释",
  ],
  notes: "语气自信温暖。描述爸妈每天早上会打开的小帮手。",
});
addVisualPanel(s8, { emoji: "📱", lines: ["今日 OOTD", "保暖 30", "体感 16°C"] });

actSlide("第四幕 · 拆解", "奇迹是怎么发生的");

const s9 = storySlide({
  title: "每一件衣服，都有自己的「保暖身份证」",
  quote: "宽松棉服和修身棉服，看起来一样，保暖差一截——我们终于能算出来了。",
  bullets: [
    "材质 × 厚度 × 类目 × 版型 + 克重修正",
    "录入时预览 TOG 等效值，建立信任",
    "7 一级 + 23 二级分类，覆盖真实育儿场景",
  ],
  notes: "像介绍一个巧妙的设计，带一点得意。",
});
addVisualPanel(s9, { emoji: "👕", lines: ["宽松 → 12", "修身 → 18"] });

onionSlide(); // 10

const s11 = storySlide({
  title: "上百件衣服，怎么让用户愿意录？",
  quote: "爬虫死了，淘宝 API 关门了——但我们找到了第三条路。",
  bullets: [
    "❌ 爬虫：封路",
    "❌ 官方 API：商家专用",
    "✅ 链接导入（万邦 API）",
    "✅ 分享文案 + AI 截图（约 80%）",
    "✅ 极简手动录入（兜底）",
  ],
  notes: "坦诚分享血泪史。主动说试过很多路走不通，显得专业。",
});
addVisualPanel(s11, { emoji: "🛤️", lines: ["主路", "辅路", "兜底"] });

const s12 = storySlide({
  title: "天气，要精确到小区",
  quote: "不是看「上海今天几度」，是看「宝宝脚下这片天空几度」。",
  bullets: [
    "上海报小雨，嘉定南翔可能没下",
    "综合体感、湿度、风速、降水概率",
    "叠加月龄、活动量、怕冷/怕热偏好",
    "室内 / 外出 / 睡眠 三大场景",
  ],
  notes: "用具体例子让听众会心一笑。",
});
addVisualPanel(s12, { emoji: "📍", lines: ["嘉定南翔", "局部天气"] });

mvpSlide(); // 13

actSlide("第四幕 · 续", "一个人，怎么把它造出来");

const s13b = storySlide({
  title: "我不是工程师，但我先看见了画面",
  quote: "先让东西长得对，再让东西存得住，最后让东西算得准。",
  bullets: [
    "从可视化出发：前端长什么样，反推后端需要什么",
    "不会写接口？把业务场景讲给 AI，它出 API 和时序图",
    "小团队策略：能接 API 就不自建，能缓存就不重复调用",
  ],
  notes: "过渡页，引出建造章节。语气像分享创业手记。",
});
addVisualPanel(s13b, { emoji: "👁️", lines: ["看见", "储存", "计算"] });

buildPipelineSlide(); // 15
toolchainSlide(); // 16
archSlide(); // 17
implStepsSlide(); // 18

actSlide("第四幕 · 续 · 代码深处", "打开引擎盖，看里面怎么转");

const s18b = storySlide({
  title: "代码不是黑箱，是一条看得见的流水线",
  quote: "从粘贴链接到今日推荐，每一步都有对应的文件和函数。",
  bullets: [
    "算法在 packages/core，与页面分离",
    "保暖值 DB trigger 与前端预览双轨一致",
    "录入三路降级：万邦 API → HTML → 标题规则",
  ],
  notes: "过渡进代码章节。语气像带人参观工厂。",
});
addVisualPanel(s18b, { emoji: "⚙️", lines: ["可追踪", "可复用"] });

codeRepoSlide(); // 20
codeRecommendFlowSlide(); // 21
codeWarmthSlide(); // 22
codeParseSlide(); // 23
codeApiSlide(); // 24

actSlide("第五幕 · 蓝图", "明天早上，会是什么样子");

const s14 = storySlide({
  title: "打开小程序，30 秒，出门",
  quote: "不再是「穿错了后悔」，而是「穿对了，安心出门」。",
  bullets: [
    "7:00 打开 → 看 OOTD → 按图穿衣 → 8:00 出门",
    "标准 / 偏暖 / 偏凉，宝妈自己选",
    "推荐可解释：「今日有风，建议加防风外层」",
  ],
  notes: "语气轻快，让听众看见产品融入日常。",
});
addVisualPanel(s14, { emoji: "☀️", lines: ["7:00", "→", "8:00 出门"] });

const s15 = storySlide({
  title: "衣柜凑不出今天的温度值？正好。",
  quote: "我们不是硬推销，是告诉你：今天缺一件防风外套。",
  bullets: [
    "衣柜缺口 → 智能推荐购买单品",
    "母婴品牌定向广告",
    "远期：黄历幸运色、星座穿搭、场景推荐",
  ],
  notes: "带一点商业敏锐，但重点是帮用户解决问题。",
});
addVisualPanel(s15, { emoji: "🧩", lines: ["缺一块", "补上"] });

const s16 = storySlide({
  title: "从宝宝的衣柜，到所有女性的穿搭引擎",
  quote: "今天解决「宝宝穿几件」，明天回答「今天穿什么颜色运气好」。",
  bullets: [
    "同一套「衣柜 + 场景 + 推荐」引擎可复用",
    "玄学/运势/场景穿搭 → 提升粘性",
    "横向扩展至成人女性市场",
  ],
  notes: "语气开阔有梦想感，但不空洞。",
});
addVisualPanel(s16, { emoji: "🛤️", lines: ["婴幼儿", "→", "全人群"] });

roadmapSlide(); // 22
metricsSlide(); // 23

const s24 = storySlide({
  act: "第五幕 · 收尾",
  title: "我们知道难在哪，所以难不住我们",
  quote: "录入难 → 三路并行  ·  API 贵 → 缓存复用  ·  算法偏 → 反馈校准",
  bullets: [
    "录入门槛 → 链接 + 截图 + 手录",
    "API 成本 → 商品目录缓存",
    "算法准确度 → 太冷/刚好/太热 反馈闭环",
    "天气精度 → 定位细化 + 手动修正",
  ],
  notes: "主动说风险，是成熟团队的标志。",
});

endSlide(); // 31

const out = join(__dirname, "brd.pptx");
await pptx.writeFile({ fileName: out });
console.log(`已生成故事化 PPT（31 页）：${out}`);
console.log("演讲者备注已写入每页 Notes，请在 PowerPoint「备注」面板查看。");
