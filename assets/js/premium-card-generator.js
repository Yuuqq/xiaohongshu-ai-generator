/**
 * 精美卡片生成器 v2.1
 * 纯 SVG 原语渲染（无 foreignObject），不包含 @font-face 声明，彻底避免 canvas 污染（Tainted Canvas）。
 * 输出尺寸为小红书标准：3:4=1080×1440, 1:1=1080×1080, 9:16=1080×1920。
 * 设计遵循 taste-skill Anti-Slop 规范。
 */
class PremiumCardGenerator {
    constructor() {
        this.isGenerating = false;
        this.cardTemplates = new Map();

        // 使用安全系统字体栈，完全避免 @font-face local() 声明引发的 Tainted canvas 问题
        this.fontSans = "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'Helvetica Neue', Arial, sans-serif";
        this.fontSerif = "'Songti SC', SimSun, 'Noto Serif SC', Georgia, serif";
        this.fontMono = "ui-monospace, 'SF Mono', Consolas, Menlo, Monaco, monospace";

        this.initializeTemplates();
    }

    // ── 小红书标准尺寸 ──────────────────────────────
    static DIMENSIONS = {
        '3:4': { width: 1080, height: 1440 },
        '1:1': { width: 1080, height: 1080 },
        '9:16': { width: 1080, height: 1920 },
        '4:3': { width: 1080, height: 810 },
        '16:9': { width: 1080, height: 608 },
    };

    // ── 模板初始化 ──────────────────────────────
    initializeTemplates() {
        this.cardTemplates.set('minimalist-svg', {
            id: 'minimalist-svg',
            name: '极简主义卡片',
            description: '大量留白与极致排版，适合文艺或概念性内容',
            colors: {
                background: '#FAFAF8',
                primary: '#1D4ED8',
                text: '#1A1A1A',
                textLight: '#6B7280',
                border: '#E5E5E0',
                accent: '#F0F0EC'
            }
        });

        this.cardTemplates.set('tech-premium', {
            id: 'tech-premium',
            name: '酷黑科技卡片',
            description: '深色未来感科技排版，适合API、系统、硬核数据',
            colors: {
                background: '#0A0E17',
                primary: '#22D3EE',
                secondary: '#10B981',
                cardBg: '#111827',
                text: '#F1F5F9',
                textLight: '#94A3B8',
                border: '#1E293B',
                gridLine: '#1E293B'
            }
        });

        this.cardTemplates.set('lifestyle-premium', {
            id: 'lifestyle-premium',
            name: '暖风生活卡片',
            description: '温暖森林色调与精致排版，适合旅行、日常与好物',
            colors: {
                background: '#1C2B1F',
                cardBg: '#FDFBF5',
                primary: '#B85636',
                text: '#1A1A1A',
                textLight: '#4A6741',
                border: '#E8E4DB',
                accent: '#F5F2EC'
            }
        });

        this.cardTemplates.set('data-showcase-svg', {
            id: 'data-showcase-svg',
            name: '数据看板卡片',
            description: 'Bento 网格化指标展示，适合精细化业务或性能对比',
            colors: {
                background: '#0F172A',
                cardBg: '#1E293B',
                primary: '#818CF8',
                secondary: '#38BDF8',
                text: '#F1F5F9',
                textLight: '#94A3B8',
                border: '#334155'
            }
        });

        this.cardTemplates.set('editorial-serif-svg', {
            id: 'editorial-serif-svg',
            name: '经典人文画册',
            description: '传统纸张色泽与大号引号，适合名言、深度思考',
            colors: {
                background: '#FAF8F3',
                primary: '#8B2E19',
                text: '#1C1C1C',
                textLight: '#5C5C5C',
                border: '#E5E2DB',
                accent: '#F5F0E8'
            }
        });
    }

    // ── 主入口 ──────────────────────────────
    async generatePremiumCard(content, templateId = 'minimalist-svg', options = {}) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请稍候');
        }

        try {
            this.isGenerating = true;

            const template = this.cardTemplates.get(templateId);
            if (!template) {
                throw new Error(`模板 ${templateId} 不存在`);
            }

            const aspectRatio = options.aspectRatio || '3:4';
            const dims = PremiumCardGenerator.DIMENSIONS[aspectRatio]
                || PremiumCardGenerator.DIMENSIONS['3:4'];
            const { width, height } = dims;

            const analysis = this.analyzeContent(content);
            const svg = this.createPremiumSVG(analysis, template, width, height, options);
            const pngData = await this.convertSvgToPng(svg, width, height);

            return {
                svg,
                url: pngData.url,
                blob: pngData.blob,
                width,
                height,
                format: 'png',
                analysis
            };
        } finally {
            this.isGenerating = false;
        }
    }

    // ── 内容分析 ──────────────────────────────
    analyzeContent(content) {
        const lines = content.split('\n').filter(l => l.trim());
        const title = this.extractTitle(lines);
        const dataPoints = this.extractDataPoints(content);
        const keyPoints = this.extractKeyPoints(content);
        const contentType = this.analyzeContentType(content);

        return {
            title,
            dataPoints,
            keyPoints,
            contentType,
            originalContent: content,
            processedContent: content.length > 300 ? content.substring(0, 300) + '...' : content
        };
    }

    extractTitle(lines) {
        if (!lines.length) return '内容分享';
        let title = lines[0].replace(/^[\d.、)）\-*·•→►▶︎☞✅✔️💡🔥⭐️🌟🟢]+\s*/, '').trim();
        title = title.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
        if (title.length < 4 && lines.length > 1) {
            title = lines[0].trim();
        }
        return title || '内容分享';
    }

    extractDataPoints(content) {
        const points = [];
        const patterns = [
            /(\d+(?:\.\d+)?)\s*(TiB|GiB|MB|KB|GB|TB|%|倍|次|个|万|亿|秒|分钟|小时|天|节点)/g,
            /(?:速度|性能|容量|时间|规模|效率|准确率|覆盖率)[：:]\s*(\d+(?:\.\d+)?)\s*([\u4e00-\u9fff%a-zA-Z/]+)/g
        ];

        for (const pattern of patterns) {
            let m;
            while ((m = pattern.exec(content)) !== null && points.length < 4) {
                points.push({
                    value: m[1],
                    unit: m[2] || '',
                    label: this.guessLabel(m[0], m[2] || '')
                });
            }
        }
        return points;
    }

    guessLabel(matchStr, unit) {
        const map = {
            'TiB': '存储容量', 'GiB': '内存容量', 'GB': '存储容量', 'TB': '数据规模',
            'MB': '缓存大小', 'KB': '数据大小', '%': '性能指标', '倍': '性能提升',
            '次': '操作次数', '个': '数量指标', '万': '规模指标', '亿': '数据规模',
            '秒': '响应时间', '分钟': '处理时间', '小时': '运行时间', '天': '稳定性',
            '节点': '集群规模'
        };
        return map[unit] || '技术指标';
    }

    extractKeyPoints(content) {
        const points = [];
        const lines = content.split('\n');
        for (const line of lines) {
            const cleaned = line.trim();
            const match = cleaned.match(/^(?:\d+[.、)）]\s*|[•·\-*→►]\s*)(.+)/);
            if (match && match[1].trim().length > 2 && points.length < 6) {
                points.push(match[1].trim());
            }
        }
        if (points.length === 0) {
            const sentences = content.split(/[。！？\n]/).filter(s => s.trim().length > 8);
            points.push(...sentences.slice(0, 5));
        }
        return points;
    }

    analyzeContentType(content) {
        const techWords = ['AI', 'API', '算法', '模型', '系统', '技术', '开源', '框架', '数据库', '性能'];
        const lifeWords = ['生活', '分享', '推荐', '体验', '感受', '习惯', '时间', '方法', '技巧', '清单'];
        const ts = techWords.reduce((s, w) => s + (content.includes(w) ? 1 : 0), 0);
        const ls = lifeWords.reduce((s, w) => s + (content.includes(w) ? 1 : 0), 0);
        return ts > ls ? 'tech' : 'lifestyle';
    }

    // ── SVG 文字折行工具 ──────────────────────────────
    wrapText(text, x, startY, fontSize, maxWidth, fill, options = {}) {
        const {
            fontWeight = 'normal',
            lineHeight = 1.55,
            letterSpacing = 0,
            maxLines = 20,
            fontFamily = "sans-serif"
        } = options;

        if (!text) return '';

        const avgCharWidth = fontSize * 0.55;
        const charsPerLine = Math.floor(maxWidth / avgCharWidth);

        const wrappedLines = [];
        let remaining = text;
        while (remaining.length > 0 && wrappedLines.length < maxLines) {
            if (remaining.length <= charsPerLine) {
                wrappedLines.push(remaining);
                remaining = '';
            } else {
                let breakIdx = charsPerLine;
                const searchStart = Math.max(0, charsPerLine - 8);
                for (let i = charsPerLine; i >= searchStart; i--) {
                    const ch = remaining[i];
                    if ('，。！？；：、 ,.:;!?\n'.includes(ch)) {
                        breakIdx = i + 1;
                        break;
                    }
                }
                wrappedLines.push(remaining.substring(0, breakIdx));
                remaining = remaining.substring(breakIdx);
            }
        }

        const dy = fontSize * lineHeight;
        return wrappedLines.map((line, i) => {
            const escapedLine = this.escapeXML(line);
            const yPos = startY + i * dy;
            return `<text x="${x}" y="${yPos}" font-size="${fontSize}" fill="${fill}" font-weight="${fontWeight}" font-family="${fontFamily}" letter-spacing="${letterSpacing}">${escapedLine}</text>`;
        }).join('\n        ');
    }

    // ── SVG 路由 ──────────────────────────────
    createPremiumSVG(analysis, template, width, height, options = {}) {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

        // 彻底移除 defs 中的 @font-face，避免 Chromium 因 local() 指令污染 Canvas
        svg += `<defs></defs>`;

        if (template.id === 'minimalist-svg') {
            svg += this.renderMinimalistSVG(analysis, template, width, height, options);
        } else if (template.id === 'tech-premium') {
            svg += this.renderTechPremiumSVG(analysis, template, width, height, options);
        } else if (template.id === 'lifestyle-premium') {
            svg += this.renderLifestylePremiumSVG(analysis, template, width, height, options);
        } else if (template.id === 'data-showcase-svg') {
            svg += this.renderDataShowcaseSVG(analysis, template, width, height, options);
        } else if (template.id === 'editorial-serif-svg') {
            svg += this.renderEditorialSerifSVG(analysis, template, width, height, options);
        } else {
            svg += this.renderMinimalistSVG(analysis, template, width, height, options);
        }

        svg += '</svg>';
        return svg;
    }

    // ═══════════════════════════════════════════════════════════
    //  1. 极简主义 (Minimalist)
    // ═══════════════════════════════════════════════════════════
    renderMinimalistSVG(analysis, template, w, h) {
        const c = template.colors;
        const padX = 100;
        const contentW = w - padX * 2;
        let parts = [];

        parts.push(`<rect width="${w}" height="${h}" fill="${c.background}" />`);
        parts.push(`<line x1="${padX - 20}" y1="${Math.round(h * 0.14)}" x2="${padX - 20}" y2="${Math.round(h * 0.86)}" stroke="${c.primary}" stroke-width="5" stroke-linecap="round" />`);

        const tagY = Math.round(h * 0.10);
        parts.push(`<text x="${padX}" y="${tagY}" font-size="18" fill="${c.textLight}" font-family="${this.fontMono}" letter-spacing="3" font-weight="600">MINIMALIST · AESTHETIC</text>`);

        const titleY = Math.round(h * 0.18);
        const titleFontSize = analysis.title.length > 18 ? 42 : 52;
        parts.push(this.wrapText(analysis.title, padX, titleY, titleFontSize, contentW, c.text, {
            fontWeight: '700',
            lineHeight: 1.35,
            fontFamily: this.fontSans,
            maxLines: 3
        }));

        const sepY = titleY + titleFontSize * 1.35 * Math.min(3, Math.ceil(analysis.title.length / Math.floor(contentW / (titleFontSize * 0.55)))) + 30;
        parts.push(`<line x1="${padX}" y1="${sepY}" x2="${padX + 120}" y2="${sepY}" stroke="${c.primary}" stroke-width="3" stroke-linecap="round" />`);

        let currentY = sepY + 50;
        if (analysis.dataPoints.length > 0) {
            const dpW = Math.floor((contentW - 30) / 2);
            analysis.dataPoints.slice(0, 4).forEach((dp, i) => {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const dpX = padX + col * (dpW + 30);
                const dpY = currentY + row * 100;

                parts.push(`<text x="${dpX}" y="${dpY}" font-size="16" fill="${c.textLight}" font-family="${this.fontSans}" font-weight="600" letter-spacing="1">${this.escapeXML(dp.label)}</text>`);
                parts.push(`<text x="${dpX}" y="${dpY + 38}" font-size="38" fill="${c.primary}" font-family="${this.fontMono}" font-weight="800">${dp.value} <tspan font-size="22" font-weight="400">${dp.unit}</tspan></text>`);
                parts.push(`<line x1="${dpX}" y1="${dpY + 50}" x2="${dpX + dpW}" y2="${dpY + 50}" stroke="${c.border}" stroke-width="1" />`);
            });
            currentY += Math.ceil(analysis.dataPoints.length / 2) * 100 + 30;
        }

        if (analysis.keyPoints.length > 0) {
            parts.push(`<text x="${padX}" y="${currentY}" font-size="18" fill="${c.textLight}" font-family="${this.fontMono}" letter-spacing="2" font-weight="600">KEY POINTS</text>`);
            currentY += 40;

            analysis.keyPoints.forEach((point, i) => {
                const idx = String(i + 1).padStart(2, '0');
                parts.push(`<text x="${padX}" y="${currentY}" font-size="20" fill="${c.primary}" font-family="${this.fontMono}" font-weight="700">[${idx}]</text>`);
                const textX = padX + 65;
                const textW = contentW - 65;
                const pointLines = this.wrapText(point, textX, currentY, 22, textW, c.text, {
                    fontWeight: '400',
                    lineHeight: 1.5,
                    fontFamily: this.fontSans,
                    maxLines: 3
                });
                parts.push(pointLines);
                const lineCount = Math.min(3, Math.ceil(point.length / Math.floor(textW / (22 * 0.55))));
                currentY += 22 * 1.5 * lineCount + 20;
            });
        }

        parts.push(`<text x="${padX}" y="${h - 80}" font-size="14" fill="${c.textLight}" font-family="${this.fontMono}" letter-spacing="2">SVG · XIAOHONGSHU · ${w}×${h}</text>`);

        return '\n        ' + parts.join('\n        ');
    }

    // ═══════════════════════════════════════════════════════════
    //  2. 酷黑科技 (Tech Premium - Bento)
    // ═══════════════════════════════════════════════════════════
    renderTechPremiumSVG(analysis, template, w, h) {
        const c = template.colors;
        const padX = 60;
        const contentW = w - padX * 2;
        let parts = [];

        parts.push(`<rect width="${w}" height="${h}" fill="${c.background}" />`);

        for (let y = 0; y <= h; y += 60) {
            parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${c.gridLine}" stroke-width="0.5" opacity="0.3" />`);
        }
        for (let x = 0; x <= w; x += 60) {
            parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${c.gridLine}" stroke-width="0.5" opacity="0.3" />`);
        }

        const headerH = 170;
        parts.push(`<rect x="${padX}" y="70" width="${contentW}" height="${headerH}" rx="14" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);
        parts.push(`<circle cx="${padX + 30}" cy="100" r="7" fill="#FF5F56" />`);
        parts.push(`<circle cx="${padX + 52}" cy="100" r="7" fill="#FFBD2E" />`);
        parts.push(`<circle cx="${padX + 74}" cy="100" r="7" fill="#27C93F" />`);
        parts.push(`<text x="${w - padX - 30}" y="107" font-size="13" fill="${c.textLight}" font-family="${this.fontMono}" text-anchor="end">terminal.sh</text>`);

        const titleFontSize = analysis.title.length > 20 ? 30 : 36;
        parts.push(this.wrapText(analysis.title, padX + 30, 145, titleFontSize, contentW - 60, c.text, {
            fontWeight: '700',
            lineHeight: 1.3,
            fontFamily: this.fontSans,
            maxLines: 2
        }));

        let currentY = 70 + headerH + 25;
        if (analysis.dataPoints.length > 0) {
            const cols = 2;
            const cardGap = 20;
            const cardW = Math.floor((contentW - cardGap) / cols);
            const cardH = 120;

            analysis.dataPoints.slice(0, 4).forEach((dp, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const cx = padX + col * (cardW + cardGap);
                const cy = currentY + row * (cardH + cardGap);

                parts.push(`<rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="12" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);
                parts.push(`<rect x="${cx}" y="${cy}" width="${cardW}" height="4" rx="2" fill="${c.primary}" />`);
                parts.push(`<text x="${cx + 18}" y="${cy + 32}" font-size="14" fill="${c.textLight}" font-family="${this.fontMono}" letter-spacing="1">${this.escapeXML(dp.label).toUpperCase()}</text>`);
                parts.push(`<text x="${cx + 18}" y="${cy + 72}" font-size="34" fill="${c.text}" font-family="${this.fontMono}" font-weight="800">${dp.value} <tspan font-size="20" fill="${c.primary}" font-weight="400">${dp.unit}</tspan></text>`);
                const barW = cardW - 36;
                const fillPct = Math.min(100, parseInt(dp.value) || 65);
                parts.push(`<rect x="${cx + 18}" y="${cy + 90}" width="${barW}" height="6" rx="3" fill="rgba(255,255,255,0.05)" />`);
                parts.push(`<rect x="${cx + 18}" y="${cy + 90}" width="${Math.round(barW * fillPct / 100)}" height="6" rx="3" fill="${c.primary}" opacity="0.8" />`);
            });
            currentY += Math.ceil(analysis.dataPoints.length / cols) * (cardH + cardGap) + 10;
        }

        if (analysis.keyPoints.length > 0) {
            const kpH = Math.min(h - currentY - 100, 50 + analysis.keyPoints.length * 65);
            parts.push(`<rect x="${padX}" y="${currentY}" width="${contentW}" height="${kpH}" rx="14" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);
            parts.push(`<text x="${padX + 25}" y="${currentY + 35}" font-size="15" fill="${c.primary}" font-family="${this.fontMono}" font-weight="700" letter-spacing="2">SYSTEM_LOG // KEY_POINTS</text>`);

            let kpY = currentY + 65;
            analysis.keyPoints.forEach((point, i) => {
                parts.push(`<text x="${padX + 25}" y="${kpY}" font-size="15" fill="${c.secondary}" font-family="${this.fontMono}" font-weight="700">[${i + 1}]</text>`);
                const textX = padX + 75;
                const textW = contentW - 100;
                parts.push(this.wrapText(point, textX, kpY, 19, textW, '#E2E8F0', {
                    fontWeight: '400',
                    lineHeight: 1.45,
                    fontFamily: this.fontSans,
                    maxLines: 2
                }));
                const lineCount = Math.min(2, Math.ceil(point.length / Math.floor(textW / (19 * 0.55))));
                kpY += 19 * 1.45 * lineCount + 12;
            });
        }

        parts.push(`<text x="${padX}" y="${h - 60}" font-size="13" fill="${c.textLight}" font-family="${this.fontMono}">// RENDER: SVG_PURE · ${w}×${h} · ACCENT: ${c.primary}</text>`);

        return '\n        ' + parts.join('\n        ');
    }

    // ── 3. 暖风生活 (Lifestyle Premium) ──────────────────
    renderLifestylePremiumSVG(analysis, template, w, h) {
        const c = template.colors;
        const padX = 70;
        const contentW = w - padX * 2;
        let parts = [];

        parts.push(`<rect width="${w}" height="${h}" fill="${c.background}" />`);
        parts.push(`<circle cx="${w - 150}" cy="200" r="180" fill="${c.primary}" opacity="0.04" />`);
        parts.push(`<circle cx="120" cy="${h - 250}" r="220" fill="${c.textLight}" opacity="0.03" />`);

        const cardX = padX;
        const cardY = 90;
        const cardW = contentW;
        const cardH = h - 180;
        parts.push(`<rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="24" fill="${c.cardBg}" />`);

        const badgeW = 160;
        const badgeX = Math.round(w / 2 - badgeW / 2);
        parts.push(`<rect x="${badgeX}" y="${cardY + 40}" width="${badgeW}" height="34" rx="17" fill="${c.accent}" />`);
        parts.push(`<text x="${w / 2}" y="${cardY + 62}" font-size="15" fill="${c.primary}" font-family="${this.fontSans}" font-weight="700" text-anchor="middle" letter-spacing="2">LIFE STYLE</text>`);

        const titleY = cardY + 115;
        const titleFontSize = analysis.title.length > 16 ? 36 : 44;
        parts.push(this.wrapText(analysis.title, cardX + 40, titleY, titleFontSize, cardW - 80, c.text, {
            fontWeight: '700',
            lineHeight: 1.35,
            fontFamily: this.fontSans,
            maxLines: 3
        }));

        const subTitleY = titleY + titleFontSize * 1.35 * Math.min(3, Math.ceil(analysis.title.length / Math.floor((cardW - 80) / (titleFontSize * 0.55)))) + 15;
        parts.push(`<text x="${w / 2}" y="${subTitleY}" font-size="16" fill="${c.textLight}" font-family="${this.fontSans}" text-anchor="middle" letter-spacing="2">Daily Share · Content &amp; Life</text>`);

        let currentY = subTitleY + 40;
        if (analysis.keyPoints.length > 0) {
            const insetX = cardX + 40;
            const insetW = cardW - 80;
            const insetH = Math.min(cardH - (currentY - cardY) - 100, analysis.keyPoints.length * 65 + 40);
            parts.push(`<rect x="${insetX}" y="${currentY}" width="${insetW}" height="${insetH}" rx="18" fill="${c.accent}" />`);

            let kpY = currentY + 40;
            analysis.keyPoints.forEach((point, i) => {
                parts.push(`<circle cx="${insetX + 25}" cy="${kpY - 5}" r="14" fill="${c.primary}" />`);
                parts.push(`<text x="${insetX + 25}" y="${kpY}" font-size="14" fill="white" font-family="${this.fontSans}" font-weight="700" text-anchor="middle">${i + 1}</text>`);
                const textX = insetX + 50;
                const textW = insetW - 70;
                parts.push(this.wrapText(point, textX, kpY, 20, textW, '#3F4238', {
                    fontWeight: '500',
                    lineHeight: 1.45,
                    fontFamily: this.fontSans,
                    maxLines: 2
                }));
                const lineCount = Math.min(2, Math.ceil(point.length / Math.floor(textW / (20 * 0.55))));
                kpY += 20 * 1.45 * lineCount + 16;
            });
        }

        parts.push(`<text x="${w / 2}" y="${h - 110}" font-size="15" fill="${c.primary}" font-family="${this.fontSans}" font-weight="700" text-anchor="middle" letter-spacing="3">✦ LIFESTYLE SELECTION ✦</text>`);

        return '\n        ' + parts.join('\n        ');
    }

    // ── 4. 数据看板 (Data Showcase - Bento) ─────────────
    renderDataShowcaseSVG(analysis, template, w, h) {
        const c = template.colors;
        const padX = 50;
        const contentW = w - padX * 2;
        const gap = 20;
        let parts = [];

        parts.push(`<rect width="${w}" height="${h}" fill="${c.background}" />`);

        const headerH = 180;
        parts.push(`<rect x="${padX}" y="70" width="${contentW}" height="${headerH}" rx="18" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);

        const badgeW = 150;
        parts.push(`<rect x="${padX + 25}" y="95" width="${badgeW}" height="28" rx="14" fill="${c.primary}" opacity="0.15" />`);
        parts.push(`<text x="${padX + 25 + badgeW / 2}" y="114" font-size="12" fill="${c.secondary}" font-family="${this.fontMono}" font-weight="700" text-anchor="middle" letter-spacing="2">DATA_MONITOR</text>`);

        parts.push(this.wrapText(analysis.title, padX + 25, 160, 32, contentW - 50, c.text, {
            fontWeight: '700',
            lineHeight: 1.3,
            fontFamily: this.fontSans,
            maxLines: 2
        }));
        parts.push(`<text x="${padX + 25}" y="215" font-size="15" fill="${c.textLight}" font-family="${this.fontSans}">基于真实指标分析的数据看板</text>`);

        let currentY = 70 + headerH + gap;
        if (analysis.dataPoints.length > 0) {
            const cols = 2;
            const cardW = Math.floor((contentW - gap) / cols);
            const cardH = 130;

            analysis.dataPoints.slice(0, 4).forEach((dp, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const cx = padX + col * (cardW + gap);
                const cy = currentY + row * (cardH + gap);

                parts.push(`<rect x="${cx}" y="${cy}" width="${cardW}" height="${cardH}" rx="18" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);
                parts.push(`<text x="${cx + 20}" y="${cy + 30}" font-size="14" fill="${c.textLight}" font-family="${this.fontMono}">${this.escapeXML(dp.label)}</text>`);
                parts.push(`<text x="${cx + 20}" y="${cy + 75}" font-size="38" fill="${c.secondary}" font-family="${this.fontMono}" font-weight="800">${dp.value} <tspan font-size="20" font-weight="400" fill="${c.textLight}">${dp.unit}</tspan></text>`);

                const barW = cardW - 40;
                const pct = Math.min(100, parseInt(dp.value) || 50);
                parts.push(`<rect x="${cx + 20}" y="${cy + 100}" width="${barW}" height="8" rx="4" fill="rgba(255,255,255,0.04)" />`);
                parts.push(`<rect x="${cx + 20}" y="${cy + 100}" width="${Math.round(barW * pct / 100)}" height="8" rx="4" fill="url(#grad_${i})" />`);
                parts.push(`<defs><linearGradient id="grad_${i}" x1="0%" y1="0%" x2="100%"><stop offset="0%" stop-color="${c.primary}" /><stop offset="100%" stop-color="${c.secondary}" /></linearGradient></defs>`);
            });
            currentY += Math.ceil(analysis.dataPoints.length / cols) * (cardH + gap) + 5;
        }

        if (analysis.keyPoints.length > 0) {
            const insH = Math.min(h - currentY - 80, analysis.keyPoints.length * 55 + 60);
            parts.push(`<rect x="${padX}" y="${currentY}" width="${contentW}" height="${insH}" rx="18" fill="${c.cardBg}" stroke="${c.border}" stroke-width="1.5" />`);
            parts.push(`<text x="${padX + 25}" y="${currentY + 35}" font-size="14" fill="${c.secondary}" font-family="${this.fontMono}" font-weight="700" letter-spacing="2">CORE_INSIGHTS_LOG</text>`);
            parts.push(`<line x1="${padX + 25}" y1="${currentY + 45}" x2="${padX + contentW - 25}" y2="${currentY + 45}" stroke="${c.border}" stroke-width="1" />`);

            let ky = currentY + 70;
            analysis.keyPoints.slice(0, 4).forEach((p, i) => {
                parts.push(`<text x="${padX + 25}" y="${ky}" font-size="14" fill="${c.secondary}" font-family="${this.fontMono}" font-weight="700">INDEX_0${i + 1}</text>`);
                parts.push(this.wrapText(p, padX + 115, ky, 17, contentW - 140, '#E2E8F0', {
                    fontWeight: '400',
                    lineHeight: 1.4,
                    fontFamily: this.fontSans,
                    maxLines: 2
                }));
                ky += 50;
            });
        }

        return '\n        ' + parts.join('\n        ');
    }

    // ── 5. 经典人文画册 (Editorial Serif) ──────────────────
    renderEditorialSerifSVG(analysis, template, w, h) {
        const c = template.colors;
        const padX = 90;
        const contentW = w - padX * 2;
        let parts = [];

        parts.push(`<rect width="${w}" height="${h}" fill="${c.background}" />`);
        parts.push(`<rect x="30" y="30" width="${w - 60}" height="${h - 60}" fill="none" stroke="${c.border}" stroke-width="1" />`);

        parts.push(`<text x="60" y="250" font-size="200" fill="${c.primary}" opacity="0.08" font-family="${this.fontSerif}">\u201C</text>`);
        parts.push(`<text x="${w - 200}" y="${h - 150}" font-size="200" fill="${c.primary}" opacity="0.08" font-family="${this.fontSerif}">\u201D</text>`);

        const titleY = 240;
        const titleFontSize = analysis.title.length > 16 ? 38 : 48;
        parts.push(this.wrapText(analysis.title, padX, titleY, titleFontSize, contentW, c.text, {
            fontWeight: '700',
            lineHeight: 1.4,
            fontFamily: this.fontSerif,
            maxLines: 3
        }));

        const sepY = titleY + titleFontSize * 1.4 * Math.min(3, Math.ceil(analysis.title.length / Math.floor(contentW / (titleFontSize * 0.55)))) + 25;
        parts.push(`<line x1="${padX}" y1="${sepY}" x2="${padX + 80}" y2="${sepY}" stroke="${c.primary}" stroke-width="3" stroke-linecap="round" />`);

        let currentY = sepY + 50;
        if (analysis.keyPoints.length > 0) {
            analysis.keyPoints.forEach(point => {
                const indented = '\u3000\u3000' + point;
                parts.push(this.wrapText(indented, padX, currentY, 23, contentW, '#2C2C2C', {
                    fontWeight: '400',
                    lineHeight: 1.8,
                    fontFamily: this.fontSerif,
                    maxLines: 4
                }));
                const lineCount = Math.min(4, Math.ceil(indented.length / Math.floor(contentW / (23 * 0.55))));
                currentY += 23 * 1.8 * lineCount + 20;
            });
        } else {
            const indented = '\u3000\u3000' + analysis.originalContent;
            parts.push(this.wrapText(indented, padX, currentY, 23, contentW, '#2C2C2C', {
                fontWeight: '400',
                lineHeight: 1.8,
                fontFamily: this.fontSerif,
                maxLines: 15
            }));
        }

        if (analysis.dataPoints.length > 0) {
            currentY = Math.max(currentY + 30, h - 280);
            parts.push(`<line x1="${padX}" y1="${currentY}" x2="${w - padX}" y2="${currentY}" stroke="${c.border}" stroke-width="1" stroke-dasharray="6 4" />`);
            currentY += 35;
            const dpGap = Math.floor(contentW / Math.min(3, analysis.dataPoints.length));
            analysis.dataPoints.slice(0, 3).forEach((dp, i) => {
                const dx = padX + i * dpGap;
                parts.push(`<text x="${dx}" y="${currentY}" font-size="14" fill="${c.textLight}" font-family="${this.fontSans}">${this.escapeXML(dp.label)}</text>`);
                parts.push(`<text x="${dx}" y="${currentY + 30}" font-size="24" fill="${c.primary}" font-family="${this.fontSerif}" font-weight="700">${dp.value} ${dp.unit}</text>`);
            });
        }

        parts.push(`<text x="${padX}" y="${h - 80}" font-size="14" fill="${c.textLight}" font-family="${this.fontSerif}" font-style="italic" letter-spacing="1">\u2014\u2014 \u9009\u81EA\u00B7\u4EBA\u6587\u4E13\u680F\u7CFB\u5217 \u00B7 SVG\u5448\u73B0 \u00B7 ${w}\u00D7${h}</text>`);

        return '\n        ' + parts.join('\n        ');
    }

    // ── SVG → PNG 转换 ──────────────────────────────
    async convertSvgToPng(svgString, width, height) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    // 使用 2x 设备像素比以获取高清输出
                    const scale = 2;
                    const canvas = document.createElement('canvas');
                    canvas.width = width * scale;
                    canvas.height = height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.scale(scale, scale);

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    const url = canvas.toDataURL('image/png', 1.0);
                    canvas.toBlob((blob) => {
                        resolve({ url, blob });
                    }, 'image/png');
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => {
                reject(new Error('SVG 转换为 PNG 图片失败'));
            };

            // 使用 data URI 代替 Blob URL，彻底解决 Chrome 限制及 Tainted Canvas 报错
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        });
    }

    // ── XML 转义 ──────────────────────────────
    escapeXML(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// 全局实例
window.premiumCardGenerator = new PremiumCardGenerator();
