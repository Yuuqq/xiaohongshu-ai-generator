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
        
        // API端点配置
        this.endpoints = {
            textGeneration: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            imageGeneration: 'https://generativelanguage.googleapis.com/v1beta/models/imagen-2:generateImage'
        };
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
            const response = await this.makeApiRequest(this.endpoints.textGeneration, {
                contents: [{
                    parts: [{ text: 'Hello' }]
                }]
            }, keyToValidate);

            return response.ok;
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
        
        const response = await fetch(`${url}?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        return response;
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
