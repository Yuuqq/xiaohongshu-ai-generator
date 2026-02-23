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
        
        // 设置高DPI支持
        const dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = `${this.baseWidth}px`;
        this.canvas.style.height = `${this.baseHeight}px`;
        this.canvas.width = this.baseWidth * dpr;
        this.canvas.height = this.baseHeight * dpr;
        this.ctx.scale(dpr, dpr);
    }

    /**
     * 加载卡片模板
     */
    loadCardTemplates() {
        this.cardTemplates = {
            'xiaohongshu-lifestyle': {
                background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB, #FFCCCB)',
                primaryColor: '#FF69B4',
                secondaryColor: '#FFF0F5',
                textColor: '#2C2C2C',
                accentColor: '#FF1493',
                layout: 'lifestyle'
            },
            'xiaohongshu-knowledge': {
                background: 'linear-gradient(135deg, #87CEEB, #B0E0E6, #E0F6FF)',
                primaryColor: '#4169E1',
                secondaryColor: '#F0F8FF',
                textColor: '#1E1E1E',
                accentColor: '#0066CC',
                layout: 'knowledge'
            },
            'xiaohongshu-fashion': {
                background: 'linear-gradient(135deg, #DDA0DD, #EE82EE, #DA70D6)',
                primaryColor: '#BA55D3',
                secondaryColor: '#F8F0FF',
                textColor: '#2F2F2F',
                accentColor: '#9932CC',
                layout: 'fashion'
            },
            'xiaohongshu-food': {
                background: 'linear-gradient(135deg, #FFB347, #FFA500, #FF8C00)',
                primaryColor: '#FF6347',
                secondaryColor: '#FFF8DC',
                textColor: '#2C1810',
                accentColor: '#FF4500',
                layout: 'food'
            },
            'xiaohongshu-travel': {
                background: 'linear-gradient(135deg, #98FB98, #90EE90, #87CEEB)',
                primaryColor: '#32CD32',
                secondaryColor: '#F0FFF0',
                textColor: '#1C3A1C',
                accentColor: '#228B22',
                layout: 'travel'
            },
            'xiaohongshu-product': {
                background: 'linear-gradient(135deg, #FFECD2, #FDD9A0, #F8B981)',
                primaryColor: '#EA580C',
                secondaryColor: '#FFF4E6',
                textColor: '#7C2D12',
                accentColor: '#FB923C',
                layout: 'product'
            },
            'xiaohongshu-fitness': {
                background: 'linear-gradient(135deg, #84FAB0, #8FD3F4, #A7E9AF)',
                primaryColor: '#059669',
                secondaryColor: '#ECFDF5',
                textColor: '#064E3B',
                accentColor: '#10B981',
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
            
            // 添加水印
            if (options.addWatermark !== false) {
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
                watermarkOpacity: 0.08
            },
            illustration: {
                key: 'illustration',
                backgroundMode: 'vivid',
                textureNoise: 10,
                contentPanelOpacity: 0.8,
                titlePanelOpacityStart: 0.9,
                titlePanelOpacityEnd: 0.75,
                titleWeight: 700,
                bodyFontSize: 18,
                lineHeight: 28,
                tagMode: 'filled',
                decorationLevel: 'rich',
                topBarHeight: 8,
                iconSize: 24,
                watermarkOpacity: 0.1
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
                watermarkOpacity: 0.06
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
                watermarkOpacity: 0.12
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
            const gradient = this.ctx.createLinearGradient(0, 0, 0, 960);
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
            this.ctx.save();
            this.ctx.globalAlpha = 0.22;
            this.ctx.fillStyle = templateConfig.accentColor;
            this.ctx.beginPath();
            this.ctx.arc(430, 170, 140, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = templateConfig.primaryColor;
            this.ctx.beginPath();
            this.ctx.arc(110, 780, 180, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        } else if (styleProfile.backgroundMode === 'soft') {
            this.ctx.save();
            this.ctx.globalAlpha = 0.26;
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillRect(0, 0, 540, 960);
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
        const { textColor, primaryColor, secondaryColor } = templateConfig;
        
        // 设置文本样式
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // 绘制标题区域
        await this.drawTitle(content, templateConfig, tone, styleProfile);
        
        // 绘制主要内容
        await this.drawMainContent(content, templateConfig, styleProfile);
        
        // 绘制标签
        if (customTags.length > 0) {
            await this.drawTags(customTags, templateConfig, styleProfile);
        }
        
        // 绘制装饰图标
        await this.drawIcons(templateConfig, tone, styleProfile);
    }

    /**
     * 绘制标题
     */
    async drawTitle(content, templateConfig, tone, styleProfile) {
        const { primaryColor, textColor } = templateConfig;
        
        // 提取标题（取前20个字符）
        const title = content.split('\n')[0].substring(0, 20) + (content.length > 20 ? '...' : '');
        
        // 设置标题样式
        this.ctx.font = this.fontLoaded ? `${styleProfile.titleWeight} 32px ${this.systemFontFamily}` : 'bold 32px sans-serif';
        this.ctx.fillStyle = textColor;
        
        // 绘制标题背景
        const titleBg = this.ctx.createLinearGradient(0, 80, 540, 120);
        titleBg.addColorStop(0, `rgba(255, 255, 255, ${styleProfile.titlePanelOpacityStart})`);
        titleBg.addColorStop(1, `rgba(255, 255, 255, ${styleProfile.titlePanelOpacityEnd})`);
        
        this.ctx.fillStyle = titleBg;
        this.roundRect(40, 80, 460, 60, 15);
        this.ctx.fill();
        
        // 绘制标题文字
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(title, 60, 100);
        
        // 绘制装饰线
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(60, 130, 100, 4);
    }

    /**
     * 绘制主要内容
     */
    async drawMainContent(content, templateConfig, styleProfile) {
        const { textColor, secondaryColor } = templateConfig;
        
        // 内容区域背景
        this.ctx.fillStyle = `rgba(255, 255, 255, ${styleProfile.contentPanelOpacity})`;
        this.roundRect(40, 180, 460, 600, 20);
        this.ctx.fill();
        
        // 设置内容文字样式
        this.ctx.font = this.fontLoaded ? `${styleProfile.bodyFontSize}px ${this.systemFontFamily}` : '18px sans-serif';
        this.ctx.fillStyle = textColor;
        
        // 分段绘制内容
        const lines = this.wrapText(content, 420);
        let y = 220;
        
        lines.forEach((line, index) => {
            if (y > 750) return; // 防止超出边界
            
            this.ctx.fillText(line, 60, y);
            y += styleProfile.lineHeight;
        });
    }

    /**
     * 绘制标签
     */
    async drawTags(tags, templateConfig, styleProfile) {
        const { primaryColor, secondaryColor } = templateConfig;
        
        let x = 60;
        let y = 820;
        
        tags.forEach(tag => {
            const tagWidth = this.ctx.measureText(`#${tag}`).width + 20;
            
            // 检查是否需要换行
            if (x + tagWidth > 480) {
                x = 60;
                y += 35;
            }
            
            // 绘制标签背景
            if (styleProfile.tagMode === 'outline') {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                this.roundRect(x, y, tagWidth, 25, 12);
                this.ctx.fill();

                this.ctx.strokeStyle = primaryColor;
                this.ctx.lineWidth = 1.5;
                this.roundRect(x, y, tagWidth, 25, 12);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = primaryColor;
                this.roundRect(x, y, tagWidth, 25, 12);
                this.ctx.fill();
            }
            
            // 绘制标签文字
            this.ctx.fillStyle = styleProfile.tagMode === 'outline' ? primaryColor : 'white';
            this.ctx.font = this.fontLoaded ? `14px ${this.systemFontFamily}` : '14px sans-serif';
            this.ctx.fillText(`#${tag}`, x + 10, y + 6);
            
            x += tagWidth + 10;
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
        
        // 绘制角落装饰
        this.ctx.save();
        this.ctx.globalAlpha = styleProfile.decorationLevel === 'subtle' ? 0.45 : 1;
        this.drawCornerDecorations(templateConfig);
        
        // 绘制模板特定装饰
        this.drawTemplateSpecificDecorations(template, templateConfig);
        this.ctx.restore();
    }

    /**
     * 绘制角落装饰
     */
    drawCornerDecorations(templateConfig) {
        const { accentColor } = templateConfig;
        
        this.ctx.fillStyle = accentColor;
        
        // 左上角
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 30, 0, Math.PI / 2);
        this.ctx.fill();
        
        // 右下角
        this.ctx.beginPath();
        this.ctx.arc(this.baseWidth, this.baseHeight, 30, Math.PI, 3 * Math.PI / 2);
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
        this.drawHeart(480, 50, 15);
        this.drawHeart(50, 900, 12);
    }

    /**
     * 绘制教育类装饰
     */
    drawEducationDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制书本图标
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(480, 40, 20, 25);
        this.ctx.fillRect(485, 45, 10, 15);
    }

    /**
     * 绘制时尚类装饰
     */
    drawFashionDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制星星装饰
        this.ctx.fillStyle = primaryColor;
        this.drawStar(480, 50, 15);
        this.drawStar(60, 900, 12);
    }

    /**
     * 绘制旅行类装饰
     */
    drawTravelDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(485, 52, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(485, 52, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fill();
    }

    /**
     * 绘制购物类装饰
     */
    drawShoppingDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(468, 36, 24, 20);
        this.ctx.beginPath();
        this.ctx.arc(474, 36, 3, Math.PI, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(486, 36, 3, Math.PI, 2 * Math.PI);
        this.ctx.stroke();
    }

    /**
     * 绘制健身类装饰
     */
    drawFitnessDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(468, 46, 8, 8);
        this.ctx.fillRect(484, 46, 8, 8);
        this.ctx.fillRect(476, 44, 8, 12);
    }

    /**
     * 绘制极简类装饰
     */
    drawMinimalistDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(468, 50);
        this.ctx.lineTo(492, 50);
        this.ctx.stroke();
    }

    /**
     * 绘制科技类装饰
     */
    drawTechnologyDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        this.ctx.strokeStyle = primaryColor;
        this.ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
            this.ctx.strokeRect(468 + i * 8, 40 + i * 4, 18 - i * 4, 18 - i * 4);
        }
    }

    /**
     * 绘制默认装饰
     */
    drawDefaultDecorations(templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 绘制圆形装饰
        this.ctx.fillStyle = primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(480, 50, 10, 0, 2 * Math.PI);
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
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + word + ' ';
            const metrics = this.ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine !== '') {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine.trim() !== '') {
            lines.push(currentLine.trim());
        }
        
        return lines;
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
        if (styleProfile.decorationLevel === 'none') {
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
        this.ctx.fillText(icon, 450, 150);
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
        const outputSize = this.getOutputDimensions(aspectRatio, quality);
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d');

        outputCanvas.width = outputSize.width;
        outputCanvas.height = outputSize.height;

        const srcWidth = this.canvas.width;
        const srcHeight = this.canvas.height;
        const coverScale = Math.max(outputSize.width / srcWidth, outputSize.height / srcHeight);
        const coverWidth = srcWidth * coverScale;
        const coverHeight = srcHeight * coverScale;
        const coverX = (outputSize.width - coverWidth) / 2;
        const coverY = (outputSize.height - coverHeight) / 2;

        outputCtx.fillStyle = '#F5F5F7';
        outputCtx.fillRect(0, 0, outputSize.width, outputSize.height);
        outputCtx.globalAlpha = 0.32;
        outputCtx.drawImage(this.canvas, coverX, coverY, coverWidth, coverHeight);
        outputCtx.globalAlpha = 1;

        const containScale = Math.min(outputSize.width / srcWidth, outputSize.height / srcHeight);
        const renderWidth = srcWidth * containScale;
        const renderHeight = srcHeight * containScale;
        const renderX = (outputSize.width - renderWidth) / 2;
        const renderY = (outputSize.height - renderHeight) / 2;

        outputCtx.drawImage(this.canvas, renderX, renderY, renderWidth, renderHeight);

        const mimeMap = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
            png: 'image/png'
        };
        const mimeType = mimeMap[format] || 'image/png';
        const qualityValue = quality === 'ultra' ? 1 : quality === 'high' ? 0.92 : 0.82;

        return new Promise((resolve) => {
            outputCanvas.toBlob((blob) => {
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
