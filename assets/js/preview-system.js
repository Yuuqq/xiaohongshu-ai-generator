/**
 * 实时预览系统
 * 负责管理整个内容生成流程的实时预览功能
 */

class PreviewSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.stepData = {
            content: '',
            tone: '',
            template: null,
            customTags: [],
            optimizedContent: '',
            generationSettings: {}
        };

        // Step4 preview state
        this.previewImages = [];
        this.previewIndex = 0;
        this.previewUpdateTimeout = null;
        this._initialized = false;
        this._step2EventsBound = false;
        this.init();
    }

    /**
     * 初始化预览系统
     */
    init() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        this.bindStepNavigation();
        this.bindInputEvents();
        this.bindToneSelection();
        this.bindTemplateSelection();
        this.bindTagSystem();
        this.bindOptimizationControls();
        this.bindPreviewControls();
        this.updateStepDisplay();
        DEBUG.log('实时预览系统初始化完成');
    }

    /**
     * 绑定步骤导航事件
     */
    bindStepNavigation() {
        // 步骤1导航
        const nextStep1 = document.getElementById('nextStep1');
        if (nextStep1) {
            nextStep1.addEventListener('click', () => this.goToStep(2));
        }

        // 步骤2导航
        const prevStep2 = document.getElementById('prevStep2');
        const nextStep2 = document.getElementById('nextStep2');
        if (prevStep2) prevStep2.addEventListener('click', () => this.goToStep(1));
        if (nextStep2) nextStep2.addEventListener('click', () => this.goToStep(3));

        // 步骤3导航
        const prevStep3 = document.getElementById('prevStep3');
        const nextStep3 = document.getElementById('nextStep3');
        if (prevStep3) prevStep3.addEventListener('click', () => this.goToStep(2));
        if (nextStep3) nextStep3.addEventListener('click', () => this.goToStep(4));

        // 步骤4导航
        const prevStep4 = document.getElementById('prevStep4');
        const nextStep4 = document.getElementById('nextStep4');
        if (prevStep4) prevStep4.addEventListener('click', () => this.goToStep(3));
        if (nextStep4) nextStep4.addEventListener('click', () => this.goToStep(5));

        // 步骤5导航
        const prevStep5 = document.getElementById('prevStep5');
        const startOverBtn = document.getElementById('startOverBtn');
        if (prevStep5) prevStep5.addEventListener('click', () => this.goToStep(4));
        if (startOverBtn) startOverBtn.addEventListener('click', () => this.startOver());
    }

    /**
     * 绑定输入事件
     */
    bindInputEvents() {
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            // 初始化时设置当前值
            this.stepData.content = contentInput.value || '';
            DEBUG.log('初始化内容:', this.stepData.content);

            contentInput.addEventListener('input', (e) => {
                this.stepData.content = e.target.value;
                DEBUG.log('输入内容更新:', this.stepData.content);
                this.updateInputStats(e.target.value);
                this.validateStep1();
                this.updateContentPreview();
            });

            contentInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.stepData.content = e.target.value;
                    DEBUG.log('粘贴内容更新:', this.stepData.content);
                    this.updateInputStats(e.target.value);
                    this.validateStep1();
                    this.updateContentPreview();
                }, 10);
            });
        }

        // 清空按钮
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (contentInput) {
                    contentInput.value = '';
                    this.stepData.content = '';
                    this.updateInputStats('');
                    this.validateStep1();
                    this.updateContentPreview();
                }
            });
        }
    }

    /**
     * 绑定口吻选择事件
     */
    bindToneSelection() {
        // 这个方法现在在 bindStep2Events 中处理
        DEBUG.log('口吻选择事件将在步骤2显示时绑定');
    }

    /**
     * 绑定模板选择事件
     */
    bindTemplateSelection() {
        // 监听模板管理器的模板选择事件
        document.addEventListener('templateSelected', (e) => {
            DEBUG.log('收到模板选择事件:', e.detail);
            this.stepData.template = e.detail.template;
            this.validateStep2();
            this.updatePreview();
            DEBUG.log('预览系统：选择模板:', this.stepData.template.name);
        });

        // 模板网格点击事件将在步骤2显示时绑定
        DEBUG.log('模板选择事件将在步骤2显示时绑定');
    }

    /**
     * 绑定标签系统事件
     */
    bindTagSystem() {
        const customTagInput = document.getElementById('customTagInput');
        const addTagBtn = document.getElementById('addTagBtn');
        const tagsContainer = document.getElementById('tagsContainer');

        // 添加自定义标签
        const addTag = () => {
            const tagText = customTagInput.value.trim();
            if (tagText && !this.stepData.customTags.includes(tagText)) {
                this.stepData.customTags.push(tagText);
                this.renderTags();
                customTagInput.value = '';
                this.updatePreview();
            }
        };

        if (addTagBtn) {
            addTagBtn.addEventListener('click', addTag);
        }

        if (customTagInput) {
            customTagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                }
            });
        }

        // 建议标签点击
        const suggestedTags = document.querySelectorAll('.suggested-tag');
        suggestedTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const tagText = tag.dataset.tag;
                if (!this.stepData.customTags.includes(tagText)) {
                    this.stepData.customTags.push(tagText);
                    this.renderTags();
                    this.updatePreview();
                }
            });
        });
    }

    /**
     * 绑定优化控制事件
     */
    bindOptimizationControls() {
        // 优化按钮的事件处理由 ContentOptimizer 负责，这里不重复绑定
        const acceptOptimizedBtn = document.getElementById('acceptOptimizedBtn');
        const regenerateBtn = document.getElementById('regenerateBtn');
        const editOptimizedBtn = document.getElementById('editOptimizedBtn');

        if (acceptOptimizedBtn) {
            acceptOptimizedBtn.addEventListener('click', () => this.acceptOptimizedContent());
        }

        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.optimizeContent());
        }

        if (editOptimizedBtn) {
            editOptimizedBtn.addEventListener('click', () => this.editOptimizedContent());
        }
    }

    /**
     * 绑定预览控制事件
     */
    bindPreviewControls() {
        const generatePreviewBtn = document.getElementById('generatePreviewBtn');
        const generateAllBtn = document.getElementById('generateAllBtn');
        const refreshPreviewBtn = document.getElementById('refreshPreviewBtn');
        const previewCard = document.getElementById('livePreviewCard');
        const previewImagesGrid = document.getElementById('previewImagesGrid');

        if (generatePreviewBtn) {
            generatePreviewBtn.addEventListener('click', () => this.generateLivePreview());
        }

        if (generateAllBtn) {
            generateAllBtn.addEventListener('click', () => this.generateAllImages());
        }

        if (refreshPreviewBtn) {
            refreshPreviewBtn.addEventListener('click', () => this.generateLivePreview());
        }

        // 预览卡片：上一张/下一张（多图）
        if (previewCard) {
            previewCard.addEventListener('click', (event) => {
                const prevBtn = event.target.closest?.('.preview-nav-prev');
                const nextBtn = event.target.closest?.('.preview-nav-next');
                if (prevBtn) {
                    this.shiftPreviewIndex(-1);
                    return;
                }
                if (nextBtn) {
                    this.shiftPreviewIndex(1);
                }
            });
        }

        // 网格点击：切换大预览
        if (previewImagesGrid) {
            previewImagesGrid.addEventListener('click', (event) => {
                if (event.target.closest?.('.preview-download-btn')) {
                    return;
                }
                const item = event.target.closest?.('.preview-image-item');
                if (!item) return;
                const idx = Number(item.dataset.previewIndex);
                if (Number.isFinite(idx)) {
                    this.setPreviewIndex(idx);
                }
            });
        }

        // 生成设置变化时更新预览
        const settingsInputs = ['imageCount', 'imageStyle', 'aspectRatio', 'quality'];
        settingsInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.stepData.generationSettings[id] = element.value;
                    this.updatePreview();
                });
            }
        });
    }

    setPreviewImages(images = [], index = 0) {
        this.previewImages = Array.isArray(images) ? images : [];
        this.previewIndex = 0;
        this.setPreviewIndex(index);
    }

    setPreviewIndex(index = 0) {
        const total = this.previewImages.length;
        if (total === 0) {
            this.previewIndex = 0;
            this.renderLivePreviewCard(null);
            return;
        }

        const nextIndex = Math.max(0, Math.min(total - 1, Number(index) || 0));
        this.previewIndex = nextIndex;
        this.renderLivePreviewCard(this.previewImages[this.previewIndex]);
    }

    shiftPreviewIndex(delta = 0) {
        const total = this.previewImages.length;
        if (total <= 1) return;
        const next = (this.previewIndex + (Number(delta) || 0) + total) % total;
        this.setPreviewIndex(next);
    }

    renderLivePreviewCard(image) {
        const previewCard = document.getElementById('livePreviewCard');
        if (!previewCard) return;

        if (!image) {
            previewCard.classList.remove('has-image');
            previewCard.innerHTML = '<div class="preview-placeholder">点击生成预览查看效果</div>';
            return;
        }

        previewCard.classList.add('has-image');
        const total = this.previewImages.length;
        const showNav = total > 1;
        const counter = showNav ? `${this.previewIndex + 1}/${total}` : '';

        previewCard.innerHTML = `
            <div class="preview-card-media">
                <img src="${image.url}" alt="预览图片" class="preview-card-image" loading="lazy">
            </div>
            ${showNav ? `
                <div class="preview-card-hud" aria-hidden="true">
                    <button class="preview-nav-btn preview-nav-prev" title="上一张" type="button">
                        <span class="material-icons">chevron_left</span>
                    </button>
                    <div class="preview-counter">${counter}</div>
                    <button class="preview-nav-btn preview-nav-next" title="下一张" type="button">
                        <span class="material-icons">chevron_right</span>
                    </button>
                </div>
            ` : ''}
        `;
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(step) {
        if (step < 1 || step > this.totalSteps) return;

        // 验证当前步骤是否可以继续
        if (!this.canProceedFromStep(this.currentStep, step)) {
            return;
        }

        // 隐藏当前步骤内容
        const currentStepElement = document.querySelector(`.step-content[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.style.display = 'none';
            DEBUG.log(`隐藏步骤 ${this.currentStep} 内容`);
        } else {
            DEBUG.warn(`未找到步骤 ${this.currentStep} 的内容元素`);
        }

        // 显示目标步骤内容
        const targetStepElement = document.querySelector(`.step-content[data-step="${step}"]`);
        if (targetStepElement) {
            targetStepElement.style.display = 'block';
            targetStepElement.classList.add('fade-in');
            DEBUG.log(`显示步骤 ${step} 内容`);
        } else {
            DEBUG.warn(`未找到步骤 ${step} 的内容元素`);
        }

        this.currentStep = step;
        this.updateStepDisplay();
        this.updateStepStatus();

        // 当进入步骤2时，绑定相关事件
        if (step === 2) {
            setTimeout(() => {
                this.bindStep2Events();
            }, 100);
        }

        // 当进入步骤3时，显示原始内容
        if (step === 3) {
            setTimeout(() => {
                this.initializeStep3();
            }, 100);
        }

        // 当进入步骤4时，进行内容分析
        if (step === 4) {
            setTimeout(() => {
                this.initializeStep4();
            }, 100);
        }

        // 当进入步骤5时，初始化导出页面
        if (step === 5) {
            setTimeout(() => {
                this.initializeExportPage();
            }, 100);
        }

        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });

        DEBUG.log(`跳转到步骤 ${step}`);
    }

    /**
     * 检查是否可以从当前步骤继续
     */
    canProceedFromStep(currentStep, targetStep) {
        if (targetStep <= currentStep) return true; // 可以回退

        DEBUG.log('检查步骤跳转:', {
            currentStep,
            targetStep,
            stepData: this.stepData
        });

        switch (currentStep) {
            case 1:
                DEBUG.log('验证步骤1内容:', this.stepData.content, '长度:', this.stepData.content.length);
                if (!this.stepData.content.trim()) {
                    this.showStepError('请先输入内容');
                    return false;
                }
                break;
            case 2:
                if (!this.stepData.tone || !this.stepData.template) {
                    this.showStepError('请选择口吻和模板');
                    return false;
                }
                break;
            case 3:
                if (!this.stepData.optimizedContent) {
                    this.showStepError('请先优化内容');
                    return false;
                }
                break;
            case 4:
                // 步骤4可以直接跳转到步骤5
                break;
        }
        return true;
    }

    /**
     * 更新步骤显示
     */
    updateStepDisplay() {
        const steps = document.querySelectorAll('.progress-steps .step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
            } else if (stepNumber < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }

    /**
     * 更新步骤状态
     */
    updateStepStatus() {
        const statusElements = {
            1: document.getElementById('inputStatus'),
            2: document.getElementById('styleStatus'),
            3: document.getElementById('optimizationStatus'),
            4: document.getElementById('previewStatus'),
            5: document.getElementById('exportStatus')
        };

        Object.keys(statusElements).forEach(step => {
            const element = statusElements[step];
            if (element) {
                element.className = 'status-indicator';
                
                if (parseInt(step) === this.currentStep) {
                    element.classList.add('active');
                    element.textContent = this.getStepStatusText(parseInt(step), 'active');
                } else if (parseInt(step) < this.currentStep) {
                    element.classList.add('completed');
                    element.textContent = this.getStepStatusText(parseInt(step), 'completed');
                } else {
                    element.textContent = this.getStepStatusText(parseInt(step), 'pending');
                }
            }
        });
    }

    /**
     * 获取步骤状态文本
     */
    getStepStatusText(step, status) {
        const statusTexts = {
            1: { pending: '待输入', active: '输入中', completed: '已完成' },
            2: { pending: '待选择', active: '选择中', completed: '已选择' },
            3: { pending: '待优化', active: '优化中', completed: '已优化' },
            4: { pending: '待生成', active: '生成中', completed: '已生成' },
            5: { pending: '待导出', active: '导出中', completed: '已导出' }
        };
        
        return statusTexts[step]?.[status] || '未知状态';
    }

    /**
     * 更新输入统计
     */
    updateInputStats(content) {
        const charCounter = document.querySelector('.char-counter');
        const wordCounter = document.querySelector('.word-counter');
        const validationStatus = document.getElementById('validationStatus');

        if (charCounter) {
            charCounter.textContent = `${content.length}/1000`;
        }

        if (wordCounter) {
            const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
            wordCounter.textContent = `${wordCount} 词`;
        }

        if (validationStatus) {
            const validation = Utils.validateContent(content);
            validationStatus.className = `validation-status ${validation.valid ? 'valid' : 'invalid'}`;
            validationStatus.textContent = validation.valid ? '✓ 格式正确' : validation.message;
        }
    }

    /**
     * 验证步骤1
     */
    validateStep1() {
        const nextBtn = document.getElementById('nextStep1');
        const isValid = this.stepData.content.trim().length >= 5;
        
        if (nextBtn) {
            nextBtn.disabled = !isValid;
        }
        
        return isValid;
    }

    /**
     * 验证步骤2
     */
    validateStep2() {
        const nextBtn = document.getElementById('nextStep2');
        const isValid = this.stepData.tone && this.stepData.template;

        DEBUG.log('验证步骤2:', {
            tone: this.stepData.tone,
            template: this.stepData.template?.name,
            isValid: isValid
        });

        if (nextBtn) {
            nextBtn.disabled = !isValid;
            DEBUG.log('步骤2按钮状态:', nextBtn.disabled ? '禁用' : '启用');
        } else {
            DEBUG.warn('未找到nextStep2按钮');
        }

        return isValid;
    }

    /**
     * 验证步骤3
     */
    validateStep3() {
        const nextBtn = document.getElementById('nextStep3');
        const isValid = String(this.stepData.optimizedContent || '').trim().length > 0;

        if (nextBtn) {
            nextBtn.disabled = !isValid;
        }

        return isValid;
    }

    /**
     * 更新内容预览
     */
    updateContentPreview() {
        clearTimeout(this.previewUpdateTimeout);
        this.previewUpdateTimeout = setTimeout(() => {
            const contentPreview = document.getElementById('contentPreview');
            if (contentPreview) {
                if (this.stepData.content.trim()) {
                    contentPreview.innerHTML = `
                        <div class="preview-content">
                            ${this.stepData.content.replace(/\n/g, '<br>')}
                        </div>
                    `;
                } else {
                    contentPreview.innerHTML = '<div class="preview-placeholder">请输入内容以查看预览</div>';
                }
            }
        }, 300);
    }

    /**
     * 渲染标签
     */
    renderTags() {
        const tagsContainer = document.getElementById('tagsContainer');
        if (!tagsContainer) return;

        if (this.stepData.customTags.length === 0) {
            tagsContainer.innerHTML = '<div class="preview-placeholder">暂无自定义标签</div>';
            return;
        }

        tagsContainer.innerHTML = this.stepData.customTags.map(tag => `
            <div class="tag-item">
                <span class="tag-text">${tag}</span>
                <button class="tag-remove" data-tag="${tag}">
                    <span class="material-icons" style="font-size: 16px;">close</span>
                </button>
            </div>
        `).join('');

        // 绑定删除事件
        tagsContainer.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const tagToRemove = btn.dataset.tag;
                this.stepData.customTags = this.stepData.customTags.filter(tag => tag !== tagToRemove);
                this.renderTags();
                this.updatePreview();
            });
        });
    }

    /**
     * 显示步骤错误
     */
    showStepError(message) {
        if (window.uiManager) {
            window.uiManager.showToast(message, 'warning');
        }
    }

    /**
     * 更新预览
     */
    updatePreview() {
        // 这里可以添加实时预览更新逻辑
        DEBUG.log('更新预览:', this.stepData);
    }

    /**
     * 初始化步骤3
     */
    initializeStep3() {
        DEBUG.log('初始化步骤3 - 内容优化');

        // 显示原始内容
        const originalContentElement = document.getElementById('originalContent');
        if (originalContentElement && this.stepData.content) {
            originalContentElement.innerHTML = `
                <div class="content-text">${this.stepData.content.replace(/\n/g, '<br>')}</div>
                <div class="content-meta">
                    <span class="content-length">${this.stepData.content.length} 字符</span>
                    <span class="content-words">${this.stepData.content.split(/\s+/).length} 词</span>
                </div>
            `;
            DEBUG.log('原始内容已显示:', this.stepData.content);
        } else {
            DEBUG.warn('未找到原始内容元素或内容为空');
            if (originalContentElement) {
                originalContentElement.innerHTML = '<div class="content-placeholder">未找到原始内容，请返回步骤1重新输入</div>';
            }
        }

        // 清空优化后的内容显示
        const optimizedContentElement = document.getElementById('optimizedContent');
        if (optimizedContentElement) {
            optimizedContentElement.innerHTML = '<div class="optimization-placeholder">点击"AI智能优化"按钮开始优化</div>';
        }

        // 隐藏内容操作按钮
        const contentActions = document.querySelector('.content-actions');
        if (contentActions) {
            contentActions.style.display = 'none';
        }

        // 禁用下一步按钮
        const nextBtn = document.getElementById('nextStep3');
        if (nextBtn) {
            nextBtn.disabled = true;
        }

        // 如果已经有优化内容（例如返回到步骤3），同步按钮状态
        this.validateStep3();

        DEBUG.log('步骤3初始化完成');
    }

    /**
     * 初始化步骤4
     */
    initializeStep4() {
        DEBUG.log('初始化步骤4 - 预览生成');

        // 进行内容分析
        this.performContentAnalysis();

        // 绑定分析相关事件
        this.bindAnalysisEvents();

        DEBUG.log('步骤4初始化完成');
    }

    /**
     * 执行内容分析
     */
    performContentAnalysis() {
        if (!window.contentAnalyzer) {
            DEBUG.warn('内容分析器未初始化');
            return;
        }

        const contentToAnalyze = this.stepData.optimizedContent || this.stepData.content;
        if (!contentToAnalyze) {
            DEBUG.warn('没有内容可供分析');
            return;
        }

        const analysis = window.contentAnalyzer.getSectionSuggestions(contentToAnalyze);
        this.stepData.contentAnalysis = analysis;

        DEBUG.log('内容分析结果:', analysis);

        // 显示分析结果
        this.displayAnalysisResult(analysis);
    }

    /**
     * 显示分析结果
     */
    displayAnalysisResult(analysis) {
        const contentAnalysisPanel = document.getElementById('contentAnalysis');
        const analysisResult = document.getElementById('analysisResult');

        if (!contentAnalysisPanel || !analysisResult) {
            DEBUG.warn('分析结果显示元素未找到');
            return;
        }

        // 显示分析面板
        contentAnalysisPanel.style.display = 'block';

        // 构建分析结果HTML
        let resultHTML = `
            <div class="analysis-summary">
                <div class="analysis-stat">
                    <span class="stat-number">${analysis.imageCount}</span>
                    <span class="stat-label">建议图片数量</span>
                </div>
                <div class="analysis-stat">
                    <span class="stat-number">${analysis.sections.length}</span>
                    <span class="stat-label">检测到段落</span>
                </div>
                <div class="analysis-stat">
                    <span class="stat-number">${analysis.cleanContent.length}</span>
                    <span class="stat-label">字符数</span>
                </div>
            </div>
            <div class="analysis-description">
                <p><strong>分析结果:</strong> ${analysis.analysis}</p>
            </div>
        `;

        if (analysis.sections.length > 0) {
            resultHTML += `
                <div class="sections-preview">
                    <h4>内容分段预览:</h4>
                    <div class="sections-list">
            `;

            analysis.sections.forEach((section, index) => {
                resultHTML += `
                    <div class="section-item">
                        <div class="section-header">
                            <span class="section-number">${index + 1}</span>
                            <span class="section-title">${section.title}</span>
                            <span class="section-length">${section.length}字符</span>
                        </div>
                        <div class="section-preview">${section.content.substring(0, 100)}${section.content.length > 100 ? '...' : ''}</div>
                    </div>
                `;
            });

            resultHTML += `
                    </div>
                </div>
            `;
        }

        if (analysis.suggestions.length > 0) {
            resultHTML += `
                <div class="analysis-suggestions">
                    <h4>建议:</h4>
                    <ul>
            `;

            analysis.suggestions.forEach(suggestion => {
                resultHTML += `<li>${suggestion}</li>`;
            });

            resultHTML += `
                    </ul>
                </div>
            `;
        }

        analysisResult.innerHTML = resultHTML;
    }

    /**
     * 绑定分析相关事件
     */
    bindAnalysisEvents() {
        const useAnalysisBtn = document.getElementById('useAnalysisBtn');
        const manualSettingsBtn = document.getElementById('manualSettingsBtn');

        if (useAnalysisBtn) {
            useAnalysisBtn.addEventListener('click', () => this.useAnalysisSettings());
        }

        if (manualSettingsBtn) {
            manualSettingsBtn.addEventListener('click', () => this.showManualSettings());
        }
    }

    /**
     * 使用分析建议的设置
     */
    useAnalysisSettings() {
        if (!this.stepData.contentAnalysis) {
            DEBUG.warn('没有分析结果可用');
            return;
        }

        const analysis = this.stepData.contentAnalysis;

        // 更新图片数量设置
        const imageCountSelect = document.getElementById('imageCount');
        if (imageCountSelect) {
            // 如果选项中没有建议的数量，添加一个
            const suggestedCount = analysis.imageCount;
            let optionExists = false;

            for (let option of imageCountSelect.options) {
                if (parseInt(option.value) === suggestedCount) {
                    optionExists = true;
                    break;
                }
            }

            if (!optionExists) {
                const newOption = document.createElement('option');
                newOption.value = suggestedCount;
                newOption.textContent = `${suggestedCount}张图片 (智能推荐)`;
                imageCountSelect.appendChild(newOption);
            }

            imageCountSelect.value = suggestedCount;
        }

        // 隐藏分析面板，显示设置面板
        const contentAnalysisPanel = document.getElementById('contentAnalysis');
        const generationSettings = document.getElementById('generationSettings');

        if (contentAnalysisPanel) {
            contentAnalysisPanel.style.display = 'none';
        }
        if (generationSettings) {
            generationSettings.style.display = 'block';
        }

        // 显示提示
        if (window.uiManager) {
            window.uiManager.showToast(`已应用智能分析建议：生成${analysis.imageCount}张图片`, 'success');
        }

        DEBUG.log('已应用智能分析设置');
    }

    /**
     * 显示手动设置
     */
    showManualSettings() {
        const contentAnalysisPanel = document.getElementById('contentAnalysis');
        const generationSettings = document.getElementById('generationSettings');

        if (contentAnalysisPanel) {
            contentAnalysisPanel.style.display = 'none';
        }
        if (generationSettings) {
            generationSettings.style.display = 'block';
        }

        DEBUG.log('切换到手动设置模式');
    }

    /**
     * 优化内容
     */
    async optimizeContent() {
        if (!window.contentOptimizer) {
            this.showStepError('内容优化器未初始化');
            return;
        }

        try {
            const optimizedContent = await window.contentOptimizer.optimizeContent(
                this.stepData.content,
                this.stepData.tone,
                this.stepData.template,
                this.stepData.customTags,
                {
                    enhanceReadability: document.getElementById('enhanceReadability')?.checked,
                    addEmojis: document.getElementById('addEmojis')?.checked,
                    optimizeStructure: document.getElementById('optimizeStructure')?.checked
                }
            );

            this.stepData.optimizedContent = optimizedContent;

            // 启用下一步按钮
            const nextBtn = document.getElementById('nextStep3');
            if (nextBtn) {
                nextBtn.disabled = false;
            }

            DEBUG.log('内容优化完成');
        } catch (error) {
            DEBUG.error('内容优化失败:', error);
            this.showStepError(error.message || '内容优化失败');
        }
    }

    /**
     * 接受优化后的内容
     */
    acceptOptimizedContent() {
        const nextBtn = document.getElementById('nextStep3');
        if (nextBtn) {
            nextBtn.disabled = false;
        }
        DEBUG.log('接受优化后的内容');
    }

    /**
     * 编辑优化后的内容
     */
    editOptimizedContent() {
        DEBUG.log('编辑优化后的内容');
    }

    /**
     * 生成实时预览
     */
    async generateLivePreview() {
        if (!window.visualGenerator) {
            this.showStepError('视觉生成器未初始化');
            return;
        }

        try {
            const previewCard = document.getElementById('livePreviewCard');
            const generateBtn = document.getElementById('generatePreviewBtn');
            const refreshBtn = document.getElementById('refreshPreviewBtn');
            const previewImagesGrid = document.getElementById('previewImagesGrid');
            const generatedImagesPreview = document.getElementById('generatedImagesPreview');

            // 显示加载状态
            if (previewCard) {
                previewCard.classList.add('loading');
                previewCard.innerHTML = '<div class="preview-placeholder">正在生成预览...</div>';
            }

            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> 生成中...';
            }

            // 获取生成设置
            this.stepData.generationSettings = {
                imageCount: parseInt(document.getElementById('imageCount')?.value) || 1,
                imageStyle: document.getElementById('imageStyle')?.value || 'illustration',
                aspectRatio: document.getElementById('aspectRatio')?.value || '9:16',
                quality: document.getElementById('quality')?.value || 'high'
            };

            const contentToUse = this.stepData.optimizedContent || this.stepData.content;
            const startTime = Date.now();

            // 清空旧的生成结果，保证“生成数量”直观一致
            if (window.app?.clearGeneratedImages) {
                window.app.clearGeneratedImages();
            } else if (window.app) {
                window.app.generatedImages = [];
            }

            let generatedImages = [];
            // 优先使用 ImageGenerator 的本地 Canvas 渲染（可复用分段/数量逻辑）
            if (window.imageGenerator?.generateWithVisualGenerator && window.imageGenerator?.processGenerationResults) {
                const settings = {
                    ...this.stepData.generationSettings,
                    template: this.stepData.template,
                    tone: this.stepData.tone,
                    customTags: this.stepData.customTags,
                    useGeminiApi: false,
                    useVisualGenerator: true
                };
                const prompt = window.promptEngine?.generatePrompt(contentToUse, this.stepData.template, settings) ||
                    `创建一个小红书风格的图片，内容：${contentToUse}`;

                const rawResults = await window.imageGenerator.generateWithVisualGenerator(prompt, settings);
                generatedImages = await window.imageGenerator.processGenerationResults(rawResults, contentToUse, this.stepData.template);
            } else {
                // 后备：仅生成 1 张
                const imageData = await window.visualGenerator.generateCard(
                    contentToUse,
                    this.stepData.template,
                    this.stepData.tone,
                    this.stepData.customTags,
                    this.stepData.generationSettings
                );

                const parsedMeta = window.visualGenerator?.parseContent
                    ? window.visualGenerator.parseContent(contentToUse)
                    : { title: '', body: '' };

                const imageInfo = {
                    id: `preview_${Date.now()}_0`,
                    url: imageData.url,
                    blob: imageData.blob,
                    title: `${parsedMeta.title || this.stepData.template.name || '预览图片'}`,
                    template: this.stepData.template.name || '未知模板',
                    content: (parsedMeta.body || contentToUse)
                        .replace(/\s+/g, ' ')
                        .trim()
                        .substring(0, 50) + '...',
                    width: imageData.width || 800,
                    height: imageData.height || 1200,
                    size: imageData.blob?.size || 0,
                    timestamp: new Date().toISOString()
                };

                if (window.app?.addGeneratedImage) {
                    window.app.addGeneratedImage(imageInfo);
                }

                generatedImages = [imageInfo];
            }
 
            // 显示预览（多图：可切换）
            if (previewCard) {
                previewCard.classList.remove('loading');
            }
            this.setPreviewImages(generatedImages, 0);

            // 同步到网格视图（与“批量生成”一致）
            if (previewImagesGrid) {
                previewImagesGrid.innerHTML = '';
                generatedImages.forEach((image, index) => {
                    const imageItem = this.createPreviewImageItem(image, index);
                    previewImagesGrid.appendChild(imageItem);
                });
            }

            if (generatedImagesPreview) {
                generatedImagesPreview.style.display = 'block';
            }

            // 更新统计信息
            const generationTime = Math.round((Date.now() - startTime) / 1000);
            const imageCountElement = document.getElementById('previewImageCount');
            const generationTimeElement = document.getElementById('previewGenerationTime');
            if (imageCountElement) {
                imageCountElement.textContent = generatedImages.length;
            }
            if (generationTimeElement) {
                generationTimeElement.textContent = generationTime;
            }

            // 多图时自动滚动到网格，避免用户误以为只有 1 张
            if (generatedImages.length > 1 && generatedImagesPreview) {
                generatedImagesPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // 启用下一步按钮
            const nextBtn = document.getElementById('nextStep4');
            if (nextBtn) {
                nextBtn.disabled = false;
            }

            // 更新按钮状态
            if (generateBtn) {
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<span class="material-icons">visibility</span> 生成预览';
            }

            if (refreshBtn) {
                refreshBtn.style.display = 'inline-flex';
            }

            if (window.uiManager) {
                window.uiManager.showToast(`预览生成完成：${generatedImages.length}张`, 'success');
            }

            DEBUG.log('实时预览生成完成');
        } catch (error) {
            DEBUG.error('预览生成失败:', error);

            const previewCard = document.getElementById('livePreviewCard');
            if (previewCard) {
                previewCard.classList.remove('loading');
                previewCard.innerHTML = `
                    <div class="preview-error">
                        <span class="material-icons">error</span>
                        <div>预览生成失败</div>
                        <button onclick="window.previewSystem.generateLivePreview()" class="retry-button">重试</button>
                    </div>
                `;
            }

            this.showStepError(error.message || '预览生成失败');
        }
    }

    /**
     * 批量生成图片
     */
    async generateAllImages() {
        if (!window.imageGenerator) {
            this.showStepError('图片生成器未初始化');
            return;
        }

        try {
            const generateAllBtn = document.getElementById('generateAllBtn');
            const previewImagesGrid = document.getElementById('previewImagesGrid');
            const generatedImagesPreview = document.getElementById('generatedImagesPreview');

            // 显示加载状态
            if (generateAllBtn) {
                generateAllBtn.disabled = true;
                generateAllBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> 生成中...';
            }

            // 获取生成设置
            this.stepData.generationSettings = {
                imageCount: parseInt(document.getElementById('imageCount')?.value) || 3,
                imageStyle: document.getElementById('imageStyle')?.value || 'illustration',
                aspectRatio: document.getElementById('aspectRatio')?.value || '9:16',
                quality: document.getElementById('quality')?.value || 'high'
            };

            DEBUG.log('批量生成设置:', this.stepData.generationSettings);

            // 清空旧的生成结果，保证“生成数量”直观一致
            if (window.app?.clearGeneratedImages) {
                window.app.clearGeneratedImages();
            } else if (window.app) {
                window.app.generatedImages = [];
            }

            // 记录开始时间
            const startTime = Date.now();

            // 使用优化后的内容或原始内容
            const contentToUse = this.stepData.optimizedContent || this.stepData.content;

            // 调用图片生成器
            const generatedImages = await window.imageGenerator.generateImages(contentToUse, {
                template: this.stepData.template,
                tone: this.stepData.tone,
                customTags: this.stepData.customTags,
                ...this.stepData.generationSettings
            });

            // 计算生成时间
            const generationTime = Math.round((Date.now() - startTime) / 1000);

            // 显示生成的图片
            if (previewImagesGrid && generatedImages) {
                previewImagesGrid.innerHTML = '';

                generatedImages.forEach((image, index) => {
                    const imageItem = this.createPreviewImageItem(image, index);
                    previewImagesGrid.appendChild(imageItem);
                });

                // 显示图片网格
                if (generatedImagesPreview) {
                    generatedImagesPreview.style.display = 'block';
                }

                // 同步大预览（多图可切换）
                this.setPreviewImages(generatedImages, 0);

                // 更新统计信息
                const imageCountElement = document.getElementById('previewImageCount');
                const generationTimeElement = document.getElementById('previewGenerationTime');

                if (imageCountElement) {
                    imageCountElement.textContent = generatedImages.length;
                }
                if (generationTimeElement) {
                    generationTimeElement.textContent = generationTime;
                }

                // 启用下一步按钮
                const nextBtn = document.getElementById('nextStep4');
                if (nextBtn) {
                    nextBtn.disabled = false;
                }

                DEBUG.log(`成功生成 ${generatedImages.length} 张图片`);
            }

        } catch (error) {
            DEBUG.error('批量生成失败:', error);
            this.showStepError(error.message || '批量生成失败');
        } finally {
            // 恢复按钮状态
            const generateAllBtn = document.getElementById('generateAllBtn');
            if (generateAllBtn) {
                generateAllBtn.disabled = false;
                generateAllBtn.innerHTML = '<span class="material-icons">auto_awesome</span> 批量生成';
            }
        }
    }

    /**
     * 创建预览图片项
     */
    createPreviewImageItem(image, index) {
        const item = document.createElement('div');
        item.className = 'preview-image-item fade-in';
        item.dataset.previewIndex = index;

        item.innerHTML = `
            <div class="preview-image-wrapper">
                <img src="${image.url}" alt="${image.title}" class="preview-image" loading="lazy">
                <div class="preview-image-overlay">
                    <button class="preview-download-btn" data-image-id="${image.id}" title="下载图片">
                        <span class="material-icons">download</span>
                    </button>
                </div>
            </div>
            <div class="preview-image-info">
                <div class="preview-image-title">${image.title}</div>
                <div class="preview-image-meta">${image.width}x${image.height}</div>
            </div>
        `;

        // 绑定下载事件
        const downloadBtn = item.querySelector('.preview-download-btn');
        downloadBtn.addEventListener('click', () => {
            if (window.imageGenerator) {
                window.imageGenerator.downloadImage(image);
            }
        });

        return item;
    }

    /**
     * 初始化导出页面（第五步）
     */
    initializeExportPage() {
        DEBUG.log('初始化导出页面...');

        // 更新统计信息
        this.updateExportStats();

        // 渲染图片网格
        this.renderImagesGrid();

        // 绑定导出相关事件
        this.bindExportEvents();
    }

    /**
     * 更新导出统计信息
     */
    updateExportStats() {
        const images = window.app?.generatedImages || [];
        const imageCount = images.length;
        const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
        const generationTime = this.calculateGenerationTime();

        // 更新图片数量
        const imageCountElement = document.getElementById('totalImages');
        if (imageCountElement) {
            imageCountElement.textContent = imageCount;
        }

        // 更新总大小
        const totalSizeElement = document.getElementById('totalSize');
        if (totalSizeElement) {
            totalSizeElement.textContent = this.formatFileSize(totalSize);
        }

        // 更新生成时间
        const generationTimeElement = document.getElementById('generationTime');
        if (generationTimeElement) {
            generationTimeElement.textContent = generationTime;
        }

        DEBUG.log(`导出统计更新: ${imageCount}张图片, ${this.formatFileSize(totalSize)}, ${generationTime}`);
    }

    /**
     * 渲染图片网格
     */
    renderImagesGrid() {
        const imagesGrid = document.getElementById('imagesGrid');
        if (!imagesGrid) return;

        const images = window.app?.generatedImages || [];

        if (images.length === 0) {
            imagesGrid.innerHTML = `
                <div class="no-images">
                    <span class="material-icons">image_not_supported</span>
                    <p>暂无生成的图片</p>
                    <button onclick="window.previewSystem.goToStep(4)" class="secondary-button">
                        返回生成预览
                    </button>
                </div>
            `;
            return;
        }

        imagesGrid.innerHTML = images.map(image => `
            <div class="image-item" data-image-id="${image.id}">
                <img src="${image.url}" alt="${image.title}" class="image-preview" loading="lazy">
                <div class="image-actions">
                    <div class="image-info">
                        <div class="image-title">${image.title}</div>
                        <div class="image-meta">${this.formatFileSize(image.size)} • ${image.width}x${image.height}</div>
                    </div>
                    <button class="download-button download-single-btn" data-image-id="${image.id}" title="下载此图片">
                        <span class="material-icons">download</span>
                    </button>
                </div>
            </div>
        `).join('');

        // 绑定单张图片下载事件
        imagesGrid.querySelectorAll('.download-single-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const imageId = e.target.closest('.download-single-btn').dataset.imageId;
                this.downloadSingleImage(imageId);
            });
        });
    }

    /**
     * 绑定导出相关事件
     */
    bindExportEvents() {
        // 下载全部按钮
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => this.downloadAllImages());
        }

        // 分享按钮
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareImages());
        }

        // 重新生成按钮
        const regenerateAllBtn = document.getElementById('regenerateAllBtn');
        if (regenerateAllBtn) {
            regenerateAllBtn.addEventListener('click', () => this.regenerateAllImages());
        }
    }

    /**
     * 下载单张图片
     */
    downloadSingleImage(imageId) {
        const images = window.app?.generatedImages || [];
        const image = images.find(img => img.id === imageId);

        if (!image) {
            DEBUG.error('未找到图片:', imageId);
            return;
        }

        try {
            const filename = `xiaohongshu_${image.template.replace(/[^\w]/g, '_')}_${Date.now()}.png`;
            const link = document.createElement('a');
            link.href = image.url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

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
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const filename = `xiaohongshu_${image.template.replace(/[^\w]/g, '_')}_${i + 1}.png`;

                const link = document.createElement('a');
                link.href = image.url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

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
     * 分享图片
     */
    shareImages() {
        if (navigator.share) {
            // 使用Web Share API（如果支持）
            navigator.share({
                title: '小红书AI生成图片',
                text: '我用AI生成了这些小红书风格的图片！',
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href).then(() => {
                if (window.uiManager) {
                    window.uiManager.showToast('链接已复制到剪贴板', 'success');
                }
            });
        }
    }

    /**
     * 重新生成所有图片
     */
    regenerateAllImages() {
        // 清空当前图片
        if (window.app) {
            window.app.generatedImages = [];
        }

        // 返回第四步重新生成
        this.goToStep(4);

        if (window.uiManager) {
            window.uiManager.showToast('已清空图片，请重新生成', 'info');
        }
    }

    /**
     * 计算生成时间
     */
    calculateGenerationTime() {
        // 这里可以根据实际情况计算，暂时返回模拟值
        return '3s';
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 绑定步骤2的事件
     */
    bindStep2Events() {
        if (this._step2EventsBound) {
            this.validateStep2();
            return;
        }

        DEBUG.log('绑定步骤2事件...');
        this._step2EventsBound = true;

        // 绑定口吻选择
        const toneGrid = document.getElementById('toneGrid');
        if (toneGrid) {
            DEBUG.log('找到口吻网格，绑定事件');
            toneGrid.addEventListener('click', (e) => {
                const toneCard = e.target.closest('.tone-card');
                if (toneCard) {
                    DEBUG.log('点击口吻卡片:', toneCard.dataset.tone);

                    // 移除之前的选中状态
                    toneGrid.querySelectorAll('.tone-card').forEach(card => {
                        card.classList.remove('selected');
                    });

                    // 添加新的选中状态
                    toneCard.classList.add('selected');
                    this.stepData.tone = toneCard.dataset.tone;

                    this.validateStep2();
                    this.updatePreview();

                    DEBUG.log('预览系统：选择口吻:', this.stepData.tone);
                }
            });
        } else {
            DEBUG.warn('未找到口吻网格元素');
        }

        // 绑定模板选择
        const templateGrid = document.getElementById('templateGrid');
        if (templateGrid) {
            DEBUG.log('找到模板网格，绑定事件');
            if (window.templateManager && typeof window.templateManager.selectTemplate === 'function') {
                // 确保模板已渲染，并复用 templateManager 自身的点击处理
                window.templateManager.templateGrid = templateGrid;

                if (!templateGrid.children.length || templateGrid.children.length === 0) {
                    DEBUG.log('模板网格为空，触发模板渲染');
                    const rendered = window.templateManager.forceRender();
                    if (!rendered) {
                        DEBUG.warn('模板渲染失败，使用默认模板');
                        window.templateManager.templates = window.templateManager.getDefaultTemplates();
                        window.templateManager.forceRender();
                    }
                }

                // 同步当前已选模板，保证步骤2状态与生成器一致
                this.stepData.template = window.templateManager.getSelectedTemplate() || this.stepData.template;
                this.validateStep2();
            } else {
                // 后备逻辑：直接在预览系统中维护模板选择
                templateGrid.addEventListener('click', (e) => {
                    const templateCard = e.target.closest('.template-card');
                    if (!templateCard) return;

                    templateGrid.querySelectorAll('.template-card').forEach(card => {
                        card.classList.remove('selected');
                    });
                    templateCard.classList.add('selected');
                    this.validateStep2();
                    this.updatePreview();
                });
            }
        } else {
            DEBUG.warn('未找到模板网格元素');
        }
    }

    /**
     * 重新开始
     */
    startOver() {
        this.stepData = {
            content: '',
            tone: '',
            template: null,
            customTags: [],
            optimizedContent: '',
            generationSettings: {}
        };
        
        // 清空输入
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            contentInput.value = '';
        }
        
        // 重置选择
        document.querySelectorAll('.tone-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        
        this.renderTags();
        this.goToStep(1);
        
        if (window.uiManager) {
            window.uiManager.showToast('已重新开始', 'info');
        }
    }

    /**
     * 获取当前步骤数据
     */
    getStepData() {
        return { ...this.stepData };
    }

    /**
     * 设置步骤数据
     */
    setStepData(data) {
        this.stepData = { ...this.stepData, ...data };

        if (!data || typeof data !== 'object') {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(data, 'optimizedContent')) {
            this.validateStep3();
        }
    }
}

// 全局预览系统实例
window.previewSystem = new PreviewSystem();
