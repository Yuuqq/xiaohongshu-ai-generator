/**
 * 高级图片生成器
 * 使用Fabric.js提供更强大的图片生成和排版功能
 */

class AdvancedImageGenerator {
    constructor() {
        this.canvas = null;
        this.fabricCanvas = null;
        this.isGenerating = false;
        this.templates = {};
        this.fonts = [
            'Arial', 'Helvetica', 'Georgia', 'Times New Roman',
            'sans-serif', 'serif', 'monospace'
        ];
        this.init();
    }

    /**
     * 初始化生成器
     */
    async init() {
        try {
            // 检查Fabric.js是否已加载
            if (typeof fabric === 'undefined') {
                await this.loadFabricJS();
            }
            
            // 创建画布
            this.createCanvas();
            
            // 初始化模板
            this.initializeTemplates();
            
            DEBUG.log('高级图片生成器初始化完成');
        } catch (error) {
            DEBUG.error('高级图片生成器初始化失败:', error);
        }
    }

    /**
     * 动态加载Fabric.js
     */
    loadFabricJS() {
        return new Promise((resolve, reject) => {
            if (typeof fabric !== 'undefined') {
                resolve();
                return;
            }

            const fabricSources = [
                'https://cdn.staticfile.org/fabric.js/5.3.0/fabric.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.0/fabric.min.js'
            ];

            const tryLoad = (index) => {
                if (index >= fabricSources.length) {
                    DEBUG.error('Fabric.js 所有镜像源都加载失败');
                    reject(new Error('Fabric.js 加载失败'));
                    return;
                }

                const script = document.createElement('script');
                script.src = fabricSources[index];
                script.onload = () => {
                    DEBUG.log(`Fabric.js 加载完成: ${fabricSources[index]}`);
                    resolve();
                };
                script.onerror = () => {
                    DEBUG.warn(`Fabric.js 加载失败，尝试下一个源: ${fabricSources[index]}`);
                    script.remove();
                    tryLoad(index + 1);
                };
                document.head.appendChild(script);
            };

            tryLoad(0);
        });
    }

    /**
     * 创建画布
     */
    createCanvas() {
        // 创建隐藏的canvas元素
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'advanced-image-canvas';
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);

        // 初始化Fabric画布
        this.fabricCanvas = new fabric.Canvas(this.canvas, {
            width: 540,
            height: 960,
            backgroundColor: '#ffffff'
        });
    }

    /**
     * 初始化模板
     */
    initializeTemplates() {
        this.templates = {
            'xiaohongshu-lifestyle': {
                name: '小红书生活风',
                backgroundColor: '#fff5f5',
                primaryColor: '#ff6b6b',
                secondaryColor: '#4ecdc4',
                accentColor: '#45b7d1',
                textColor: '#2c3e50',
                fontFamily: 'Arial, sans-serif',
                layout: 'vertical',
                padding: 40,
                titleSize: 32,
                bodySize: 18,
                spacing: 20
            },
            'xiaohongshu-fashion': {
                name: '小红书时尚风',
                backgroundColor: '#f8f9fa',
                primaryColor: '#e91e63',
                secondaryColor: '#9c27b0',
                accentColor: '#673ab7',
                textColor: '#212529',
                fontFamily: 'Arial, sans-serif',
                layout: 'vertical',
                padding: 35,
                titleSize: 28,
                bodySize: 16,
                spacing: 18
            },
            'xiaohongshu-food': {
                name: '小红书美食风',
                backgroundColor: '#fff8e1',
                primaryColor: '#ff9800',
                secondaryColor: '#ff5722',
                accentColor: '#ffc107',
                textColor: '#3e2723',
                fontFamily: 'Georgia, serif',
                layout: 'vertical',
                padding: 45,
                titleSize: 30,
                bodySize: 17,
                spacing: 22
            },
            'xiaohongshu-tech': {
                name: '小红书科技风',
                backgroundColor: '#f5f5f5',
                primaryColor: '#2196f3',
                secondaryColor: '#00bcd4',
                accentColor: '#009688',
                textColor: '#263238',
                fontFamily: 'Helvetica, Arial, sans-serif',
                layout: 'vertical',
                padding: 30,
                titleSize: 26,
                bodySize: 15,
                spacing: 16
            }
        };
    }

    /**
     * 生成图片
     */
    async generateImage(content, template, options = {}) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请稍候');
        }

        try {
            this.isGenerating = true;
            
            // 获取模板配置
            const templateConfig = this.templates[template.id] || this.templates['xiaohongshu-lifestyle'];
            
            // 设置画布尺寸
            this.setCanvasSize(options.aspectRatio || '9:16');
            
            // 清空画布
            this.fabricCanvas.clear();
            
            // 设置背景
            await this.setBackground(templateConfig, options);
            
            // 分析内容并布局
            const layout = this.analyzeContentLayout(content, templateConfig);
            
            // 渲染内容
            await this.renderContent(layout, templateConfig, options);
            
            // 添加装饰元素
            await this.addDecorations(templateConfig, options);
            
            // 添加水印
            if (options.addWatermark !== false) {
                await this.addWatermark(templateConfig);
            }
            
            // 确保所有对象都已渲染
            await this.ensureRenderComplete();

            // 导出图片
            const imageData = await this.exportImage(options.format || 'png', options.quality || 'high');
            
            return imageData;
            
        } catch (error) {
            DEBUG.error('图片生成失败:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 设置画布尺寸
     */
    setCanvasSize(aspectRatio) {
        let width, height;
        
        switch (aspectRatio) {
            case '1:1':
                width = height = 800;
                break;
            case '16:9':
                width = 800;
                height = 450;
                break;
            case '4:5':
                width = 640;
                height = 800;
                break;
            case '9:16':
            default:
                width = 540;
                height = 960;
                break;
        }
        
        this.fabricCanvas.setDimensions({
            width: width,
            height: height
        });
    }

    /**
     * 设置背景
     */
    async setBackground(templateConfig, options) {
        // 设置背景色
        this.fabricCanvas.backgroundColor = templateConfig.backgroundColor;
        
        // 添加渐变背景
        if (options.backgroundStyle === 'gradient') {
            const gradient = new fabric.Gradient({
                type: 'linear',
                coords: {
                    x1: 0, y1: 0,
                    x2: this.fabricCanvas.width, y2: this.fabricCanvas.height
                },
                colorStops: [
                    { offset: 0, color: templateConfig.backgroundColor },
                    { offset: 1, color: this.lightenColor(templateConfig.primaryColor, 0.8) }
                ]
            });
            
            const rect = new fabric.Rect({
                left: 0,
                top: 0,
                width: this.fabricCanvas.width,
                height: this.fabricCanvas.height,
                fill: gradient,
                selectable: false
            });
            
            this.fabricCanvas.add(rect);
        }
        
        // 添加装饰性背景图案
        if (options.backgroundPattern) {
            await this.addBackgroundPattern(templateConfig);
        }
    }

    /**
     * 分析内容布局
     */
    analyzeContentLayout(content, templateConfig) {
        const lines = content.split('\n').filter(line => line.trim());
        const layout = {
            title: '',
            sections: [],
            totalHeight: 0,
            layoutStrategy: 'auto'
        };

        // 提取标题（第一行或最显眼的内容）
        if (lines.length > 0) {
            layout.title = lines[0].length > 50 ? lines[0].substring(0, 50) + '...' : lines[0];
        }

        // 分析段落
        let currentSection = '';
        lines.slice(1).forEach(line => {
            if (line.trim().length === 0) return;

            // 检查是否是新段落的开始
            if (this.isNewSection(line)) {
                if (currentSection.trim()) {
                    layout.sections.push({
                        type: 'paragraph',
                        content: currentSection.trim()
                    });
                }
                currentSection = line;
            } else {
                currentSection += (currentSection ? '\n' : '') + line;
            }
        });

        if (currentSection.trim()) {
            layout.sections.push({
                type: 'paragraph',
                content: currentSection.trim()
            });
        }

        // 智能排版分析
        layout.layoutAnalysis = this.analyzeLayoutRequirements(layout, templateConfig);

        return layout;
    }

    /**
     * 分析排版需求
     */
    analyzeLayoutRequirements(layout, templateConfig) {
        const totalContent = layout.title + ' ' + layout.sections.map(s => s.content).join(' ');
        const contentLength = totalContent.length;
        const sectionCount = layout.sections.length;

        // 计算内容密度
        const contentDensity = contentLength / (this.fabricCanvas.width * this.fabricCanvas.height / 1000);

        // 确定布局策略
        let layoutStrategy = 'balanced';
        if (contentLength < 100) {
            layoutStrategy = 'spacious';
        } else if (contentLength > 500) {
            layoutStrategy = 'compact';
        }

        // 计算字体大小
        const fontSizes = this.calculateOptimalFontSizes(contentLength, sectionCount, templateConfig);

        // 计算间距
        const spacing = this.calculateOptimalSpacing(contentLength, layoutStrategy, templateConfig);

        // 确定布局方向
        const orientation = this.determineLayoutOrientation(layout.sections, this.fabricCanvas.width, this.fabricCanvas.height);

        return {
            strategy: layoutStrategy,
            contentDensity: contentDensity,
            fontSizes: fontSizes,
            spacing: spacing,
            orientation: orientation,
            estimatedHeight: this.estimateContentHeight(layout, fontSizes, spacing)
        };
    }

    /**
     * 计算最优字体大小
     */
    calculateOptimalFontSizes(contentLength, sectionCount, templateConfig) {
        const baseTitle = templateConfig.titleSize;
        const baseBody = templateConfig.bodySize;

        // 根据内容长度调整字体大小
        let titleMultiplier = 1;
        let bodyMultiplier = 1;

        if (contentLength < 100) {
            // 内容少，字体可以大一些
            titleMultiplier = 1.2;
            bodyMultiplier = 1.1;
        } else if (contentLength > 500) {
            // 内容多，字体需要小一些
            titleMultiplier = 0.8;
            bodyMultiplier = 0.9;
        }

        // 根据段落数量调整
        if (sectionCount > 5) {
            bodyMultiplier *= 0.9;
        }

        return {
            title: Math.round(baseTitle * titleMultiplier),
            body: Math.round(baseBody * bodyMultiplier),
            caption: Math.round(baseBody * bodyMultiplier * 0.8)
        };
    }

    /**
     * 计算最优间距
     */
    calculateOptimalSpacing(contentLength, layoutStrategy, templateConfig) {
        const baseSpacing = templateConfig.spacing;

        let multiplier = 1;
        switch (layoutStrategy) {
            case 'spacious':
                multiplier = 1.5;
                break;
            case 'compact':
                multiplier = 0.7;
                break;
            case 'balanced':
            default:
                multiplier = 1;
                break;
        }

        return {
            section: Math.round(baseSpacing * multiplier),
            paragraph: Math.round(baseSpacing * multiplier * 0.6),
            line: Math.round(baseSpacing * multiplier * 0.3)
        };
    }

    /**
     * 确定布局方向
     */
    determineLayoutOrientation(sections, canvasWidth, canvasHeight) {
        const aspectRatio = canvasWidth / canvasHeight;

        // 横版图片适合左右布局
        if (aspectRatio > 1.5) {
            return 'horizontal';
        }

        // 竖版图片适合上下布局
        if (aspectRatio < 0.8) {
            return 'vertical';
        }

        // 方形图片根据内容决定
        const totalLength = sections.reduce((sum, section) => sum + section.content.length, 0);
        return totalLength > 300 ? 'vertical' : 'mixed';
    }

    /**
     * 估算内容高度
     */
    estimateContentHeight(layout, fontSizes, spacing) {
        let estimatedHeight = spacing.section; // 顶部间距

        // 标题高度
        if (layout.title) {
            estimatedHeight += fontSizes.title + spacing.section;
        }

        // 段落高度
        layout.sections.forEach(section => {
            const lines = Math.ceil(section.content.length / 50); // 估算行数
            estimatedHeight += (fontSizes.body * 1.5 * lines) + spacing.paragraph;
        });

        return estimatedHeight;
    }

    /**
     * 判断是否是新段落
     */
    isNewSection(line) {
        // 数字开头
        if (/^\d+[\.\)]\s/.test(line)) return true;
        // 项目符号
        if (/^[\*\-\+•]\s/.test(line)) return true;
        // 中文数字
        if (/^[一二三四五六七八九十]+[\.\、]\s/.test(line)) return true;
        
        return false;
    }

    /**
     * 渲染内容
     */
    async renderContent(layout, templateConfig, options) {
        const analysis = layout.layoutAnalysis;
        const padding = templateConfig.padding;
        let currentY = padding;

        // 检查内容是否超出画布，如果是则调整布局
        if (analysis.estimatedHeight > this.fabricCanvas.height - padding * 2) {
            await this.renderCompactLayout(layout, templateConfig, options);
            return;
        }

        // 根据布局方向选择渲染方式
        if (analysis.orientation === 'horizontal') {
            await this.renderHorizontalLayout(layout, templateConfig, options);
        } else {
            await this.renderVerticalLayout(layout, templateConfig, options);
        }
    }

    /**
     * 渲染垂直布局
     */
    async renderVerticalLayout(layout, templateConfig, options) {
        const analysis = layout.layoutAnalysis;
        const padding = templateConfig.padding;
        let currentY = padding;

        // 渲染标题
        if (layout.title) {
            const titleText = new fabric.Text(layout.title, {
                left: this.fabricCanvas.width / 2,
                top: currentY,
                fontFamily: templateConfig.fontFamily,
                fontSize: analysis.fontSizes.title,
                fill: templateConfig.primaryColor,
                fontWeight: 'bold',
                textAlign: 'center',
                originX: 'center'
            });

            this.fabricCanvas.add(titleText);
            currentY += titleText.height + analysis.spacing.section;
        }

        // 渲染段落
        for (let index = 0; index < layout.sections.length; index++) {
            const section = layout.sections[index];

            // 检测段落类型并应用不同样式
            const isListItem = this.isListItem(section.content);
            const isNumbered = this.isNumberedItem(section.content);

            let textAlign = 'left';
            let leftMargin = padding;

            if (isListItem || isNumbered) {
                leftMargin += 20; // 列表项缩进
            }

            const textObj = new fabric.Textbox(section.content, {
                left: leftMargin,
                top: currentY,
                width: this.fabricCanvas.width - leftMargin - padding,
                fontFamily: templateConfig.fontFamily,
                fontSize: analysis.fontSizes.body,
                fill: templateConfig.textColor,
                lineHeight: this.calculateLineHeight(section.content.length),
                textAlign: textAlign
            });

            this.fabricCanvas.add(textObj);
            currentY += textObj.height + analysis.spacing.paragraph;

            // 添加装饰性分隔元素
            if (index < layout.sections.length - 1 && analysis.strategy !== 'compact') {
                await this.addSectionDivider(currentY, templateConfig, analysis);
                currentY += analysis.spacing.section;
            }
        }
    }

    /**
     * 渲染水平布局
     */
    async renderHorizontalLayout(layout, templateConfig, options) {
        const analysis = layout.layoutAnalysis;
        const padding = templateConfig.padding;
        const columnWidth = (this.fabricCanvas.width - padding * 3) / 2;

        let leftColumnY = padding;
        let rightColumnY = padding;

        // 标题跨越两列
        if (layout.title) {
            const titleText = new fabric.Text(layout.title, {
                left: this.fabricCanvas.width / 2,
                top: leftColumnY,
                fontFamily: templateConfig.fontFamily,
                fontSize: analysis.fontSizes.title,
                fill: templateConfig.primaryColor,
                fontWeight: 'bold',
                textAlign: 'center',
                originX: 'center'
            });

            this.fabricCanvas.add(titleText);
            leftColumnY = rightColumnY = titleText.top + titleText.height + analysis.spacing.section;
        }

        // 分配段落到两列
        layout.sections.forEach((section, index) => {
            const useLeftColumn = index % 2 === 0;
            const columnX = useLeftColumn ? padding : padding * 2 + columnWidth;
            const currentY = useLeftColumn ? leftColumnY : rightColumnY;

            const textObj = new fabric.Textbox(section.content, {
                left: columnX,
                top: currentY,
                width: columnWidth,
                fontFamily: templateConfig.fontFamily,
                fontSize: analysis.fontSizes.body,
                fill: templateConfig.textColor,
                lineHeight: 1.4,
                textAlign: 'left'
            });

            this.fabricCanvas.add(textObj);

            if (useLeftColumn) {
                leftColumnY = currentY + textObj.height + analysis.spacing.paragraph;
            } else {
                rightColumnY = currentY + textObj.height + analysis.spacing.paragraph;
            }
        });
    }

    /**
     * 渲染紧凑布局
     */
    async renderCompactLayout(layout, templateConfig, options) {
        const padding = templateConfig.padding * 0.7; // 减少边距
        const compactFontSizes = {
            title: templateConfig.titleSize * 0.8,
            body: templateConfig.bodySize * 0.85
        };
        const compactSpacing = templateConfig.spacing * 0.6;

        let currentY = padding;

        // 紧凑标题
        if (layout.title) {
            const titleText = new fabric.Text(layout.title, {
                left: this.fabricCanvas.width / 2,
                top: currentY,
                fontFamily: templateConfig.fontFamily,
                fontSize: compactFontSizes.title,
                fill: templateConfig.primaryColor,
                fontWeight: 'bold',
                textAlign: 'center',
                originX: 'center'
            });

            this.fabricCanvas.add(titleText);
            currentY += titleText.height + compactSpacing;
        }

        // 紧凑段落
        layout.sections.forEach((section, index) => {
            const textObj = new fabric.Textbox(section.content, {
                left: padding,
                top: currentY,
                width: this.fabricCanvas.width - padding * 2,
                fontFamily: templateConfig.fontFamily,
                fontSize: compactFontSizes.body,
                fill: templateConfig.textColor,
                lineHeight: 1.3,
                textAlign: 'left'
            });

            this.fabricCanvas.add(textObj);
            currentY += textObj.height + compactSpacing * 0.8;
        });
    }

    /**
     * 计算行高
     */
    calculateLineHeight(contentLength) {
        if (contentLength < 50) return 1.6;
        if (contentLength < 150) return 1.5;
        return 1.4;
    }

    /**
     * 检测是否为列表项
     */
    isListItem(content) {
        return /^[\*\-\+•]\s/.test(content.trim());
    }

    /**
     * 检测是否为编号项
     */
    isNumberedItem(content) {
        return /^\d+[\.\)]\s/.test(content.trim());
    }

    /**
     * 添加段落分隔符
     */
    async addSectionDivider(y, templateConfig, analysis) {
        const dividerWidth = this.fabricCanvas.width * 0.3;
        const dividerX = (this.fabricCanvas.width - dividerWidth) / 2;

        if (analysis.strategy === 'spacious') {
            // 装饰性分隔线
            const line = new fabric.Line([
                dividerX, y,
                dividerX + dividerWidth, y
            ], {
                stroke: templateConfig.secondaryColor,
                strokeWidth: 3,
                opacity: 0.4
            });
            this.fabricCanvas.add(line);

            // 中心装饰点
            const dot = new fabric.Circle({
                left: this.fabricCanvas.width / 2 - 3,
                top: y - 3,
                radius: 3,
                fill: templateConfig.accentColor,
                opacity: 0.6
            });
            this.fabricCanvas.add(dot);
        } else {
            // 简单分隔线
            const line = new fabric.Line([
                dividerX, y,
                dividerX + dividerWidth, y
            ], {
                stroke: templateConfig.secondaryColor,
                strokeWidth: 1,
                opacity: 0.3
            });
            this.fabricCanvas.add(line);
        }
    }

    /**
     * 添加装饰元素
     */
    async addDecorations(templateConfig, options) {
        // 添加顶部装饰条
        const topBar = new fabric.Rect({
            left: 0,
            top: 0,
            width: this.fabricCanvas.width,
            height: 8,
            fill: templateConfig.primaryColor,
            selectable: false
        });
        this.fabricCanvas.add(topBar);
        
        // 添加角落装饰
        const cornerSize = 60;
        const corner = new fabric.Circle({
            left: this.fabricCanvas.width - cornerSize - 20,
            top: 20,
            radius: cornerSize / 2,
            fill: templateConfig.accentColor,
            opacity: 0.1,
            selectable: false
        });
        this.fabricCanvas.add(corner);
    }

    /**
     * 添加水印
     */
    async addWatermark(templateConfig) {
        const watermark = new fabric.Text('AI生成', {
            left: this.fabricCanvas.width - 80,
            top: this.fabricCanvas.height - 30,
            fontFamily: templateConfig.fontFamily,
            fontSize: 12,
            fill: templateConfig.textColor,
            opacity: 0.3,
            selectable: false
        });
        
        this.fabricCanvas.add(watermark);
    }

    /**
     * 确保渲染完成
     */
    async ensureRenderComplete() {
        return new Promise((resolve) => {
            // 强制渲染所有对象
            this.fabricCanvas.renderAll();

            // 等待一小段时间确保渲染完成
            setTimeout(() => {
                // 再次渲染确保所有文字都已显示
                this.fabricCanvas.renderAll();
                resolve();
            }, 100);
        });
    }

    /**
     * 导出图片
     */
    async exportImage(format, quality) {
        const qualityMap = {
            'standard': 0.7,
            'high': 0.9,
            'ultra': 1.0
        };
        
        const dataURL = this.fabricCanvas.toDataURL({
            format: format,
            quality: qualityMap[quality] || 0.9,
            multiplier: quality === 'ultra' ? 2 : 1
        });
        
        // 转换为Blob
        const blob = await this.dataURLToBlob(dataURL);
        
        return {
            url: dataURL,
            blob: blob,
            width: this.fabricCanvas.width,
            height: this.fabricCanvas.height,
            format: format
        };
    }

    /**
     * DataURL转Blob
     */
    dataURLToBlob(dataURL) {
        return new Promise((resolve) => {
            const arr = dataURL.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            
            resolve(new Blob([u8arr], { type: mime }));
        });
    }

    /**
     * 颜色处理工具
     */
    lightenColor(color, amount) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        let r = (num >> 16) + amount * 255;
        let g = (num >> 8 & 0x00FF) + amount * 255;
        let b = (num & 0x0000FF) + amount * 255;
        
        r = r > 255 ? 255 : r < 0 ? 0 : r;
        g = g > 255 ? 255 : g < 0 ? 0 : g;
        b = b > 255 ? 255 : b < 0 ? 0 : b;
        
        return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
    }

    /**
     * 获取可用模板
     */
    getAvailableTemplates() {
        return Object.keys(this.templates).map(id => ({
            id: id,
            name: this.templates[id].name
        }));
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.fabricCanvas) {
            this.fabricCanvas.dispose();
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// 全局实例
window.advancedImageGenerator = new AdvancedImageGenerator();
