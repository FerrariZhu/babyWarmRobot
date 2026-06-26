# LittleCompass BRD 文档包

本目录包含 **宝宝穿衣助手（LittleCompass）** 的商业需求文档及演示材料。

## 文件说明

| 文件 | 说明 |
|------|------|
| `BRD.md` | 整理后的完整商业需求文档（含第十章代码实现详解） |
| `brd.html` | 图文并茂的 HTML 演示文稿（21 页幻灯片） |
| `brd.pptx` | PowerPoint 文件（**故事化 20 页**，含演讲者备注） |
| `raw-transcript.txt` | 语音转文字原始稿 |
| `generate-pptx.mjs` | PPTX 生成脚本 |

## 查看演示文稿

### 方式一：HTML 幻灯片（推荐，即开即用）

用浏览器打开 `brd.html`：

- **→ / 空格**：下一页
- **←**：上一页
- 也可点击右下角按钮翻页

### 方式二：生成 PowerPoint (.pptx)

```bash
cd brd
npm install
npm run pptx
```

生成后得到 `brd.pptx`，可用 Keynote / PowerPoint / WPS 打开。

也可在 PowerPoint 中：**文件 → 导出 → PDF** 用于分享。

## 文档结构（BRD.md）

1. 文档摘要
2. 立项背景与初衷
3. 目标用户
4. 产品愿景与价值主张
5. 核心产品逻辑（温度值 / 保暖值 / OOTD）
6. 功能规划（MVP + 路线图）
7. 三大核心难点与应对
8. 商业模式
9. 技术实现路径
10. 竞争差异化 / 风险 / 里程碑 / 成功指标

---

*由语音转写稿整理，结合 baby-outfit MVP 实现状态编写。*
