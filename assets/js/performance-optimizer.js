/**
 * 性能优化和用户体验增强模块
 * 负责优化应用性能和提升用户体验
 */

class PerformanceOptimizer {
    constructor() {
        this.performanceMetrics = {};
        this.loadingStates = new Map();
        this.debounceTimers = new Map();
        this.intersectionObserver = null;
        this._initialized = false;
        this.init();
    }

    /**
     * 初始化性能优化器
     */
    init() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        this.setupPerformanceMonitoring();
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupMemoryManagement();
        this.setupErrorBoundaries();
        this.setupAccessibility();
        DEBUG.log('性能优化器初始化完成');
    }

    /**
     * 设置性能监控
     */
    setupPerformanceMonitoring() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            this.measurePageLoadPerformance();
        });

        // 监控用户交互性能
        this.setupInteractionMonitoring();

        // 监控内存使用
        this.setupMemoryMonitoring();
    }

    /**
     * 测量页面加载性能
     */
    measurePageLoadPerformance() {
        if (performance.getEntriesByType) {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');

            this.performanceMetrics = {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                timestamp: Date.now()
            };

            DEBUG.log('页面性能指标:', this.performanceMetrics);

            // 如果加载时间过长，显示提示
            if (this.performanceMetrics.loadComplete > 3000) {
                this.showPerformanceWarning();
            }
        }
    }

    /**
     * 设置交互监控
     */
    setupInteractionMonitoring() {
        // 监控按钮点击响应时间
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .clickable')) {
                const startTime = performance.now();
                
                // 使用 requestAnimationFrame 确保在下一帧测量
                requestAnimationFrame(() => {
                    const responseTime = performance.now() - startTime;
                    if (responseTime > 100) {
                        DEBUG.warn(`交互响应时间过长: ${responseTime.toFixed(2)}ms`);
                    }
                });
            }
        });

        // 监控输入延迟
        document.addEventListener('input', this.debounce((e) => {
            const startTime = performance.now();
            requestAnimationFrame(() => {
                const inputDelay = performance.now() - startTime;
                if (inputDelay > 50) {
                    DEBUG.warn(`输入延迟过高: ${inputDelay.toFixed(2)}ms`);
                }
            });
        }, 100));
    }

    /**
     * 设置内存监控
     */
    setupMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                const memoryUsage = {
                    used: memoryInfo.usedJSHeapSize,
                    total: memoryInfo.totalJSHeapSize,
                    limit: memoryInfo.jsHeapSizeLimit,
                    percentage: (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
                };

                // 如果内存使用超过80%，触发清理
                if (memoryUsage.percentage > 80) {
                    this.performMemoryCleanup();
                }
            }, 30000); // 每30秒检查一次
        }
    }

    /**
     * 设置懒加载
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadElement(entry.target);
                        this.intersectionObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // 观察所有懒加载元素
            document.querySelectorAll('[data-lazy]').forEach(el => {
                this.intersectionObserver.observe(el);
            });
        }
    }

    /**
     * 加载懒加载元素
     */
    loadElement(element) {
        const src = element.dataset.lazy;
        if (src) {
            if (element.tagName === 'IMG') {
                element.src = src;
            } else {
                element.style.backgroundImage = `url(${src})`;
            }
            element.removeAttribute('data-lazy');
            element.classList.add('loaded');
        }
    }

    /**
     * 设置图片优化
     */
    setupImageOptimization() {
        // 自动压缩大图片
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.files[0]) {
                const file = e.target.files[0];
                if (file.type.startsWith('image/') && file.size > 1024 * 1024) { // 1MB
                    this.compressImage(file).then(compressedFile => {
                        // 替换原文件
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(compressedFile);
                        e.target.files = dataTransfer.files;
                    });
                }
            }
        });
    }

    /**
     * 压缩图片
     */
    async compressImage(file, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // 计算新尺寸
                const maxWidth = 1920;
                const maxHeight = 1080;
                let { width, height } = img;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // 绘制并压缩
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(resolve, file.type, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * 设置内存管理
     */
    setupMemoryManagement() {
        // 定期清理未使用的对象URL
        setInterval(() => {
            this.cleanupObjectURLs();
        }, 60000); // 每分钟清理一次

        // 页面隐藏时清理资源
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.performMemoryCleanup();
            }
        });
    }

    /**
     * 清理对象URL
     */
    cleanupObjectURLs() {
        // 清理已经不在DOM中的图片的对象URL
        document.querySelectorAll('img[src^="blob:"]').forEach(img => {
            if (!document.body.contains(img)) {
                URL.revokeObjectURL(img.src);
            }
        });
    }

    /**
     * 执行内存清理
     */
    performMemoryCleanup() {
        // 清理生成的图片缓存
        if (window.app && window.app.generatedImages) {
            window.app.generatedImages.forEach(image => {
                if (image.url && image.url.startsWith('blob:')) {
                    URL.revokeObjectURL(image.url);
                }
            });
        }

        // 清理Canvas缓存
        if (window.visualGenerator && window.visualGenerator.canvas) {
            const ctx = window.visualGenerator.ctx;
            ctx.clearRect(0, 0, window.visualGenerator.canvas.width, window.visualGenerator.canvas.height);
        }

        // 强制垃圾回收（如果支持）
        if (window.gc) {
            window.gc();
        }

        DEBUG.log('内存清理完成');
    }

    /**
     * 设置错误边界
     */
    setupErrorBoundaries() {
        // 全局错误处理
        window.addEventListener('error', (e) => {
            this.handleError(e.error, 'JavaScript Error');
        });

        // Promise错误处理
        window.addEventListener('unhandledrejection', (e) => {
            this.handleError(e.reason, 'Unhandled Promise Rejection');
        });

        // 资源加载错误
        window.addEventListener('error', (e) => {
            if (e.target !== window) {
                this.handleResourceError(e.target);
            }
        }, true);
    }

    /**
     * 处理错误
     */
    handleError(error, context) {
        DEBUG.error(`${context}:`, error);

        // 记录错误信息
        const errorInfo = {
            message: error.message || error,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // 保存错误日志
        this.saveErrorLog(errorInfo);

        // 显示用户友好的错误信息
        if (window.uiManager) {
            window.uiManager.showToast('发生了一个错误，我们正在处理中', 'error');
        }
    }

    /**
     * 处理资源加载错误
     */
    handleResourceError(element) {
        if (element.tagName === 'IMG') {
            // 图片加载失败，显示占位图
            element.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWbvueJh+WKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';
        }
    }

    /**
     * 保存错误日志
     */
    saveErrorLog(errorInfo) {
        try {
            const errorLogs = Utils.storage.get('error_logs', []);
            errorLogs.push(errorInfo);
            
            // 只保留最近50条错误日志
            if (errorLogs.length > 50) {
                errorLogs.splice(0, errorLogs.length - 50);
            }
            
            Utils.storage.set('error_logs', errorLogs);
        } catch (e) {
            DEBUG.warn('无法保存错误日志:', e);
        }
    }

    /**
     * 设置无障碍功能
     */
    setupAccessibility() {
        // 键盘导航支持
        this.setupKeyboardNavigation();
        
        // 屏幕阅读器支持
        this.setupScreenReaderSupport();
        
        // 焦点管理
        this.setupFocusManagement();
    }

    /**
     * 设置键盘导航
     */
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Tab键导航增强
            if (e.key === 'Tab') {
                this.highlightFocusableElements();
            }
            
            // 快捷键支持
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.triggerMainAction();
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveCurrentState();
                        break;
                }
            }
        });
    }

    /**
     * 设置屏幕阅读器支持
     */
    setupScreenReaderSupport() {
        // 动态更新aria-live区域
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);

        // 监听状态变化并通知屏幕阅读器
        document.addEventListener('statusChange', (e) => {
            liveRegion.textContent = e.detail.message;
        });
    }

    /**
     * 设置焦点管理
     */
    setupFocusManagement() {
        // 模态框焦点陷阱
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="flex"]');
                if (openModal && window.uiManager) {
                    const modalName = openModal.id.replace('Modal', '');
                    window.uiManager.closeModal(modalName);
                }
            }
        });
    }

    /**
     * 防抖函数
     */
    debounce(func, wait, immediate = false) {
        return (...args) => {
            const later = () => {
                this.debounceTimers.delete(func);
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !this.debounceTimers.has(func);
            clearTimeout(this.debounceTimers.get(func));
            this.debounceTimers.set(func, setTimeout(later, wait));
            
            if (callNow) func(...args);
        };
    }

    /**
     * 显示性能警告
     */
    showPerformanceWarning() {
        if (window.uiManager) {
            window.uiManager.showToast('页面加载较慢，建议检查网络连接', 'warning', 5000);
        }
    }

    /**
     * 高亮可聚焦元素
     */
    highlightFocusableElements() {
        // 为当前聚焦的元素添加高亮样式
        const focusedElement = document.activeElement;
        if (focusedElement && focusedElement !== document.body) {
            focusedElement.classList.add('keyboard-focused');
            
            // 3秒后移除高亮
            setTimeout(() => {
                focusedElement.classList.remove('keyboard-focused');
            }, 3000);
        }
    }

    /**
     * 触发主要操作
     */
    triggerMainAction() {
        const currentStep = window.previewSystem?.currentStep || 1;
        const nextButton = document.querySelector(`#nextStep${currentStep}`);
        
        if (nextButton && !nextButton.disabled) {
            nextButton.click();
        }
    }

    /**
     * 保存当前状态
     */
    saveCurrentState() {
        if (window.previewSystem) {
            const stepData = window.previewSystem.getStepData();
            Utils.storage.set('auto_save_state', {
                stepData,
                currentStep: window.previewSystem.currentStep,
                timestamp: Date.now()
            });
            
            if (window.uiManager) {
                window.uiManager.showToast('状态已自动保存', 'success', 2000);
            }
        }
    }

    /**
     * 恢复保存的状态
     */
    restoreSavedState() {
        const savedState = Utils.storage.get('auto_save_state');
        if (savedState && Date.now() - savedState.timestamp < 24 * 60 * 60 * 1000) { // 24小时内
            if (confirm('检测到未完成的工作，是否恢复？')) {
                if (window.previewSystem) {
                    window.previewSystem.setStepData(savedState.stepData);
                    window.previewSystem.goToStep(savedState.currentStep);
                }
            }
        }
    }

    /**
     * 获取性能指标
     */
    getPerformanceMetrics() {
        return this.performanceMetrics;
    }

    /**
     * 获取错误日志
     */
    getErrorLogs() {
        return Utils.storage.get('error_logs', []);
    }

    /**
     * 清空错误日志
     */
    clearErrorLogs() {
        Utils.storage.remove('error_logs');
    }
}

// 全局性能优化器实例
window.performanceOptimizer = new PerformanceOptimizer();
