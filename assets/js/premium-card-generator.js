/**
 * 精美卡片生成器
 * 基于用户提供的SVG示例，生成高质量的小红书风格卡片
 */
class PremiumCardGenerator {
    constructor() {
        this.isGenerating = false;
        this.cardTemplates = new Map();
        this.initializeTemplates();
    }

    /**
     * 初始化精美模板
     */
    initializeTemplates() {
        // 技术卡片模板 - 基于用户提供的SVG示例
        this.cardTemplates.set('tech-premium', {
            name: '技术精美卡片',
            description: '适合技术内容的高颜值卡片',
            gradients: {
                background: 'linear-gradient(135deg, #FFD4E5 0%, #AAE0FF 100%)',
                header: 'linear-gradient(135deg, #615DFA 0%, #9C27B0 100%)',
                accent: 'linear-gradient(135deg, #FF6B95 0%, #FFA726 100%)'
            },
            colors: {
                primary: '#615DFA',
                secondary: '#FF6B95',
                accent: '#52BF90',
                warning: '#FFA726',
                text: '#333333',
                textLight: '#666666',
                white: '#FFFFFF'
            },
            fonts: {
                title: "'LXGW WenKai', 'Noto Sans SC', sans-serif",
                content: "'Noto Sans SC', 'PingFang SC', sans-serif",
                data: "'SF Pro Display', 'Helvetica Neue', sans-serif"
            }
        });

        // 生活方式精美模板
        this.cardTemplates.set('lifestyle-premium', {
            name: '生活精美卡片',
            description: '适合生活分享的高颜值卡片',
            gradients: {
                background: 'linear-gradient(135deg, #FFF4F9 0%, #E8F5E8 100%)',
                header: 'linear-gradient(135deg, #FF6B95 0%, #FFB6D9 100%)',
                accent: 'linear-gradient(135deg, #ADFFD6 0%, #52BF90 100%)'
            },
            colors: {
                primary: '#FF6B95',
                secondary: '#52BF90',
                accent: '#FFA726',
                text: '#333333',
                textLight: '#666666',
                white: '#FFFFFF'
            },
            fonts: {
                title: "'LXGW WenKai', 'Noto Sans SC', sans-serif",
                content: "'Noto Sans SC', 'PingFang SC', sans-serif"
            }
        });
    }

    /**
     * 生成精美SVG卡片
     */
    async generatePremiumCard(content, templateId = 'tech-premium', options = {}) {
        if (this.isGenerating) {
            throw new Error('正在生成中，请稍候');
        }

        try {
            this.isGenerating = true;
            
            const template = this.cardTemplates.get(templateId);
            if (!template) {
                throw new Error(`模板 ${templateId} 不存在`);
            }

            // 分析内容结构
            const contentAnalysis = this.analyzeContent(content);
            
            // 生成SVG
            const svg = this.createPremiumSVG(contentAnalysis, template, options);
            
            return {
                svg: svg,
                dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
                analysis: contentAnalysis
            };
            
        } finally {
            this.isGenerating = false;
        }
    }

    /**
     * 分析内容结构
     */
    analyzeContent(content) {
        // 提取标题（第一行或包含关键词的句子）
        const lines = content.split('\n').filter(line => line.trim());
        const title = this.extractTitle(lines);
        
        // 提取关键数据点
        const dataPoints = this.extractDataPoints(content);
        
        // 提取要点列表
        const keyPoints = this.extractKeyPoints(content);
        
        // 分析内容类型
        const contentType = this.analyzeContentType(content);
        
        return {
            title,
            dataPoints,
            keyPoints,
            contentType,
            originalContent: content,
            processedContent: this.processContentForDisplay(content)
        };
    }

    /**
     * 提取标题
     */
    extractTitle(lines) {
        // 更全面的技术关键词
        const techKeywords = [
            'AI', 'API', '技术', '系统', '算法', '模型', '框架', '工具', '平台', '服务',
            'NSA', 'Hardware', 'Software', 'Database', 'Network', 'Security', 'Performance',
            '数据库', '网络', '安全', '性能', '优化', '架构', '开源', '云计算', '大数据',
            'TiB', 'GiB', 'GPU', 'CPU', 'SSD', 'NVMe', 'RAID', 'Linux', 'Windows'
        ];

        // 首先尝试找到最长的包含技术关键词的行
        let bestTitle = '';
        let maxScore = 0;

        for (const line of lines) {
            if (line.length > 100) continue; // 跳过过长的行

            const score = techKeywords.reduce((count, keyword) => {
                return count + (line.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
            }, 0);

            if (score > maxScore || (score === maxScore && line.length > bestTitle.length)) {
                maxScore = score;
                bestTitle = line.trim();
            }
        }

        // 如果找到了有技术关键词的标题，使用它
        if (bestTitle && maxScore > 0) {
            return bestTitle;
        }

        // 否则使用第一行，但限制长度
        const firstLine = lines[0]?.trim() || '技术分享';
        return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    }

    /**
     * 提取数据点
     */
    extractDataPoints(content) {
        const dataPoints = [];

        // 更强大的数字+单位匹配模式，包括小数和更多单位
        const numberPattern = /(\d+(?:\.\d+)?)\s*(TiB\/秒|GiB\/秒|MB\/秒|KB\/秒|TiB\/分钟|GiB\/分钟|TiB|GiB|MB|KB|秒|分钟|小时|天|倍|%|节点|个|次|万|亿)/gi;
        let match;

        // 先尝试匹配完整的性能描述
        const performancePatterns = [
            /(\d+(?:\.\d+)?)\s*(TiB\/秒|GiB\/秒|MB\/秒)/gi,
            /(\d+(?:\.\d+)?)\s*(TiB\/分钟|GiB\/分钟)/gi,
            /(\d+(?:\.\d+)?)\s*(TiB|GiB|MB|KB)/gi,
            /(\d+(?:\.\d+)?)\s*([万亿]?节点|个节点)/gi
        ];

        // 重置正则表达式
        numberPattern.lastIndex = 0;

        while ((match = numberPattern.exec(content)) !== null && dataPoints.length < 4) {
            const value = match[1];
            const unit = match[2];

            // 提取更准确的上下文
            const context = this.extractDataContext(content, match.index, match[0]);

            dataPoints.push({
                value: value,
                unit: unit,
                label: context || this.generateLabelFromUnit(unit),
                color: this.getDataPointColor(dataPoints.length)
            });
        }

        // 如果没有找到足够的数据点，添加一些默认的
        if (dataPoints.length === 0) {
            dataPoints.push(
                { value: "高", unit: "性能", label: "系统性能", color: this.getDataPointColor(0) },
                { value: "优", unit: "质量", label: "代码质量", color: this.getDataPointColor(1) }
            );
        }

        return dataPoints;
    }

    /**
     * 提取数据上下文
     */
    extractDataContext(content, index, matchText) {
        // 在数字前后查找描述性文字
        const before = content.substring(Math.max(0, index - 50), index);
        const after = content.substring(index, index + 100);
        const fullContext = before + matchText + after;

        // 更详细的上下文关键词映射
        const contextKeywords = {
            '读取速度': '读取速度',
            '写入速度': '写入速度',
            '处理速度': '处理速度',
            '查询速度': '查询速度',
            '排序速度': '排序速度',
            '传输速度': '传输速度',
            '吞吐量': '数据吞吐量',
            '带宽': '网络带宽',
            '延迟': '响应延迟',
            '节点': '集群规模',
            '内存': '内存容量',
            '存储': '存储容量',
            '缓存': '缓存大小',
            '并发': '并发数量',
            '连接': '连接数量',
            'QPS': '查询性能',
            'TPS': '事务性能',
            'CPU': 'CPU性能',
            'GPU': 'GPU性能'
        };

        // 检查完整上下文
        for (const [keyword, label] of Object.entries(contextKeywords)) {
            if (fullContext.toLowerCase().includes(keyword.toLowerCase())) {
                return label;
            }
        }
        
        return null;
    }

    /**
     * 获取数据点颜色
     */
    getDataPointColor(index) {
        const colors = ['#615DFA', '#FF6B95', '#52BF90', '#FFA726'];
        return colors[index % colors.length];
    }

    /**
     * 根据单位生成标签
     */
    generateLabelFromUnit(unit) {
        const unitLabels = {
            'TiB/秒': '读取速度',
            'GiB/秒': '处理速度',
            'MB/秒': '传输速度',
            'KB/秒': '网络速度',
            'TiB/分钟': '数据吞吐量',
            'GiB/分钟': '处理吞吐量',
            'TiB': '存储容量',
            'GiB': '内存容量',
            'MB': '缓存大小',
            'KB': '数据大小',
            '节点': '集群规模',
            '个': '数量指标',
            '次': '操作次数',
            '万': '规模指标',
            '亿': '数据规模',
            '%': '性能指标',
            '秒': '响应时间',
            '分钟': '处理时间',
            '小时': '运行时间',
            '天': '稳定性',
            '倍': '性能提升'
        };

        return unitLabels[unit] || '技术指标';
    }

    /**
     * 提取关键要点
     */
    extractKeyPoints(content) {
        const points = [];
        
        // 查找列表项
        const listPattern = /[•·\-\*]\s*(.+)/g;
        let match;
        
        while ((match = listPattern.exec(content)) !== null && points.length < 4) {
            points.push(match[1].trim());
        }
        
        // 如果没有找到列表，尝试按句子分割
        if (points.length === 0) {
            const sentences = content.split(/[。！？]/).filter(s => s.trim() && s.length > 10);
            points.push(...sentences.slice(0, 4));
        }
        
        return points;
    }

    /**
     * 分析内容类型
     */
    analyzeContentType(content) {
        const techKeywords = ['AI', 'API', '算法', '模型', '系统', '技术', '开源'];
        const lifestyleKeywords = ['生活', '分享', '推荐', '体验', '感受'];
        
        const techScore = techKeywords.reduce((score, keyword) => 
            score + (content.includes(keyword) ? 1 : 0), 0);
        const lifestyleScore = lifestyleKeywords.reduce((score, keyword) => 
            score + (content.includes(keyword) ? 1 : 0), 0);
        
        return techScore > lifestyleScore ? 'tech' : 'lifestyle';
    }

    /**
     * 处理内容用于显示
     */
    processContentForDisplay(content) {
        // 移除过长的句子，保持简洁
        return content.length > 200 ? content.substring(0, 200) + '...' : content;
    }

    /**
     * 创建精美SVG
     */
    createPremiumSVG(analysis, template, options = {}) {
        const width = 750;
        const height = 1334;
        
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;
        
        // 添加定义（渐变和阴影）
        svg += this.createSVGDefinitions(template);
        
        // 主背景
        svg += `<rect width="${width}" height="${height}" fill="url(#bgGradient)" />`;
        
        // 装饰元素
        svg += this.createDecorationElements(template);
        
        // 内容区域
        svg += this.createContentArea(analysis, template, width, height);
        
        svg += '</svg>';
        
        return svg;
    }

    /**
     * 创建SVG定义
     */
    createSVGDefinitions(template) {
        return `
        <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${this.extractGradientColor(template.gradients.background, 0)};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${this.extractGradientColor(template.gradients.background, 1)};stop-opacity:1" />
            </linearGradient>
            <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:${this.extractGradientColor(template.gradients.header, 0)};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${this.extractGradientColor(template.gradients.header, 1)};stop-opacity:1" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                <feOffset dx="0" dy="3" result="offsetblur" />
                <feComponentTransfer>
                    <feFuncA type="linear" slope="0.2" />
                </feComponentTransfer>
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>`;
    }

    /**
     * 提取渐变颜色
     */
    extractGradientColor(gradient, position) {
        // 简单的颜色提取，实际项目中可以使用更复杂的解析
        const colors = gradient.match(/#[0-9A-Fa-f]{6}/g) || ['#FFD4E5', '#AAE0FF'];
        return colors[position] || colors[0];
    }

    /**
     * 创建装饰元素
     */
    createDecorationElements(template) {
        return `
        <!-- 装饰元素：几何形状 -->
        <circle cx="50" cy="150" r="80" fill="${template.colors.primary}" opacity="0.1" />
        <circle cx="700" cy="200" r="120" fill="${template.colors.secondary}" opacity="0.08" />
        <circle cx="120" cy="1200" r="100" fill="${template.colors.accent}" opacity="0.06" />
        <circle cx="650" cy="1100" r="90" fill="${template.colors.primary}" opacity="0.05" />`;
    }

    /**
     * 创建内容区域
     */
    createContentArea(analysis, template, width, height) {
        let content = '';
        
        // 内容背景
        content += `<rect x="75" y="280" width="600" height="880" rx="30" ry="30" fill="${template.colors.white}" filter="url(#softShadow)" />`;
        
        // 标题区域
        content += this.createHeaderSection(analysis, template);
        
        // 数据点区域
        if (analysis.dataPoints.length > 0) {
            content += this.createDataPointsSection(analysis, template);
        }
        
        // 关键要点区域
        if (analysis.keyPoints.length > 0) {
            content += this.createKeyPointsSection(analysis, template);
        }
        
        return content;
    }

    /**
     * 创建标题区域
     */
    createHeaderSection(analysis, template) {
        return `
        <!-- 标题区域 -->
        <rect x="75" y="140" width="600" height="180" rx="30" ry="30" fill="url(#headerGradient)" filter="url(#softShadow)" />
        <text x="375" y="220" font-family="${template.fonts.title}" font-size="44" font-weight="bold" fill="${template.colors.white}" text-anchor="middle">${this.escapeXML(analysis.title)}</text>
        <text x="375" y="280" font-family="${template.fonts.content}" font-size="28" fill="${template.colors.white}" text-anchor="middle">精美技术内容分享</text>`;
    }

    /**
     * 创建数据点区域
     */
    createDataPointsSection(analysis, template) {
        let section = `
        <!-- 数据指标区域 -->
        <g font-family="${template.fonts.content}" fill="${template.colors.text}">
            <text x="105" y="380" font-size="26" font-weight="bold">🚀 核心数据</text>`;
        
        analysis.dataPoints.forEach((point, index) => {
            const x = 105 + (index % 2) * 285;
            const y = 410 + Math.floor(index / 2) * 140;
            
            section += `
            <rect x="${x}" y="${y}" width="255" height="120" rx="20" ry="20" fill="${point.color}15" />
            <text x="${x + 127.5}" y="${y + 40}" font-size="22" font-weight="bold" fill="${template.colors.text}" text-anchor="middle">${this.escapeXML(point.label)}</text>
            <text x="${x + 127.5}" y="${y + 80}" font-size="30" font-weight="bold" fill="${point.color}" text-anchor="middle">${point.value} ${point.unit}</text>`;
        });
        
        section += '</g>';
        return section;
    }

    /**
     * 创建关键要点区域
     */
    createKeyPointsSection(analysis, template) {
        const startY = 600 + (analysis.dataPoints.length > 0 ? Math.ceil(analysis.dataPoints.length / 2) * 140 : 0);
        
        let section = `
        <!-- 关键要点区域 -->
        <g font-family="${template.fonts.content}" fill="${template.colors.text}">
            <text x="105" y="${startY}" font-size="26" font-weight="bold">💡 核心要点</text>
            <rect x="105" y="${startY + 20}" width="540" height="${analysis.keyPoints.length * 40 + 40}" rx="15" ry="15" fill="${template.colors.primary}08" />`;
        
        analysis.keyPoints.forEach((point, index) => {
            section += `
            <text x="125" y="${startY + 60 + index * 40}" font-size="22" fill="${template.colors.text}">• ${this.escapeXML(point.substring(0, 50))}${point.length > 50 ? '...' : ''}</text>`;
        });
        
        section += '</g>';
        return section;
    }

    /**
     * 转义XML字符
     */
    escapeXML(text) {
        return text.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
    }
}

// 全局实例
window.premiumCardGenerator = new PremiumCardGenerator();
