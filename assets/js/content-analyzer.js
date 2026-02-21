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
                /^\d+[\.\)]\s*(.+)$/gm,       // 数字标题 (1. 2.)
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
                /^\d+[\.\)]\s+(.+)$/gm,       // 有序列表
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
        const titlePattern = /^(#{1,6}\s+.+|\d+[\.\)]\s*.+|[一二三四五六七八九十]+[\.\、]\s*.+)$/gm;
        
        let lastIndex = 0;
        let match;
        
        while ((match = titlePattern.exec(content)) !== null) {
            // 添加前一段内容
            if (match.index > lastIndex) {
                const prevContent = content.substring(lastIndex, match.index).trim();
                if (prevContent.length > this.minSectionLength) {
                    sections.push({
                        type: 'content',
                        title: this.generateTitle(prevContent),
                        content: prevContent,
                        length: prevContent.length
                    });
                }
            }
            
            // 查找下一个标题的位置
            const nextMatch = titlePattern.exec(content);
            const endIndex = nextMatch ? nextMatch.index : content.length;
            titlePattern.lastIndex = match.index; // 重置位置
            
            const sectionContent = content.substring(match.index, endIndex).trim();
            if (sectionContent.length > this.minSectionLength) {
                sections.push({
                    type: 'titled',
                    title: match[0].replace(/^#+\s*|\d+[\.\)]\s*|[一二三四五六七八九十]+[\.\、]\s*/g, ''),
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
        const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > this.minSectionLength);
        
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
        const firstSentence = content.split(/[。！？]/)[0].trim();
        if (firstSentence.length > 20) {
            return firstSentence.substring(0, 20) + '...';
        }
        return firstSentence || '内容片段';
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
