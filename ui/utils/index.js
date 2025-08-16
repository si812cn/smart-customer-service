/**
 * 工具类：通用方法封装（新增方法）
 */
export const Utils = {

    /**
     * 获取当前时间戳
     * @returns {number} 当前时间毫秒值
     */
    now() { return Date.now(); },

    /**
     * 对用户输入进行安全过滤，防止 XSS 攻击和 Prompt 注入
     *
     * 该函数会：
     * 1. 清除换行符，防止上下文分隔或提示词逃逸
     * 2. 过滤常见恶意代码片段（如脚本标签、SQL/CLI 注释符号）
     * 3. 去除首尾空白字符
     * 4. 截取最大长度以防止过长输入影响模型性能或增加风险
     *
     * @param {string} str - 待处理的用户输入字符串
     * @returns {string} - 经过清理和截断的安全字符串
     *
     * @example
     * sanitizeInput('Hello <script>alert(1)</script>\n\n-- ignore this');
     * // 返回: "Hello  ignore this"
     */
    sanitizeInput(str) {
        return str
            .replace(/[\r\n]+/g, ' ')                    // 将换行替换为空格，防止上下文注入
            .replace(/--|;;|<script|<\/script>/gi, '')   // 过滤注释符号和脚本标签（基础XSS/注入防护）
            .trim()                                      // 去除首尾空格
            .slice(0, 500);                              // 限制最大长度为500字符，防止过长输入
    },

    /**
     * 规范化字符串（用于生成安全的 key）
     * @param {string} str - 原始字符串
     * @param {number} maxLength - 最大长度
     * @returns {string} 规范化后的字符串
     */
    normalize(str, maxLength = 32) {
        return String(str)
            .replace(/:/g, '：')                    // 冒号 → 全角
            .replace(/\s+/g, '_')                   // 空白 → 下划线
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.：]/g, '') // 白名单
            .substring(0, maxLength)
            .toLowerCase();
    },

    /**
     * 生成安全的 session key
     * 格式：session:<botId>:<safeNickname>
     */
    createSessionKey(botId, nickname) {
        // 1. 规范化 nickname：只保留安全字符
        const safeNickname = this.normalize(nickname, 32);

        // 2. 拼接 key，使用 : 作为结构化分隔符
        return `session:${botId}:${safeNickname}`;
    },

    /**
     * 创建评论唯一键（用于去重）
     * @param {string} user - 用户名
     * @param {string} text - 评论内容
     * @returns {string} 唯一键，格式：comment:user:text
     */
    createCommentKey(user, text) {
        const safeUser = this.normalize(user);
        const safeText = this.normalize(text, 20); // 文本适当缩短
        return `comment:${safeUser}:${safeText}`;
    },

    /**
     * 根据当前页面 URL 判断所属直播平台
     * @returns {string} 平台标识（如 douyin, kuaishou）
     */
    getPlatform(host) {
        if (host.includes('jinritemai')) return 'douyin';
        if (host.includes('kwaixiaodian')) return 'kuaishou';
        if (host.includes('xiaohongshu')) return 'xiaohongshu';
        if (host.includes('weixin')) return 'shipinhao';
        if (host.includes('baidu')) return 'baidu';
        if (host.includes('jd')) return 'jingdong';
        if (host.includes('taobao')) return 'taobao';
        if (host.includes('tiktok')) return 'tiktok';
        return 'unknown';
    }
};


/**
 * XPath 工具类：封装查询与等待逻辑
 */
class XPathUtil {
    /**
     * 执行 XPath 查询，返回第一个匹配元素
     * @param {string} xpath - XPath 表达式
     * @param {Node} ctx - 查询上下文（默认 document）
     * @returns {Element|null} 匹配的 DOM 元素或 null
     */
    static query(xpath, ctx = document) {
        try {
            return document.evaluate(xpath, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch (e) {
            console.warn('[XPath] 查询失败:', xpath, e);
            return null;
        }
    }

    /**
     * 等待元素出现（轮询机制）
     * @param {string} xpath - 要等待的元素 XPath
     * @param {Function} cb - 元素找到后的回调函数
     * @param {number} retries - 最大重试次数
     * @param {number} interval - 重试间隔（毫秒）
     */
    static waitFor(xpath, cb, retries = 60, interval = 500) {
        const el = this.query(xpath);
        if (el) {
            cb(el);
        } else if (retries > 0) {
            setTimeout(() => this.waitFor(xpath, cb, retries - 1, interval), interval);
        } else {
            console.warn('[XPath] 元素未找到，放弃:', xpath);
        }
    }

    /**
     * 查询所有匹配 XPath 的元素
     * @param {string} xpath - XPath 表达式
     * @param {Node} ctx - 上下文
     * @returns {Element[]} 元素数组
     */
    static queryAll(xpath, ctx = document) {
        const res = [];
        try {
            const iter = document.evaluate(xpath, ctx, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            let node;
            while ((node = iter.iterateNext())) res.push(node);
        } catch (e) {
            console.warn('[XPath] queryAll 失败:', xpath, e);
        }
        return res;
    }
}