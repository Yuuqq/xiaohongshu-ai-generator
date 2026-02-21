/**
 * 现代图片生成器 - Google Design 风格
 * 基于 HTML2Canvas + CSS Grid + Material Design 3.0
 * 
 * @author Google Design Team Inspired
 * @version 2.0.0
 */

class ModernImageGenerator {
    constructor() {
        this.isGenerating = false;
        this.templates = new Map();
        this.dynamicColors = new Map();
        this.renderContainer = null;
        this.observer = null;
        
        this.init();
    }

    /**
     * 初始化现代图片生成器
     */
    async init() {
        try {
            // 加载必要的库
            await this.loadDependencies();
            
            // 创建渲染容器
            this.createRenderContainer();
            
            // 初始化 Material Design 3.0 模板
            this.initializeMaterialTemplates();
            
            // 设置动态颜色系统
            this.setupDynamicColors();
            
            // 初始化观察器
            this.setupObserver();
            
            console.log('🎨 Modern Image Generator initialized with Material Design 3.0');
        } catch (error) {
            console.error('❌ Modern Image Generator initialization failed:', error);
            throw error;
        }
    }

    /**
     * 加载依赖库
     */
    async loadDependencies() {
        const dependencies = [
            {
                name: 'html2canvas',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
                check: () => typeof html2canvas !== 'undefined'
            },
            {
                name: 'gsap',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
                check: () => typeof gsap !== 'undefined'
            }
        ];

        for (const dep of dependencies) {
            if (!dep.check()) {
                await this.loadScript(dep.url);
                console.log(`✅ Loaded ${dep.name}`);
            }
        }
    }

    /**
     * 动态加载脚本
     */
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 创建渲染容器
     */
    createRenderContainer() {
        // 移除旧容器
        const oldContainer = document.getElementById('modern-render-container');
        if (oldContainer) {
            oldContainer.remove();
        }

        // 创建新的渲染容器
        this.renderContainer = document.createElement('div');
        this.renderContainer.id = 'modern-render-container';
        this.renderContainer.style.cssText = `
            position: fixed;
            top: -10000px;
            left: -10000px;
            width: 540px;
            height: 960px;
            background: white;
            font-family: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
            overflow: hidden;
            z-index: -1000;
            transform: scale(1);
            transform-origin: top left;
        `;
        
        document.body.appendChild(this.renderContainer);
    }

    /**
     * 初始化 Material Design 3.0 模板
     */
    initializeMaterialTemplates() {
        this.templates.set('material-lifestyle', {
            name: 'Material Lifestyle',
            primaryColor: '#6750A4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#EADDFF',
            onPrimaryContainer: '#21005D',
            secondary: '#625B71',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#E8DEF8',
            onSecondaryContainer: '#1D192B',
            tertiary: '#7D5260',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#FFD8E4',
            onTertiaryContainer: '#31111D',
            surface: '#FEF7FF',
            onSurface: '#1C1B1F',
            surfaceVariant: '#E7E0EC',
            onSurfaceVariant: '#49454F',
            outline: '#79747E',
            typography: {
                displayLarge: { size: '57px', weight: '400', lineHeight: '64px' },
                displayMedium: { size: '45px', weight: '400', lineHeight: '52px' },
                displaySmall: { size: '36px', weight: '400', lineHeight: '44px' },
                headlineLarge: { size: '32px', weight: '400', lineHeight: '40px' },
                headlineMedium: { size: '28px', weight: '400', lineHeight: '36px' },
                headlineSmall: { size: '24px', weight: '400', lineHeight: '32px' },
                titleLarge: { size: '22px', weight: '500', lineHeight: '28px' },
                titleMedium: { size: '16px', weight: '500', lineHeight: '24px' },
                titleSmall: { size: '14px', weight: '500', lineHeight: '20px' },
                bodyLarge: { size: '16px', weight: '400', lineHeight: '24px' },
                bodyMedium: { size: '14px', weight: '400', lineHeight: '20px' },
                bodySmall: { size: '12px', weight: '400', lineHeight: '16px' }
            }
        });

        this.templates.set('material-tech', {
            name: 'Material Tech',
            primaryColor: '#0061A4',
            onPrimary: '#FFFFFF',
            primaryContainer: '#D1E4FF',
            onPrimaryContainer: '#001D36',
            secondary: '#535F70',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#D7E3F7',
            onSecondaryContainer: '#101C2B',
            tertiary: '#6B5778',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#F2DAFF',
            onTertiaryContainer: '#251431',
            surface: '#F8F9FF',
            onSurface: '#191C20',
            surfaceVariant: '#DFE2EB',
            onSurfaceVariant: '#43474E',
            outline: '#73777F',
            typography: {
                displayLarge: { size: '57px', weight: '400', lineHeight: '64px' },
                displayMedium: { size: '45px', weight: '400', lineHeight: '52px' },
                displaySmall: { size: '36px', weight: '400', lineHeight: '44px' },
                headlineLarge: { size: '32px', weight: '400', lineHeight: '40px' },
                headlineMedium: { size: '28px', weight: '400', lineHeight: '36px' },
                headlineSmall: { size: '24px', weight: '400', lineHeight: '32px' },
                titleLarge: { size: '22px', weight: '500', lineHeight: '28px' },
                titleMedium: { size: '16px', weight: '500', lineHeight: '24px' },
                titleSmall: { size: '14px', weight: '500', lineHeight: '20px' },
                bodyLarge: { size: '16px', weight: '400', lineHeight: '24px' },
                bodyMedium: { size: '14px', weight: '400', lineHeight: '20px' },
                bodySmall: { size: '12px', weight: '400', lineHeight: '16px' }
            }
        });

        this.templates.set('material-nature', {
            name: 'Material Nature',
            primaryColor: '#386A20',
            onPrimary: '#FFFFFF',
            primaryContainer: '#B9F396',
            onPrimaryContainer: '#0F2000',
            secondary: '#55624C',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#D9E7CB',
            onSecondaryContainer: '#131F0D',
            tertiary: '#386666',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#BCEBEB',
            onTertiaryContainer: '#002020',
            surface: '#F7FBF0',
            onSurface: '#191D16',
            surfaceVariant: '#DFE4D7',
            onSurfaceVariant: '#43483E',
            outline: '#74796D',
            typography: {
                displayLarge: { size: '57px', weight: '400', lineHeight: '64px' },
                displayMedium: { size: '45px', weight: '400', lineHeight: '52px' },
                displaySmall: { size: '36px', weight: '400', lineHeight: '44px' },
                headlineLarge: { size: '32px', weight: '400', lineHeight: '40px' },
                headlineMedium: { size: '28px', weight: '400', lineHeight: '36px' },
                headlineSmall: { size: '24px', weight: '400', lineHeight: '32px' },
                titleLarge: { size: '22px', weight: '500', lineHeight: '28px' },
                titleMedium: { size: '16px', weight: '500', lineHeight: '24px' },
                titleSmall: { size: '14px', weight: '500', lineHeight: '20px' },
                bodyLarge: { size: '16px', weight: '400', lineHeight: '24px' },
                bodyMedium: { size: '14px', weight: '400', lineHeight: '20px' },
                bodySmall: { size: '12px', weight: '400', lineHeight: '16px' }
            }
        });

        // 新增技术卡片模板 - 专为技术内容优化
        this.templates.set('material-tech-card', {
            name: 'Material Tech Card',
            primaryColor: '#7C4DFF',
            onPrimary: '#FFFFFF',
            primaryContainer: '#E8F5E8',
            onPrimaryContainer: '#1A1A2E',
            secondary: '#E91E63',
            onSecondary: '#FFFFFF',
            secondaryContainer: '#FFE8F5',
            onSecondaryContainer: '#2D1B69',
            tertiary: '#2196F3',
            onTertiary: '#FFFFFF',
            tertiaryContainer: '#E8F0FF',
            onTertiaryContainer: '#001D36',
            surface: '#FFFFFF',
            onSurface: '#333333',
            surfaceVariant: '#F8F4FF',
            onSurfaceVariant: '#333333',
            outline: '#E0E0E0',
            // 技术卡片专用颜色
            techColors: {
                performance: '#4CAF50',
                innovation: '#FF9800',
                efficiency: '#2196F3',
                reliability: '#9C27B0'
            },
            typography: {
                displayLarge: { size: '42px', weight: '700', lineHeight: '48px', fontFamily: 'LXGW WenKai' },
                displayMedium: { size: '36px', weight: '600', lineHeight: '42px', fontFamily: 'LXGW WenKai' },
                displaySmall: { size: '30px', weight: '600', lineHeight: '36px', fontFamily: 'LXGW WenKai' },
                headlineLarge: { size: '28px', weight: '600', lineHeight: '34px', fontFamily: 'Noto Sans SC' },
                headlineMedium: { size: '26px', weight: '600', lineHeight: '32px', fontFamily: 'Noto Sans SC' },
                headlineSmall: { size: '24px', weight: '600', lineHeight: '30px', fontFamily: 'Noto Sans SC' },
                titleLarge: { size: '22px', weight: '600', lineHeight: '28px', fontFamily: 'Noto Sans SC' },
                titleMedium: { size: '20px', weight: '600', lineHeight: '26px', fontFamily: 'Noto Sans SC' },
                titleSmall: { size: '18px', weight: '500', lineHeight: '24px', fontFamily: 'Noto Sans SC' },
                bodyLarge: { size: '22px', weight: '400', lineHeight: '28px', fontFamily: 'Noto Sans SC' },
                bodyMedium: { size: '20px', weight: '400', lineHeight: '26px', fontFamily: 'Noto Sans SC' },
                bodySmall: { size: '18px', weight: '400', lineHeight: '24px', fontFamily: 'Noto Sans SC' }
            }
        });
    }

    /**
     * 设置动态颜色系统
     */
    setupDynamicColors() {
        // 基于内容情感分析的动态配色
        this.dynamicColors.set('positive', {
            primary: '#4CAF50',
            secondary: '#81C784',
            accent: '#C8E6C9'
        });

        this.dynamicColors.set('energetic', {
            primary: '#FF5722',
            secondary: '#FF8A65',
            accent: '#FFCCBC'
        });

        this.dynamicColors.set('calm', {
            primary: '#2196F3',
            secondary: '#64B5F6',
            accent: '#BBDEFB'
        });

        this.dynamicColors.set('elegant', {
            primary: '#9C27B0',
            secondary: '#BA68C8',
            accent: '#E1BEE7'
        });
    }

    /**
     * 设置观察器
     */
    setupObserver() {
        // 使用 ResizeObserver 监听容器变化
        if ('ResizeObserver' in window) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    this.handleResize(entry);
                }
            });
        }
    }

    /**
     * 处理尺寸变化
     */
    handleResize(entry) {
        // 响应式调整
        const { width, height } = entry.contentRect;
        console.log(`📐 Container resized: ${width}x${height}`);
    }

    /**
     * 生成现代化图片
     */
    async generateModernImage(content, templateId = 'material-lifestyle', options = {}) {
        if (this.isGenerating) {
            throw new Error('Generation in progress');
        }

        try {
            this.isGenerating = true;
            
            // 获取模板
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error(`Template ${templateId} not found`);
            }

            // 分析内容
            const contentAnalysis = this.analyzeContent(content);
            
            // 创建DOM结构
            const domElement = await this.createModernDOM(content, template, contentAnalysis, options);
            
            // 应用动画效果
            await this.applyAnimations(domElement);
            
            // 等待渲染完成
            await this.waitForRender();
            
            // 生成高质量图片
            const imageData = await this.captureHighQualityImage(domElement, options);
            
            return imageData;
            
        } catch (error) {
            console.error('❌ Modern image generation failed:', error);
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 分析内容特征
     */
    analyzeContent(content) {
        const analysis = {
            length: content.length,
            wordCount: content.split(/\s+/).length,
            sentiment: this.analyzeSentiment(content),
            structure: this.analyzeStructure(content),
            complexity: this.calculateComplexity(content)
        };

        return analysis;
    }

    /**
     * 情感分析
     */
    analyzeSentiment(content) {
        const positiveWords = ['好', '棒', '优秀', '完美', '喜欢', '爱', '美', '赞', '推荐'];
        const energeticWords = ['激动', '兴奋', '活力', '动感', '热情', '火热', '燃'];
        const calmWords = ['平静', '安静', '舒适', '温和', '柔和', '宁静', '放松'];
        
        const lowerContent = content.toLowerCase();
        
        let positiveScore = positiveWords.reduce((score, word) => 
            score + (lowerContent.includes(word) ? 1 : 0), 0);
        let energeticScore = energeticWords.reduce((score, word) => 
            score + (lowerContent.includes(word) ? 1 : 0), 0);
        let calmScore = calmWords.reduce((score, word) => 
            score + (lowerContent.includes(word) ? 1 : 0), 0);

        if (energeticScore > positiveScore && energeticScore > calmScore) return 'energetic';
        if (calmScore > positiveScore && calmScore > energeticScore) return 'calm';
        if (positiveScore > 0) return 'positive';
        
        return 'elegant';
    }

    /**
     * 结构分析
     */
    analyzeStructure(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const hasNumbers = /\d+[\.\)]\s/.test(content);
        const hasBullets = /[•\-\*]\s/.test(content);
        const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content);
        
        return {
            lineCount: lines.length,
            hasNumbers,
            hasBullets,
            hasEmojis,
            avgLineLength: lines.reduce((sum, line) => sum + line.length, 0) / lines.length
        };
    }

    /**
     * 复杂度计算
     */
    calculateComplexity(content) {
        const factors = {
            length: Math.min(content.length / 500, 1),
            punctuation: (content.match(/[。！？；，]/g) || []).length / content.length,
            variety: new Set(content.split('')).size / content.length
        };
        
        return (factors.length + factors.punctuation + factors.variety) / 3;
    }

    /**
     * 创建现代DOM结构
     */
    async createModernDOM(content, template, analysis, options) {
        // 清空容器
        this.renderContainer.innerHTML = '';

        // 设置CSS变量
        this.setCSSVariables(template, analysis);

        // 创建主容器
        const mainContainer = document.createElement('div');
        mainContainer.className = 'modern-image-container';
        mainContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: var(--spacing-lg);
            padding: var(--spacing-xl);
            background: linear-gradient(135deg, var(--surface) 0%, var(--surface-variant) 100%);
            position: relative;
            overflow: hidden;
        `;

        // 添加背景装饰
        this.addBackgroundDecorations(mainContainer, template);

        // 创建头部
        const header = this.createHeader(content, template, analysis);
        mainContainer.appendChild(header);

        // 创建内容区域
        const contentArea = this.createContentArea(content, template, analysis);
        mainContainer.appendChild(contentArea);

        // 创建底部
        const footer = this.createFooter(template);
        mainContainer.appendChild(footer);

        this.renderContainer.appendChild(mainContainer);
        return mainContainer;
    }

    /**
     * 设置CSS变量
     */
    setCSSVariables(template, analysis) {
        const root = this.renderContainer;

        // Material Design 3.0 颜色
        root.style.setProperty('--primary', template.primaryColor);
        root.style.setProperty('--on-primary', template.onPrimary);
        root.style.setProperty('--primary-container', template.primaryContainer);
        root.style.setProperty('--on-primary-container', template.onPrimaryContainer);
        root.style.setProperty('--secondary', template.secondary);
        root.style.setProperty('--on-secondary', template.onSecondary);
        root.style.setProperty('--secondary-container', template.secondaryContainer);
        root.style.setProperty('--on-secondary-container', template.onSecondaryContainer);
        root.style.setProperty('--tertiary', template.tertiary);
        root.style.setProperty('--surface', template.surface);
        root.style.setProperty('--on-surface', template.onSurface);
        root.style.setProperty('--surface-variant', template.surfaceVariant);
        root.style.setProperty('--on-surface-variant', template.onSurfaceVariant);
        root.style.setProperty('--outline', template.outline);

        // 动态间距
        const baseSpacing = 8;
        root.style.setProperty('--spacing-xs', `${baseSpacing * 0.5}px`);
        root.style.setProperty('--spacing-sm', `${baseSpacing}px`);
        root.style.setProperty('--spacing-md', `${baseSpacing * 1.5}px`);
        root.style.setProperty('--spacing-lg', `${baseSpacing * 2}px`);
        root.style.setProperty('--spacing-xl', `${baseSpacing * 3}px`);
        root.style.setProperty('--spacing-xxl', `${baseSpacing * 4}px`);

        // 动态字体大小
        const typography = template.typography;
        Object.entries(typography).forEach(([key, value]) => {
            root.style.setProperty(`--font-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-size`, value.size);
            root.style.setProperty(`--font-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-weight`, value.weight);
            root.style.setProperty(`--font-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-line-height`, value.lineHeight);
            if (value.fontFamily) {
                root.style.setProperty(`--font-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}-family`, value.fontFamily);
            }
        });

        // 圆角
        root.style.setProperty('--radius-xs', '4px');
        root.style.setProperty('--radius-sm', '8px');
        root.style.setProperty('--radius-md', '12px');
        root.style.setProperty('--radius-lg', '16px');
        root.style.setProperty('--radius-xl', '24px');

        // 阴影
        root.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)');
        root.style.setProperty('--shadow-md', '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)');
        root.style.setProperty('--shadow-lg', '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)');
    }

    /**
     * 添加背景装饰
     */
    addBackgroundDecorations(container, template) {
        // 几何装饰元素
        const decoration1 = document.createElement('div');
        decoration1.style.cssText = `
            position: absolute;
            top: -50px;
            right: -50px;
            width: 200px;
            height: 200px;
            background: linear-gradient(45deg, var(--primary), var(--tertiary));
            border-radius: 50%;
            opacity: 0.1;
            z-index: 0;
        `;

        const decoration2 = document.createElement('div');
        decoration2.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: -30px;
            width: 150px;
            height: 150px;
            background: linear-gradient(-45deg, var(--secondary), var(--primary));
            border-radius: var(--radius-xl);
            opacity: 0.08;
            z-index: 0;
            transform: rotate(15deg);
        `;

        container.appendChild(decoration1);
        container.appendChild(decoration2);
    }

    /**
     * 创建头部
     */
    createHeader(content, template, analysis) {
        const header = document.createElement('header');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 2;
            position: relative;
        `;

        // 提取标题
        const title = this.extractTitle(content);

        const titleElement = document.createElement('h1');
        titleElement.textContent = title;
        titleElement.style.cssText = `
            font-size: var(--font-headline-large-size);
            font-weight: var(--font-headline-large-weight);
            line-height: var(--font-headline-large-line-height);
            color: var(--on-surface);
            margin: 0;
            background: linear-gradient(135deg, var(--primary), var(--tertiary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        `;

        // 装饰图标
        const iconElement = document.createElement('div');
        iconElement.innerHTML = this.getTemplateIcon(template);
        iconElement.style.cssText = `
            width: 48px;
            height: 48px;
            background: var(--primary-container);
            border-radius: var(--radius-md);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--on-primary-container);
            font-size: 24px;
        `;

        header.appendChild(titleElement);
        header.appendChild(iconElement);

        return header;
    }

    /**
     * 等待渲染完成
     */
    waitForRender() {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                setTimeout(resolve, 100);
            });
        });
    }

    /**
     * 创建内容区域
     */
    createContentArea(content, template, analysis) {
        const contentArea = document.createElement('main');
        contentArea.style.cssText = `
            display: grid;
            gap: var(--spacing-lg);
            z-index: 2;
            position: relative;
        `;

        // 分析内容结构
        const sections = this.parseContentSections(content);

        sections.forEach((section, index) => {
            const sectionElement = this.createSection(section, template, index);
            contentArea.appendChild(sectionElement);
        });

        return contentArea;
    }

    /**
     * 解析内容段落
     */
    parseContentSections(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const sections = [];
        let currentSection = { type: 'text', content: '', items: [] };

        lines.forEach(line => {
            const trimmedLine = line.trim();

            // 检测列表项
            if (/^[\d+\.\)]\s/.test(trimmedLine) || /^[•\-\*]\s/.test(trimmedLine)) {
                if (currentSection.type !== 'list') {
                    if (currentSection.content) sections.push(currentSection);
                    currentSection = { type: 'list', content: '', items: [] };
                }
                currentSection.items.push(trimmedLine.replace(/^[\d+\.\)\-\*•]\s*/, ''));
            } else if (trimmedLine.length > 0) {
                if (currentSection.type !== 'text') {
                    if (currentSection.items.length > 0) sections.push(currentSection);
                    currentSection = { type: 'text', content: '', items: [] };
                }
                currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
            }
        });

        if (currentSection.content || currentSection.items.length > 0) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * 创建段落
     */
    createSection(section, template, index) {
        const sectionElement = document.createElement('section');

        // 技术卡片模板的特殊样式
        if (template.name === 'Material Tech Card') {
            return this.createTechCardSection(section, template, index);
        }

        sectionElement.style.cssText = `
            background: var(--surface);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-sm);
            border-left: 4px solid var(--primary);
            position: relative;
            overflow: hidden;
        `;

        // 添加微妙的背景渐变
        const bgOverlay = document.createElement('div');
        bgOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, var(--primary-container) 0%, transparent 50%);
            opacity: 0.03;
            z-index: 0;
        `;
        sectionElement.appendChild(bgOverlay);

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            position: relative;
            z-index: 1;
        `;

        if (section.type === 'list') {
            const listElement = document.createElement('ul');
            listElement.style.cssText = `
                list-style: none;
                padding: 0;
                margin: 0;
                display: grid;
                gap: var(--spacing-md);
            `;

            section.items.forEach((item, itemIndex) => {
                const listItem = document.createElement('li');
                listItem.style.cssText = `
                    display: flex;
                    align-items: flex-start;
                    gap: var(--spacing-md);
                    font-size: var(--font-body-large-size);
                    line-height: var(--font-body-large-line-height);
                    color: var(--on-surface);
                `;

                const bullet = document.createElement('span');
                bullet.textContent = (itemIndex + 1).toString();
                bullet.style.cssText = `
                    background: var(--primary);
                    color: var(--on-primary);
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--font-body-small-size);
                    font-weight: 600;
                    flex-shrink: 0;
                    margin-top: 2px;
                `;

                const text = document.createElement('span');
                text.textContent = item;
                text.style.cssText = `
                    flex: 1;
                `;

                listItem.appendChild(bullet);
                listItem.appendChild(text);
                listElement.appendChild(listItem);
            });

            contentWrapper.appendChild(listElement);
        } else {
            const textElement = document.createElement('p');
            textElement.textContent = section.content;
            textElement.style.cssText = `
                font-size: var(--font-body-large-size);
                line-height: var(--font-body-large-line-height);
                color: var(--on-surface);
                margin: 0;
                text-align: justify;
                hyphens: auto;
            `;

            contentWrapper.appendChild(textElement);
        }

        sectionElement.appendChild(contentWrapper);
        return sectionElement;
    }

    /**
     * 创建底部
     */
    createFooter(template) {
        const footer = document.createElement('footer');
        footer.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 2;
            position: relative;
        `;

        const brandElement = document.createElement('div');
        brandElement.textContent = 'AI Generated';
        brandElement.style.cssText = `
            font-size: var(--font-body-small-size);
            color: var(--on-surface-variant);
            opacity: 0.7;
        `;

        const timeElement = document.createElement('div');
        timeElement.textContent = new Date().toLocaleDateString('zh-CN');
        timeElement.style.cssText = `
            font-size: var(--font-body-small-size);
            color: var(--on-surface-variant);
            opacity: 0.7;
        `;

        footer.appendChild(brandElement);
        footer.appendChild(timeElement);

        return footer;
    }

    /**
     * 提取标题
     */
    extractTitle(content) {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length === 0) return '小红书分享';

        const firstLine = lines[0].trim();
        return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
    }

    /**
     * 获取模板图标
     */
    getTemplateIcon(template) {
        const icons = {
            'material-lifestyle': '🌟',
            'material-tech': '🚀',
            'material-nature': '🌿'
        };

        return icons[template.name.toLowerCase().replace(/\s+/g, '-')] || '✨';
    }

    /**
     * 应用动画效果
     */
    async applyAnimations(domElement) {
        if (typeof gsap === 'undefined') return;

        // 淡入动画
        gsap.fromTo(domElement,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
        );

        // 元素依次出现
        const sections = domElement.querySelectorAll('section');
        gsap.fromTo(sections,
            { opacity: 0, x: -30 },
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, delay: 0.2, ease: "power2.out" }
        );
    }

    /**
     * 捕获高质量图片
     */
    async captureHighQualityImage(domElement, options = {}) {
        if (typeof html2canvas === 'undefined') {
            throw new Error('html2canvas library not loaded');
        }

        const canvas = await html2canvas(domElement, {
            backgroundColor: null,
            scale: options.quality === 'ultra' ? 3 : options.quality === 'high' ? 2 : 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            width: 540,
            height: 960,
            scrollX: 0,
            scrollY: 0
        });

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve({
                    url: canvas.toDataURL('image/png', 1.0),
                    blob: blob,
                    width: canvas.width,
                    height: canvas.height,
                    format: 'png'
                });
            }, 'image/png', 1.0);
        });
    }

    /**
     * 获取可用模板
     */
    getAvailableTemplates() {
        return Array.from(this.templates.entries()).map(([id, template]) => ({
            id,
            name: template.name,
            preview: this.generateTemplatePreview(template)
        }));
    }

    /**
     * 生成模板预览
     */
    generateTemplatePreview(template) {
        return {
            primaryColor: template.primaryColor,
            secondaryColor: template.secondary,
            backgroundColor: template.surface
        };
    }

    /**
     * 创建技术卡片专用段落
     */
    createTechCardSection(section, template, index) {
        const sectionElement = document.createElement('section');

        // 检测技术内容类型
        const contentType = this.detectTechContentType(section);

        // 根据内容类型应用不同样式
        const bgColor = this.getTechCardBgColor(contentType, template);
        const borderColor = this.getTechCardBorderColor(contentType, template);

        sectionElement.style.cssText = `
            background: ${bgColor};
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            box-shadow: var(--shadow-md);
            border-left: 6px solid ${borderColor};
            position: relative;
            overflow: hidden;
            margin-bottom: var(--spacing-md);
        `;

        // 添加技术卡片特有的装饰元素
        if (contentType === 'performance' || contentType === 'features') {
            const techIcon = document.createElement('div');
            techIcon.style.cssText = `
                position: absolute;
                top: var(--spacing-md);
                right: var(--spacing-md);
                width: 32px;
                height: 32px;
                background: ${borderColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 16px;
                font-weight: bold;
                z-index: 2;
            `;
            techIcon.textContent = contentType === 'performance' ? '⚡' : '🔧';
            sectionElement.appendChild(techIcon);
        }

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            position: relative;
            z-index: 1;
        `;

        if (section.type === 'list') {
            const listElement = this.createTechCardList(section, template, contentType);
            contentWrapper.appendChild(listElement);
        } else {
            const textElement = this.createTechCardText(section, template, contentType);
            contentWrapper.appendChild(textElement);
        }

        sectionElement.appendChild(contentWrapper);
        return sectionElement;
    }

    /**
     * 检测技术内容类型
     */
    detectTechContentType(section) {
        const content = section.content || section.items.join(' ');
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes('performance') || lowerContent.includes('speed') ||
            lowerContent.includes('fast') || lowerContent.includes('optimization') ||
            /\d+(\.\d+)?\s*(gb|mb|kb|tb|ghz|mhz|ms|s|%)/i.test(content)) {
            return 'performance';
        }

        if (lowerContent.includes('feature') || lowerContent.includes('component') ||
            lowerContent.includes('core') || lowerContent.includes('mechanism')) {
            return 'features';
        }

        if (lowerContent.includes('why') || lowerContent.includes('important') ||
            lowerContent.includes('benefit') || lowerContent.includes('advantage')) {
            return 'benefits';
        }

        return 'general';
    }

    /**
     * 获取技术卡片背景色
     */
    getTechCardBgColor(contentType, template) {
        const colors = {
            performance: '#E8F5E8',
            features: '#FFF8E1',
            benefits: '#E8F0FF',
            general: '#F8F4FF'
        };
        return colors[contentType] || colors.general;
    }

    /**
     * 获取技术卡片边框色
     */
    getTechCardBorderColor(contentType, template) {
        if (template.techColors) {
            const colors = {
                performance: template.techColors.performance,
                features: template.techColors.innovation,
                benefits: template.techColors.efficiency,
                general: template.primaryColor
            };
            return colors[contentType] || colors.general;
        }
        return template.primaryColor;
    }

    /**
     * 创建技术卡片列表
     */
    createTechCardList(section, template, contentType) {
        const listElement = document.createElement('ul');
        listElement.style.cssText = `
            list-style: none;
            padding: 0;
            margin: 0;
            display: grid;
            gap: var(--spacing-md);
        `;

        section.items.forEach((item, itemIndex) => {
            const listItem = document.createElement('li');
            listItem.style.cssText = `
                display: flex;
                align-items: flex-start;
                gap: var(--spacing-md);
                font-size: var(--font-body-large-size);
                line-height: var(--font-body-large-line-height);
                color: var(--on-surface);
                font-family: ${template.typography.bodyLarge.fontFamily || 'Noto Sans SC'};
            `;

            const bullet = document.createElement('span');
            bullet.textContent = '•';
            bullet.style.cssText = `
                color: ${this.getTechCardBorderColor(contentType, template)};
                font-weight: bold;
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            `;

            const text = document.createElement('span');
            text.textContent = item;
            text.style.cssText = `
                flex: 1;
                font-weight: 500;
            `;

            listItem.appendChild(bullet);
            listItem.appendChild(text);
            listElement.appendChild(listItem);
        });

        return listElement;
    }

    /**
     * 创建技术卡片文本
     */
    createTechCardText(section, template, contentType) {
        const textElement = document.createElement('p');
        textElement.textContent = section.content;
        textElement.style.cssText = `
            font-size: var(--font-body-large-size);
            line-height: var(--font-body-large-line-height);
            color: var(--on-surface);
            margin: 0;
            font-family: ${template.typography.bodyLarge.fontFamily || 'Noto Sans SC'};
            font-weight: 500;
        `;

        return textElement;
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }

        if (this.renderContainer && this.renderContainer.parentNode) {
            this.renderContainer.parentNode.removeChild(this.renderContainer);
        }

        this.templates.clear();
        this.dynamicColors.clear();
    }
}

// 全局实例
window.modernImageGenerator = new ModernImageGenerator();
