/**
 * API内容优化引擎
 * 负责调用Gemini API进行智能内容优化和润色
 */

class ContentOptimizer {
    constructor() {
        this.apiKey = '';
        this.isOptimizing = false;
        this.optimizationHistory = [];
        this._initialized = false;
        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.textModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
        
        // 口吻配置
        this.toneConfigs = {
            friendly: {
                name: '亲切友好',
                prompt: '使用温暖亲和的语调，多用"亲爱的"、"小伙伴们"等称呼，语言轻松自然，拉近与读者的距离',
                keywords: ['亲爱的', '小伙伴们', '真的超级', '特别推荐', '分享给大家']
            },
            professional: {
                name: '专业权威',
                prompt: '使用严谨专业的语调，逻辑清晰，用词准确，体现专业性和可信度',
                keywords: ['根据研究', '专业建议', '科学证明', '权威推荐', '经验总结']
            },
            playful: {
                name: '活泼可爱',
                prompt: '使用轻松有趣的语调，多用表情符号，语言活泼，充满青春活力',
                keywords: ['超级棒', '太爱了', '必须安利', '绝绝子', 'yyds']
            },
            concise: {
                name: '简洁干练',
                prompt: '使用简洁明了的语调，言简意赅，直击要点，避免冗余表达',
                keywords: ['重点是', '简单来说', '核心要点', '直接说', '总结一下']
            },
            elegant: {
                name: '优雅文艺',
                prompt: '使用优雅文艺的语调，文字有美感，适当使用修辞手法，体现文艺气质',
                keywords: ['如诗如画', '岁月静好', '温柔时光', '美好生活', '诗意栖居']
            },
            trendy: {
                name: '潮流时尚',
                prompt: '使用时尚潮流的语调，紧跟网络热词，语言年轻化，体现时尚感',
                keywords: ['绝了', '太香了', '爱了爱了', '神仙', '宝藏']
            }
        };

        // 延迟初始化，确保其他依赖已加载
        setTimeout(() => {
            this.init();
        }, 100);
    }

    /**
     * 初始化优化引擎
     */
    init() {
        try {
            this.apiKey = (window.app && typeof window.app.getApiKey === 'function')
                ? window.app.getApiKey()
                : '';

            if (this._initialized) {
                return;
            }
            this._initialized = true;

            this.loadOptimizationHistory();
            this.bindOptimizationEvents();
            DEBUG.log('内容优化引擎初始化完成');
        } catch (error) {
            DEBUG.error('内容优化引擎初始化失败:', error);
            // 即使初始化失败，也要确保实例存在
            this.apiKey = '';
        }
    }

    /**
     * 绑定优化相关事件
     */
    bindOptimizationEvents() {
        // 监听优化按钮点击
        document.addEventListener('click', (e) => {
            if (e.target.id === 'optimizeBtn' || e.target.closest('#optimizeBtn')) {
                this.handleOptimizeClick();
            }
        });
    }

    /**
     * 处理优化按钮点击
     */
    async handleOptimizeClick() {
        const stepData = window.previewSystem?.getStepData();
        if (!stepData) {
            if (window.uiManager) {
                window.uiManager.showToast('请先完成前面的步骤', 'warning');
            }
            return;
        }

        if (!stepData.content || !stepData.tone || !stepData.template) {
            if (window.uiManager) {
                window.uiManager.showToast('请确保已输入内容并选择了口吻和模板', 'warning');
            }
            return;
        }

        try {
            await this.optimizeContent(
                stepData.content,
                stepData.tone,
                stepData.template,
                stepData.customTags || []
            );
        } catch (error) {
            DEBUG.error('优化失败:', error);
        }
    }

    /**
     * 设置API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * 优化内容
     */
    async optimizeContent(originalContent, tone, template, customTags = [], options = {}) {
        DEBUG.log('优化状态检查:', this.isOptimizing);
        if (this.isOptimizing) {
            DEBUG.warn('优化已在进行中，拒绝重复请求');
            throw new Error('正在优化中，请稍候');
        }

        try {
            this.isOptimizing = true;
            
            // 显示优化进度
            this.showOptimizationProgress();

            // 构建优化提示词
            const optimizationPrompt = this.buildOptimizationPrompt(
                originalContent, tone, template, customTags, options
            );

            DEBUG.log('优化提示词:', optimizationPrompt);

            // 调用API进行优化
            const optimizationResult = await this.callOptimizationAPI(optimizationPrompt, {
                originalContent,
                tone,
                template,
                customTags,
                options
            });
            const optimizedContent = optimizationResult.content;

            // 保存优化历史
            this.saveOptimizationHistory(originalContent, optimizedContent, tone, template);

            // 显示优化结果
            this.displayOptimizationResult(optimizedContent, optimizationResult);

            return optimizedContent;

        } catch (error) {
            DEBUG.error('内容优化失败:', error);
            this.showOptimizationError(error.message);
            throw error;
        } finally {
            DEBUG.log('重置优化状态');
            this.isOptimizing = false;
            this.hideOptimizationProgress();
        }
    }

    /**
     * 构建优化提示词
     */
    buildOptimizationPrompt(content, tone, template, customTags, options) {
        const toneConfig = this.toneConfigs[tone] || this.toneConfigs.friendly;
        const templateInfo = template || { name: '通用模板', category: 'general' };

        let prompt = `请帮我优化以下小红书内容，要求：

【原始内容】
${content}

【优化要求】
1. 写作口吻：${toneConfig.name} - ${toneConfig.prompt}
2. 内容类型：${templateInfo.name}（${templateInfo.category}类别）
3. 平台特色：符合小红书平台特点，适合年轻用户阅读和分享

【具体优化方向】`;

        // 添加优化选项
        if (options.enhanceReadability !== false) {
            prompt += '\n- 提升可读性：优化句式结构，使内容更易读懂';
        }

        if (options.addEmojis !== false) {
            prompt += '\n- 添加表情符号：适当添加相关emoji，增加视觉吸引力';
        }

        if (options.optimizeStructure !== false) {
            prompt += '\n- 优化结构：调整段落结构，突出重点信息';
        }

        // 添加自定义标签
        if (customTags.length > 0) {
            prompt += `\n- 融入标签：自然融入这些关键词：${customTags.join('、')}`;
        }

        // 添加口吻关键词建议
        if (toneConfig.keywords.length > 0) {
            prompt += `\n- 语言风格：可以适当使用这些表达：${toneConfig.keywords.join('、')}`;
        }

        prompt += `

【输出要求】
1. 保持原意不变，只优化表达方式
2. 字数控制在原文的80%-120%之间
3. 确保内容真实可信，不夸大宣传
4. 语言自然流畅，符合中文表达习惯
5. 适合小红书平台的内容调性

请直接输出优化后的内容，不需要额外说明：`;

        return prompt;
    }

    /**
     * 调用优化API
     */
    async callOptimizationAPI(prompt, context = {}) {
        const allowLocalFallback = context.options?.allowLocalFallback !== false;

        if (!this.apiKey) {
            if (allowLocalFallback) {
                return this.runLocalFallbackOptimization(prompt, context, '未配置 API 密钥');
            }
            throw new Error('请先配置API密钥');
        }

        try {
            this.updateOptimizationProgress(20, '连接 Gemini 优化模型...');

            let lastError = null;
            for (const model of this.textModels) {
                try {
                    this.updateOptimizationProgress(40, `正在使用 ${model} 优化内容...`);

                    const response = await this.makeGeminiRequest(model, {
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.9,
                            maxOutputTokens: 2048
                        }
                    });

                    const optimizedContent = this.extractTextFromGeminiResponse(response);
                    if (!optimizedContent) {
                        throw new Error(`模型 ${model} 未返回有效文本`);
                    }

                    this.updateOptimizationProgress(100, '优化完成！');
                    return {
                        content: this.normalizeOptimizedText(optimizedContent),
                        source: 'gemini',
                        model
                    };
                } catch (modelError) {
                    lastError = modelError;
                    DEBUG.warn(`内容优化模型 ${model} 调用失败:`, modelError);
                }
            }

            throw lastError || new Error('所有优化模型均不可用');
        } catch (error) {
            DEBUG.error('API调用失败:', error);
            if (allowLocalFallback) {
                return this.runLocalFallbackOptimization(prompt, context, error?.message || 'Gemini 服务暂时不可用');
            }
            throw new Error('内容优化服务暂时不可用，请稍后重试');
        }
    }

    /**
     * Gemini 不可用时的本地优化回退
     */
    async runLocalFallbackOptimization(prompt, context = {}, reason = '') {
        this.updateOptimizationProgress(65, 'Gemini 优化暂不可用，切换本地优化...');
        await new Promise(resolve => setTimeout(resolve, 250));

        const localOptimized = this.generateFallbackOptimization(
            context.originalContent || this.extractOriginalContentFromPrompt(prompt),
            context.tone,
            context.customTags || [],
            context.options || {}
        );

        this.updateOptimizationProgress(100, '本地优化完成！');

        return {
            content: localOptimized,
            source: 'local',
            reason
        };
    }

    /**
     * 从提示词中提取原始内容（回退兜底）
     */
    extractOriginalContentFromPrompt(prompt) {
        const contentMatch = prompt.match(/【原始内容】\n([\s\S]*?)\n\n【优化要求】/);
        return contentMatch ? contentMatch[1].trim() : '';
    }

    /**
     * 生成本地优化结果（无 API 回退）
     */
    generateFallbackOptimization(originalContent, tone, customTags = [], options = {}) {
        const safeOriginal = (originalContent || '').trim();
        if (!safeOriginal) {
            return '这是一份已优化的内容草稿，请补充原始内容后重试。';
        }

        const tonePrefixMap = {
            friendly: '姐妹们，今天把实用经验整理给大家👇',
            professional: '以下是整理后的核心结论：',
            playful: '来啦来啦，重点都帮你标好了✨',
            concise: '直接上重点：',
            elegant: '把这份感受和方法，认真写给你：',
            trendy: '这波真的很能打，重点给你划好了：'
        };

        const toneSuffixMap = {
            friendly: '有问题欢迎评论区交流，我们一起进步～',
            professional: '以上内容可直接按步骤执行。',
            playful: '看到这里记得点赞收藏，回头照着做就行～',
            concise: '按上面执行即可。',
            elegant: '愿你在日常里，也能持续收获确定感。',
            trendy: '先收藏再实操，真的省事。'
        };

        let optimized = safeOriginal
            .replace(/\r\n/g, '\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

        if (options.optimizeStructure !== false) {
            optimized = this.restructureFallbackText(optimized);
        }

        if (options.addEmojis !== false && tone !== 'professional' && tone !== 'concise') {
            optimized = optimized
                .replace(/(^|\n)([^#\n].{6,30})(?=\n|$)/g, '$1🔸$2')
                .replace(/。/g, '。');
        }

        const prefix = tonePrefixMap[tone] || tonePrefixMap.friendly;
        const suffix = toneSuffixMap[tone] || toneSuffixMap.friendly;
        const tags = customTags
            .map(tag => String(tag || '').trim().replace(/^#/, ''))
            .filter(Boolean)
            .slice(0, 6)
            .map(tag => `#${tag}`);

        const finalLines = [prefix, '', optimized, '', suffix];
        if (tags.length > 0) {
            finalLines.push('', tags.join(' '));
        }

        return finalLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }

    /**
     * 本地优化的结构调整
     */
    restructureFallbackText(text) {
        const segments = text
            .split(/\n+/)
            .map(s => s.trim())
            .filter(Boolean);

        if (segments.length >= 2) {
            return segments.join('\n\n');
        }

        const sentences = text
            .split(/(?<=[。！？])/)
            .map(s => s.trim())
            .filter(Boolean);

        if (sentences.length <= 2) {
            return text;
        }

        const grouped = [];
        for (let i = 0; i < sentences.length; i += 2) {
            grouped.push(sentences.slice(i, i + 2).join(''));
        }
        return grouped.join('\n\n');
    }

    /**
     * 调用 Gemini 文本模型
     */
    async makeGeminiRequest(model, payload) {
        const response = await fetch(`${this.apiBase}/${model}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.apiKey
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error?.message || `Gemini 请求失败: ${response.status}`);
        }

        return data;
    }

    /**
     * 从 Gemini 响应中提取文本
     */
    extractTextFromGeminiResponse(response) {
        const candidates = response?.candidates || [];
        for (const candidate of candidates) {
            const parts = candidate?.content?.parts || [];
            const textParts = parts.map(part => part?.text).filter(Boolean);
            if (textParts.length > 0) {
                return textParts.join('\n').trim();
            }
        }
        return '';
    }

    /**
     * 清理优化结果文本
     */
    normalizeOptimizedText(text) {
        return text
            .replace(/^```(?:markdown|text)?/i, '')
            .replace(/```$/i, '')
            .trim();
    }

    /**
     * 模拟优化过程
     */
    async simulateOptimization() {
        const steps = [
            { progress: 20, message: '分析原始内容...' },
            { progress: 40, message: '应用口吻风格...' },
            { progress: 60, message: '优化语言表达...' },
            { progress: 80, message: '调整内容结构...' },
            { progress: 100, message: '优化完成！' }
        ];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, 800));
            this.updateOptimizationProgress(step.progress, step.message);
        }
    }

    /**
     * 生成模拟优化结果
     */
    generateMockOptimization(prompt) {
        // 从提示词中提取原始内容
        const contentMatch = prompt.match(/【原始内容】\n(.*?)\n\n【优化要求】/s);
        const originalContent = contentMatch ? contentMatch[1].trim() : '示例内容';

        // 简单的模拟优化：添加表情符号和优化表达
        let optimized = originalContent;

        // 添加表情符号
        optimized = optimized.replace(/！/g, '！✨');
        optimized = optimized.replace(/。/g, '。💫');

        // 添加小红书风格的开头和结尾
        optimized = `🌟 ${optimized}

📝 以上就是今天的分享啦～
💕 觉得有用的话记得点赞收藏哦！
🔥 有问题欢迎评论区交流～

#小红书分享 #生活美学 #干货推荐`;

        return optimized;
    }

    /**
     * 显示优化进度
     */
    showOptimizationProgress() {
        const optimizeBtn = document.getElementById('optimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.disabled = true;
            optimizeBtn.innerHTML = `
                <span class="material-icons">hourglass_empty</span>
                优化中...
            `;
        }

        // 显示进度条
        const optimizedContent = document.getElementById('optimizedContent');
        if (optimizedContent) {
            optimizedContent.innerHTML = `
                <div class="optimization-progress">
                    <div class="progress-spinner"></div>
                    <div class="progress-text">AI正在优化内容...</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="optimizationProgressFill"></div>
                    </div>
                    <div class="progress-message" id="optimizationProgressMessage">准备中...</div>
                </div>
            `;
        }
    }

    /**
     * 更新优化进度
     */
    updateOptimizationProgress(percentage, message) {
        const progressFill = document.getElementById('optimizationProgressFill');
        const progressMessage = document.getElementById('optimizationProgressMessage');

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (progressMessage) {
            progressMessage.textContent = message;
        }
    }

    /**
     * 隐藏优化进度
     */
    hideOptimizationProgress() {
        const optimizeBtn = document.getElementById('optimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.disabled = false;
            optimizeBtn.innerHTML = `
                <span class="material-icons">psychology</span>
                AI智能优化
            `;
        }
    }

    /**
     * 显示优化结果
     */
    displayOptimizationResult(optimizedContent, meta = {}) {
        const optimizedContentDiv = document.getElementById('optimizedContent');
        const contentActions = document.querySelector('.content-actions');
        const fallbackNote = meta.source === 'local'
            ? '<div style="margin-bottom:10px;padding:8px 10px;border-radius:8px;background:#fff7ed;color:#9a3412;font-size:13px;">Gemini 优化暂不可用，当前结果由本地优化生成。</div>'
            : '';

        if (optimizedContentDiv) {
            optimizedContentDiv.innerHTML = `
                ${fallbackNote}
                <div class="optimized-text">${optimizedContent.replace(/\n/g, '<br>')}</div>
            `;
        }

        if (contentActions) {
            contentActions.style.display = 'flex';
        }

        // 更新预览系统数据
        if (window.previewSystem) {
            window.previewSystem.setStepData({ optimizedContent });
        }

        // 显示成功提示
        if (window.uiManager) {
            if (meta.source === 'local') {
                window.uiManager.showToast('Gemini 暂不可用，已切换本地优化', 'warning', 5000);
            } else {
                window.uiManager.showToast('内容优化完成！', 'success');
            }
        }
    }

    /**
     * 显示优化错误
     */
    showOptimizationError(message) {
        const optimizedContent = document.getElementById('optimizedContent');
        if (optimizedContent) {
            optimizedContent.innerHTML = `
                <div class="optimization-error">
                    <span class="material-icons">error</span>
                    <div class="error-message">${message}</div>
                    <button class="retry-button" onclick="window.contentOptimizer.retryOptimization()">
                        <span class="material-icons">refresh</span>
                        重试
                    </button>
                </div>
            `;
        }

        if (window.uiManager) {
            window.uiManager.showToast(message, 'error');
        }
    }

    /**
     * 重试优化
     */
    async retryOptimization() {
        const stepData = window.previewSystem?.getStepData();
        if (stepData) {
            await this.optimizeContent(
                stepData.content,
                stepData.tone,
                stepData.template,
                stepData.customTags
            );
        }
    }

    /**
     * 保存优化历史
     */
    saveOptimizationHistory(original, optimized, tone, template) {
        const historyItem = {
            id: Utils.generateId('opt'),
            timestamp: new Date().toISOString(),
            original,
            optimized,
            tone,
            template: template?.name || '未知模板',
            wordCount: {
                original: original.trim().split(/\s+/).length,
                optimized: optimized.trim().split(/\s+/).length
            }
        };

        this.optimizationHistory.push(historyItem);
        
        // 保存到本地存储
        Utils.storage.set('optimization_history', this.optimizationHistory.slice(-10)); // 只保留最近10次
    }

    /**
     * 获取优化历史
     */
    getOptimizationHistory() {
        return this.optimizationHistory;
    }

    /**
     * 清空优化历史
     */
    clearOptimizationHistory() {
        this.optimizationHistory = [];
        Utils.storage.remove('optimization_history');
    }

    /**
     * 加载优化历史
     */
    loadOptimizationHistory() {
        const history = Utils.storage.get('optimization_history', []);
        this.optimizationHistory = history;
    }

    /**
     * 获取口吻配置
     */
    getToneConfig(tone) {
        return this.toneConfigs[tone] || this.toneConfigs.friendly;
    }

    /**
     * 获取所有口吻配置
     */
    getAllToneConfigs() {
        return this.toneConfigs;
    }

    /**
     * 分析内容质量
     */
    analyzeContentQuality(content) {
        const analysis = {
            length: content.length,
            wordCount: content.trim().split(/\s+/).length,
            sentences: content.split(/[。！？]/).filter(s => s.trim()).length,
            paragraphs: content.split(/\n\s*\n/).filter(p => p.trim()).length,
            emojiCount: (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length,
            readabilityScore: this.calculateReadabilityScore(content)
        };

        return analysis;
    }

    /**
     * 计算可读性分数
     */
    calculateReadabilityScore(content) {
        const avgSentenceLength = content.length / Math.max(1, content.split(/[。！？]/).length);
        const avgWordLength = content.replace(/\s/g, '').length / Math.max(1, content.trim().split(/\s+/).length);
        
        // 简单的可读性评分算法
        let score = 100;
        
        // 句子长度惩罚
        if (avgSentenceLength > 50) score -= 20;
        else if (avgSentenceLength > 30) score -= 10;
        
        // 词汇复杂度惩罚
        if (avgWordLength > 3) score -= 10;
        
        // 段落结构奖励
        const paragraphCount = content.split(/\n\s*\n/).length;
        if (paragraphCount > 1) score += 10;
        
        return Math.max(0, Math.min(100, score));
    }
}

// 全局内容优化器实例
try {
    window.contentOptimizer = new ContentOptimizer();
    DEBUG.log('ContentOptimizer 实例创建成功');
} catch (error) {
    DEBUG.error('ContentOptimizer 实例创建失败:', error);
    // 创建一个最小的备用实例
    window.contentOptimizer = {
        init: () => DEBUG.log('ContentOptimizer 备用实例初始化'),
        optimizeContent: () => Promise.reject(new Error('ContentOptimizer 未正确初始化'))
    };
}
