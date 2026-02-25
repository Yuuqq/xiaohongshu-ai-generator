/**
 * 高级视觉卡片生成器
 * 负责生成专业级的小红书风格卡片
 */

class VisualGenerator {
    constructor() {
        this.baseWidth = 540;
        this.baseHeight = 960;
        this.canvas = null;
        this.ctx = null;
        this.isGenerating = false;
        this.cardTemplates = {};
        this.fontLoaded = false;
        this.systemFontFamily = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
        this._initPromise = null;
        this._renderInfo = null;
        
        this.init();
    }

    /**
     * 初始化视觉生成器
     */
    async init() {
        if (this._initPromise) {
            return this._initPromise;
        }

        this._initPromise = (async () => {
            await this.loadFonts();
            this.setupCanvas();
            this.loadCardTemplates();
            DEBUG.log('视觉生成器初始化完成');
        })();

        return this._initPromise;
    }

    /**
     * 加载字体
     */
    async loadFonts() {
        try {
            // 使用本地系统字体栈，避免依赖海外字体域名
            this.fontLoaded = true;
            DEBUG.log('系统字体栈已就绪');
        } catch (error) {
            DEBUG.warn('字体加载失败，使用系统默认字体:', error);
            this.fontLoaded = false;
        }
    }

    /**
     * 设置画布
     */
    setupCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // 默认使用设计尺寸（具体输出尺寸会在 generateCard 中按比例与质量调整）
        this.canvas.style.width = `${this.baseWidth}px`;
        this.canvas.style.height = `${this.baseHeight}px`;
        this.canvas.width = this.baseWidth;
        this.canvas.height = this.baseHeight;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /**
     * 获取设计尺寸（与排版坐标系一致）
     */
    getDesignDimensions(aspectRatio = '9:16') {
        const ratio = String(aspectRatio || '9:16');
        switch (ratio) {
            case '1:1':
                return { width: 540, height: 540 };
            case '4:5':
                return { width: 540, height: 675 };
            case '16:9':
                return { width: 960, height: 540 };
            case '9:16':
            default:
                return { width: 540, height: 960 };
        }
    }

    /**
     * 准备画布：按比例/质量设置输出像素尺寸，并将坐标系缩放到“设计尺寸”
     */
    prepareCanvas(options = {}) {
        const aspectRatio = options.aspectRatio || '9:16';
        const quality = options.quality || 'high';
        const design = this.getDesignDimensions(aspectRatio);
        const output = this.getOutputDimensions(aspectRatio, quality);

        this.baseWidth = design.width;
        this.baseHeight = design.height;

        if (!this.canvas || !this.ctx) {
            this.setupCanvas();
        }

        // 输出像素尺寸（与导出一致）
        this.canvas.width = output.width;
        this.canvas.height = output.height;
        this.canvas.style.width = `${design.width}px`;
        this.canvas.style.height = `${design.height}px`;

        const scale = output.width / design.width;
        this.ctx.setTransform(scale, 0, 0, scale, 0, 0);

        this._renderInfo = { aspectRatio, quality, design, output, scale };
        return this._renderInfo;
    }

    /**
     * 加载卡片模板
     */
    loadCardTemplates() {
        this.cardTemplates = {
            'xiaohongshu-lifestyle': {
                background: 'linear-gradient(135deg, #FFF1F2, #FFE4E6, #FFD6E0)',
                primaryColor: '#FF2742',
                secondaryColor: '#FFF5F6',
                textColor: '#111827',
                accentColor: '#FB7185',
                layout: 'lifestyle'
            },
            'xiaohongshu-knowledge': {
                background: 'linear-gradient(135deg, #EFF6FF, #E0F2FE, #DBEAFE)',
                primaryColor: '#2563EB',
                secondaryColor: '#F0F9FF',
                textColor: '#0F172A',
                accentColor: '#38BDF8',
                layout: 'knowledge'
            },
            'xiaohongshu-fashion': {
                background: 'linear-gradient(135deg, #FDF2F8, #FAE8FF, #F5D0FE)',
                primaryColor: '#DB2777',
                secondaryColor: '#FDF4FF',
                textColor: '#111827',
                accentColor: '#A855F7',
                layout: 'fashion'
            },
            'xiaohongshu-food': {
                background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5, #FED7AA)',
                primaryColor: '#EA580C',
                secondaryColor: '#FFF7ED',
                textColor: '#7C2D12',
                accentColor: '#FB923C',
                layout: 'food'
            },
            'xiaohongshu-travel': {
                background: 'linear-gradient(135deg, #ECFEFF, #DCFCE7, #CCFBF1)',
                primaryColor: '#059669',
                secondaryColor: '#F0FDF4',
                textColor: '#064E3B',
                accentColor: '#06B6D4',
                layout: 'travel'
            },
            'xiaohongshu-product': {
                background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7, #FDE68A)',
                primaryColor: '#B45309',
                secondaryColor: '#FFFBEB',
                textColor: '#78350F',
                accentColor: '#F59E0B',
                layout: 'product'
            },
            'xiaohongshu-fitness': {
                background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7, #E0F2FE)',
                primaryColor: '#16A34A',
                secondaryColor: '#F0FDF4',
                textColor: '#052E16',
                accentColor: '#22C55E',
                layout: 'fitness'
            },
            'xiaohongshu-minimalist': {
                background: 'linear-gradient(135deg, #F8FAFC, #EEF2F7, #E2E8F0)',
                primaryColor: '#334155',
                secondaryColor: '#F8FAFC',
                textColor: '#0F172A',
                accentColor: '#94A3B8',
                layout: 'minimalist'
            },
            'xiaohongshu-tech-premium': {
                background: 'linear-gradient(135deg, #EDE9FE, #DDE8FF, #D4E6FF)',
                primaryColor: '#6366F1',
                secondaryColor: '#F5F3FF',
                textColor: '#312E81',
                accentColor: '#8B5CF6',
                layout: 'tech'
            },
            'xiaohongshu-data-showcase': {
                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF, #D6DEFF)',
                primaryColor: '#4F46E5',
                secondaryColor: '#EEF2FF',
                textColor: '#1E1B4B',
                accentColor: '#6366F1',
                layout: 'data'
            },
            'xiaohongshu-tutorial-card': {
                background: 'linear-gradient(135deg, #E6FFFB, #D9FDF4, #CCFBF1)',
                primaryColor: '#0F766E',
                secondaryColor: '#F0FDFA',
                textColor: '#134E4A',
                accentColor: '#14B8A6',
                layout: 'tutorial'
            }
        };
    }

    /**
     * 获取模板配置（优先精确ID，其次按分类回退）
     */
    getTemplateConfig(template) {
        const templateId = template?.id;
        if (templateId && this.cardTemplates[templateId]) {
            return this.cardTemplates[templateId];
        }

        const categoryFallback = {
            lifestyle: 'xiaohongshu-lifestyle',
            education: 'xiaohongshu-knowledge',
            fashion: 'xiaohongshu-fashion',
            food: 'xiaohongshu-food',
            travel: 'xiaohongshu-travel',
            shopping: 'xiaohongshu-product',
            fitness: 'xiaohongshu-fitness',
            minimalist: 'xiaohongshu-minimalist',
            technology: 'xiaohongshu-tech-premium'
        };

        const fallbackId = categoryFallback[template?.category] || 'xiaohongshu-lifestyle';
        return this.cardTemplates[fallbackId] || this.cardTemplates['xiaohongshu-lifestyle'];
    }

    /**
     * 生成卡片
     */
    async generateCard(content, template, tone, customTags = [], options = {}) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请稍候');
        }

        try {
            this.isGenerating = true;

            // 确保初始化完成（字体/画布/模板）
            await this.init();

            // 按比例/质量准备画布（输出像素尺寸 + 设计坐标系缩放）
            this.prepareCanvas(options);
             
            // 获取模板配置
            const templateConfig = this.getTemplateConfig(template);
            const styleProfile = this.getStyleProfile(options.imageStyle);
            
            // 清空画布
            this.clearCanvas();
            
            // 绘制背景
            await this.drawBackground(templateConfig, styleProfile);
            
            // 绘制内容
            await this.drawContent(content, templateConfig, tone, customTags, options, styleProfile);
            
            // 绘制装饰元素
            await this.drawDecorations(templateConfig, template, styleProfile);
            
            // 添加水印（默认关闭，避免影响“高级感”；需要时显式传 true）
            if (options.addWatermark === true) {
                await this.drawWatermark(styleProfile);
            }
            
            // 转换为图片
            const imageData = await this.canvasToImageData(options.format || 'png', options);
            
            return imageData;
            
        } catch (error) {
            DEBUG.error('卡片生成失败:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 根据图片风格返回渲染配置
     */
    getStyleProfile(imageStyle = 'illustration') {
        const profiles = {
            realistic: {
                key: 'realistic',
                backgroundMode: 'soft',
                textureNoise: 2,
                contentPanelOpacity: 0.9,
                titlePanelOpacityStart: 0.92,
                titlePanelOpacityEnd: 0.84,
                titleWeight: 600,
                bodyFontSize: 17,
                lineHeight: 27,
                tagMode: 'outline',
                decorationLevel: 'subtle',
                topBarHeight: 5,
                iconSize: 20,
                watermarkOpacity: 0.04
            },
            illustration: {
                key: 'illustration',
                // 默认更偏“小红书/高级感”：更轻的背景、更干净的层次、减少花哨装饰
                backgroundMode: 'soft',
                textureNoise: 2,
                contentPanelOpacity: 0.92,
                titlePanelOpacityStart: 0.96,
                titlePanelOpacityEnd: 0.9,
                titleWeight: 800,
                bodyFontSize: 18,
                lineHeight: 30,
                tagMode: 'filled',
                decorationLevel: 'subtle',
                topBarHeight: 4,
                iconSize: 22,
                watermarkOpacity: 0.035
            },
            minimalist: {
                key: 'minimalist',
                backgroundMode: 'minimal',
                textureNoise: 0,
                contentPanelOpacity: 0.96,
                titlePanelOpacityStart: 0.96,
                titlePanelOpacityEnd: 0.92,
                titleWeight: 600,
                bodyFontSize: 16,
                lineHeight: 30,
                tagMode: 'outline',
                decorationLevel: 'none',
                topBarHeight: 3,
                iconSize: 18,
                watermarkOpacity: 0.03
            },
            artistic: {
                key: 'artistic',
                backgroundMode: 'artistic',
                textureNoise: 6,
                contentPanelOpacity: 0.76,
                titlePanelOpacityStart: 0.86,
                titlePanelOpacityEnd: 0.72,
                titleWeight: 700,
                bodyFontSize: 18,
                lineHeight: 29,
                tagMode: 'filled',
                decorationLevel: 'rich',
                topBarHeight: 10,
                iconSize: 26,
                watermarkOpacity: 0.05
            }
        };

        return profiles[imageStyle] || profiles.illustration;
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * 绘制背景
     */
    async drawBackground(templateConfig, styleProfile) {
        const { background } = templateConfig;

        if (styleProfile.backgroundMode === 'minimal') {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.baseHeight);
            gradient.addColorStop(0, '#F8FAFC');
            gradient.addColorStop(1, '#EEF2F7');
            this.ctx.fillStyle = gradient;
        } else if (background.startsWith('linear-gradient')) {
            // 解析渐变
            const gradientMatch = background.match(/linear-gradient\(([^)]+)\)/);
            if (gradientMatch) {
                const gradientParams = gradientMatch[1].split(',').map(s => s.trim());
                const colors = gradientParams.slice(1);
                
                // 创建渐变
                const gradient = this.ctx.createLinearGradient(0, 0, this.baseWidth, this.baseHeight);
                colors.forEach((color, index) => {
                    gradient.addColorStop(index / (colors.length - 1), color);
                });
                
                this.ctx.fillStyle = gradient;
            }
        } else {
            this.ctx.fillStyle = background;
        }
        
        this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);

        if (styleProfile.backgroundMode === 'artistic') {
            const sx = this.baseWidth / 540;
            const sy = this.baseHeight / 960;
            const s = Math.min(sx, sy);
            this.ctx.save();
            this.ctx.globalAlpha = 0.22;
            this.ctx.fillStyle = templateConfig.accentColor;
            this.ctx.beginPath();
            this.ctx.arc(this.baseWidth * (430 / 540), this.baseHeight * (170 / 960), 140 * s, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = templateConfig.primaryColor;
            this.ctx.beginPath();
            this.ctx.arc(this.baseWidth * (110 / 540), this.baseHeight * (780 / 960), 180 * s, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        } else if (styleProfile.backgroundMode === 'soft') {
            this.ctx.save();
            this.ctx.globalAlpha = 0.26;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
            this.ctx.restore();
        }

        // 添加纹理效果
        await this.addBackgroundTexture(templateConfig, styleProfile);
    }

    /**
     * 添加背景纹理
     */
    async addBackgroundTexture(templateConfig, styleProfile) {
        const intensity = styleProfile.textureNoise || 0;
        if (intensity <= 0) {
            return;
        }

        // 添加微妙的噪点纹理
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * intensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 绘制内容
     */
    async drawContent(content, templateConfig, tone, customTags, options, styleProfile) {
        const { textColor } = templateConfig;
        const parsed = this.parseContent(content);
        const mergedTags = this.mergeTags(parsed.tags, customTags);
        const hasBody = String(parsed?.body || '').trim().length > 0;
        
        // 设置文本样式
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // 绘制标题区域
        const titleMetrics = await this.drawTitle(parsed, templateConfig, tone, styleProfile);
        
        // 绘制主要内容
        let contentPanelMetrics = null;
        let tagLayout = null;
        let reservedBottomHeight = 0;

        if (mergedTags.length > 0 && hasBody) {
            const outerMarginX = Math.round(this.baseWidth * (40 / 540));
            const panelW = Math.max(0, this.baseWidth - outerMarginX * 2);
            const paddingX = Math.round(this.baseWidth * (24 / 540));
            tagLayout = this.getTagLayout(mergedTags, Math.max(0, panelW - paddingX * 2));
            reservedBottomHeight = (tagLayout?.totalHeight || 0) + 18;
        }

        if (hasBody) {
            contentPanelMetrics = await this.drawMainContent(parsed, templateConfig, styleProfile, titleMetrics, {
                reservedBottomHeight
            });
        }
        
        // 绘制标签
        if (mergedTags.length > 0) {
            if (contentPanelMetrics) {
                await this.drawTags(mergedTags, templateConfig, styleProfile, {
                    panelMetrics: contentPanelMetrics,
                    layout: tagLayout
                });
            } else {
                await this.drawTags(mergedTags, templateConfig, styleProfile, {
                    anchorY: (titleMetrics?.bottomY || 180) + 22
                });
            }
        }
        
        // 绘制装饰图标
        await this.drawIcons(templateConfig, tone, styleProfile);
    }

    /**
     * 解析内容：提取标题/副标题/正文/标签
     */
    parseContent(rawContent) {
        const original = String(rawContent || '').replace(/\r\n/g, '\n').trim();
        if (!original) {
            return { kicker: '', title: '未提供内容', body: '', tags: [] };
        }

        const { text: textWithoutTags, tags } = this.extractHashtags(original);
        const stripLeadingMarkers = (line) => String(line || '').replace(/^\s*(?:(?:✅|☑️|✔️|👉|💡|🔥|⭐️|⭐|🌟|🟢|🔸|🔹|🔻|🔺|▶︎|▶|→)|[-*•·])\s*/, '');
        const lines = textWithoutTags
            .split('\n')
            .map(line => line.replace(/\s+$/g, ''));

        const firstNonEmptyIndex = lines.findIndex(line => line.trim().length > 0);

        let title = '';
        let titleLineIndex = -1;
        for (let i = 0; i < lines.length; i++) {
            const normalizedLine = stripLeadingMarkers(lines[i]);
            const m = normalizedLine.match(/^\s*(?:标题|Title)\s*[:：]\s*(.+?)\s*$/i);
            if (m && m[1] && m[1].trim()) {
                title = this.cleanTitleText(m[1]);
                titleLineIndex = i;
                break;
            }
        }

        // 兜底：用第一行作为标题
        if (!title && firstNonEmptyIndex !== -1) {
            const firstLine = lines[firstNonEmptyIndex].trim();
            const looksLikeListItem = !!this.parseListItem(firstLine);
            if (!looksLikeListItem && firstLine.length <= 28) {
                title = this.cleanTitleText(firstLine);
                titleLineIndex = firstNonEmptyIndex;
            }
        }

        // 如果存在“标题：xxx”，且第一行像前缀，则作为 kicker
        let kicker = '';
        let kickerLineIndex = -1;
        if (title && firstNonEmptyIndex !== -1 && firstNonEmptyIndex < titleLineIndex) {
            const firstLine = lines[firstNonEmptyIndex].trim();
            if (/[：:]$/.test(firstLine) && firstLine.length <= 20) {
                kicker = stripLeadingMarkers(firstLine).replace(/[：:]$/, '').trim();
                kickerLineIndex = firstNonEmptyIndex;
            }
        }

        // 移除 title/kicker 行，得到正文
        const bodyLines = lines.filter((_, idx) => idx !== titleLineIndex && idx !== kickerLineIndex);

        // 从正文开头提取常见的“信息条”作为 kicker（如：适合：xxx）
        if (!kicker) {
            const firstBodyIndex = bodyLines.findIndex(line => String(line || '').trim().length > 0);
            if (firstBodyIndex !== -1) {
                const candidate = String(bodyLines[firstBodyIndex] || '').trim();
                const normalizedCandidate = stripLeadingMarkers(candidate);
                const m = normalizedCandidate.match(/^(适合|适用|适用人群|人群|对象|场景|适用于)\s*[:：]\s*(.+)$/);
                if (m && m[2] && normalizedCandidate.length <= 40) {
                    kicker = `${m[1]}：${String(m[2]).trim()}`;
                    bodyLines.splice(firstBodyIndex, 1);
                }
            }
        }

        const body = bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

        if (!title) {
            const generatedTitle = this.generateTitle(body || textWithoutTags);
            title = this.cleanTitleText(generatedTitle) || generatedTitle;
        }

        return { kicker, title, body, tags };
    }

    extractHashtags(text) {
        const tags = [];
        const tagPattern = /#([A-Za-z0-9_\u4e00-\u9fff]+)/g;
        let match;
        while ((match = tagPattern.exec(text)) !== null) {
            const tag = (match[1] || '').trim();
            if (tag) tags.push(tag);
        }

        const cleaned = text
            .replace(tagPattern, '')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        return { text: cleaned, tags };
    }

    mergeTags(primaryTags = [], secondaryTags = []) {
        const merged = [];
        const seen = new Set();
        const pushTag = (t) => {
            const tag = String(t || '').trim().replace(/^#/, '');
            if (!tag) return;
            const key = tag.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(tag);
        };
        primaryTags.forEach(pushTag);
        secondaryTags.forEach(pushTag);
        return merged.slice(0, 10);
    }

    getTagLayout(tags, maxWidth) {
        const safeTags = Array.isArray(tags) ? tags : [];
        if (safeTags.length === 0) return null;

        const limit = Math.max(120, Number(maxWidth) || 0);
        const tagGap = 10;
        const rowSpacing = 35;
        const tagHeight = 25;

        this.ctx.font = this.fontLoaded ? `14px ${this.systemFontFamily}` : '14px sans-serif';

        const rows = [];
        let currentRow = [];
        let x = 0;

        const pushRow = () => {
            if (currentRow.length > 0) rows.push(currentRow);
            currentRow = [];
            x = 0;
        };

        safeTags.forEach((tag) => {
            const safeTag = String(tag || '').trim().replace(/^#/, '');
            if (!safeTag) return;

            const label = `#${safeTag}`;
            const tagWidth = this.ctx.measureText(label).width + 20;

            if (currentRow.length > 0 && x + tagWidth > limit) {
                pushRow();
            }

            currentRow.push({ tag: safeTag, label, width: tagWidth });
            x += tagWidth + tagGap;
        });

        pushRow();

        if (rows.length === 0) return null;

        const totalHeight = (rows.length - 1) * rowSpacing + tagHeight;
        return {
            rows,
            totalHeight,
            rowSpacing,
            tagHeight,
            tagGap
        };
    }

    generateTitle(text) {
        const safe = String(text || '').replace(/\s+/g, ' ').trim();
        if (!safe) return '内容摘要';
        const first = safe.split(/[。！？\n]/)[0].trim();
        if (first.length <= 20) return first || '内容摘要';
        return first.slice(0, 20) + '...';
    }

    cleanTitleText(text) {
        let title = String(text || '').trim();
        if (!title) return '';

        title = title
            .replace(/^(?:✅|☑️|✔️|👉|💡|🔥|⭐️|⭐|🌟|🟢|🔸|🔹|🔻|🔺|▶︎|▶|→|[-*•·])\s*/, '')
            .replace(/^\s*(?:标题|Title)\s*[:：]\s*/i, '')
            .replace(/\.\.\.$/, '')
            .replace(/…$/, '')
            .replace(/^#{1,6}\s+/, '')
            .replace(/^[（\(][一二三四五六七八九十\d]+[）\)]\s*/, '')
            .replace(/^\d{1,2}[\.\)、\)）]\s*/, '')
            .replace(/^[一二三四五六七八九十]+[\.\、]\s*/, '')
            .replace(/[：:]$/, '')
            .trim();

        return title;
    }

    /**
     * 将文本转换为可绘制的行（支持换行、中文、列表缩进）
     */
    layoutTextLines(text, maxWidth) {
        const lines = [];
        let listGroupSeq = 0;
        const rawLines = String(text || '').replace(/\r\n/g, '\n').split('\n');

        rawLines.forEach((rawLine) => {
            const line = String(rawLine || '').trim();
            if (!line) {
                lines.push({ type: 'blank' });
                return;
            }

            // 小标题：如“注意：”“避坑：”
            if (line.length <= 12 && /[：:]$/.test(line)) {
                const headingText = line.replace(/[：:]$/, '').trim();
                if (headingText) {
                    lines.push({ type: 'heading', text: headingText });
                    return;
                }
            }

            const listItem = this.parseListItem(line);
            if (listItem) {
                listGroupSeq += 1;
                const listGroup = `l${listGroupSeq}`;
                const marker = listItem.marker;
                const content = listItem.content;
                const markerWidth = this.ctx.measureText(marker).width;
                const indent = markerWidth + 10;
                const wrapped = this.wrapCanvasText(content, maxWidth - indent);

                wrapped.forEach((textLine, idx) => {
                    lines.push({
                        type: 'text',
                        marker: idx === 0 ? marker : '',
                        listGroup,
                        indent,
                        text: textLine
                    });
                });
                return;
            }

            const wrapped = this.wrapCanvasText(line, maxWidth);
            wrapped.forEach((textLine) => {
                lines.push({ type: 'text', marker: '', indent: 0, text: textLine });
            });
        });

        // 移除首尾多余空行
        while (lines.length > 0 && lines[0].type === 'blank') lines.shift();
        while (lines.length > 0 && lines[lines.length - 1].type === 'blank') lines.pop();

        return lines;
    }

    parseListItem(line) {
        const m = String(line || '').match(/^(\s*(?:(?:✅|☑️|✔️|👉|💡|🔥|⭐️|⭐|🌟|🟢|🔸|🔹|🔻|🔺|▶︎|▶|→)|[-*•·]|(?:\d{1,2}|[一二三四五六七八九十]+)[\.\)、\)）]))\s*(.+)$/);
        if (!m) return null;
        let marker = String(m[1] || '').trim();
        let content = String(m[2] || '').trim();
        if (!marker || !content) return null;

        // 处理“🔸1）xxx”这类双标记：优先保留数字序号，避免出现“🔸 + 1）”重复
        if (!/^(?:\d{1,2}|[一二三四五六七八九十]+)[\.\)、\)）]$/.test(marker)) {
            const numericPrefix = content.match(/^((?:\d{1,2}|[一二三四五六七八九十]+)[\.\)、\)）])\s*(.+)$/);
            if (numericPrefix && numericPrefix[1] && numericPrefix[2]) {
                marker = numericPrefix[1].trim();
                content = numericPrefix[2].trim();
            }
        }

        if (!content) return null;
        return { marker, content };
    }

    wrapCanvasText(text, maxWidth) {
        const tokens = this.tokenizeForWrap(String(text || ''));
        const result = [];
        let current = '';

        const punctRe = /^[，。！？、；：:,.!?;)\]\}》）”’…%]$/;
        const isPunctuation = (token) => punctRe.test(token);

        const pushLine = (line) => {
            const trimmed = String(line || '').trimEnd();
            if (trimmed.length > 0) {
                result.push(trimmed);
            }
        };

        tokens.forEach((token) => {
            if (!token) return;
            if (token === ' ' && current.length === 0) return;

            // 避免标点挂行：如果新行开头是标点，尽量并回上一行
            if (current.length === 0 && result.length > 0 && isPunctuation(token)) {
                const prev = result[result.length - 1];
                const merged = prev + token;
                if (this.ctx.measureText(merged).width <= maxWidth) {
                    result[result.length - 1] = merged;
                    return;
                }
            }

            const testLine = current + token;
            if (this.ctx.measureText(testLine).width > maxWidth && current.length > 0) {
                const trimmedCurrent = current.trimEnd();

                if (isPunctuation(token) && trimmedCurrent.length > 1) {
                    const lastChar = trimmedCurrent.slice(-1);
                    const rest = trimmedCurrent.slice(0, -1);
                    pushLine(rest);
                    current = lastChar + token;
                } else {
                    pushLine(trimmedCurrent);
                    current = token === ' ' ? '' : token;
                }
            } else {
                current = testLine;
            }
        });

        if (current.trim().length > 0) {
            pushLine(current);
        }

        return result.length > 0 ? result : [''];
    }

    tokenizeForWrap(text) {
        const tokens = [];
        let buffer = '';
        let mode = '';

        const flush = () => {
            if (buffer) tokens.push(buffer);
            buffer = '';
            mode = '';
        };

        for (const ch of String(text || '')) {
            if (ch === '\t') {
                flush();
                tokens.push(' ');
                continue;
            }

            if (/\s/.test(ch)) {
                flush();
                // 合并连续空格
                if (tokens.length === 0 || tokens[tokens.length - 1] !== ' ') {
                    tokens.push(' ');
                }
                continue;
            }

            if (/[A-Za-z0-9]/.test(ch)) {
                if (mode === 'latin') {
                    buffer += ch;
                } else {
                    flush();
                    mode = 'latin';
                    buffer = ch;
                }
                continue;
            }

            // CJK 或标点：逐字拆分，便于换行
            flush();
            tokens.push(ch);
        }

        flush();
        return tokens;
    }

    /**
     * 绘制标题
     */
    async drawTitle(parsed, templateConfig, tone, styleProfile) {
        const { primaryColor, textColor } = templateConfig;
        
        const kicker = String(parsed?.kicker || '').trim();
        const titleText = String(parsed?.title || '').trim();
        
        // 设置标题样式（随画布高度轻微缩放，适配 4:5 / 1:1 等比例）
        const titleFontSize = Math.round(30 * (this.baseHeight / 960));
        this.ctx.font = this.fontLoaded ? `${styleProfile.titleWeight} ${titleFontSize}px ${this.systemFontFamily}` : `bold ${titleFontSize}px sans-serif`;
        this.ctx.fillStyle = textColor;
        
        // 绘制标题背景
        const panelX = Math.round(this.baseWidth * (40 / 540));
        const panelY = Math.round(this.baseHeight * (64 / 960));
        const panelW = Math.max(0, this.baseWidth - panelX * 2);
        const hasKicker = !!kicker;

        const innerPaddingX = Math.round(this.baseWidth * (20 / 540));
        const titleLines = this.wrapTitleLines(titleText, Math.max(0, panelW - innerPaddingX * 2), 2);
        const titleStartOffset = hasKicker
            ? Math.round(40 * (this.baseHeight / 960))
            : Math.round(18 * (this.baseHeight / 960));
        const titleLineHeight = Math.round(34 * (this.baseHeight / 960));
        const lastLineTop = titleStartOffset + (titleLines.length - 1) * titleLineHeight;
        const lastLineBottom = lastLineTop + Math.round(32 * (this.baseHeight / 960));
        const desiredPanelH = lastLineBottom + Math.round(22 * (this.baseHeight / 960));
        const minPanelH = hasKicker
            ? Math.round(104 * (this.baseHeight / 960))
            : Math.round(86 * (this.baseHeight / 960));
        const panelH = Math.max(desiredPanelH, minPanelH);

        const titleBg = this.ctx.createLinearGradient(0, panelY, this.baseWidth, panelY + panelH);
        titleBg.addColorStop(0, `rgba(255, 255, 255, ${styleProfile.titlePanelOpacityStart})`);
        titleBg.addColorStop(1, `rgba(255, 255, 255, ${styleProfile.titlePanelOpacityEnd})`);
        
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
        this.ctx.shadowBlur = 16;
        this.ctx.shadowOffsetY = 8;
        this.ctx.fillStyle = titleBg;
        this.roundRect(panelX, panelY, panelW, panelH, 18);
        this.ctx.fill();
        this.ctx.restore();
        
        const textX = panelX + innerPaddingX;

        // kicker（小字）
        let titleStartY = panelY + Math.round(18 * (this.baseHeight / 960));
        if (hasKicker) {
            this.ctx.fillStyle = primaryColor;
            this.ctx.font = this.fontLoaded ? `600 14px ${this.systemFontFamily}` : '600 14px sans-serif';
            const kickerFit = this.fitTextToWidth(kicker, Math.max(0, panelW - innerPaddingX * 2));
            this.ctx.fillText(kickerFit, textX, panelY + Math.round(16 * (this.baseHeight / 960)));
            titleStartY = panelY + titleStartOffset;
        }

        // 标题（最多两行）
        this.ctx.fillStyle = textColor;
        this.ctx.font = this.fontLoaded ? `${styleProfile.titleWeight} ${titleFontSize}px ${this.systemFontFamily}` : `bold ${titleFontSize}px sans-serif`;
        titleLines.forEach((line, idx) => {
            this.ctx.fillText(line, textX, titleStartY + idx * titleLineHeight);
        });
        
        // 绘制装饰线
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(textX, panelY + panelH - Math.round(16 * (this.baseHeight / 960)), 84, 3);

        return {
            x: panelX,
            y: panelY,
            width: panelW,
            height: panelH,
            bottomY: panelY + panelH
        };
    }

    wrapTitleLines(text, maxWidth, maxLines = 2) {
        const raw = String(text || '').replace(/\s+/g, ' ').trim();
        if (!raw) return ['内容摘要'];

        const lines = this.wrapCanvasText(raw, maxWidth);
        if (lines.length <= maxLines) {
            return lines;
        }

        const head = lines.slice(0, maxLines);
        const lastIndex = head.length - 1;
        head[lastIndex] = this.fitTextToWidth(head[lastIndex], maxWidth, true);
        return head;
    }

    fitTextToWidth(text, maxWidth, forceEllipsis = false) {
        const raw = String(text || '').trim();
        if (!raw) return '';
        if (!forceEllipsis && this.ctx.measureText(raw).width <= maxWidth) {
            return raw;
        }

        const ellipsis = '...';
        const ellipsisWidth = this.ctx.measureText(ellipsis).width;
        const targetWidth = Math.max(0, maxWidth - ellipsisWidth);

        let result = '';
        for (const ch of raw) {
            const test = result + ch;
            if (this.ctx.measureText(test).width > targetWidth) {
                break;
            }
            result = test;
        }
        return result ? result + ellipsis : raw.slice(0, 1) + ellipsis;
    }

    /**
     * 绘制主要内容
     */
    async drawMainContent(parsed, templateConfig, styleProfile, titleMetrics = null, layoutOptions = {}) {
        const { textColor, primaryColor } = templateConfig;
        const body = String(parsed?.body || '').trim();
        const reservedBottomHeight = Math.max(0, Number(layoutOptions?.reservedBottomHeight) || 0);
        
        const panelX = Math.round(this.baseWidth * (40 / 540));
        const panelW = Math.max(0, this.baseWidth - panelX * 2);
        const paddingX = Math.round(this.baseWidth * (24 / 540));
        const paddingY = 28;

        const bottomSafePadding = styleProfile.decorationLevel === 'none' ? 72 : 90;
        const contentBottom = Math.round(this.baseHeight - bottomSafePadding);
        const contentLength = body.length;
        let minPanelH = styleProfile.backgroundMode === 'minimal' ? 220 : 240;
        if (contentLength > 260) {
            minPanelH = 360;
        } else if (contentLength > 160) {
            minPanelH = 320;
        } else if (contentLength > 90) {
            minPanelH = 280;
        } else if (contentLength > 0) {
            minPanelH = 240;
        }
        let panelY = Math.round((titleMetrics?.bottomY || 170) + 16);
        if (panelY > contentBottom - minPanelH) {
            panelY = contentBottom - minPanelH;
        }
        
        // 设置内容文字样式
        let fontSize = styleProfile.bodyFontSize;
        let lineHeight = styleProfile.lineHeight;
        if (contentLength > 0 && contentLength < 120) {
            fontSize += 2;
            lineHeight += 4;
        }
        if (contentLength > 0 && contentLength < 70) {
            fontSize += 2;
            lineHeight += 2;
        }

        this.ctx.font = this.fontLoaded ? `${fontSize}px ${this.systemFontFamily}` : `${fontSize}px sans-serif`;
        
        const maxWidth = panelW - paddingX * 2;
        const baseX = panelX + paddingX;

        const lineItems = this.layoutTextLines(body, maxWidth);

        const heightOfBase = (item) => {
            if (item.type === 'blank') return Math.round(lineHeight * 0.7);
            if (item.type === 'heading') return Math.round(lineHeight * 1.05);
            return lineHeight;
        };
        const heightWithContext = (item, prev, next) => {
            let h = heightOfBase(item);
            if (item.type === 'heading' && prev && prev.type !== 'blank') {
                h += Math.round(lineHeight * 0.25);
            }

            // 列表项结尾增加一点间距（提升可读性）
            if (item.type === 'text' && item.listGroup && (!next || next.listGroup !== item.listGroup)) {
                h += Math.round(lineHeight * 0.14);
            }

            return h;
        };

        const totalHeight = lineItems.reduce((sum, item, idx) => {
            const prev = idx > 0 ? lineItems[idx - 1] : null;
            const next = idx < lineItems.length - 1 ? lineItems[idx + 1] : null;
            return sum + heightWithContext(item, prev, next);
        }, 0);

        const maxPanelH = contentBottom - panelY;
        const idealPanelH = Math.ceil(paddingY * 2 + totalHeight + reservedBottomHeight);
        const panelH = Math.min(maxPanelH, Math.max(minPanelH, idealPanelH));

        // 绘制内容面板背景（更“干净”的高级感：轻阴影 + 轻描边）
        this.ctx.fillStyle = `rgba(255, 255, 255, ${styleProfile.contentPanelOpacity})`;
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
        this.ctx.shadowBlur = 18;
        this.ctx.shadowOffsetY = 10;
        this.roundRect(panelX, panelY, panelW, panelH, 24);
        this.ctx.fill();
        this.ctx.restore();

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
        this.ctx.lineWidth = 1;
        this.roundRect(panelX, panelY, panelW, panelH, 24);
        this.ctx.stroke();
        this.ctx.restore();

        this.ctx.fillStyle = textColor;
        const yMin = panelY + paddingY;
        const maxReserve = Math.max(0, panelH - paddingY * 2 - Math.round(lineHeight * 4.6));
        const appliedReserve = Math.min(reservedBottomHeight, maxReserve);
        const yMax = panelY + panelH - paddingY - appliedReserve;
        const available = yMax - yMin;
        let y = yMin;
        if (totalHeight > 0 && totalHeight < available * 0.7) {
            y = yMin + Math.min((available - totalHeight) * 0.26, lineHeight * 2.2);
        }

        const toDraw = [];
        for (let i = 0; i < lineItems.length; i++) {
            const item = lineItems[i];
            const prev = toDraw.length > 0 ? toDraw[toDraw.length - 1] : null;
            const next = i < lineItems.length - 1 ? lineItems[i + 1] : null;
            const nextY = y + heightWithContext(item, prev, next);
            if (nextY > yMax) {
                // 溢出：最后一行加省略号
                if (toDraw.length > 0) {
                    const last = toDraw[toDraw.length - 1];
                    if (last.type === 'text') {
                        last.text = this.fitTextToWidth(last.text, maxWidth - (last.indent || 0), true);
                    }
                }
                break;
            }
            toDraw.push(item);
            y = nextY;
        }

        // 重新绘制（使用单独循环，确保 y 累加一致）
        y = yMin;
        if (totalHeight > 0 && totalHeight < available * 0.7) {
            y = yMin + Math.min((available - totalHeight) * 0.26, lineHeight * 2.2);
        }

        toDraw.forEach((item, idx) => {
            const prev = idx > 0 ? toDraw[idx - 1] : null;
            const next = idx < toDraw.length - 1 ? toDraw[idx + 1] : null;

            if (item.type === 'blank') {
                y += heightWithContext(item, prev, next);
                return;
            }

            if (item.type === 'heading') {
                const preGap = prev && prev.type !== 'blank'
                    ? Math.round(lineHeight * 0.25)
                    : 0;
                const h = heightWithContext(item, prev, next);
                if (preGap) {
                    y += preGap;
                }

                const label = this.fitTextToWidth(String(item.text || '').trim(), maxWidth);
                if (label) {
                    const headingFontSize = Math.max(14, fontSize - 1);
                    this.ctx.font = this.fontLoaded ? `700 ${headingFontSize}px ${this.systemFontFamily}` : `700 ${headingFontSize}px sans-serif`;
                    const w = Math.min(maxWidth, this.ctx.measureText(label).width + 18);
                    const h = Math.round(headingFontSize + 10);
                    this.ctx.fillStyle = this.hexToRgba(primaryColor, 0.14);
                    this.roundRect(baseX, y - 4, w, h, 12);
                    this.ctx.fill();

                    this.ctx.fillStyle = primaryColor;
                    this.ctx.fillText(label, baseX + 9, y);
                }

                y += Math.max(0, h - preGap);
                return;
            }

            if (item.marker) {
                this.ctx.fillStyle = primaryColor;
                this.ctx.font = this.fontLoaded ? `700 ${fontSize}px ${this.systemFontFamily}` : `700 ${fontSize}px sans-serif`;
                this.ctx.fillText(item.marker, baseX, y);
                this.ctx.fillStyle = textColor;
                this.ctx.font = this.fontLoaded ? `${fontSize}px ${this.systemFontFamily}` : `${fontSize}px sans-serif`;
                this.ctx.fillText(item.text, baseX + item.indent, y);
            } else {
                this.ctx.fillStyle = textColor;
                this.ctx.font = this.fontLoaded ? `${fontSize}px ${this.systemFontFamily}` : `${fontSize}px sans-serif`;
                this.ctx.fillText(item.text, baseX + (item.indent || 0), y);
            }

            y += heightWithContext(item, prev, next);
        });

        return {
            x: panelX,
            y: panelY,
            width: panelW,
            height: panelH,
            paddingX,
            paddingY,
            innerX: baseX,
            innerWidth: maxWidth,
            innerYMin: yMin,
            innerYMax: yMax,
            reservedBottomHeight: appliedReserve
        };
    }

    /**
     * 绘制标签
     */
    async drawTags(tags, templateConfig, styleProfile, options = {}) {
        const { primaryColor, secondaryColor } = templateConfig;
        const safeTags = Array.isArray(tags) ? tags : [];
        if (safeTags.length === 0) return;

        const panel = options?.panelMetrics || null;
        const anchorY = Number(options?.anchorY);

        // 设置标签字体（确保 measureText 基于同一字体）
        this.ctx.font = this.fontLoaded ? `14px ${this.systemFontFamily}` : '14px sans-serif';

        const widthLimit = panel
            ? (panel.innerWidth || (panel.width - (panel.paddingX || 0) * 2))
            : 420;
        const layout = options?.layout || this.getTagLayout(safeTags, widthLimit);
        if (!layout) return;

        const baseX = panel ? (panel.innerX || (panel.x + (panel.paddingX || 0))) : 60;
        const baseY = panel
            ? (panel.y + panel.height - (panel.paddingY || 0) - layout.totalHeight)
            : (Number.isFinite(anchorY) ? anchorY : 820);

        let y = baseY;
        if (panel) {
            // 保护：避免标签挤到内容区顶部
            y = Math.max(y, panel.y + (panel.paddingY || 0) + 12);
        }

        layout.rows.forEach((row, rowIndex) => {
            let x = baseX;
            const rowY = y + rowIndex * layout.rowSpacing;

            row.forEach((item) => {
                const tagWidth = item.width;

                // 绘制标签背景
                if (styleProfile.tagMode === 'outline') {
                    this.ctx.fillStyle = panel ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.85)';
                    this.roundRect(x, rowY, tagWidth, layout.tagHeight, 12);
                    this.ctx.fill();

                    this.ctx.strokeStyle = primaryColor;
                    this.ctx.lineWidth = 1.5;
                    this.roundRect(x, rowY, tagWidth, layout.tagHeight, 12);
                    this.ctx.stroke();
                } else {
                    // panel 内更克制一点
                    this.ctx.fillStyle = panel ? this.hexToRgba(primaryColor, 0.92) : primaryColor;
                    this.roundRect(x, rowY, tagWidth, layout.tagHeight, 12);
                    this.ctx.fill();
                }
                
                // 绘制标签文字
                this.ctx.fillStyle = styleProfile.tagMode === 'outline' ? primaryColor : 'white';
                this.ctx.fillText(item.label, x + 10, rowY + 6);
                
                x += tagWidth + layout.tagGap;
            });
        });
    }

    /**
     * 绘制装饰元素
     */
    async drawDecorations(templateConfig, template, styleProfile) {
        const { primaryColor, accentColor } = templateConfig;
        
        // 绘制顶部装饰
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(0, 0, this.baseWidth, styleProfile.topBarHeight);

        if (styleProfile.decorationLevel === 'none') {
            return;
        }

        // subtle：只保留非常克制的角落装饰（更偏“高级感”）
        if (styleProfile.decorationLevel === 'subtle') {
            this.ctx.save();
            this.ctx.globalAlpha = 0.22;
            this.drawCornerDecorations(templateConfig, { size: 22 });
            this.ctx.restore();
            return;
        }
        
        // rich：保留模板装饰，但稍微降低整体存在感
        this.ctx.save();
        this.ctx.globalAlpha = 0.85;
        this.drawCornerDecorations(templateConfig, { size: 26 });
        this.drawTemplateSpecificDecorations(template, templateConfig);
        this.ctx.restore();
    }

    /**
     * 绘制角落装饰
     */
    drawCornerDecorations(templateConfig, options = {}) {
        const { accentColor } = templateConfig;
        const size = Math.max(10, Number(options.size) || 30);
        
        this.ctx.fillStyle = accentColor;
        
        // 左上角
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI / 2);
        this.ctx.fill();
        
        // 右下角
        this.ctx.beginPath();
        this.ctx.arc(this.baseWidth, this.baseHeight, size, Math.PI, 3 * Math.PI / 2);
        this.ctx.fill();
    }

    /**
     * 绘制模板特定装饰
     */
    drawTemplateSpecificDecorations(template, templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 根据模板类型添加特定装饰
        switch (template?.category) {
            case 'lifestyle':
                this.drawLifestyleDecorations(templateConfig);
                break;
            case 'education':
                this.drawEducationDecorations(templateConfig);
                break;
            case 'fashion':
                this.drawFashionDecorations(templateConfig);
                break;
            case 'travel':
                this.drawTravelDecorations(templateConfig);
                break;
            case 'shopping':
                this.drawShoppingDecorations(templateConfig);
                break;
            case 'fitness':
                this.drawFitnessDecorations(templateConfig);
                break;
            case 'minimalist':
                this.drawMinimalistDecorations(templateConfig);
                break;
            case 'technology':
                this.drawTechnologyDecorations(templateConfig);
                break;
            default:
                this.drawDefaultDecorations(templateConfig);
        }
    }

    /**
     * 绘制生活方式装饰
     */
    drawLifestyleDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制心形装饰
        this.ctx.fillStyle = primaryColor;
        this.drawHeart(this.baseWidth - 60, 50, 15);
        this.drawHeart(50, this.baseHeight - 60, 12);
    }

    /**
     * 绘制教育类装饰
     */
    drawEducationDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制书本图标
        this.ctx.fillStyle = primaryColor;
        const x = this.baseWidth - 60;
        this.ctx.fillRect(x, 40, 20, 25);
        this.ctx.fillRect(x + 5, 45, 10, 15);
    }

    /**
     * 绘制时尚类装饰
     */
    drawFashionDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制星星装饰
        this.ctx.fillStyle = primaryColor;
        this.drawStar(this.baseWidth - 60, 50, 15);
        this.drawStar(60, this.baseHeight - 60, 12);
    }

    /**
     * 绘制旅行类装饰
     */
    drawTravelDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 55;
        const y = 52;
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    /**
     * 绘制购物类装饰
     */
    drawShoppingDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 72;
        const y = 36;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(x, y, 24, 20);
        this.ctx.beginPath();
        this.ctx.arc(x + 6, y, 3, Math.PI, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(x + 18, y, 3, Math.PI, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * 绘制健身类装饰
     */
    drawFitnessDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 72;
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(x, 46, 8, 8);
        this.ctx.fillRect(x + 16, 46, 8, 8);
        this.ctx.fillRect(x + 8, 44, 8, 12);
    }

    /**
     * 绘制极简类装饰
     */
    drawMinimalistDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 72;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 50);
        this.ctx.lineTo(x + 24, 50);
        this.ctx.stroke();
    }

    /**
     * 绘制科技类装饰
     */
    drawTechnologyDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 72;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            this.ctx.strokeRect(x + i * 8, 40 + i * 4, 18 - i * 4, 18 - i * 4);
        }
    }

    /**
     * 绘制默认装饰
     */
    drawDefaultDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        const x = this.baseWidth - 60;
        
        // 绘制圆形装饰
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(x, 50, 10, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * 绘制水印
     */
    async drawWatermark(styleProfile) {
        this.ctx.fillStyle = `rgba(0, 0, 0, ${styleProfile.watermarkOpacity})`;
        this.ctx.font = this.fontLoaded ? `12px ${this.systemFontFamily}` : '12px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Created with AI Generator', this.baseWidth - 20, this.baseHeight - 20);
        this.ctx.textAlign = 'left'; // 重置对齐方式
    }

    /**
     * 文本换行
     */
    wrapText(text, maxWidth) {
        return this.wrapCanvasText(text, maxWidth);
    }

    hexToRgba(hex, alpha = 1) {
        const safeAlpha = Math.max(0, Math.min(1, Number(alpha)));
        const raw = String(hex || '').trim().replace(/^#/, '');
        if (!raw) return `rgba(0, 0, 0, ${safeAlpha})`;

        let value = raw;
        if (value.length === 3) {
            value = value.split('').map(ch => ch + ch).join('');
        }
        if (value.length !== 6) return `rgba(0, 0, 0, ${safeAlpha})`;

        const r = parseInt(value.slice(0, 2), 16);
        const g = parseInt(value.slice(2, 4), 16);
        const b = parseInt(value.slice(4, 6), 16);
        if ([r, g, b].some(n => Number.isNaN(n))) {
            return `rgba(0, 0, 0, ${safeAlpha})`;
        }
        return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * 绘制心形
     */
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + size / 4);
        this.ctx.quadraticCurveTo(x, y, x + size / 4, y);
        this.ctx.quadraticCurveTo(x + size / 2, y, x + size / 2, y + size / 4);
        this.ctx.quadraticCurveTo(x + size / 2, y, x + 3 * size / 4, y);
        this.ctx.quadraticCurveTo(x + size, y, x + size, y + size / 4);
        this.ctx.quadraticCurveTo(x + size, y + size / 2, x + 3 * size / 4, y + 3 * size / 4);
        this.ctx.lineTo(x + size / 2, y + size);
        this.ctx.lineTo(x + size / 4, y + 3 * size / 4);
        this.ctx.quadraticCurveTo(x, y + size / 2, x, y + size / 4);
        this.ctx.fill();
    }

    /**
     * 绘制星星
     */
    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        this.ctx.beginPath();
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 绘制图标
     */
    async drawIcons(templateConfig, tone, styleProfile) {
        // 高级风格默认不绘制表情图标，避免“幼稚感”
        if (styleProfile.decorationLevel !== 'rich') {
            return;
        }

        // 根据口吻添加相应的图标装饰
        const iconMap = {
            friendly: '😊',
            professional: '💼',
            playful: '🎉',
            concise: '⚡',
            elegant: '✨',
            trendy: '🔥'
        };
        
        const icon = iconMap[tone] || '✨';
        
        // 绘制表情符号（简化版本，实际项目中可以使用图片）
        this.ctx.font = `${styleProfile.iconSize}px serif`;
        this.ctx.fillText(icon, this.baseWidth - 60, 26);
    }

    /**
     * 转换画布为图片数据
     */
    getOutputDimensions(aspectRatio = '9:16', quality = 'high') {
        const presets = {
            standard: {
                '9:16': { width: 540, height: 960 },
                '1:1': { width: 540, height: 540 },
                '16:9': { width: 960, height: 540 },
                '4:5': { width: 720, height: 900 }
            },
            high: {
                '9:16': { width: 1080, height: 1920 },
                '1:1': { width: 1080, height: 1080 },
                '16:9': { width: 1920, height: 1080 },
                '4:5': { width: 1080, height: 1350 }
            },
            ultra: {
                '9:16': { width: 1440, height: 2560 },
                '1:1': { width: 1440, height: 1440 },
                '16:9': { width: 2560, height: 1440 },
                '4:5': { width: 1440, height: 1800 }
            }
        };

        const qualitySet = presets[quality] || presets.high;
        return qualitySet[aspectRatio] || qualitySet['9:16'];
    }

    async canvasToImageData(format = 'png', options = {}) {
        const aspectRatio = options.aspectRatio || '9:16';
        const quality = options.quality || 'high';
        const outputSize = this._renderInfo?.output || this.getOutputDimensions(aspectRatio, quality);

        const mimeMap = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            png: 'image/png'
        };
        const mimeType = mimeMap[format] || 'image/png';
        const qualityValue = quality === 'ultra' ? 1 : quality === 'high' ? 0.92 : 0.82;

        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                resolve({
                    blob,
                    url,
                    width: outputSize.width,
                    height: outputSize.height,
                    format
                });
            }, mimeType, qualityValue);
        });
    }

    /**
     * 获取画布元素
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * 预览卡片
     */
    previewCard(container) {
        if (container && this.canvas) {
            container.innerHTML = '';
            const previewCanvas = this.canvas.cloneNode(true);
            previewCanvas.style.maxWidth = '100%';
            previewCanvas.style.height = 'auto';
            previewCanvas.style.borderRadius = '12px';
            previewCanvas.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
            container.appendChild(previewCanvas);
        }
    }
}

// 全局视觉生成器实例
window.visualGenerator = new VisualGenerator();
