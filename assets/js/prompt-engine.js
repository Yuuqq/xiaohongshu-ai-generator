/**
 * 智能提示词生成引擎
 * 负责根据用户输入和模板生成优化的API提示词
 */

class PromptEngine {
    constructor() {
        this.basePrompts = {
            system: "你是一个专业的小红书内容设计师，擅长创建吸引人的视觉内容。",
            imageGeneration: "请生成一张适合小红书平台的图片，要求高质量、美观、符合平台风格。",
            style: "图片应该具有现代感、时尚感，色彩搭配和谐，排版清晰易读。"
        };
        
        this.styleModifiers = {
            warm: "温暖色调，使用粉色、橙色、米色等暖色系",
            professional: "专业简洁，使用蓝色、灰色等商务色彩",
            trendy: "时尚潮流，使用鲜艳对比色彩",
            appetizing: "诱人食欲，使用橙红、黄色等暖色调",
            adventure: "自由冒险，使用蓝绿、天空色等清新色彩",
            shopping: "购物欲望，使用橙黄、金色等活力色彩",
            energetic: "充满活力，使用绿色、蓝色等健康色彩",
            minimal: "极简风格，使用黑白灰或单一色调"
        };

        this.layoutStyles = {
            vertical: "竖版布局，适合手机浏览",
            card: "卡片式布局，信息层次清晰",
            magazine: "杂志风格布局，视觉冲击力强",
            "food-card": "美食卡片布局，突出食物诱人特质",
            "travel-card": "旅行卡片布局，体现自由和美好",
            "product-card": "产品卡片布局，突出商品特色",
            "fitness-card": "健身卡片布局，体现健康活力",
            "minimal-card": "极简卡片布局，大量留白"
        };

        this.contentEnhancers = {
            lifestyle: ["生活美学", "日常记录", "温馨治愈", "生活态度"],
            education: ["知识分享", "学习成长", "实用技巧", "专业指导"],
            fashion: ["时尚潮流", "穿搭灵感", "美妆技巧", "风格展示"],
            food: ["美食诱惑", "味蕾享受", "烹饪艺术", "食物美学"],
            travel: ["旅行记忆", "风景如画", "文化体验", "自由探索"],
            shopping: ["好物推荐", "购物体验", "品质生活", "消费指南"],
            fitness: ["健康生活", "运动激情", "身心平衡", "积极向上"],
            minimalist: ["简约美学", "内心宁静", "生活哲学", "精神追求"]
        };
    }

    /**
     * 生成完整的提示词
     */
    generatePrompt(content, template, options = {}) {
        try {
            const {
                imageCount = 1,
                imageStyle = 'illustration',
                aspectRatio = '9:16',
                quality = 'high'
            } = options;

            // 构建基础提示词
            let prompt = this.buildBasePrompt(content, template);
            
            // 添加风格描述
            prompt += this.buildStyleDescription(template);
            
            // 添加布局描述
            prompt += this.buildLayoutDescription(template);
            
            // 添加内容增强
            prompt += this.buildContentEnhancement(content, template);
            
            // 添加技术要求
            prompt += this.buildTechnicalRequirements(imageStyle, aspectRatio, quality);
            
            // 添加小红书特定要求
            prompt += this.buildPlatformRequirements();

            return this.optimizePrompt(prompt);
        } catch (error) {
            DEBUG.error('生成提示词失败:', error);
            return this.getFallbackPrompt(content);
        }
    }

    /**
     * 构建基础提示词
     */
    buildBasePrompt(content, template) {
        const basePrompt = template.prompt_template || 
            `创建一个小红书风格的${template.name}图片，内容：${content}`;
        
        return basePrompt.replace('{content}', content) + '\n\n';
    }

    /**
     * 构建风格描述
     */
    buildStyleDescription(template) {
        const style = template.style || {};
        const colorScheme = style.colorScheme || 'warm';
        const typography = style.typography || 'modern';
        
        let styleDesc = '设计风格要求：\n';
        
        // 颜色风格
        if (this.styleModifiers[colorScheme]) {
            styleDesc += `- 色彩：${this.styleModifiers[colorScheme]}\n`;
        }
        
        // 字体风格
        styleDesc += `- 字体：${this.getTypographyDescription(typography)}\n`;
        
        return styleDesc + '\n';
    }

    /**
     * 构建布局描述
     */
    buildLayoutDescription(template) {
        const style = template.style || {};
        const layout = style.layout || 'vertical';
        
        let layoutDesc = '布局要求：\n';
        
        if (this.layoutStyles[layout]) {
            layoutDesc += `- ${this.layoutStyles[layout]}\n`;
        }
        
        // 添加元素要求
        if (style.elements && style.elements.length > 0) {
            layoutDesc += `- 包含元素：${style.elements.join('、')}\n`;
        }
        
        return layoutDesc + '\n';
    }

    /**
     * 构建内容增强
     */
    buildContentEnhancement(content, template) {
        const category = template.category || 'lifestyle';
        const enhancers = this.contentEnhancers[category] || this.contentEnhancers.lifestyle;
        
        let enhancement = '内容增强：\n';
        enhancement += `- 主题关键词：${enhancers.slice(0, 2).join('、')}\n`;
        enhancement += `- 情感调性：${this.getEmotionalTone(content, category)}\n`;
        enhancement += `- 视觉重点：${this.getVisualFocus(content, template)}\n`;
        
        return enhancement + '\n';
    }

    /**
     * 构建技术要求
     */
    buildTechnicalRequirements(imageStyle, aspectRatio, quality) {
        let techReq = '技术要求：\n';
        techReq += `- 图片风格：${this.getImageStyleDescription(imageStyle)}\n`;
        techReq += `- 画面比例：${aspectRatio}（适合手机浏览）\n`;
        techReq += `- 图片质量：${quality === 'high' ? '高清晰度' : '标准清晰度'}\n`;
        techReq += '- 分辨率：至少1080x1920像素\n';
        
        return techReq + '\n';
    }

    /**
     * 构建平台要求
     */
    buildPlatformRequirements() {
        return `小红书平台要求：
- 符合小红书用户审美偏好
- 适合移动端浏览和分享
- 文字清晰可读，重要信息突出
- 整体设计精美，具有吸引力
- 避免过于商业化的设计元素
- 保持年轻化、时尚化的视觉风格

`;
    }

    /**
     * 获取字体描述
     */
    getTypographyDescription(typography) {
        const descriptions = {
            modern: '现代简洁字体，清晰易读',
            clean: '干净利落字体，专业感强',
            stylish: '时尚字体，具有设计感',
            friendly: '友好亲和字体，温暖感',
            wanderlust: '自由随性字体，轻松感',
            persuasive: '有说服力字体，商务感',
            strong: '有力量感字体，运动感',
            elegant: '优雅字体，文艺气质'
        };
        return descriptions[typography] || descriptions.modern;
    }

    /**
     * 获取情感调性
     */
    getEmotionalTone(content, category) {
        const tones = {
            lifestyle: '温馨、治愈、生活化',
            education: '专业、可信、实用',
            fashion: '时尚、潮流、个性',
            food: '诱人、温暖、享受',
            travel: '自由、美好、向往',
            shopping: '吸引、实用、品质',
            fitness: '活力、健康、积极',
            minimalist: '宁静、简约、深度'
        };
        return tones[category] || tones.lifestyle;
    }

    /**
     * 获取视觉重点
     */
    getVisualFocus(content, template) {
        const category = template.category || 'lifestyle';
        const focuses = {
            lifestyle: '生活场景和情感表达',
            education: '知识要点和逻辑结构',
            fashion: '视觉效果和风格展示',
            food: '食物质感和色彩搭配',
            travel: '风景美感和体验感受',
            shopping: '产品特色和使用价值',
            fitness: '运动状态和健康理念',
            minimalist: '空间感和精神内涵'
        };
        return focuses[category] || focuses.lifestyle;
    }

    /**
     * 获取图片风格描述
     */
    getImageStyleDescription(style) {
        const descriptions = {
            realistic: '写实摄影风格，真实自然',
            illustration: '插画风格，色彩丰富有设计感',
            minimalist: '极简风格，简洁大方',
            artistic: '艺术风格，创意独特'
        };
        return descriptions[style] || descriptions.illustration;
    }

    /**
     * 优化提示词
     */
    optimizePrompt(prompt) {
        // 移除多余的空行
        prompt = prompt.replace(/\n{3,}/g, '\n\n');
        
        // 确保提示词长度适中
        if (prompt.length > 2000) {
            prompt = this.truncatePrompt(prompt, 2000);
        }
        
        // 添加结尾要求
        prompt += '\n请确保生成的图片完全符合以上所有要求，具有高质量和专业水准。';
        
        return prompt.trim();
    }

    /**
     * 截断过长的提示词
     */
    truncatePrompt(prompt, maxLength) {
        if (prompt.length <= maxLength) return prompt;
        
        const sections = prompt.split('\n\n');
        let result = '';
        
        for (const section of sections) {
            if ((result + section).length > maxLength - 100) break;
            result += section + '\n\n';
        }
        
        return result.trim();
    }

    /**
     * 获取后备提示词
     */
    getFallbackPrompt(content) {
        return `创建一个小红书风格的图片，内容：${content}。要求：现代简约设计，温暖色调，竖版布局，适合手机浏览，文字清晰易读，整体美观大方。`;
    }

    /**
     * 分析内容关键词
     */
    analyzeKeywords(content) {
        // 简单的关键词提取（实际项目中可以使用更复杂的NLP算法）
        const keywords = content.match(/[\u4e00-\u9fa5]{2,}/g) || [];
        return [...new Set(keywords)].slice(0, 5);
    }

    /**
     * 生成多样化提示词
     */
    generateVariations(content, template, count = 3) {
        const variations = [];
        const basePrompt = this.generatePrompt(content, template);
        
        variations.push(basePrompt);
        
        // 生成变体
        for (let i = 1; i < count; i++) {
            const variation = this.createVariation(basePrompt, i);
            variations.push(variation);
        }
        
        return variations;
    }

    /**
     * 创建提示词变体
     */
    createVariation(basePrompt, index) {
        const variations = [
            '增加更多创意元素和视觉亮点',
            '强调色彩对比和视觉层次',
            '突出文字排版的设计感'
        ];
        
        if (index <= variations.length) {
            return basePrompt + '\n\n特别要求：' + variations[index - 1];
        }
        
        return basePrompt;
    }
}

// 全局提示词引擎实例
window.promptEngine = new PromptEngine();
