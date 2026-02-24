# 小红书 AI 图片生成器

基于 Google Gemini API 的静态站点工具，用于生成小红书图文卡片与封面图。

在线地址：`https://yuuqq.github.io/xiaohongshu-ai-generator/`

## 功能概览
- 五步工作流：内容输入 -> 风格选择 -> 内容优化 -> 预览生成 -> 图片导出。
- 支持多模板、多口吻、多图批量生成。
- 实时预览支持比例与质量输出（`1:1`、`9:16`、`16:9`、`4:5`）。
- 内容优化支持 Gemini API，并带本地回退（API 不可用时不中断流程）。
- 国内访问优化：本地图标字体 + 国内 CDN 优先策略。

## 快速开始
1. 安装依赖：
```bash
npm install
```
2. 本地启动（推荐 HTTP，不建议直接双击 `index.html`）：
```bash
npm run start
```
3. 浏览器打开 `http://127.0.0.1:8080`。
4. 在页面右上角设置中填写 Gemini API Key。

## 使用说明
1. 步骤 1 输入文案。
2. 步骤 2 选择写作口吻和视觉模板。
3. 步骤 3 点击「AI智能优化」生成优化文案。
4. 步骤 4 设置生成数量、图片风格、比例、质量并预览。
5. 步骤 5 批量导出图片。

## 关键概念
- 步骤 2「视觉模板」：决定主题配色、布局倾向、模板语义（如科技/好物/教程）。
- 步骤 4「图片风格」：决定渲染风格参数（如背景形态、装饰强度、纹理方式）。
- 两者都会影响最终出图，模板偏“内容框架”，风格偏“视觉渲染”。

## 常见问题
- 内容优化提示服务不可用：
  系统会自动切换到本地优化并继续流程，页面会显示回退提示。
- 模板或风格看起来没变化：
  先强刷 `Ctrl+F5`，再重新生成预览；确保不是浏览器缓存旧脚本。
- 本地只显示少量模板：
  请使用 HTTP 启动项目，避免 `file://` 下模板 JSON 加载失败。

## 项目结构
```text
.
├── index.html
├── assets/
│   ├── css/
│   ├── js/
│   └── vendor/material-icons/
├── templates/
│   ├── templates.json
│   └── templates-extended.json
└── docs/
```

## 技术栈
- 前端：HTML、CSS、Vanilla JavaScript
- AI：Google Gemini API
- 运行：静态站点（`http-server` / `live-server`）

## 部署
- GitHub Pages：推送 `master` 后自动发布。
- 也可使用：
```bash
npm run deploy
```

## License
MIT
