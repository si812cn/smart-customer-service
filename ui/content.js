// content.js
// 直播AI助手 - 页面注入脚本
// 职责：监听页面评论 → 请求AI回复 → 填入输入框 → 自动发送
// 作者：Qwen
// 日期：2025-08-14

(function () {
    'use strict';

    /**
     * 全局配置对象
     * 所有可调参数集中管理，便于后期通过 popup 扩展配置
     */
    const Config = {
        REPLY: {
            // 用户级冷却时间（毫秒）：同一用户3秒内不重复回复
            cooldown: 3000,
            // 每分钟最多自动回复条数，防止被平台限流
            maxPerMinute: 20,
            // 回复内容最大长度（字符）
            maxLength: 30,
            // 是否开启自动发送（false 则只填入不发送）
            autoSend: true
        },
        FILTER: {
            // 屏蔽关键词列表：包含这些词的评论将被忽略
            blockedKeywords: [
                '刷单', '加V', '微信', 'qq', 'vx',
                'telegram', 'tg', '返现', '代运营'
            ]
        }
    };

    /**
     * 工具类：通用方法封装
     */
    const Utils = {
        /**
         * 获取当前时间戳
         * @returns {number} 当前时间毫秒值
         */
        now() { return Date.now(); },

        /**
         * 根据当前页面 URL 判断所属直播平台
         * @returns {string} 平台标识（如 douyin, kuaishou）
         */
        getPlatform() {
            const host = location.host;
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
     * 各平台关键元素的 XPath 选择器
     * 支持多路径（用 | 分隔）作为回退机制
     */
    const SELECTORS = {
        INPUT: {
            douyin: '//textarea[@class="webcast-chatroom___textarea"]',
            kuaishou: '//textarea[contains(@class,"comment-input")]',
            xiaohongshu: '//textarea[contains(@class,"d-text")]',
            shipinhao: '//textarea[@class="message-input"]',
            baidu: '//input[@id="input"]',
            taobao: '//textarea[@placeholder="回复观众"]',
            jingdong: '//textarea[contains(@class,"textArea")]',
            tiktok: '//div[@contenteditable="plaintext-only"]'
        },
        SEND: {
            douyin: '//button[@data-e2e="send-button"]',
            kuaishou: '//button[contains(@class,"submit-button")]',
            xiaohongshu: '//span[text()="发送"]/ancestor::button',
            shipinhao: '//button[contains(@class,"send-btn")]',
            baidu: '//button[.//text()="发送"]',
            taobao: '//span[text()="发布"]/ancestor::button',
            jingdong: '//button[.//span[text()="发送"]]',
            tiktok: '//button[@aria-label="Send message"]'
        },
        COMMENT_LIST: {
            douyin: '//div[contains(@class,"comment-item")]',
            kuaishou: '//div[@class="item"]',
            xiaohongshu: '//div[@class="comment-item"]',
            shipinhao: '//div[@class="comment-content"]',
            baidu: '//div[@class="comment-text"]',
            taobao: '//div[contains(@class,"comment-content")]',
            jingdong: '//div[@class="comment-content"]',
            tiktok: '//div[@data-e2e="comment-item"]'
        },
        COMMENT_USER: {
            douyin: './/span[contains(@class,"user-name")]',
            kuaishou: './/div[contains(@class,"user")]//span',
            xiaohongshu: './/span[contains(@class,"username")]',
            shipinhao: './/span[contains(@class,"user-name")]',
            baidu: './/span[contains(@class,"user")]',
            taobao: './/span[contains(@class,"user-nick")]',
            jingdong: './/span[contains(@class,"user-name")]',
            tiktok: './/span[contains(@class,"user-name")]'
        },
        COMMENT_TEXT: {
            douyin: './/span[contains(@class,"comment-text")]',
            kuaishou: './/div[contains(@class,"content")]',
            xiaohongshu: './/span[contains(@class,"content")]',
            shipinhao: './/span[contains(@class,"comment-text")]',
            baidu: './/span[contains(@class,"text")]',
            taobao: './/span[contains(@class,"text")]',
            jingdong: './/span[contains(@class,"content")]',
            tiktok: './/span[contains(@class,"comment-text")]'
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

    /**
     * 评论监听器：使用 MutationObserver 捕获新评论
     */
    class CommentObserver {
        /**
         * @param {Function} onNewComment - 新评论回调函数
         */
        constructor(onNewComment) {
            this.onNewComment = onNewComment;
            this.seenComments = new Set(); // 已处理评论去重
            this.start();
        }

        /**
         * 启动监听
         */
        start() {
            const platform = Utils.getPlatform();
            const listXpath = SELECTORS.COMMENT_LIST[platform];
            if (!listXpath) {
                console.warn('[CommentObserver] 不支持的平台:', platform);
                return;
            }

            // 使用 MutationObserver 监听评论区变化
            const observer = new MutationObserver(() => this.extractNewComments());

            // 等待评论列表出现
            XPathUtil.waitFor(listXpath.split('|')[0], (listEl) => {
                if (listEl) {
                    observer.observe(listEl, { childList: true, subtree: true });
                    console.log('[CommentObserver] 已监听评论区');
                }
            });
        }

        /**
         * 提取新评论并触发回调
         */
        extractNewComments() {
            const platform = Utils.getPlatform();
            const items = XPathUtil.queryAll(SELECTORS.COMMENT_LIST[platform]);

            items.forEach(item => {
                const userEl = XPathUtil.query(SELECTORS.COMMENT_USER[platform], item);
                const textEl = XPathUtil.query(SELECTORS.COMMENT_TEXT[platform], item);

                if (!userEl || !textEl) return;

                const user = userEl.textContent.trim();
                const text = textEl.textContent.trim();
                const id = `${user}:${text}`; // 唯一标识

                // 去重：避免重复处理
                if (!this.seenComments.has(id)) {
                    this.seenComments.add(id);
                    this.onNewComment({
                        user,
                        text,
                        timestamp: Utils.now()
                    });
                }
            });
        }
    }

    /**
     * 直播助手主类
     */
    class LiveAssistant {
        constructor() {
            this.platform = Utils.getPlatform();
            this.inputSelector = SELECTORS.INPUT[this.platform];
            this.sendSelector = SELECTORS.SEND[this.platform];
            this.isProcessing = false;        // 防并发锁
            this.replyCount = 0;              // 当前分钟已回复数
            this.lastReplyTime = 0;           // 上次回复时间
            this.userCooldown = new Map();    // 用户冷却时间表
            this.init();
        }

        /**
         * 初始化：启动监听器，绑定事件
         */
        init() {
            if (this.platform === 'unknown') {
                console.warn('[LiveAssistant] 不支持的平台:', location.host);
                return;
            }

            // 启动评论监听
            new CommentObserver((comment) => this.handleComment(comment));

            // 防冲突：用户手动输入时暂停自动回复
            document.addEventListener('focusin', () => {
                this.isProcessing = true;
            });
            document.addEventListener('focusout', () => {
                setTimeout(() => this.isProcessing = false, 1000);
            });

            console.log(`[LiveAssistant] 已启动，平台: ${this.platform}`);
        }

        /**
         * 处理新评论
         * @param {Object} comment - 评论对象 { user, text }
         */
        async handleComment(comment) {
            // 条件检查：过滤 + 冷却 + 并发锁
            if (this.isFiltered(comment.text)) {
                console.debug('[过滤] 忽略评论:', comment.text);
                return;
            }
            if (this.isProcessing) {
                console.debug('[并发] 正在处理中，跳过:', comment.text);
                return;
            }
            if (!this.canReplyNow(comment.user)) {
                console.debug('[频率] 超出限制，跳过:', comment.user);
                return;
            }

            this.isProcessing = true;

            try {
                // 向 background.js 请求 AI 回复
                const response = await chrome.runtime.sendMessage({
                    type: 'GENERATE_REPLY',
                    prompt: `观众说：“${comment.text}”，请热情回复，30字内，带1个emoji`
                });

                if (response?.reply) {
                    // 清理回复内容
                    const clean = response.reply.trim().slice(0, Config.REPLY.maxLength);
                    await this.insertReply(clean);
                    if (Config.REPLY.autoSend) {
                        await this.sendReply();
                    }
                    this.updateStats(comment.user);
                    console.log('[AI回复已发送]', clean);
                }
            } catch (err) {
                console.error('[AI回复失败]', err.message || err);
            } finally {
                this.isProcessing = false;
            }
        }

        /**
         * 检查是否应过滤该评论
         * @param {string} text - 评论文本
         * @returns {boolean} 是否过滤
         */
        isFiltered(text) {
            const lower = text.toLowerCase();
            return Config.FILTER.blockedKeywords.some(kw => lower.includes(kw));
        }

        /**
         * 检查是否可以回复（频率控制）
         * @param {string} user - 用户名
         * @returns {boolean} 是否允许回复
         */
        canReplyNow(user) {
            const now = Utils.now();
            const last = this.userCooldown.get(user) || 0;
            const onCooldown = now - last < Config.REPLY.cooldown;
            const rateLimited = this.replyCount >= Config.REPLY.maxPerMinute &&
                (now - this.lastReplyTime) < 60000;
            return !onCooldown && !rateLimited;
        }

        /**
         * 更新统计信息（冷却、计数）
         * @param {string} user - 用户名
         */
        updateStats(user) {
            this.userCooldown.set(user, Utils.now());
            this.replyCount++;
            if (Utils.now() - this.lastReplyTime > 60000) {
                this.replyCount = 1;
                this.lastReplyTime = Utils.now();
            }
        }

        /**
         * 将回复内容填入输入框
         * @param {string} text - 要填入的文本
         * @returns {Promise<void>}
         */
        async insertReply(text) {
            return new Promise(resolve => {
                XPathUtil.waitFor(this.inputSelector, (inputEl) => {
                    if (!inputEl) {
                        console.warn('[输入框] 未找到，跳过');
                        return resolve();
                    }

                    // 支持两种输入框类型：value 和 contenteditable
                    if (inputEl.value !== undefined) {
                        inputEl.value = text;
                    } else if (inputEl.textContent !== undefined) {
                        inputEl.textContent = text;
                    }

                    // 触发输入事件，通知前端框架
                    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    setTimeout(resolve, 300);
                });
            });
        }

        /**
         * 点击发送按钮
         * @returns {Promise<void>}
         */
        async sendReply() {
            return new Promise(resolve => {
                XPathUtil.waitFor(this.sendSelector, (btn) => {
                    if (btn && !btn.disabled) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btn.click();
                        console.log('[发送] 按钮已点击');
                    } else {
                        console.warn('[发送] 按钮不可用或未找到');
                    }
                    setTimeout(resolve, 500);
                });
            });
        }
    }

    // ========================
    // 启动主程序
    // ========================
    new LiveAssistant();

})();