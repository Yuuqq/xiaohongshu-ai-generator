/**
 * Gemini API图片生成器
 * 负责调用Google Gemini API生成图片
 */

class ImageGenerator {
    constructor() {
        this.apiKey = '';
        this.isGenerating = false;
        this.generationQueue = [];
        this.maxRetries = 3;
        this.retryDelay = 2000;

        this.apiBase = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.textModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest'];
        this.imageModels = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];
    }

    /**
     * 设置API密钥
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        DEBUG.log('API密钥已设置');
    }

    /**
     * 验证API密钥
     */
    async validateApiKey(apiKey = null) {
        const keyToValidate = apiKey || this.apiKey;
        
        if (!keyToValidate) {
            throw new Error('API密钥不能为空');
        }

        const validation = Utils.validateApiKey(keyToValidate);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        try {
            // 发送测试请求验证API密钥
            const response = await this.makeApiRequest(`${this.apiBase}/${this.textModels[0]}:generateContent`, {
                contents: [{
                    parts: [{ text: 'Hello' }]
                }],
                generationConfig: {
                    maxOutputTokens: 16,
                    temperature: 0
                }
            }, keyToValidate);

            return !!response?.candidates?.length;
        } catch (error) {
            DEBUG.error('API密钥验证失败:', error);
            return false;
        }
    }

    /**
     * 生成图片
     */
    async generateImages(content, options = {}) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请稍候');
        }

        try {
            this.isGenerating = true;
            
            // 验证输入
            this.validateInput(content);
            
            // 获取当前模板
            const template = options.template || window.templateManager?.getSelectedTemplate();
            if (!template) {
                throw new Error('请先选择一个模板');
            }

            // 获取生成设置
            const settings = this.getGenerationSettings(options);

            // 未配置 API Key 时，自动切换到本地生成（高级生成器/模拟生成）
            if (!this.apiKey && settings.useGeminiApi !== false) {
                settings.useGeminiApi = false;
                if (window.uiManager) {
                    window.uiManager.showToast('未配置 API 密钥，已切换本地生成', 'warning', 4500);
                }
            }
            
            // 显示加载界面
            if (window.uiManager) {
                window.uiManager.showLoading('AI正在创作中...');
                window.uiManager.updateProgress(10, '正在生成提示词...');
            }

            // 生成优化的提示词
            const prompt = window.promptEngine?.generatePrompt(content, template, settings) || 
                          `创建一个小红书风格的图片，内容：${content}`;

            DEBUG.log('生成的提示词:', prompt);

            // 更新进度
            if (window.uiManager) {
                window.uiManager.updateProgress(30, '正在调用AI生成服务...');
            }

            // 调用API生成图片
            const results = await this.callImageGenerationAPI(prompt, settings);

            // 更新进度
            if (window.uiManager) {
                window.uiManager.updateProgress(80, '正在处理生成结果...');
            }

            // 处理生成结果
            const processedImages = await this.processGenerationResults(results, content, template);

            // 更新进度
            if (window.uiManager) {
                window.uiManager.updateProgress(100, '生成完成！');
            }

            // 显示结果
            this.displayResults(processedImages);

            // 隐藏加载界面
            setTimeout(() => {
                if (window.uiManager) {
                    window.uiManager.hideLoading();
                    window.uiManager.showToast(`成功生成 ${processedImages.length} 张图片`, 'success');
                }
            }, 1000);

            return processedImages;

        } catch (error) {
            DEBUG.error('图片生成失败:', error);
            
            if (window.uiManager) {
                window.uiManager.hideLoading();
                window.uiManager.showToast(error.message || '生成失败，请重试', 'error');
            }
            
            throw error;
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 验证输入内容
     */
    validateInput(content) {
        const validation = Utils.validateContent(content);
        if (!validation.valid) {
            throw new Error(validation.message);
        }
    }

    /**
     * 获取生成设置
     */
    getGenerationSettings(options) {
        const defaultSettings = {
            imageCount: 3,
            imageStyle: 'illustration',
            aspectRatio: '9:16',
            quality: 'high'
        };

        // 从UI获取设置
        const imageCountSelect = document.getElementById('imageCount');
        const imageStyleSelect = document.getElementById('imageStyle');

        if (imageCountSelect) {
            defaultSettings.imageCount = parseInt(imageCountSelect.value) || 3;
        }
        if (imageStyleSelect) {
            defaultSettings.imageStyle = imageStyleSelect.value || 'illustration';
        }

        return { ...defaultSettings, ...options };
    }

    /**
     * 调用图片生成API
     */
    async callImageGenerationAPI(prompt, settings) {
        try {
            // 优先使用 Gemini 图片 API
            if (settings.useGeminiApi !== false) {
                try {
                    return await this.generateWithGeminiImageAPI(prompt, settings);
                } catch (apiError) {
                    DEBUG.warn('Gemini 图片 API 生成失败，回退到本地高级生成器:', apiError);
                    if (window.uiManager) {
                        window.uiManager.showToast('Gemini 图片服务暂时不可用，已自动切换本地生成', 'warning', 5000);
                    }
                }
            }

            // 本地视觉生成器（Canvas）：中文排版更稳定，优先于 Fabric 方案
            if (window.visualGenerator && settings.useVisualGenerator !== false) {
                return await this.generateWithVisualGenerator(prompt, settings);
            }

            // 检查是否有高级图片生成器
            if (window.advancedImageGenerator && settings.useAdvancedGenerator !== false) {
                return await this.generateWithAdvancedGenerator(prompt, settings);
            }

            // 回退到模拟生成
            await this.simulateApiDelay(2000);

            const results = [];
            for (let i = 0; i < settings.imageCount; i++) {
                results.push(await this.generateMockImage(prompt, i + 1, settings));
            }

            return results;
        } catch (error) {
            DEBUG.error('API调用失败:', error);
            throw new Error('图片生成服务暂时不可用，请稍后重试');
        }
    }

    /**
     * 使用 Gemini 图片 API 生成图片
     */
    async generateWithGeminiImageAPI(prompt, settings) {
        const results = [];
        const template = settings.template || window.templateManager?.getSelectedTemplate() || { id: 'xiaohongshu-lifestyle', name: '默认模板', category: 'lifestyle' };
        const tone = settings.tone || 'friendly';
        const sections = window.previewSystem?.stepData?.contentAnalysis?.sections || [];

        const fallbackContent = window.previewSystem?.stepData?.optimizedContent || window.previewSystem?.stepData?.content || prompt;
        const tasks = Array.from({ length: settings.imageCount }, (_, index) => {
            const section = sections[index];
            return {
                content: section?.content || fallbackContent,
                title: section?.title || '',
                index
            };
        });

        for (const task of tasks) {
            const imagePrompt = this.buildGeminiImagePrompt(prompt, task.content, template, tone, settings, task.index, task.title);
            const imageData = await this.requestGeminiImage(imagePrompt, settings);

            results.push({
                url: imageData.url,
                blob: imageData.blob,
                width: imageData.width,
                height: imageData.height,
                prompt: imagePrompt,
                sectionTitle: task.title,
                sectionIndex: task.index,
                variation: task.index + 1
            });

            if (window.uiManager) {
                const progress = Math.round(((task.index + 1) / tasks.length) * 70) + 10;
                window.uiManager.updateProgress(progress, `Gemini 正在生成第 ${task.index + 1} 张图片...`);
            }
        }

        return results;
    }

    /**
     * 构建 Gemini 图片生成提示词
     */
    buildGeminiImagePrompt(basePrompt, content, template, tone, settings, index, sectionTitle = '') {
        const toneDescriptions = {
            friendly: '亲切友好',
            professional: '专业权威',
            playful: '活泼可爱',
            concise: '简洁干练',
            elegant: '优雅文艺',
            trendy: '潮流时尚'
        };

        const variationTips = [
            '强调标题视觉冲击力和封面吸引力',
            '强调正文信息层级与可读性',
            '强调配色细节与背景质感',
            '强调图文对比和留白',
            '强调图标点缀与布局平衡'
        ];

        const variationTip = variationTips[index % variationTips.length];
        const aspectRatio = settings.aspectRatio || '9:16';

        return `你是小红书视觉设计师。请输出一张高质量中文图片。

主题内容：${content}
${sectionTitle ? `小节标题：${sectionTitle}` : ''}
模板：${template.name}（${template.category || 'lifestyle'}）
写作口吻：${toneDescriptions[tone] || '亲切友好'}
画面比例：${aspectRatio}
画面风格：${settings.imageStyle || 'illustration'}
质量要求：${settings.quality === 'high' ? '高清细节' : '标准清晰度'}
变化要求：第 ${index + 1} 张图，${variationTip}

设计要求：
1. 文字全部使用简体中文，保证可读性。
2. 适配移动端竖屏浏览，信息层次清晰。
3. 风格要与模板类型一致，避免千篇一律。
4. 不要出现水印、品牌 Logo、无关英文段落。

补充参考（可择优吸收）：${basePrompt.slice(0, 1200)}`;
    }

    /**
     * 请求 Gemini 图片模型并解析返回图片
     */
    async requestGeminiImage(prompt, settings) {
        let lastError = null;

        for (const model of this.imageModels) {
            try {
                const payload = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseModalities: ['IMAGE', 'TEXT'],
                        temperature: 0.8
                    }
                };

                const response = await this.makeApiRequest(`${this.apiBase}/${model}:generateContent`, payload);
                const imagePart = this.extractImagePart(response);

                if (!imagePart?.data) {
                    throw new Error(`模型 ${model} 未返回图片数据`);
                }

                const mimeType = imagePart.mimeType || 'image/png';
                const blob = this.base64ToBlob(imagePart.data, mimeType);
                const url = URL.createObjectURL(blob);
                const size = await this.measureImageSize(blob);

                return {
                    url,
                    blob,
                    width: size.width,
                    height: size.height
                };
            } catch (error) {
                lastError = error;
                DEBUG.warn(`Gemini 图片模型 ${model} 调用失败:`, error);
            }
        }

        throw lastError || new Error('Gemini 图片模型不可用');
    }

    /**
     * 从 Gemini 响应中提取图片部分
     */
    extractImagePart(response) {
        const candidates = response?.candidates || [];
        for (const candidate of candidates) {
            const parts = candidate?.content?.parts || [];
            for (const part of parts) {
                if (part?.inlineData?.data) {
                    return {
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType
                    };
                }
                if (part?.inline_data?.data) {
                    return {
                        data: part.inline_data.data,
                        mimeType: part.inline_data.mime_type
                    };
                }
            }
        }
        return null;
    }

    /**
     * Base64 转 Blob
     */
    base64ToBlob(base64Data, mimeType = 'image/png') {
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        const chunkSize = 1024;

        for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
            const slice = byteCharacters.slice(offset, offset + chunkSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    }

    /**
     * 测量图片尺寸
     */
    async measureImageSize(blob) {
        return new Promise((resolve) => {
            const probeUrl = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                const size = {
                    width: img.naturalWidth || img.width || 0,
                    height: img.naturalHeight || img.height || 0
                };
                URL.revokeObjectURL(probeUrl);
                resolve(size);
            };

            img.onerror = () => {
                URL.revokeObjectURL(probeUrl);
                resolve({ width: 0, height: 0 });
            };

            img.src = probeUrl;
        });
    }

    /**
     * 将图片风格映射为本地生成器参数
     */
    getLocalStyleOptions(imageStyle = 'illustration') {
        const styleMap = {
            realistic: {
                backgroundStyle: 'solid',
                backgroundPattern: false,
                decorationLevel: 'minimal',
                addWatermark: true
            },
            illustration: {
                backgroundStyle: 'gradient',
                backgroundPattern: true,
                decorationLevel: 'rich',
                addWatermark: true
            },
            minimalist: {
                backgroundStyle: 'solid',
                backgroundPattern: false,
                decorationLevel: 'none',
                addWatermark: true
            },
            artistic: {
                backgroundStyle: 'radial',
                backgroundPattern: true,
                decorationLevel: 'rich',
                addWatermark: true
            }
        };

        return styleMap[imageStyle] || styleMap.illustration;
    }

    /**
     * 使用高级生成器生成图片
     */
    async generateWithAdvancedGenerator(prompt, settings) {
        const results = [];
        const template = settings.template || window.templateManager?.getSelectedTemplate() || { id: 'xiaohongshu-lifestyle' };
        const styleOptions = this.getLocalStyleOptions(settings.imageStyle);

        const contentToUse = window.previewSystem?.stepData?.optimizedContent ||
                           window.previewSystem?.stepData?.content ||
                           prompt;
        const sections = window.previewSystem?.stepData?.contentAnalysis?.sections || [];

        for (let i = 0; i < settings.imageCount; i++) {
            const section = sections[i];
            const sectionContent = section?.content || contentToUse;
            const sectionTitle = section?.title || '';

            try {
                const imageData = await window.advancedImageGenerator.generateImage(
                    sectionContent,
                    template,
                    {
                        aspectRatio: settings.aspectRatio,
                        quality: settings.quality,
                        imageStyle: settings.imageStyle,
                        backgroundStyle: styleOptions.backgroundStyle,
                        backgroundPattern: styleOptions.backgroundPattern,
                        decorationLevel: styleOptions.decorationLevel,
                        addWatermark: styleOptions.addWatermark
                    }
                );

                results.push({
                    url: imageData.url,
                    blob: imageData.blob,
                    width: imageData.width,
                    height: imageData.height,
                    prompt: sectionTitle ? `${sectionTitle}: ${sectionContent.substring(0, 100)}...` : prompt,
                    sectionTitle,
                    sectionIndex: section ? i : undefined,
                    variation: i + 1
                });

                if (window.uiManager) {
                    const progress = Math.round(((i + 1) / settings.imageCount) * 70) + 10;
                    window.uiManager.updateProgress(progress, `正在生成第 ${i + 1} 张图片...`);
                }

            } catch (error) {
                DEBUG.error(`生成第 ${i + 1} 张图片失败:`, error);
                results.push(await this.generateMockImage(prompt, i + 1, settings));
            }
        }

        return results;
    }

    /**
     * 使用本地视觉生成器（Canvas）生成图片（更适配中文排版）
     */
    async generateWithVisualGenerator(prompt, settings) {
        if (!window.visualGenerator) {
            throw new Error('视觉生成器未初始化');
        }

        const results = [];
        const template = settings.template || window.templateManager?.getSelectedTemplate() || { id: 'xiaohongshu-lifestyle', name: '默认模板', category: 'lifestyle' };
        const tone = settings.tone || 'friendly';
        const customTags = Array.isArray(settings.customTags)
            ? settings.customTags
            : (window.previewSystem?.stepData?.customTags || []);
        const sections = window.previewSystem?.stepData?.contentAnalysis?.sections || [];
        const fallbackContent = window.previewSystem?.stepData?.optimizedContent || window.previewSystem?.stepData?.content || prompt;

        const cleanSectionTitle = (rawTitle) => {
            let title = String(rawTitle || '').replace(/\r\n/g, '\n').trim();
            if (!title) return '';

            // 只取首行，避免段落标题带入换行
            if (title.includes('\n')) {
                title = title.split('\n')[0].trim();
            }

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
        };

        const buildCleanContent = (rawText, fallbackTitle = '') => {
            const safeRaw = String(rawText || '').replace(/\r\n/g, '\n').trim();
            if (!safeRaw) return '';

            const parsed = typeof window.visualGenerator.parseContent === 'function'
                ? window.visualGenerator.parseContent(safeRaw)
                : { title: '', kicker: '', body: safeRaw };

            const title = String(parsed?.title || '').trim() || cleanSectionTitle(fallbackTitle);
            const kicker = String(parsed?.kicker || '').trim();
            const body = String(parsed?.body || '').trim();

            // 单行内容时不强行拆标题/正文，避免出现“标题有了但正文空了”的尴尬
            if (!body && safeRaw.split('\n').filter(l => l.trim()).length <= 1) {
                return safeRaw;
            }

            const lines = [];
            if (title) lines.push(`标题：${title}`);
            if (kicker) lines.push(kicker);
            if (body) {
                if (lines.length > 0) lines.push('');
                lines.push(body);
            }
            return lines.join('\n').trim();
        };

        const inheritedTags = (() => {
            try {
                if (typeof window.visualGenerator.extractHashtags === 'function') {
                    return window.visualGenerator.extractHashtags(fallbackContent).tags || [];
                }
            } catch (error) {
                DEBUG.warn('提取全局标签失败:', error);
            }
            return [];
        })();

        const combinedTags = [...customTags, ...inheritedTags];

        const isHashtagOnlyContent = (text) => {
            const raw = String(text || '').replace(/\r\n/g, '\n').trim();
            if (!raw) return true;

            if (typeof window.visualGenerator.extractHashtags === 'function') {
                const extracted = window.visualGenerator.extractHashtags(raw);
                const withoutTags = String(extracted?.text || '').replace(/\s+/g, '').trim();
                const tags = Array.isArray(extracted?.tags) ? extracted.tags : [];
                return tags.length > 0 && withoutTags.length === 0;
            }

            const stripped = raw
                .replace(/#([A-Za-z0-9_\u4e00-\u9fff]+)/g, '')
                .replace(/\s+/g, '')
                .trim();
            return stripped.length === 0 && /#/.test(raw);
        };

        const usableSections = Array.isArray(sections)
            ? sections.filter(section => section?.content && !isHashtagOnlyContent(section.content))
            : [];

        const deriveTitleFromBody = (bodyText) => {
            const firstLine = String(bodyText || '')
                .replace(/\r\n/g, '\n')
                .split('\n')
                .map(l => l.trim())
                .find(Boolean) || '';
            return cleanSectionTitle(firstLine);
        };

        const buildContentWithHeader = (header, bodyText, maxLines = null) => {
            const lines = [];
            const headerTitle = cleanSectionTitle(header?.title) || String(header?.title || '').trim();
            const headerKicker = String(header?.kicker || '').trim();

            if (headerTitle) lines.push(`标题：${headerTitle}`);
            if (headerKicker) lines.push(headerKicker);

            let body = String(bodyText || '').replace(/\r\n/g, '\n').trim();
            if (headerKicker && body.startsWith(headerKicker)) {
                body = body.split('\n').slice(1).join('\n').trim();
            }

            if (typeof maxLines === 'number' && maxLines > 0 && body) {
                const bodyLines = body.split('\n').map(l => l.trim()).filter(Boolean);
                body = bodyLines.slice(0, maxLines).join('\n').trim();
            }

            if (body) {
                if (lines.length > 0) lines.push('');
                lines.push(body);
            }

            return lines.join('\n').trim();
        };

        const buildCoverSummaryBody = (sectionsToSummarize, maxLines = 6) => {
            const collected = [];
            const list = Array.isArray(sectionsToSummarize) ? sectionsToSummarize : [];

            for (const section of list) {
                const raw = String(section?.content || '').replace(/\r\n/g, '\n').trim();
                if (!raw) continue;

                const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
                for (const line of lines) {
                    if (collected.length >= maxLines) break;
                    collected.push(line.length > 46 ? line.slice(0, 46) + '...' : line);
                }

                if (collected.length >= maxLines) break;
            }

            return collected.join('\n').trim();
        };

        // 检测“全局标题区”：第一段只有标题/适合等元信息时，后续卡片复用同一个标题区
        let globalHeader = null;
        let contentSections = usableSections;
        if (usableSections.length > 1 && typeof window.visualGenerator.parseContent === 'function') {
            const firstRaw = String(usableSections[0]?.content || '').replace(/\r\n/g, '\n').trim();
            const normalizedFirstRaw = firstRaw.replace(/^\s*(?:(?:✅|☑️|✔️|👉|💡|🔥|⭐️|⭐|🌟|🟢|🔸|🔹|🔻|🔺|▶︎|▶|→)|[-*•·])\s*/gm, '');
            const firstParsed = window.visualGenerator.parseContent(firstRaw);
            const nonEmptyLines = firstRaw.split('\n').map(l => l.trim()).filter(Boolean);
            const bodyLen = String(firstParsed?.body || '').trim().length;
            const headerSignals = /(?:^|\n)\s*(?:标题|Title)\s*[:：]/i.test(normalizedFirstRaw) ||
                /(?:^|\n)\s*(适合|适用|适用人群|人群|对象|场景|适用于)\s*[:：]/.test(normalizedFirstRaw) ||
                !!String(firstParsed?.kicker || '').trim();

            if (headerSignals && String(firstParsed?.title || '').trim() && bodyLen < 16 && nonEmptyLines.length <= 3) {
                globalHeader = {
                    title: String(firstParsed.title || '').trim(),
                    kicker: String(firstParsed.kicker || '').trim()
                };
                contentSections = usableSections.slice(1);
            }
        }

        const tasks = [];

        if (globalHeader && contentSections.length > 0) {
            // 如果“内容段落”数量足够覆盖 imageCount：每张复用全局标题区，避免封面空白
            if (settings.imageCount <= contentSections.length) {
                for (let index = 0; index < settings.imageCount; index++) {
                    const section = contentSections[index];
                    const rawBody = section?.content || fallbackContent;
                    const sectionTitle = cleanSectionTitle(section?.title) || deriveTitleFromBody(rawBody) || `${template.name} - ${index + 1}`;

                    tasks.push({
                        index,
                        sectionOriginalIndex: usableSections.indexOf(section),
                        sectionTitle,
                        contentToRender: buildContentWithHeader(globalHeader, rawBody)
                    });
                }
            } else {
                // 不足时：保留一张“封面”（标题区 + 摘要），其余按段落生成
                const coverBody = buildCoverSummaryBody(contentSections.slice(0, 2), 6) ||
                    contentSections[0]?.content ||
                    fallbackContent;
                tasks.push({
                    index: 0,
                    sectionOriginalIndex: 0,
                    sectionTitle: cleanSectionTitle(globalHeader.title) || '封面',
                    contentToRender: buildContentWithHeader(globalHeader, coverBody)
                });

                for (let index = 1; index < settings.imageCount; index++) {
                    const section = contentSections[index - 1];
                    const rawBody = section?.content || fallbackContent;
                    const sectionTitle = cleanSectionTitle(section?.title) || deriveTitleFromBody(rawBody) || `${template.name} - ${index + 1}`;

                    tasks.push({
                        index,
                        sectionOriginalIndex: section ? usableSections.indexOf(section) : undefined,
                        sectionTitle,
                        contentToRender: buildContentWithHeader(globalHeader, rawBody)
                    });
                }
            }
        } else {
            for (let index = 0; index < settings.imageCount; index++) {
                const section = usableSections[index] || sections[index];
                const title = section?.title || '';
                const raw = section?.content || fallbackContent;
                const contentToRender = buildCleanContent(raw, title);

                const parsedMeta = typeof window.visualGenerator.parseContent === 'function'
                    ? window.visualGenerator.parseContent(String(contentToRender || '').trim())
                    : { title: cleanSectionTitle(title) };

                tasks.push({
                    index,
                    sectionOriginalIndex: section ? sections.indexOf(section) : undefined,
                    sectionTitle: String(parsedMeta?.title || '').trim() || cleanSectionTitle(title) || `${template.name} - ${index + 1}`,
                    contentToRender
                });
            }
        }

        for (const task of tasks) {
            const imageData = await window.visualGenerator.generateCard(
                task.contentToRender,
                template,
                tone,
                combinedTags,
                settings
            );

            results.push({
                url: imageData.url,
                blob: imageData.blob,
                width: imageData.width,
                height: imageData.height,
                prompt: prompt,
                sectionTitle: task.sectionTitle,
                sectionIndex: typeof task.sectionOriginalIndex === 'number' ? task.sectionOriginalIndex : undefined,
                variation: task.index + 1
            });

            if (window.uiManager) {
                const progress = Math.round(((task.index + 1) / tasks.length) * 70) + 10;
                window.uiManager.updateProgress(progress, `正在生成第 ${task.index + 1} 张图片...`);
            }
        }

        return results;
    }

    /**
     * 生成模拟图片（用于演示）
     */
    async generateMockImage(prompt, index, settings = {}) {
        // 创建一个Canvas来生成示例图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 根据设置确定画布尺寸
        let width = 540, height = 960;
        switch (settings.aspectRatio) {
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

        canvas.width = width;
        canvas.height = height;
        
        // 生成渐变背景
        const gradients = [
            ['#667eea', '#764ba2'],
            ['#4facfe', '#00f2fe'],
            ['#fa709a', '#fee140'],
            ['#ff9a9e', '#fecfef'],
            ['#a8edea', '#fed6e3']
        ];
        
        const gradientColors = gradients[index % gradients.length];
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 添加用户内容文本
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 处理用户内容
        const contentToShow = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt;
        const lines = this.wrapText(ctx, contentToShow, width - 80, 24);

        // 添加标题
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText(`第${index}张图片`, canvas.width / 2, 40);

        // 添加内容文字
        ctx.font = '18px Arial, sans-serif';
        let currentY = 100;
        lines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += 30;
        });

        // 添加装饰元素
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

        // 添加时间戳
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height - 30);
        
        // 转换为Blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve({
                    blob: blob,
                    url: URL.createObjectURL(blob),
                    width: canvas.width,
                    height: canvas.height,
                    prompt: prompt.substring(0, 100) + '...',
                    index: index
                });
            }, 'image/png');
        });
    }

    /**
     * 文字换行处理
     */
    wrapText(ctx, text, maxWidth, fontSize) {
        ctx.font = `${fontSize}px Arial, sans-serif`;
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        // 限制最大行数
        return lines.slice(0, 8);
    }

    /**
     * 模拟API延迟
     */
    async simulateApiDelay(ms) {
        return new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                if (window.uiManager) {
                    window.uiManager.updateProgress(30 + (progress / 100) * 40, '正在生成图片...');
                }
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, ms / 10);
        });
    }

    /**
     * 处理生成结果
     */
    async processGenerationResults(results, content, template) {
        const processedImages = [];

        for (let i = 0; i < results.length; i++) {
            const result = results[i];

            const sectionTitle = String(result.sectionTitle || '').trim();
            const displayTitle = sectionTitle
                ? sectionTitle
                : `${template.name} - ${i + 1}`;
            
            const imageData = {
                id: Utils.generateId('img'),
                url: result.url,
                blob: result.blob,
                title: displayTitle.length > 32 ? displayTitle.slice(0, 32) + '...' : displayTitle,
                prompt: result.prompt,
                template: template.name,
                content: content.substring(0, 50) + '...',
                timestamp: new Date().toISOString(),
                width: result.width,
                height: result.height,
                size: result.blob.size
            };

            processedImages.push(imageData);
            
            // 添加到应用状态
            if (window.app) {
                window.app.addGeneratedImage(imageData);
            }
        }

        return processedImages;
    }

    /**
     * 显示生成结果
     */
    displayResults(images) {
        const imagesGrid = document.getElementById('imagesGrid');
        if (!imagesGrid) return;

        // 清空之前的结果
        imagesGrid.innerHTML = '';

        // 添加新的图片
        images.forEach(image => {
            const imageItem = this.createImageItem(image);
            imagesGrid.appendChild(imageItem);
        });

        // 显示结果区域
        if (window.uiManager) {
            window.uiManager.showResults();
        }
    }

    /**
     * 创建图片项元素
     */
    createImageItem(image) {
        const item = document.createElement('div');
        item.className = 'image-item fade-in';
        
        item.innerHTML = `
            <img src="${image.url}" alt="${image.title}" class="image-preview" loading="lazy">
            <div class="image-actions">
                <div class="image-info">
                    <div class="image-title">${image.title}</div>
                    <div class="image-meta">${Utils.formatFileSize(image.size)} • ${image.width}x${image.height}</div>
                </div>
                <button class="download-button" data-image-id="${image.id}" title="下载图片">
                    <span class="material-icons">download</span>
                </button>
            </div>
        `;

        // 绑定下载事件
        const downloadBtn = item.querySelector('.download-button');
        downloadBtn.addEventListener('click', () => {
            this.downloadImage(image);
        });

        return item;
    }

    /**
     * 下载单张图片
     */
    downloadImage(image) {
        try {
            const filename = Utils.generateFileName(
                `xiaohongshu_${image.template.replace(/[^\w]/g, '_')}`,
                'png'
            );
            
            Utils.downloadFile(image.blob, filename);
            
            if (window.uiManager) {
                window.uiManager.showToast('图片下载成功', 'success');
            }
        } catch (error) {
            DEBUG.error('下载失败:', error);
            if (window.uiManager) {
                window.uiManager.showToast('下载失败，请重试', 'error');
            }
        }
    }

    /**
     * 下载所有图片
     */
    async downloadAllImages() {
        const images = window.app?.generatedImages || [];
        
        if (images.length === 0) {
            if (window.uiManager) {
                window.uiManager.showToast('没有可下载的图片', 'warning');
            }
            return;
        }

        try {
            // 使用JSZip库打包下载（这里简化为逐个下载）
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const filename = Utils.generateFileName(
                    `xiaohongshu_${image.template.replace(/[^\w]/g, '_')}_${i + 1}`,
                    'png'
                );
                
                Utils.downloadFile(image.blob, filename);
                
                // 添加延迟避免浏览器阻止多个下载
                if (i < images.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            if (window.uiManager) {
                window.uiManager.showToast(`成功下载 ${images.length} 张图片`, 'success');
            }
        } catch (error) {
            DEBUG.error('批量下载失败:', error);
            if (window.uiManager) {
                window.uiManager.showToast('批量下载失败，请重试', 'error');
            }
        }
    }

    /**
     * 发起API请求
     */
    async makeApiRequest(url, data, apiKey = null) {
        const key = apiKey || this.apiKey;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': key
            },
            body: JSON.stringify(data)
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseData.error?.message || `API请求失败: ${response.status}`);
        }

        return responseData;
    }

    /**
     * 清空生成结果
     */
    clearResults() {
        const imagesGrid = document.getElementById('imagesGrid');
        if (imagesGrid) {
            imagesGrid.innerHTML = '';
        }

        if (window.app) {
            window.app.clearGeneratedImages();
        }

        if (window.uiManager) {
            window.uiManager.hideResults();
        }
    }
}

// 全局图片生成器实例
window.imageGenerator = new ImageGenerator();
