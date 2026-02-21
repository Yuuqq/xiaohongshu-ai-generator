/**
 * 工具函数库
 * 提供通用的工具函数和辅助方法
 */

class Utils {
    /**
     * 防抖函数
     */
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    /**
     * 节流函数
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * 生成唯一ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 格式化文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 格式化日期时间
     */
    static formatDateTime(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    /**
     * 生成文件名
     */
    static generateFileName(prefix = 'xiaohongshu', extension = 'png') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        return `${prefix}_${timestamp}.${extension}`;
    }

    /**
     * 下载文件
     */
    static downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 下载文本文件
     */
    static downloadTextFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        this.downloadFile(blob, filename);
    }

    /**
     * 下载JSON文件
     */
    static downloadJsonFile(data, filename) {
        const content = JSON.stringify(data, null, 2);
        this.downloadTextFile(content, filename, 'application/json');
    }

    /**
     * 复制文本到剪贴板
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    /**
     * 验证API密钥格式
     */
    static validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, message: 'API密钥不能为空' };
        }

        if (apiKey.length < 10) {
            return { valid: false, message: 'API密钥长度不足' };
        }

        // Google API密钥通常以AIza开头
        if (!apiKey.startsWith('AIza')) {
            return { valid: false, message: 'API密钥格式不正确' };
        }

        return { valid: true, message: 'API密钥格式正确' };
    }

    /**
     * 验证文本内容
     */
    static validateContent(content) {
        if (!content || typeof content !== 'string') {
            return { valid: false, message: '内容不能为空' };
        }

        const trimmed = content.trim();
        if (trimmed.length === 0) {
            return { valid: false, message: '内容不能为空' };
        }

        if (trimmed.length < 5) {
            return { valid: false, message: '内容太短，至少需要5个字符' };
        }

        if (trimmed.length > 1000) {
            return { valid: false, message: '内容太长，最多1000个字符' };
        }

        return { valid: true, message: '内容格式正确' };
    }

    /**
     * 清理HTML标签
     */
    static stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /**
     * 转义HTML字符
     */
    static escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * 检查是否为移动设备
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * 检查浏览器支持
     */
    static checkBrowserSupport() {
        const features = {
            fetch: typeof fetch !== 'undefined',
            localStorage: typeof Storage !== 'undefined',
            canvas: !!document.createElement('canvas').getContext,
            webgl: !!document.createElement('canvas').getContext('webgl'),
            clipboard: !!navigator.clipboard,
            serviceWorker: 'serviceWorker' in navigator
        };

        const unsupported = Object.entries(features)
            .filter(([key, supported]) => !supported)
            .map(([key]) => key);

        return {
            supported: unsupported.length === 0,
            missing: unsupported,
            features
        };
    }

    /**
     * 获取设备信息
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }

    /**
     * 本地存储管理
     */
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('存储失败:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('读取失败:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('删除失败:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('清空失败:', e);
                return false;
            }
        }
    };

    /**
     * URL参数处理
     */
    static url = {
        getParams() {
            return new URLSearchParams(window.location.search);
        },

        getParam(name, defaultValue = null) {
            const params = this.getParams();
            return params.get(name) || defaultValue;
        },

        setParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.replaceState({}, '', url);
        },

        removeParam(name) {
            const url = new URL(window.location);
            url.searchParams.delete(name);
            window.history.replaceState({}, '', url);
        }
    };

    /**
     * 错误处理
     */
    static handleError(error, context = '') {
        console.error(`错误 ${context}:`, error);
        
        // 发送错误报告（如果需要）
        if (window.errorReporter) {
            window.errorReporter.report(error, context);
        }

        return {
            message: error.message || '未知错误',
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 性能监控
     */
    static performance = {
        mark(name) {
            if (performance.mark) {
                performance.mark(name);
            }
        },

        measure(name, startMark, endMark) {
            if (performance.measure) {
                performance.measure(name, startMark, endMark);
                const measure = performance.getEntriesByName(name)[0];
                return measure ? measure.duration : 0;
            }
            return 0;
        },

        getMetrics() {
            if (!performance.getEntriesByType) return {};

            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');

            return {
                loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            };
        }
    };
}

// 全局工具函数
window.Utils = Utils;

/**
 * 轻量级调试日志 — 仅在 URL 含 ?debug=1 或 localStorage.debug='1' 时输出
 */
const DEBUG = (function () {
    const enabled = () =>
        new URLSearchParams(window.location.search).get('debug') === '1' ||
        localStorage.getItem('debug') === '1';
    return {
        log: (...args) => { if (enabled()) console.log(...args); },
        warn: (...args) => { if (enabled()) console.warn(...args); },
        error: (...args) => { if (enabled()) console.error(...args); }
    };
})();

window.DEBUG = DEBUG;
