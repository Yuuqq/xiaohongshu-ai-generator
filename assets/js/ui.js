/**
 * UI交互管理系统
 * 负责处理用户界面交互、模态框、通知等
 */

class UIManager {
    constructor() {
        this.modals = new Map();
        this.toasts = [];
        this.init();
    }

    /**
     * 初始化UI管理器
     */
    init() {
        this.initModals();
        this.initToasts();
        this.initInputHandlers();
        this.initButtonHandlers();
        DEBUG.log('UI管理器初始化完成');
    }

    /**
     * 初始化模态框
     */
    initModals() {
        // 设置模态框
        const settingsModal = document.getElementById('settingsModal');
        const helpModal = document.getElementById('helpModal');

        if (settingsModal) {
            this.modals.set('settings', new Modal(settingsModal));
        }
        if (helpModal) {
            this.modals.set('help', new Modal(helpModal));
        }
    }

    /**
     * 初始化Toast通知系统
     */
    initToasts() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.id = 'toastContainer';
            this.toastContainer.className = 'toast-container';
            document.body.appendChild(this.toastContainer);
        }
    }

    /**
     * 初始化输入处理器
     */
    initInputHandlers() {
        const contentInput = document.getElementById('contentInput');
        const charCounter = document.querySelector('.char-counter');
        const clearBtn = document.getElementById('clearBtn');

        if (contentInput && charCounter) {
            contentInput.addEventListener('input', (e) => {
                const length = e.target.value.length;
                const maxLength = e.target.getAttribute('maxlength') || 1000;
                charCounter.textContent = `${length}/${maxLength}`;
                
                // 更新生成按钮状态
                if (window.templateManager) {
                    window.templateManager.updateGenerateButton();
                }
            });

            // 支持Ctrl+Enter快捷键
            contentInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.triggerGenerate();
                }
            });
        }

        if (clearBtn && contentInput) {
            clearBtn.addEventListener('click', () => {
                contentInput.value = '';
                contentInput.dispatchEvent(new Event('input'));
                contentInput.focus();
            });
        }
    }

    /**
     * 初始化按钮处理器
     */
    initButtonHandlers() {
        // 设置按钮
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openModal('settings');
            });
        }

        // 帮助按钮
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.openModal('help');
            });
        }

        // 生成按钮
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.triggerGenerate();
            });
        }

        // 下载全部按钮
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', () => {
                this.downloadAllImages();
            });
        }

        // 保存设置按钮
        const saveSettings = document.getElementById('saveSettings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                this.saveSettings();
            });
        }
    }

    /**
     * 打开模态框
     */
    openModal(modalName) {
        const modal = this.modals.get(modalName);
        if (modal) {
            modal.open();
        }
    }

    /**
     * 关闭模态框
     */
    closeModal(modalName) {
        const modal = this.modals.get(modalName);
        if (modal) {
            modal.close();
        }
    }

    /**
     * 显示Toast通知
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <span class="toast-icon material-icons">${icon}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">
                <span class="material-icons">close</span>
            </button>
        `;

        // 添加关闭事件
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        this.toastContainer.appendChild(toast);
        this.toasts.push(toast);

        // 自动移除
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        return toast;
    }

    /**
     * 获取Toast图标
     */
    getToastIcon(type) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    /**
     * 移除Toast
     */
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'toastSlideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                const index = this.toasts.indexOf(toast);
                if (index > -1) {
                    this.toasts.splice(index, 1);
                }
            }, 300);
        }
    }

    /**
     * 显示加载覆盖层
     */
    showLoading(message = 'AI正在创作中...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingTitle = document.querySelector('.loading-title');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (overlay) {
            if (loadingTitle) loadingTitle.textContent = message;
            if (progressFill) progressFill.style.width = '0%';
            if (progressText) progressText.textContent = '0%';
            
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * 更新加载进度
     */
    updateProgress(percentage, message = null) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingText = document.querySelector('.loading-text');

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}%`;
        }
        if (message && loadingText) {
            loadingText.textContent = message;
        }
    }

    /**
     * 隐藏加载覆盖层
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * 触发图片生成
     */
    async triggerGenerate() {
        const contentInput = document.getElementById('contentInput');
        const content = contentInput?.value.trim();

        if (!content) {
            this.showToast('请输入要生成图片的内容', 'warning');
            contentInput?.focus();
            return;
        }

        if (!window.templateManager?.getSelectedTemplate()) {
            this.showToast('请选择一个模板', 'warning');
            return;
        }

        if (!window.imageGenerator) {
            this.showToast('图片生成器未初始化', 'error');
            return;
        }

        try {
            await window.imageGenerator.generateImages(content);
        } catch (error) {
            DEBUG.error('生成失败:', error);
            this.showToast('生成失败，请检查设置并重试', 'error');
        }
    }

    /**
     * 保存设置
     */
    saveSettings() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const apiKey = apiKeyInput?.value.trim();

        if (!apiKey) {
            this.showToast('请输入API密钥', 'warning');
            return;
        }

        // 保存到本地存储
        localStorage.setItem('gemini_api_key', apiKey);
        
        // 更新生成器配置
        if (window.imageGenerator) {
            window.imageGenerator.setApiKey(apiKey);
        }

        this.showToast('设置已保存', 'success');
        this.closeModal('settings');
    }

    /**
     * 加载保存的设置
     */
    loadSettings() {
        const apiKeyInput = document.getElementById('apiKeyInput');
        const savedApiKey = localStorage.getItem('gemini_api_key');

        if (savedApiKey && apiKeyInput) {
            apiKeyInput.value = savedApiKey;
            
            // 自动配置生成器
            if (window.imageGenerator) {
                window.imageGenerator.setApiKey(savedApiKey);
            }
        }
    }

    /**
     * 下载所有图片
     */
    async downloadAllImages() {
        if (!window.imageGenerator) {
            this.showToast('图片生成器未初始化', 'error');
            return;
        }

        try {
            await window.imageGenerator.downloadAllImages();
        } catch (error) {
            DEBUG.error('下载失败:', error);
            this.showToast('下载失败，请重试', 'error');
        }
    }

    /**
     * 显示结果区域
     */
    showResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /**
     * 隐藏结果区域
     */
    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }
}

/**
 * 模态框类
 */
class Modal {
    constructor(element) {
        this.element = element;
        this.init();
    }

    init() {
        // 绑定关闭事件
        const closeButtons = this.element.querySelectorAll('.close-button, [id^="close"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.close());
        });

        // 点击背景关闭
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        });
    }

    open() {
        this.element.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 聚焦到第一个输入框
        const firstInput = this.element.querySelector('input, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    close() {
        this.element.style.display = 'none';
        document.body.style.overflow = '';
    }

    isOpen() {
        return this.element.style.display === 'flex';
    }
}

// 全局UI管理器实例
window.uiManager = new UIManager();
