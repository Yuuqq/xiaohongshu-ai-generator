/**
 * 小红书AI图片生成器 - 主应用文件
 * 基于Google Gemini API的智能图片生成工具
 */

// 应用配置
const APP_CONFIG = {
    name: '小红书AI图片生成器',
    version: '1.0.0',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    imageApiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    maxImages: 10,
    supportedFormats: ['PNG', 'JPEG', 'WebP'],
    maxContentLength: 1000
};

// 应用状态管理
class AppState {
    constructor() {
        this.apiKey = '';
        this.currentTemplate = null;
        this.generatedImages = [];
        this.isGenerating = false;
        this.settings = {
            imageCount: 3,
            imageStyle: 'illustration',
            aspectRatio: '9:16',
            quality: 'high'
        };
    }

    // 设置API密钥
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        Utils.storage.set('gemini_api_key', apiKey);
    }

    // 获取API密钥
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = Utils.storage.get('gemini_api_key', '');
        }
        return this.apiKey;
    }

    // 更新设置
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        Utils.storage.set('app_settings', this.settings);
    }

    // 加载设置
    loadSettings() {
        const savedSettings = Utils.storage.get('app_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    // 添加生成的图片
    addGeneratedImage(imageData) {
        this.generatedImages = [
            ...this.generatedImages,
            {
                id: Utils.generateId('img'),
                ...imageData,
                timestamp: new Date().toISOString()
            }
        ];
    }

    // 清空生成的图片
    clearGeneratedImages() {
        this.generatedImages = [];
    }

    // 获取应用状态
    getState() {
        return {
            apiKey: this.apiKey,
            currentTemplate: this.currentTemplate,
            generatedImages: this.generatedImages,
            isGenerating: this.isGenerating,
            settings: this.settings
        };
    }
}

// 全局应用实例
const app = new AppState();

// 应用初始化
document.addEventListener('DOMContentLoaded', async function() {
    DEBUG.log(`${APP_CONFIG.name} v${APP_CONFIG.version} 已加载`);

    try {
        await initializeApp();
        DEBUG.log('应用初始化完成');
    } catch (error) {
        DEBUG.error('应用初始化失败:', error);
        if (window.uiManager) {
            window.uiManager.showToast('应用初始化失败，请刷新页面重试', 'error');
        }
    }
});

/**
 * 应用初始化函数
 */
async function initializeApp() {
    // 检查浏览器支持
    const browserSupport = Utils.checkBrowserSupport();
    if (!browserSupport.supported) {
        DEBUG.warn('浏览器功能支持不完整:', browserSupport.missing);
    }

    // 加载应用设置
    app.loadSettings();

    // 初始化各个模块
    await initializeModules();

    // 绑定全局事件
    bindGlobalEvents();

    // 加载保存的设置到UI
    loadSettingsToUI();

    // 显示欢迎信息
    showWelcomeMessage();

    // 尝试恢复保存的状态
    if (window.performanceOptimizer) {
        window.performanceOptimizer.restoreSavedState();
    }

    // 强制初始化关键组件
    setTimeout(() => {
        forceInitializeComponents();
    }, 2000);
}

/**
 * 初始化各个模块
 */
async function initializeModules() {
    const modules = [
        { name: '性能优化器', instance: window.performanceOptimizer },
        { name: 'UI管理器', instance: window.uiManager },
        { name: '模板管理器', instance: window.templateManager },
        { name: '提示词引擎', instance: window.promptEngine },
        { name: '内容优化器', instance: window.contentOptimizer },
        { name: '视觉生成器', instance: window.visualGenerator },
        { name: '预览系统', instance: window.previewSystem }
    ];

    for (const module of modules) {
        try {
            if (module.instance && typeof module.instance.init === 'function') {
                await module.instance.init();
                DEBUG.log(`${module.name} 初始化完成`);
            } else if (module.instance) {
                DEBUG.log(`${module.name} 已加载`);
            } else {
                DEBUG.warn(`${module.name} 未找到`);
            }
        } catch (error) {
            DEBUG.error(`${module.name} 初始化失败:`, error);
        }
    }
}

/**
 * 绑定全局事件
 */
function bindGlobalEvents() {
    // 监听模板选择事件
    document.addEventListener('templateSelected', (e) => {
        app.currentTemplate = e.detail.template;
        DEBUG.log('当前模板:', app.currentTemplate.name);
    });

    // 监听窗口大小变化
    window.addEventListener('resize', Utils.debounce(() => {
        DEBUG.log('窗口大小变化:', window.innerWidth, 'x', window.innerHeight);
    }, 250));

    // 监听在线状态变化
    window.addEventListener('online', () => {
        if (window.uiManager) {
            window.uiManager.showToast('网络连接已恢复', 'success');
        }
    });

    window.addEventListener('offline', () => {
        if (window.uiManager) {
            window.uiManager.showToast('网络连接已断开', 'warning');
        }
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            DEBUG.log('页面隐藏');
        } else {
            DEBUG.log('页面显示');
        }
    });
}

/**
 * 加载设置到UI
 */
function loadSettingsToUI() {
    // 加载API密钥
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        apiKeyInput.value = app.getApiKey();
    }

    // 加载其他设置
    const imageCountSelect = document.getElementById('imageCount');
    const imageStyleSelect = document.getElementById('imageStyle');

    if (imageCountSelect) {
        imageCountSelect.value = app.settings.imageCount;
    }

    if (imageStyleSelect) {
        imageStyleSelect.value = app.settings.imageStyle;
    }
}

/**
 * 显示欢迎信息
 */
function showWelcomeMessage() {
    if (window.uiManager && !Utils.storage.get('welcome_shown')) {
        setTimeout(() => {
            window.uiManager.showToast('欢迎使用小红书AI图片生成器！', 'info', 5000);
            Utils.storage.set('welcome_shown', true);
        }, 1000);
    }
}

/**
 * 强制初始化组件
 */
function forceInitializeComponents() {
    DEBUG.log('开始强制初始化组件...');

    // 确保模板管理器正确初始化
    if (window.templateManager) {
        const templateGrid = document.getElementById('templateGrid');
        if (templateGrid && (!window.templateManager.templates || window.templateManager.templates.length === 0)) {
            DEBUG.log('重新初始化模板管理器...');
            window.templateManager.delayedInit();
        }
    }

    // 确保预览系统正确绑定事件
    if (window.previewSystem) {
        DEBUG.log('检查预览系统状态...');
        const stepData = window.previewSystem.getStepData();
        DEBUG.log('当前步骤数据:', stepData);

        // 如果在步骤2但没有选择模板，尝试自动选择第一个
        if (window.previewSystem.currentStep === 2 && !stepData.template && window.templateManager && window.templateManager.templates) {
            DEBUG.log('自动选择第一个模板...');
            window.templateManager.selectTemplate(window.templateManager.templates[0].id);
        }
    }

    DEBUG.log('强制初始化完成');
}

// 导出全局函数供其他模块使用
window.APP_CONFIG = APP_CONFIG;
window.app = app;

/**
 * 调试信息函数
 */
function openDebugInfo() {
    const debugInfo = {
        '应用状态': app.getState(),
        '当前步骤': window.previewSystem?.currentStep || '未知',
        '步骤数据': window.previewSystem?.getStepData() || {},
        '模板数量': window.templateManager?.templates?.length || 0,
        '模板列表': window.templateManager?.templates?.map(t => t.name) || [],
        '元素检查': {
            'toneGrid': !!document.getElementById('toneGrid'),
            'templateGrid': !!document.getElementById('templateGrid'),
            'nextStep2': !!document.getElementById('nextStep2')
        },
        '时间戳': new Date().toLocaleString()
    };

    DEBUG.log('=== 调试信息 ===');
    DEBUG.log(debugInfo);

    // 显示在弹窗中（使用 textContent 避免 XSS）
    const debugText = JSON.stringify(debugInfo, null, 2);
    const debugWindow = window.open('', '_blank', 'width=600,height=800');
    if (debugWindow) {
        debugWindow.document.write('<html><head><title>调试信息</title></head><body style="font-family:monospace;padding:20px"><h2>调试信息</h2><pre id="dbg" style="background:#f5f5f5;padding:15px;border-radius:5px;overflow:auto"></pre><button onclick="window.close()" style="margin-top:20px;padding:10px 20px">关闭</button></body></html>');
        debugWindow.document.getElementById('dbg').textContent = debugText;
    }
}

// 打开精美卡片测试页面
function openPremiumTest() {
    window.open('test-premium-generator.html', '_blank');
}

// 全局函数
window.openDebugInfo = openDebugInfo;
window.openPremiumTest = openPremiumTest;
