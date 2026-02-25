/**
 * 智能内容分析器
 * 负责分析文本内容，自动分段并确定图片生成策略
 */

class ContentAnalyzer {
    constructor() {
        this.sectionPatterns = {
            // 标题模式
            titles: [
                /^#{1,6}\s+(.+)$/gm,           // Markdown标题
                /^(.+)\n[=\-]{3,}$/gm,        // 下划线标题
                /^\d+[\.\)）]\s*(.+)$/gm,       // 数字标题 (1. 2.)
                /^[一二三四五六七八九十]+[\.\、]\s*(.+)$/gm, // 中文数字标题
                /^[（\(][一二三四五六七八九十\d]+[）\)]\s*(.+)$/gm // 括号标题
            ],
            
            // 分段模式
            paragraphs: [
                /\n\s*\n/g,                   // 空行分段
                /[。！？]\s*(?=\S)/g,         // 句号分段
                /[；;]\s*(?=\S)/g             // 分号分段
            ],
            
            // 列表模式
            lists: [
                /^[\*\-\+]\s+(.+)$/gm,        // 无序列表
                /^\d+[\.\)）]\s+(.+)$/gm,       // 有序列表
                /^[•·]\s+(.+)$/gm             // 项目符号列表
            ]
        };
        
        this.minSectionLength = 20;  // 最小段落长度
        this.maxSectionLength = 300; // 最大段落长度
        this.maxSections = 8;        // 最大段落数量
    }

    /**
     * 分析内容并生成分段策略
     */
    analyzeContent(content) {
        if (!content || content.trim().length === 0) {
            return {
                sections: [],
                strategy: 'empty',
                imageCount: 0,
                analysis: '内容为空'
            };
        }

        const cleanContent = this.cleanContent(content);
        const sections = this.extractSections(cleanContent);
        const strategy = this.determineStrategy(sections, cleanContent);
        
        return {
            sections: sections,
            strategy: strategy.type,
            imageCount: strategy.imageCount,
            analysis: strategy.analysis,
            originalContent: content,
            cleanContent: cleanContent
        };
    }

    /**
     * 清理内容
     */
    cleanContent(content) {
        return content
            .replace(/\r\n/g, '\n')           // 统一换行符
            .replace(/[^\S\n]+/g, ' ')        // 合并行内多余空格（保留换行）
            .replace(/\n\s*\n\s*\n/g, '\n\n') // 合并多余空行
            .trim();
    }

    /**
     * 提取段落
     */
    extractSections(content) {
        const sections = [];
        
        // 1. 尝试按标题分段
        const titleSections = this.extractByTitles(content);
        if (titleSections.length > 1) {
            return titleSections;
        }
        
        // 2. 尝试按列表分段
        const listSections = this.extractByLists(content);
        if (listSections.length > 1) {
            return listSections;
        }
        
        // 3. 按段落分段
        const paragraphSections = this.extractByParagraphs(content);
        if (paragraphSections.length > 1) {
            return paragraphSections;
        }
        
        // 4. 按长度强制分段
        return this.extractByLength(content);
    }

    /**
     * 按标题提取段落
     */
    extractByTitles(content) {
        const sections = [];
        const titlePattern = /^(#{1,6}\s+.+|\d+[\.\)）]\s*.+|[一二三四五六七八九十]+[\.\、]\s*.+)$/gm;

        // 先收集所有标题匹配，避免在 exec 循环中二次 exec/回退 lastIndex 造成死循环
        const matches = [];
        let match;
        while ((match = titlePattern.exec(content)) !== null) {
            // 理论上不会出现空匹配，但这里做一次保护，避免 lastIndex 不推进导致卡死
            if (!match[0]) {
                titlePattern.lastIndex += 1;
                continue;
            }
            matches.push({ index: match.index, raw: match[0] });

            // 极端情况下的保护：避免异常内容导致无限增长
            if (matches.length > 1000) {
                DEBUG.warn('标题匹配数量异常，已中断解析以避免性能问题');
                break;
            }
        }

        if (matches.length === 0) {
            return sections;
        }

        // 纯数字序号/中文序号（1. 2. 3.）在小红书内容里更常见于“列表项”而非“章节标题”。
        // 如果全部匹配都像列表项，则不要走“按标题分段”，交给 lists/paragraphs 更稳。
        const isMarkdownHeading = (raw) => /^\s*#{1,6}\s+/.test(String(raw || ''));
        const isListLikeTitle = (raw) => /^\s*(?:\d{1,2}[\.\)）]|[一二三四五六七八九十]+[\.\、])\s*\S+/.test(String(raw || ''));
        const markdownCount = matches.reduce((sum, m) => sum + (isMarkdownHeading(m.raw) ? 1 : 0), 0);
        const listLikeCount = matches.reduce((sum, m) => sum + (isListLikeTitle(m.raw) ? 1 : 0), 0);
        if (markdownCount === 0 && listLikeCount === matches.length) {
            return sections;
        }

        let lastIndex = 0;
        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const endIndex = matches[i + 1] ? matches[i + 1].index : content.length;

            // 添加前一段内容（标题前的正文）
            if (current.index > lastIndex) {
                const prevContent = content.substring(lastIndex, current.index).trim();
                if (prevContent.length > this.minSectionLength) {
                    sections.push({
                        type: 'content',
                        title: this.generateTitle(prevContent),
                        content: prevContent,
                        length: prevContent.length
                    });
                }
            }

            const sectionContent = content.substring(current.index, endIndex).trim();
            if (sectionContent.length > this.minSectionLength) {
                sections.push({
                    type: 'titled',
                    title: current.raw.replace(/^#+\s*|\d+[\.\)）]\s*|[一二三四五六七八九十]+[\.\、]\s*/g, ''),
                    content: sectionContent,
                    length: sectionContent.length
                });
            }

            lastIndex = endIndex;
        }

        return sections;
    }

    /**
     * 按列表提取段落
     */
    extractByLists(content) {
        const sections = [];
        const listItems = [];
        
        // 提取列表项
        this.sectionPatterns.lists.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                listItems.push({
                    index: match.index,
                    content: match[0],
                    text: match[1]
                });
            }
        });
        
        if (listItems.length < 2) return [];
        
        // 按位置排序
        listItems.sort((a, b) => a.index - b.index);
        
        // 分组连续的列表项
        let currentGroup = [];
        let lastIndex = -1;
        
        listItems.forEach(item => {
            if (lastIndex === -1 || item.index - lastIndex < 100) {
                currentGroup.push(item);
            } else {
                if (currentGroup.length > 1) {
                    sections.push(this.createListSection(currentGroup));
                }
                currentGroup = [item];
            }
            lastIndex = item.index + item.content.length;
        });
        
        if (currentGroup.length > 1) {
            sections.push(this.createListSection(currentGroup));
        }
        
        return sections;
    }

    /**
     * 按段落提取
     */
    extractByParagraphs(content) {
        const isHashtagOnly = (text) => {
            const stripped = String(text || '')
                .replace(/#([A-Za-z0-9_\u4e00-\u9fff]+)/g, '')
                .replace(/[^\S\n]+/g, ' ')
                .replace(/\n/g, '')
                .trim();
            return stripped.length === 0;
        };

        const paragraphs = content
            .split(/\n\s*\n/)
            .map(p => String(p || '').trim())
            .filter(p => p.length > this.minSectionLength)
            .filter(p => !isHashtagOnly(p));
        
        return paragraphs.map((paragraph, index) => ({
            type: 'paragraph',
            title: this.generateTitle(paragraph),
            content: paragraph.trim(),
            length: paragraph.length
        }));
    }

    /**
     * 按长度强制分段
     */
    extractByLength(content) {
        const sections = [];
        const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
        
        let currentSection = '';
        let sectionIndex = 0;
        
        sentences.forEach(sentence => {
            const trimmedSentence = sentence.trim() + '。';
            
            if (currentSection.length + trimmedSentence.length > this.maxSectionLength && currentSection.length > this.minSectionLength) {
                sections.push({
                    type: 'auto',
                    title: this.generateTitle(currentSection),
                    content: currentSection.trim(),
                    length: currentSection.length
                });
                currentSection = trimmedSentence;
                sectionIndex++;
            } else {
                currentSection += trimmedSentence;
            }
        });
        
        if (currentSection.trim().length > this.minSectionLength) {
            sections.push({
                type: 'auto',
                title: this.generateTitle(currentSection),
                content: currentSection.trim(),
                length: currentSection.length
            });
        }
        
        return sections;
    }

    /**
     * 创建列表段落
     */
    createListSection(listItems) {
        const content = listItems.map(item => item.content).join('\n');
        return {
            type: 'list',
            title: `列表内容 (${listItems.length}项)`,
            content: content,
            length: content.length,
            items: listItems.map(item => item.text)
        };
    }

    /**
     * 生成标题
     */
    generateTitle(content) {
        const text = String(content || '').replace(/\r\n/g, '\n').trim();
        if (!text) return '内容片段';

        const lines = text
            .split('\n')
            .map(line => String(line || '').trim())
            .filter(Boolean);

        const pickLine = () => {
            if (lines.length === 0) return '';

            for (const line of lines) {
                // 纯标签行不适合作标题
                if (/^#([A-Za-z0-9_\u4e00-\u9fff]+)/.test(line)) {
                    continue;
                }
                // 常见元信息不适合作标题
                if (/^(适合|适用|适用人群|人群|对象|场景|适用于)\s*[:：]/.test(line)) {
                    continue;
                }
                return line;
            }

            return lines[0];
        };

        let title = pickLine();
        title = title
            .replace(/^\s*(?:标题|Title)\s*[:：]\s*/i, '')
            .replace(/^#{1,6}\s+/, '')
            .replace(/^[（\(][一二三四五六七八九十\d]+[）\)]\s*/, '')
            .replace(/^\d{1,2}[\.\)、\)）]\s*/, '')
            .replace(/^[一二三四五六七八九十]+[\.\、]\s*/, '')
            .replace(/^(?:✅|☑️|✔️|👉|💡|🔥|⭐️|⭐|🌟|🟢|🔸|🔹|🔻|🔺|▶︎|▶|→|[-*•·])\s*/, '')
            .replace(/[：:]$/, '')
            .trim();

        // 兜底：如果首行清洗后为空，用“第一句话”兜底
        if (!title) {
            title = text.split(/[。！？\n]/)[0].trim();
        }

        if (!title) return '内容片段';
        if (title.length > 20) {
            return title.substring(0, 20) + '...';
        }
        return title;
    }

    /**
     * 确定生成策略
     */
    determineStrategy(sections, content) {
        const contentLength = content.length;
        const sectionCount = sections.length;
        
        // 内容很短，生成1张图
        if (contentLength < 100) {
            return {
                type: 'single',
                imageCount: 1,
                analysis: '内容较短，适合生成1张图片'
            };
        }
        
        // 有明确分段，每段一张图
        if (sectionCount > 1 && sectionCount <= this.maxSections) {
            return {
                type: 'multi-section',
                imageCount: sectionCount,
                analysis: `检测到${sectionCount}个段落，建议每段生成1张图片`
            };
        }
        
        // 内容很长，按长度分段
        if (contentLength > 800) {
            const suggestedCount = Math.min(Math.ceil(contentLength / 200), this.maxSections);
            return {
                type: 'length-based',
                imageCount: suggestedCount,
                analysis: `内容较长(${contentLength}字符)，建议生成${suggestedCount}张图片`
            };
        }
        
        // 默认策略
        const defaultCount = Math.min(Math.max(Math.ceil(contentLength / 150), 2), 5);
        return {
            type: 'default',
            imageCount: defaultCount,
            analysis: `根据内容长度，建议生成${defaultCount}张图片`
        };
    }

    /**
     * 获取分段建议
     */
    getSectionSuggestions(content) {
        const analysis = this.analyzeContent(content);
        
        return {
            ...analysis,
            suggestions: this.generateSuggestions(analysis)
        };
    }

    /**
     * 生成建议
     */
    generateSuggestions(analysis) {
        const suggestions = [];
        
        if (analysis.sections.length === 0) {
            suggestions.push('内容为空，请输入要生成图片的文字内容');
            return suggestions;
        }
        
        if (analysis.strategy === 'single') {
            suggestions.push('内容较短，建议生成1张综合性图片');
        } else if (analysis.strategy === 'multi-section') {
            suggestions.push(`检测到${analysis.sections.length}个段落，建议每个段落生成1张图片`);
            analysis.sections.forEach((section, index) => {
                suggestions.push(`第${index + 1}段: ${section.title}`);
            });
        } else {
            suggestions.push(`建议生成${analysis.imageCount}张图片，平均分配内容`);
        }
        
        return suggestions;
    }
}

// 全局实例
window.contentAnalyzer = new ContentAnalyzer();
