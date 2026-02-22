/**
 * 高级视觉卡片生成器
 * 负责生成专业级的小红书风格卡片
 */

class VisualGenerator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.isGenerating = false;
        this.cardTemplates = {};
        this.fontLoaded = false;
        this.systemFontFamily = '"PingFang SC", "Microsoft YaHei", "Noto Sans SC", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
        
        this.init();
    }

    /**
     * 初始化视觉生成器
     */
    async init() {
        await this.loadFonts();
        this.setupCanvas();
        this.loadCardTemplates();
        DEBUG.log('视觉生成器初始化完成');
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
        this.canvas.style.width = '540px';
        this.canvas.style.height = '960px';
        this.canvas.width = 540 * dpr;
        this.canvas.height = 960 * dpr;
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
            }
        };
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
            const templateConfig = this.cardTemplates[template.id] || this.cardTemplates['xiaohongshu-lifestyle'];
            
            // 清空画布
            this.clearCanvas();
            
            // 绘制背景
            await this.drawBackground(templateConfig);
            
            // 绘制内容
            await this.drawContent(content, templateConfig, tone, customTags, options);
            
            // 绘制装饰元素
            await this.drawDecorations(templateConfig, template);
            
            // 添加水印
            if (options.addWatermark !== false) {
                await this.drawWatermark();
            }
            
            // 转换为图片
            const imageData = await this.canvasToImageData(options.format || 'png');
            
            return imageData;
            
        } catch (error) {
            DEBUG.error('卡片生成失败:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 清空画布
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 绘制背景
     */
    async drawBackground(templateConfig) {
        const { background } = templateConfig;
        
        if (background.startsWith('linear-gradient')) {
            // 解析渐变
            const gradientMatch = background.match(/linear-gradient\(([^)]+)\)/);
            if (gradientMatch) {
                const gradientParams = gradientMatch[1].split(',').map(s => s.trim());
                const angle = gradientParams[0];
                const colors = gradientParams.slice(1);
                
                // 创建渐变
                const gradient = this.ctx.createLinearGradient(0, 0, 540, 960);
                colors.forEach((color, index) => {
                    gradient.addColorStop(index / (colors.length - 1), color);
                });
                
                this.ctx.fillStyle = gradient;
            }
        } else {
            this.ctx.fillStyle = background;
        }
        
        this.ctx.fillRect(0, 0, 540, 960);
        
        // 添加纹理效果
        await this.addBackgroundTexture(templateConfig);
    }

    /**
     * 添加背景纹理
     */
    async addBackgroundTexture(templateConfig) {
        // 添加微妙的噪点纹理
        const imageData = this.ctx.getImageData(0, 0, 540, 960);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 10;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 绘制内容
     */
    async drawContent(content, templateConfig, tone, customTags, options) {
        const { textColor, primaryColor, secondaryColor } = templateConfig;
        
        // 设置文本样式
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // 绘制标题区域
        await this.drawTitle(content, templateConfig, tone);
        
        // 绘制主要内容
        await this.drawMainContent(content, templateConfig);
        
        // 绘制标签
        if (customTags.length > 0) {
            await this.drawTags(customTags, templateConfig);
        }
        
        // 绘制装饰图标
        await this.drawIcons(templateConfig, tone);
    }

    /**
     * 绘制标题
     */
    async drawTitle(content, templateConfig, tone) {
        const { primaryColor, textColor } = templateConfig;
        
        // 提取标题（取前20个字符）
        const title = content.split('\n')[0].substring(0, 20) + (content.length > 20 ? '...' : '');
        
        // 设置标题样式
        this.ctx.font = this.fontLoaded ? `bold 32px ${this.systemFontFamily}` : 'bold 32px sans-serif';
        this.ctx.fillStyle = textColor;
        
        // 绘制标题背景
        const titleBg = this.ctx.createLinearGradient(0, 80, 540, 120);
        titleBg.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        titleBg.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
        
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
    async drawMainContent(content, templateConfig) {
        const { textColor, secondaryColor } = templateConfig;
        
        // 内容区域背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.roundRect(40, 180, 460, 600, 20);
        this.ctx.fill();
        
        // 设置内容文字样式
        this.ctx.font = this.fontLoaded ? `18px ${this.systemFontFamily}` : '18px sans-serif';
        this.ctx.fillStyle = textColor;
        
        // 分段绘制内容
        const lines = this.wrapText(content, 420);
        let y = 220;
        
        lines.forEach((line, index) => {
            if (y > 750) return; // 防止超出边界
            
            this.ctx.fillText(line, 60, y);
            y += 28;
        });
    }

    /**
     * 绘制标签
     */
    async drawTags(tags, templateConfig) {
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
            this.ctx.fillStyle = primaryColor;
            this.roundRect(x, y, tagWidth, 25, 12);
            this.ctx.fill();
            
            // 绘制标签文字
            this.ctx.fillStyle = 'white';
            this.ctx.font = this.fontLoaded ? `14px ${this.systemFontFamily}` : '14px sans-serif';
            this.ctx.fillText(`#${tag}`, x + 10, y + 6);
            
            x += tagWidth + 10;
        });
    }

    /**
     * 绘制装饰元素
     */
    async drawDecorations(templateConfig, template) {
        const { primaryColor, accentColor } = templateConfig;
        
        // 绘制顶部装饰
        this.ctx.fillStyle = primaryColor;
        this.ctx.fillRect(0, 0, 540, 8);
        
        // 绘制角落装饰
        this.drawCornerDecorations(templateConfig);
        
        // 绘制模板特定装饰
        this.drawTemplateSpecificDecorations(template, templateConfig);
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
        this.ctx.arc(540, 960, 30, Math.PI, 3 * Math.PI / 2);
        this.ctx.fill();
    }

    /**
     * 绘制模板特定装饰
     */
    drawTemplateSpecificDecorations(template, templateConfig) {
        const { primaryColor } = templateConfig;
        
        // 根据模板类型添加特定装饰
        switch (template.category) {
            case 'lifestyle':
                this.drawLifestyleDecorations(templateConfig);
                break;
            case 'education':
                this.drawEducationDecorations(templateConfig);
                break;
            case 'fashion':
                this.drawFashionDecorations(templateConfig);
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
    async drawWatermark() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.font = this.fontLoaded ? `12px ${this.systemFontFamily}` : '12px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Created with AI Generator', 520, 940);
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
    async drawIcons(templateConfig, tone) {
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
        this.ctx.font = '24px serif';
        this.ctx.fillText(icon, 450, 150);
    }

    /**
     * 转换画布为图片数据
     */
    async canvasToImageData(format = 'png') {
        return new Promise((resolve) => {
            this.canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                resolve({
                    blob,
                    url,
                    width: 540,
                    height: 960,
                    format
                });
            }, `image/${format}`, format === 'jpg' ? 0.9 : 1.0);
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
