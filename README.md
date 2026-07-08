# 🎨 小红书 AI 图片生成器

<div align="center">

**用 AI 一键生成精美小红书图文卡片，让创作更简单、更高效！**

*新手友好 · 纯前端 · 离线可用 · 国内优化*

[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/在线体验-GitHub%20Pages-ff2442?logo=github)](https://yuuqq.github.io/xiaohongshu-ai-generator/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-4285F4?logo=google)](https://ai.google.dev/)
[![Stars](https://img.shields.io/github/stars/Yuuqq/xiaohongshu-ai-generator?style=social)](https://github.com/Yuuqq/xiaohongshu-ai-generator/stargazers)

🌐 **在线体验（推荐新手直接使用）：** [https://yuuqq.github.io/xiaohongshu-ai-generator/](https://yuuqq.github.io/xiaohongshu-ai-generator/)

</div>

---

## 🌟 这是什么？新手必读

**小红书** 是中国最受欢迎的生活方式分享平台（类似 Instagram + Pinterest + 种草社区）。一条笔记要想被看到、被点赞、被收藏，**封面图 + 正文图文卡片** 的视觉效果至关重要！

这个工具就是专门为**内容创作者、博主、商家、学生党** 打造的：

✅ **无需设计技能**：输入文字 → AI 自动润色 → 选择模板 → 一键生成专业级图片  
✅ **AI 智能加持**：Google Gemini 帮你把普通文案变成吸引人的“种草文”  
✅ **多种风格模板**：科技、好物、教程、旅行、美食……覆盖几乎所有场景  
✅ **批量高效**：一次输入，生成 3~10 张不同风格变体，省时省力  
✅ **完全免费 + 离线可用**：核心功能本地运行，AI 不可用时自动降级  
✅ **国内友好**：无需翻墙，国内 CDN + 本地字体图标

**适合人群**：
- 想在小红书发笔记但不会 PS / Canva 的新手
- 内容博主需要高频产出高质量图文
- 电商卖家做产品种草卡片
- 学生党做课程笔记、分享卡片

---

## 📸 界面 & 效果预览（图文并茂）

### 主界面总览（5步向导式设计，一目了然）

![主界面预览](https://via.placeholder.com/900x500/FF2442/FFFFFF?text=小红书+AI+生成器+主界面截图+5步流程)

> **界面特点**：顶部步骤指示器 + 左侧/上方输入区 + 右侧实时预览区 + 底部导出按钮。粉色系主色调，符合小红书风格，轻盈现代。

### 典型生成效果示例

**科技 / AI 主题卡片示例**：

![科技主题示例](https://via.placeholder.com/600x800/4A90E2/FFFFFF?text=科技主题+小红书卡片示例)

**好物 / 种草主题示例**：

![好物主题示例](https://via.placeholder.com/600x800/FF69B4/FFFFFF?text=好物种草+小红书卡片示例)

**教程 / 步骤主题示例**：

![教程主题示例](https://via.placeholder.com/600x800/50C878/FFFFFF?text=教程步骤+小红书卡片示例)

（实际使用中效果更精美，支持自定义颜色、装饰强度、纹理等参数）

---

## 🚀 新手 3 分钟快速上手（强烈推荐在线使用）

### 方式一：在线使用（零安装，适合 99% 新手）

1. 打开链接： [https://yuuqq.github.io/xiaohongshu-ai-generator/](https://yuuqq.github.io/xiaohongshu-ai-generator/)
2. 右上角点击 **⚙️ 设置**，粘贴你的 Google Gemini API Key（免费获取，见下方）
3. 开始创作！

### 方式二：本地运行（进阶用户）

```bash
# 1. 克隆仓库
git clone https://github.com/Yuuqq/xiaohongshu-ai-generator.git
cd xiaohongshu-ai-generator

# 2. 安装依赖（只需一次）
npm install

# 3. 启动本地服务器
npm run start

# 4. 浏览器打开 http://127.0.0.1:8080
```

> 💡 **新手提示**：不要直接双击 `index.html` 打开！必须用 `npm run start` 启动 HTTP 服务，否则模板可能加载失败。

---

## 🎯 详细使用流程（每一步都有详细说明）

### Step 1 · 内容输入 📝
- 在文本框输入你的笔记正文（支持 emoji、换行，最多 1000 字）
- 实时预览区会立即显示当前文字在卡片上的排版效果
- **小技巧**：先写核心卖点或故事，再让 AI 帮你润色成更吸引人的版本

### Step 2 · 风格选择 🎨
- **写作口吻**：种草、安利、科普、教程、情感、干货等
- **视觉模板**：科技蓝、粉色好物、绿色旅行、橙色美食、简约黑白等
- 选择后，预览会实时更新主题色、布局、装饰元素

### Step 3 · AI 智能优化 🤖
- 点击「AI 智能优化」按钮
- Gemini 会根据你选择的风格，自动：
  - 润色文字（更吸引人、更有节奏）
  - 优化标题、添加钩子
  - 建议 emoji 位置
- **离线模式**：如果 API 不可用，系统自动切换本地规则优化，依然可用

### Step 4 · 预览生成 👁️
- 设置：
  - 生成数量（1~10 张）
  - 图片比例（1:1 正方形 / 9:16 竖版 / 4:5 / 16:9 横版）
  - 图片风格（简约、丰富、梦幻、赛博等）
  - 质量（标准 / 高清）
- 点击「生成预览」，Canvas 实时渲染多张不同变体
- 每张都可以单独微调参数

### Step 5 · 图片导出 💾
- 一键「批量导出高清 PNG」
- 图片自动下载到本地，文件名带时间戳和风格
- 直接上传小红书即可发布！

---

## 🔑 获取 Google Gemini API Key（免费，5 分钟搞定）

1. 访问 [Google AI Studio](https://makersuite.google.com/app/apikey)（需要 Google 账号）
2. 点击 **「Create API Key」**
3. 复制密钥（格式类似 `AIzaSy...`）
4. 回到工具页面 → 右上角 ⚙️ 设置 → 粘贴保存

> ✅ **免费额度**：日常使用完全够用（新手每月几千次请求没问题）  
> ✅ **无需信用卡**  
> ✅ **国内可访问**（有时需要稳定网络）

---

## 🧩 核心概念解释（新手向）

| 概念 | 简单理解 | 作用 |
|------|----------|------|
| **视觉模板** | 决定整体“感觉”（颜色、图标、布局框架） | 让你的笔记一眼就知道是科技风还是好物风 |
| **图片风格** | 控制背景、装饰、纹理的“味道” | 简约风 / 梦幻风 / 赛博风 等细微差别 |
| **AI 优化** | Gemini 把你的文字改得更好看 | 标题更吸睛、正文更有节奏、emoji 更合适 |
| **批量生成** | 同一内容生成多张不同风格的图片 | 方便 A/B 测试哪张效果更好 |

---

## 🛠️ 技术栈（可选了解）

纯前端实现，零后端依赖：
- HTML + CSS + JavaScript（原生，无框架）
- Google Gemini API（文案优化）
- HTML5 Canvas（高质量图片渲染导出）
- 本地 JSON 模板 + 字体图标（离线可用）

支持部署到 GitHub Pages、Vercel、Netlify、OSS 等任意静态托管平台。

---

## 📁 项目结构（开发者向）

```
xiaohongshu-ai-generator/
├── index.html              # 主页面（所有逻辑入口）
├── assets/
│   ├── css/                # 样式（粉色主题 + 响应式）
│   ├── js/                 # 核心 JS（步骤控制、Canvas 渲染、Gemini 调用）
│   └── vendor/             # 本地图标字体（离线可用）
├── templates/
│   ├── templates.json      # 基础视觉模板配置
│   └── templates-extended.json  # 更多扩展模板
└── docs/                   # 额外文档
```

---

## ❓ 常见问题（新手 FAQ）

<details>
<summary>❓ 提示“服务不可用”怎么办？</summary>

系统会**自动降级到本地优化模式**，继续生成图片，只是 AI 润色功能暂时关闭。页面会有明显提示，不影响使用。
</details>

<details>
<summary>❓ 生成的图片模板看起来没变化？</summary>

按 `Ctrl + F5`（Mac: `Cmd + Shift + R`）强制刷新浏览器缓存，然后重新生成。
</details>

<details>
<summary>❓ 本地运行只显示少量模板？</summary>

必须用 `npm run start` 启动本地服务器！直接用浏览器打开 `file://` 路径会导致 JSON 模板加载失败。
</details>

<details>
<summary>❓ 国内访问需要科学上网吗？</summary>

**不需要**！项目已针对国内优化（本地图标 + 国内 CDN）。只有调用 Gemini API 时需要能访问 Google 服务。
</details>

<details>
<summary>❓ 生成的图片怎么直接发小红书？</summary>

导出后是标准 PNG 图片，直接在小红书 App「发布笔记」时上传即可。建议竖版 9:16 或 4:5 比例最受欢迎。
</details>

---

## 🤝 贡献指南（欢迎新手参与）

1. Fork 本仓库
2. 创建功能分支 `git checkout -b feat/你的功能名`
3. 提交改动 `git commit -m 'feat: 添加xxx功能'`
4. 推送 `git push origin feat/你的功能名`
5. 发起 Pull Request

欢迎提交：
- 新模板建议
- UI 优化
- Bug 修复
- 文档改进
- 新手使用教程

---

## 📄 License

[MIT](./LICENSE) © 2024 Yuuqq

---

<div align="center">

**如果这个项目帮到你了，请给个 ⭐ Star 支持一下！**

让更多人发现这个免费好用的工具 ❤️

[在线体验](https://yuuqq.github.io/xiaohongshu-ai-generator/) · [反馈问题](https://github.com/Yuuqq/xiaohongshu-ai-generator/issues)

</div>