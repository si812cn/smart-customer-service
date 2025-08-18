// ===========================================
// 🎯 直播AI助手 - 页面注入脚本 (content.js)
// 功能：监听页面评论 → 请求AI回复 → 填入输入框 → 自动发送
// 作者：Qwen
// 日期：2025-08-14
// 更新：2025-08-16 - 流程优化与结构清晰化
// ===========================================

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
         * 创建评论唯一键（用于去重）
         * @param {string} user - 用户名
         * @param {string} text - 评论内容
         * @returns {string} 唯一键，格式：comment:user:text
         */
        createCommentKey(user, text) {
            const safeUser = this.normalize(user);
            const safeText = this.normalize(text, 20); // 文本适当缩短
            return `comment:${safeUser}:${safeText}`;
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

    // 🌟 全局存储当前配置
    let currentConfig = null;

    // 🔁 初始化：加载配置
    async function loadConfig() {

        // 脚本加载完成后，向 background.js 请求当前配置
        chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
            // 检查通信是否出错
            if (chrome.runtime.lastError) {
                console.error('[AutoReply] 与 background 通信失败:', chrome.runtime.lastError);
                return;
            }

            // 检查响应是否成功
            if (response?.success) {
                currentConfig = response.config;
            } else {
                console.error('[getConfig] 配置读取失败');
            }
        });
    }

    // 🚀 启动时加载配置
    loadConfig();

    // 🔁 监听 storage 变化（可选：配置保存后自动更新）
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.config) {
            currentConfig = changes.config.newValue;
            console.log('🔄 配置已更新:', currentConfig);
        }
    });

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
            const listSelector = SELECTORS.COMMENT_LIST[platform];

            if (!listSelector) {
                console.warn('[CommentObserver] 不支持的平台:', platform);
                return;
            }

            const observer = new MutationObserver(() => {
                this.extractNewComments(); // 统一方法名
            });

            XPathUtil.waitFor(listSelector, (container) => {
                if (container) {
                    // 监听父元素，提高稳定性
                    const parent = container.parentElement || document.body;
                    observer.observe(parent, { childList: true, subtree: true });
                    console.log('[CommentObserver] 已监听评论区');

                    // 初次检查已有评论
                    this.extractNewComments();
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
                const id = Utils.createCommentKey(user, text);

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
            console.log("start liveassistant!");
            this.platform = Utils.getPlatform();
            this.inputSelector = SELECTORS.INPUT[this.platform];
            this.sendSelector = SELECTORS.SEND[this.platform];
            this.isProcessing = false;        // 防并发锁
            this.replyCount = 0;              // 当前分钟已回复数
            this.lastReplyTime = 0;           // 上次回复时间
            this.userCooldown = new Map();    // 用户冷却时间表
            console.log(this.platform);
            console.log(this.inputSelector);
            console.log(this.sendSelector);
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
                    type: 'callAI',
                    content: '${comment.text}',
                    nickname: '${comment.user}'
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
            let blockedKeywords = Config.FILTER.blockedKeywords;
            if(currentConfig && currentConfig.text){
                blockedKeywords = currentConfig.text.blockedKeywords;
            }
            return blockedKeywords.some(kw => lower.includes(kw));
        }

        /**
         * 检查是否可以回复（频率控制）
         * @param {string} user - 用户名
         * @returns {boolean} 是否允许回复
         */
        canReplyNow(user) {
            const now = Utils.now();
            const safeUser = Utils.normalize(user);
            const last = this.userCooldown.get(safeUser) || 0;
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
            const safeUser = Utils.normalize(user);
            this.userCooldown.set(safeUser, Utils.now());
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
    // 新增功能：消息监听与扩展
    // ========================
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log('[content.js] 收到来自 background 的消息:', message);

        switch (message.type) {
            case 'showConfigHtml':
                showConfigPanel(() => {
                    // 面板真正显示后才回调
                    sendResponse({ success: true, message: '面板已显示' });
                });

                break;

            case 'testAI':
                console.log("enter testAI");
                try {
                    // 向 background.js 请求 AI 回复
                    chrome.runtime.sendMessage(
                        {
                            type: 'callAI',
                            content: '主播好看，我会不会不好看',
                            nickname: 'testUserId'
                        },
                        (response) => {  // 👈 回调函数接收响应
                            console.log('Received AI response:', response);

                            if (chrome.runtime.lastError) {
                                console.error('[AI通信失败]', chrome.runtime.lastError.message);
                                sendResponse({ error: '[AI通信失败]' });
                                return;
                            }

                            if (response?.reply) {
                                const clean = response.reply.trim().slice(0, Config.REPLY.maxLength);
                                console.log('[AI回复已发送]', clean);
                                sendResponse({ success: true, msg: '[AI回复已发送]' });
                            } else {
                                console.log('[AI回复为空]');
                                sendResponse({ error: '[AI回复为空]' });
                            }
                        }
                    );
                } catch (err) {
                    console.error('[AI回复失败]', err.message || err);
                    sendResponse({ error: '[AI回复失败]' });
                }

                break;

            case 'copyCookie':
                navigator.clipboard.writeText(document.cookie)
                    .then(() => sendResponse({ success: true, msg: 'Cookie 已复制' }))
                    .catch(err => sendResponse({ error: err.message }));
                break;

            case 'networkCatch':
                startNetworkCapture();
                sendResponse({ success: true, msg: '抓包已开启' });
                break;

            default:
                console.warn('[content.js] 未知消息类型:', message.type);
                sendResponse({ error: 'Unknown message type' });
        }

        return true; // 保持异步响应
    });

    // ============ 按需注入 panel.js（懒加载）============
    // 只有当用户点击“配置助手”按钮时，才动态加载 panel.js
    // 这样可以减少初始页面加载负担，提升性能

    /**
     * 动态注入 panel.js 脚本
     * @param {Function} callback - 脚本加载成功后的回调
     */
    function injectPanelScriptAndInit(callback) {
        // 创建 script 标签用于加载扩展内的 JS 文件
        const script = document.createElement('script');

        // 使用 chrome.runtime.getURL 获取扩展内资源的合法 URL
        // 注意路径必须与实际文件位置一致，且在 web_accessible_resources 中声明
        script.src = chrome.runtime.getURL('ui/config/panel.js');

        // 监听脚本加载成功事件
        script.onload = () => {
            console.log('[AutoReply] panel.js 加载完成');

            // 安全检查：确保回调是函数类型
            if (typeof callback === 'function') {
                callback(); // 执行后续逻辑（如获取配置并初始化面板）
            }

            // 清理：移除 script 标签以减少 DOM 污染
            // 注意：不能立即移除，因为 panel.js 可能还未执行完
            // 所以这里不移除，由 panel.js 自行管理或后续清理
        };

        // 监听脚本加载失败事件
        script.onerror = () => {
            console.error('[AutoReply] panel.js 加载失败：检查路径或 web_accessible_resources 配置');
            alert('面板加载失败，请刷新页面重试。');
        };

        // 将 script 添加到页面头部开始加载
        document.head.appendChild(script);
    }

    // ============ 显示配置面板（主入口）============
    /**
     * 显示配置面板（浮动 UI）
     * 实现：懒加载 panel.js → 获取配置 → 初始化 UI
     */
    function showConfigPanel() {
        injectPanelScriptAndInit(() => {
            // 脚本加载完成后，向 background.js 请求当前配置
            chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
                // 检查通信是否出错
                if (chrome.runtime.lastError) {
                    console.error('[AutoReply] 与 background 通信失败:', chrome.runtime.lastError);
                    alert('扩展通信异常，请重试');
                    return;
                }

                // 检查响应是否成功
                if (response?.success && typeof window.injectConfigPanel === 'function') {
                    // 调用 panel.js 中定义的函数，传入配置初始化 UI
                    window.injectConfigPanel(response.config);
                } else {
                    // 失败原因：配置获取失败 或 injectConfigPanel 未定义
                    const errorMsg = !response?.success ? response?.error : '面板初始化函数未加载';
                    console.error('[AutoReply] 初始化失败:', errorMsg);
                    alert('面板初始化失败：' + (errorMsg || '未知错误'));
                }
            });
        });
    }

    // ============ 监听 panel.js 发来的消息 ============
    // panel.js 通过 postMessage 发送操作指令（如保存、启动等）
    window.addEventListener('message', (event) => {
        // 安全检查：确保消息来自当前页面
        if (event.source !== window) return;

        const message = event.data;
        if (message.type === 'FROM_PAGE_TO_CONTENT') {

            // 转发给 background.js 处理
            chrome.runtime.sendMessage(message.data, (response) => {

                console.log('[content.js] 收到 background 响应:', response);
                // 可选：将响应传回 panel.js
                window.postMessage({ type: 'FROM_CONTENT_TO_PAGE', data: response }, '*');
            });
        }
    });

    /**
     * 开启网络请求监听（抓包模式）
     * 重写 fetch 和 XMLHttpRequest
     */
    function startNetworkCapture() {
        console.log('【抓包模式】已开启，正在监听 fetch 和 XHR 请求...');

        // 保存原始方法
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest;

        // 重写 fetch
        window.fetch = function (...args) {
            console.log('🔍 捕获 fetch 请求:', args[0], args[1]);
            return originalFetch(...args).then(response => {
                console.log('📦 fetch 响应:', response.clone());
                return response;
            }).catch(err => {
                console.error('❌ fetch 错误:', err);
                throw err;
            });
        };

        // 重写 XMLHttpRequest
        const open = originalXHR.prototype.open;
        const send = originalXHR.prototype.send;

        originalXHR.prototype.open = function (method, url, ...args) {
            this._url = url;
            this._method = method;
            return open.apply(this, [method, url, ...args]);
        };

        originalXHR.prototype.send = function (...args) {
            this.addEventListener('load', function () {
                console.log('🔍 捕获 XHR 请求:', this._method, this._url);
                console.log('📦 XHR 响应:', this.responseText || this.response);
            });
            this.addEventListener('error', function () {
                console.error('❌ XHR 请求失败:', this._method, this._url);
            });
            return send.apply(this, args);
        };
    }

    // ========================
    // 启动主程序
    // ========================
    new LiveAssistant();

})();