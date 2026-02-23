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

        if (!this.apiKey) {
            throw new Error('请先在设置中配置API密钥');
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
                }
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

        const tasks = sections.length > 0
            ? sections.slice(0, settings.imageCount).map((section, index) => ({
                  content: section.content,
                  title: section.title,
                  index
              }))
            : Array.from({ length: settings.imageCount }, (_, index) => ({
                  content: window.previewSystem?.stepData?.optimizedContent || window.previewSystem?.stepData?.content || prompt,
                  title: '',
                  index
              }));

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
     * 使用高级生成器生成图片
     */
    async generateWithAdvancedGenerator(prompt, settings) {
        const results = [];
        const template = settings.template || window.templateManager?.getSelectedTemplate() || { id: 'xiaohongshu-lifestyle' };

        // 如果有内容分析结果，使用分段内容
        if (window.previewSystem?.stepData?.contentAnalysis?.sections?.length > 0) {
            const sections = window.previewSystem.stepData.contentAnalysis.sections;

            for (let i = 0; i < Math.min(settings.imageCount, sections.length); i++) {
                const section = sections[i];
                const sectionContent = section.content;

                try {
                    const imageData = await window.advancedImageGenerator.generateImage(
                        sectionContent,
                        template,
                        {
                            aspectRatio: settings.aspectRatio,
                            quality: settings.quality,
                            backgroundStyle: 'gradient',
                            backgroundPattern: true,
                            addWatermark: true
                        }
                    );

                    results.push({
                        url: imageData.url,
                        blob: imageData.blob,
                        width: imageData.width,
                        height: imageData.height,
                        prompt: `${section.title}: ${sectionContent.substring(0, 100)}...`,
                        sectionTitle: section.title,
                        sectionIndex: i
                    });

                    // 添加进度更新
                    if (window.uiManager) {
                        const progress = Math.round(((i + 1) / settings.imageCount) * 70) + 10;
                        window.uiManager.updateProgress(progress, `正在生成第 ${i + 1} 张图片...`);
                    }

                } catch (error) {
                    DEBUG.error(`生成第 ${i + 1} 张图片失败:`, error);
                    // 如果高级生成失败，回退到模拟生成
                    results.push(await this.generateMockImage(prompt, i + 1, settings));
                }
            }
        } else {
            // 没有分段信息，使用完整内容生成
            const contentToUse = window.previewSystem?.stepData?.optimizedContent ||
                               window.previewSystem?.stepData?.content ||
                               prompt;

            for (let i = 0; i < settings.imageCount; i++) {
                try {
                    const imageData = await window.advancedImageGenerator.generateImage(
                        contentToUse,
                        template,
                        {
                            aspectRatio: settings.aspectRatio,
                            quality: settings.quality,
                            backgroundStyle: 'gradient',
                            addWatermark: true
                        }
                    );

                    results.push({
                        url: imageData.url,
                        blob: imageData.blob,
                        width: imageData.width,
                        height: imageData.height,
                        prompt: prompt,
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
            
            const imageData = {
                id: Utils.generateId('img'),
                url: result.url,
                blob: result.blob,
                title: `${template.name} - ${i + 1}`,
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
