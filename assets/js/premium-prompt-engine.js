/**
 * 精美提示词引擎
 * 基于用户优化建议，生成符合小红书高颜值要求的提示词
 */
class PremiumPromptEngine {
    constructor() {
        this.designPrinciples = {
            visual: {
                colorScheme: '柔和色调，既时尚又保持技术内容的专业性',
                layout: '整体结构舒展，同时保持视觉美感和信息清晰度',
                typography: '视觉舒适，设计精美，整体设计让小仙女们看了一眼沦陷',
                hierarchy: '突出重要和关键信息，信息层次清晰'
            },
            content: {
                accessibility: '包含面向技术小白的通俗解读',
                clarity: '符合小红书平台上流行的"高颜值、有设计感、信息清晰"的风格',
                engagement: '既时尚又保持技术内容的专业性'
            },
            restrictions: {
                avoidWords: ['小白', '炸裂', '通俗', '极限词'],
                platformStyle: '符合小红书平台特色，适合年轻用户阅读和分享'
            }
        };
        
        this.templatePrompts = new Map();
        this.initializeTemplatePrompts();
    }

    /**
     * 初始化模板提示词
     */
    initializeTemplatePrompts() {
        // 技术内容精美卡片提示词
        this.templatePrompts.set('tech-premium', {
            basePrompt: `# 任务：
请你制作适合小红书平台发布的精美卡片（SVG），竖屏，适合手机阅读。

## 要求：
- 符合小红书平台上流行的"高颜值、有设计感、信息清晰"的风格，柔和色调，既时尚又保持技术内容的专业性。
- 整体结构舒展，同时保持视觉美感和信息清晰度。
- 视觉舒适，设计精美，整体设计让小仙女们看了一眼沦陷！
- 包含面向技术新手的易懂解读
- 突出重要和关键信息 
- 不要包含"新手"、"炸裂"、"通俗"和平台极限词

## 设计规范：
- 使用柔和渐变背景（如粉色到蓝色的渐变）
- 采用现代化的圆角设计和柔和阴影
- 字体层次清晰：标题使用得意黑，正文使用思源黑体
- 色彩搭配：主色调 #615DFA，辅助色 #FF6B95、#52BF90、#FFA726
- 信息分块展示，每个数据点使用独立的卡片设计
- 添加适当的装饰元素（几何图形、图标等）`,
            
            contentStructure: `## 内容结构要求：
1. 标题区域：醒目的技术主题，配色鲜明
2. 核心数据：用数字卡片展示关键指标
3. 技术解读：用简洁语言解释技术概念
4. 重要性说明：解释为什么这个技术很重要
5. 开源信息：如果适用，提供相关链接`,
            
            styleGuide: `## 视觉风格指南：
- 背景：柔和渐变，营造温馨氛围
- 卡片：白色背景，圆角设计，柔和阴影
- 数据展示：彩色背景的数据卡片，突出重要数字
- 图标：使用emoji或简洁图标增加视觉趣味
- 排版：左对齐，适当留白，层次分明`
        });

        // 生活方式精美卡片提示词
        this.templatePrompts.set('lifestyle-premium', {
            basePrompt: `# 任务：
请你制作适合小红书平台发布的精美生活方式卡片（SVG），竖屏，适合手机阅读。

## 要求：
- 符合小红书生活方式内容的"温馨、治愈、有格调"风格
- 柔和的色彩搭配，营造温暖舒适的视觉感受
- 整体设计精美，让人看了心情愉悦
- 内容贴近生活，易于理解和共鸣
- 突出生活美学和实用价值

## 设计规范：
- 使用温暖色调的渐变背景
- 圆润的设计元素，营造亲和感
- 适当使用生活化的图标和装饰
- 字体温和友好，易于阅读
- 色彩搭配温馨治愈`,
            
            contentStructure: `## 内容结构要求：
1. 主题标题：生活化的表达方式
2. 核心内容：实用的生活建议或分享
3. 要点列表：条理清晰的关键信息
4. 情感共鸣：引发读者共鸣的表达
5. 互动引导：鼓励点赞收藏的友好提示`,
            
            styleGuide: `## 视觉风格指南：
- 背景：温暖渐变，如粉色到橙色
- 元素：圆润可爱，增加亲和力
- 配色：温馨治愈，避免过于鲜艳
- 排版：舒适的行间距，易于阅读
- 装饰：生活化的小图标和元素`
        });
    }

    /**
     * 生成精美提示词
     */
    generatePremiumPrompt(content, template, tone, customTags = [], options = {}) {
        try {
            // 分析内容类型
            const contentType = this.analyzeContentType(content);
            
            // 选择合适的模板
            const templateKey = this.selectTemplate(contentType, template);
            const templatePrompt = this.templatePrompts.get(templateKey);
            
            if (!templatePrompt) {
                return this.generateFallbackPrompt(content);
            }

            // 构建完整提示词
            let prompt = templatePrompt.basePrompt;
            
            // 添加内容分析
            prompt += this.buildContentAnalysis(content);
            
            // 添加具体内容要求
            prompt += this.buildContentRequirements(content, tone, customTags);
            
            // 添加技术规范
            prompt += templatePrompt.contentStructure;
            prompt += templatePrompt.styleGuide;
            
            // 添加输出格式要求
            prompt += this.buildOutputRequirements(options);
            
            return this.optimizePrompt(prompt);
            
        } catch (error) {
            DEBUG.error('生成精美提示词失败:', error);
            return this.generateFallbackPrompt(content);
        }
    }

    /**
     * 分析内容类型
     */
    analyzeContentType(content) {
        const techKeywords = ['AI', 'API', '算法', '模型', '系统', '技术', '开源', '文件系统', '性能', '数据'];
        const lifestyleKeywords = ['生活', '分享', '推荐', '体验', '感受', '美食', '旅行', '穿搭'];
        
        const techScore = techKeywords.reduce((score, keyword) => 
            score + (content.includes(keyword) ? 1 : 0), 0);
        const lifestyleScore = lifestyleKeywords.reduce((score, keyword) => 
            score + (content.includes(keyword) ? 1 : 0), 0);
        
        return techScore > lifestyleScore ? 'tech' : 'lifestyle';
    }

    /**
     * 选择模板
     */
    selectTemplate(contentType, template) {
        if (contentType === 'tech') {
            return 'tech-premium';
        } else {
            return 'lifestyle-premium';
        }
    }

    /**
     * 构建内容分析
     */
    buildContentAnalysis(content) {
        // 提取关键信息
        const keyData = this.extractKeyData(content);
        const mainTheme = this.extractMainTheme(content);
        
        return `

## 内容分析：
**主题：** ${mainTheme}
**关键数据：** ${keyData.join('、')}
**内容长度：** ${content.length} 字符
**原始内容：** ${content}

`;
    }

    /**
     * 提取关键数据
     */
    extractKeyData(content) {
        const dataPattern = /(\d+(?:\.\d+)?)\s*([A-Za-z\/]+|秒|分钟|小时|天|倍|%|节点|TiB|GiB|MB|KB)/g;
        const matches = [];
        let match;
        
        while ((match = dataPattern.exec(content)) !== null && matches.length < 5) {
            matches.push(`${match[1]}${match[2]}`);
        }
        
        return matches.length > 0 ? matches : ['暂无数值数据'];
    }

    /**
     * 提取主题
     */
    extractMainTheme(content) {
        // 简单的主题提取
        const lines = content.split('\n').filter(line => line.trim());
        const firstLine = lines[0]?.trim() || '';
        
        if (firstLine.length > 0 && firstLine.length < 50) {
            return firstLine;
        }
        
        // 查找包含关键词的句子
        const techKeywords = ['AI', 'API', '技术', '系统', '算法'];
        for (const line of lines) {
            if (techKeywords.some(keyword => line.includes(keyword)) && line.length < 100) {
                return line.trim();
            }
        }
        
        return '技术内容分享';
    }

    /**
     * 构建内容要求
     */
    buildContentRequirements(content, tone, customTags) {
        let requirements = `
## 具体内容要求：
1. **标题优化：** 将主题转换为吸引人的标题，避免使用禁用词汇
2. **内容简化：** 将技术概念转换为易懂的表达，但保持专业性
3. **数据突出：** 将关键数字用醒目的数据卡片展示
4. **价值说明：** 解释这个技术/内容的重要性和实用价值
5. **视觉优化：** 确保信息层次清晰，重点突出`;

        if (tone) {
            requirements += `
6. **语言风格：** 采用${tone.name}的表达方式 - ${tone.description}`;
        }

        if (customTags.length > 0) {
            requirements += `
7. **标签融入：** 自然融入这些关键词：${customTags.join('、')}`;
        }

        return requirements;
    }

    /**
     * 构建输出要求
     */
    buildOutputRequirements(options) {
        return `

## 输出要求：
1. **格式：** 生成完整的SVG代码，包含所有样式定义
2. **尺寸：** 750x1334像素，适合手机竖屏显示
3. **兼容性：** 确保SVG代码在现代浏览器中正常显示
4. **优化：** 代码结构清晰，便于后续修改和优化
5. **完整性：** 包含所有必要的渐变、阴影和装饰元素

## 质量标准：
- 视觉效果必须达到小红书平台的高颜值标准
- 信息传达清晰准确，层次分明
- 色彩搭配和谐，符合现代审美
- 整体设计具有专业感和吸引力
- 适合目标用户群体的审美偏好`;
    }

    /**
     * 优化提示词
     */
    optimizePrompt(prompt) {
        // 移除禁用词汇
        const forbiddenWords = this.designPrinciples.restrictions.avoidWords;
        let optimized = prompt;
        
        forbiddenWords.forEach(word => {
            const regex = new RegExp(word, 'g');
            optimized = optimized.replace(regex, this.getAlternativeWord(word));
        });
        
        // 确保提示词长度适中
        if (optimized.length > 3000) {
            optimized = this.truncatePrompt(optimized);
        }
        
        return optimized;
    }

    /**
     * 获取替代词汇
     */
    getAlternativeWord(word) {
        const alternatives = {
            '小白': '新手',
            '炸裂': '出色',
            '通俗': '易懂',
            '极限': '优秀'
        };
        
        return alternatives[word] || word;
    }

    /**
     * 截断提示词
     */
    truncatePrompt(prompt) {
        const sections = prompt.split('##');
        const essential = sections.slice(0, 4).join('##'); // 保留前4个主要部分
        return essential + '\n\n## 注意：请确保输出高质量的SVG卡片';
    }

    /**
     * 生成后备提示词
     */
    generateFallbackPrompt(content) {
        return `请创建一个精美的小红书风格SVG卡片，内容：${content}。
要求：高颜值设计，柔和色调，信息清晰，适合手机竖屏显示。
尺寸：750x1334像素，包含渐变背景、圆角设计和柔和阴影。`;
    }

    /**
     * 生成多个变体提示词
     */
    generateVariations(content, template, tone, customTags = [], count = 3) {
        const variations = [];
        const basePrompt = this.generatePremiumPrompt(content, template, tone, customTags);
        
        variations.push(basePrompt);
        
        // 生成变体
        const variationStyles = [
            '强调数据可视化和图表元素',
            '突出色彩对比和视觉层次',
            '增加更多装饰元素和视觉亮点'
        ];
        
        for (let i = 1; i < count && i < variationStyles.length + 1; i++) {
            const variation = basePrompt + `\n\n**特别要求：** ${variationStyles[i - 1]}`;
            variations.push(variation);
        }
        
        return variations;
    }
}

// 全局实例
window.premiumPromptEngine = new PremiumPromptEngine();
