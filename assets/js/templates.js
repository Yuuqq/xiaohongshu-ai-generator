/**
 * 模板管理系统
 * 负责加载、管理和渲染小红书风格模板
 */

class TemplateManager {
    constructor() {
        this.templates = [];
        this.selectedTemplate = null;
        this.templateGrid = null;
    }

    /**
     * 初始化模板系统
     */
    async init() {
        try {
            await this.loadTemplates();

            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            this.templateGrid = document.getElementById('templateGrid');
            if (!this.templateGrid) {
                DEBUG.warn('模板网格元素未找到，延迟初始化');
                setTimeout(() => this.delayedInit(), 1000);
                return;
            }

            this.renderTemplates();
            this.bindEvents();
            DEBUG.log('模板系统初始化完成');
        } catch (error) {
            DEBUG.error('模板系统初始化失败:', error);
            this.showError('模板加载失败，请刷新页面重试');
        }
    }

    /**
     * 延迟初始化
     */
    delayedInit() {
        this.templateGrid = document.getElementById('templateGrid');
        if (this.templateGrid) {
            this.renderTemplates();
            this.bindEvents();
            DEBUG.log('模板系统延迟初始化完成');
        } else {
            DEBUG.error('模板网格元素仍未找到');
        }
    }

    /**
     * 强制渲染模板（公共方法）
     */
    forceRender() {
        this.templateGrid = document.getElementById('templateGrid');
        if (this.templateGrid && this.templates && this.templates.length > 0) {
            DEBUG.log('强制渲染模板');
            this.renderTemplates();
            return true;
        }
        return false;
    }

    /**
     * 加载模板数据
     */
    async loadTemplates() {
        try {
            DEBUG.log('开始加载模板...');
            const response = await fetch('./templates/templates-extended.json');
            DEBUG.log('模板文件响应状态:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.templates = data.templates;
            DEBUG.log(`成功加载 ${this.templates.length} 个模板:`, this.templates.map(t => t.name));
        } catch (error) {
            DEBUG.error('加载模板失败:', error);
            DEBUG.log('使用默认模板作为后备');
            // 使用默认模板作为后备
            this.templates = this.getDefaultTemplates();
            DEBUG.log(`加载了 ${this.templates.length} 个默认模板`);
        }
    }

    /**
     * 获取默认模板（后备方案）
     */
    getDefaultTemplates() {
        DEBUG.log('使用默认模板');
        return [
            {
                id: 'default-lifestyle',
                name: '🌸 生活方式',
                description: '适合生活分享、日常记录',
                category: 'lifestyle',
                preview_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                style: {
                    layout: 'vertical',
                    colorScheme: 'warm',
                    typography: 'modern',
                    elements: ['title', 'content', 'tags']
                },
                prompt_template: '创建一个小红书风格的生活方式图片，内容：{content}，温暖色调，现代排版。'
            },
            {
                id: 'default-knowledge',
                name: '📚 知识干货',
                description: '适合知识分享、教程攻略',
                category: 'education',
                preview_gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                style: {
                    layout: 'card',
                    colorScheme: 'professional',
                    typography: 'clean',
                    elements: ['title', 'content', 'steps']
                },
                prompt_template: '创建一个小红书知识卡片，内容：{content}，专业简洁，清晰排版。'
            },
            {
                id: 'default-fashion',
                name: '👗 时尚穿搭',
                description: '适合穿搭分享、美妆教程',
                category: 'fashion',
                preview_gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                style: {
                    layout: 'magazine',
                    colorScheme: 'trendy',
                    typography: 'stylish',
                    elements: ['title', 'content', 'tags']
                },
                prompt_template: '创建一个小红书时尚穿搭图片，内容：{content}，时尚杂志风格。'
            },
            {
                id: 'default-food',
                name: '🍰 美食分享',
                description: '适合美食推荐、菜谱分享',
                category: 'food',
                preview_gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
                style: {
                    layout: 'food-card',
                    colorScheme: 'appetizing',
                    typography: 'friendly',
                    elements: ['title', 'content', 'rating']
                },
                prompt_template: '创建一个小红书美食分享卡片，内容：{content}，温暖的橙红色系，让人有食欲。'
            }
        ];
    }

    /**
     * 渲染模板网格
     */
    renderTemplates() {
        if (!this.templateGrid) {
            DEBUG.warn('模板网格元素不存在，无法渲染模板');
            return;
        }

        DEBUG.log('开始渲染模板，共', this.templates.length, '个模板');
        this.templateGrid.innerHTML = '';

        this.templates.forEach((template, index) => {
            const templateCard = this.createTemplateCard(template);
            this.templateGrid.appendChild(templateCard);
            DEBUG.log(`渲染模板 ${index + 1}:`, template.name);
        });

        // 默认选择第一个模板
        if (this.templates.length > 0) {
            DEBUG.log('默认选择第一个模板:', this.templates[0].name);
            setTimeout(() => {
                this.selectTemplate(this.templates[0].id);
            }, 100);
        }
    }

    /**
     * 创建模板卡片元素
     */
    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;

        card.innerHTML = `
            <div class="template-name">${template.name}</div>
            <div class="template-description">${template.description}</div>
            <div class="template-preview" style="background: ${template.preview_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}">
                <span class="preview-text">${template.name}</span>
            </div>
        `;

        return card;
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        if (!this.templateGrid) return;

        this.templateGrid.addEventListener('click', (e) => {
            const templateCard = e.target.closest('.template-card');
            if (templateCard) {
                const templateId = templateCard.dataset.templateId;
                this.selectTemplate(templateId);
            }
        });
    }

    /**
     * 选择模板
     */
    selectTemplate(templateId) {
        if (!this.templateGrid) {
            DEBUG.warn('模板网格未初始化');
            return;
        }

        // 移除之前的选中状态
        const previousSelected = this.templateGrid.querySelector('.template-card.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // 添加新的选中状态
        const newSelected = this.templateGrid.querySelector(`[data-template-id="${templateId}"]`);
        if (newSelected) {
            newSelected.classList.add('selected');
        }

        // 更新选中的模板
        this.selectedTemplate = this.templates.find(t => t.id === templateId);

        if (this.selectedTemplate) {
            // 触发模板选择事件
            this.onTemplateSelected(this.selectedTemplate);
            DEBUG.log('选择模板:', this.selectedTemplate.name);
        } else {
            DEBUG.warn('未找到模板:', templateId);
        }
    }

    /**
     * 模板选择回调
     */
    onTemplateSelected(template) {
        // 发送自定义事件
        const event = new CustomEvent('templateSelected', {
            detail: { template }
        });
        document.dispatchEvent(event);

        // 更新生成按钮状态
        this.updateGenerateButton();
    }

    /**
     * 获取当前选中的模板
     */
    getSelectedTemplate() {
        return this.selectedTemplate;
    }

    /**
     * 根据模板生成提示词
     */
    generatePrompt(content, template = null) {
        const selectedTemplate = template || this.selectedTemplate;
        if (!selectedTemplate) {
            return `创建一个小红书风格的图片，内容：${content}`;
        }

        return selectedTemplate.prompt_template.replace('{content}', content);
    }

    /**
     * 更新生成按钮状态
     */
    updateGenerateButton() {
        const generateBtn = document.getElementById('generateBtn');
        const contentInput = document.getElementById('contentInput');
        
        if (generateBtn && contentInput) {
            const hasContent = contentInput.value.trim().length > 0;
            const hasTemplate = this.selectedTemplate !== null;
            generateBtn.disabled = !(hasContent && hasTemplate);
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 这里可以集成到全局的通知系统
        DEBUG.error(message);
        
        // 简单的错误显示
        if (this.templateGrid) {
            this.templateGrid.innerHTML = `
                <div class="error-message">
                    <span class="material-icons">error</span>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    /**
     * 获取模板分类
     */
    getCategories() {
        const categories = [...new Set(this.templates.map(t => t.category))];
        return categories;
    }

    /**
     * 按分类筛选模板
     */
    filterByCategory(category) {
        if (category === 'all') {
            this.renderTemplates();
        } else {
            const filteredTemplates = this.templates.filter(t => t.category === category);
            this.renderFilteredTemplates(filteredTemplates);
        }
    }

    /**
     * 渲染筛选后的模板
     */
    renderFilteredTemplates(templates) {
        if (!this.templateGrid) return;

        this.templateGrid.innerHTML = '';

        templates.forEach(template => {
            const templateCard = this.createTemplateCard(template);
            this.templateGrid.appendChild(templateCard);
        });
    }
}

// 全局模板管理器实例
window.templateManager = new TemplateManager();
