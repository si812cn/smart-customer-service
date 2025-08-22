// ===========================================
// 🎯 直播AI助手 - 页面注入脚本 (content.js)
// 功能：监听页面评论 → 请求AI回复 → 填入输入框 → 自动发送
// 作者：Qwen
// 日期：2025-08-14
// 更新：2025-08-16 - 流程优化与结构清晰化
// ===========================================

(function () {
    'use strict';

    function getPlatform() {
        const host = location.host;
        if (host === 'buyin.jinritemai.com') return 'douyin_live';
        if (host === 'im.jinritemai.com') return 'douyin_im';
        if (host.includes('kwaixiaodian')) return 'kuaishou';
        if (host.includes('xiaohongshu')) return 'xiaohongshu';
        if (host.includes('weixin')) return 'shipinhao';
        if (host.includes('baidu')) return 'baidu';
        if (host.includes('jd')) return 'jingdong';
        if (host.includes('taobao')) return 'taobao';
        if (host.includes('tiktok')) return 'tiktok';
        return 'unknown';
    }

    // 🔁 监听 storage 变化（可选：配置保存后自动更新）
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local' && changes.config) {
            console.log('[AutoReply] 收到配置更新通知');
            window.AutoReplyCore.ConfigManager.onUpdate(changes.config.newValue);
        }
    });

    /**
     * 客服助手主类
     */
    class CustAssistant {
        constructor() {
            console.log("start custassistant!");
            this.platform = getPlatform();
            this.config = null;
            this.utils = null;
            this.xpathUtils = null;
            this.inputSelector = null;
            this.sendSelector = null;
            this.isProcessing = false;        // 防并发锁
            this.replyCount = 0;              // 当前分钟已回复数
            this.lastReplyTime = 0;           // 上次回复时间
            this.userCooldown = new Map();    // 用户冷却时间表// 构造函数中添加
            this.seenComments = new Set();    // 去重机制（防重复评论瞬间触发）

            this.init();
        }

        /**
         * 初始化：启动监听器，绑定事件
         */
        init() {
            if (this.platform === 'unknown') {
                console.warn('[CustAssistant] 不支持的平台:', location.host);
                return;
            }

            // 防冲突：用户手动输入时暂停自动回复
            document.addEventListener('focusin', () => {
                this.isProcessing = true;
            });
            document.addEventListener('focusout', () => {
                setTimeout(() => this.isProcessing = false, 1000);
            });

            console.log(`[CustAssistant] 已启动，平台: ${this.platform}`);
        }

        /**
         * 处理新评论
         * @param {Object} comment - 评论对象 { user, text }
         */
        async handleComment(comment) {
            this.config =window.AutoReplyCore.ConfigManager.get();
            this.utils = window.AutoReplyCore.Utils;
            this.xpathUtils = window.AutoReplyCore.XPathUtil;
            this.inputSelector = window.AutoReplyCore.SELECTORS.INPUT[this.platform];
            this.sendSelector = window.AutoReplyCore.SELECTORS.SEND[this.platform];

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

            const key = this.utils.createCommentKey(comment.user, comment.text, "reply");
            if (this.seenComments.has(key)) {
                console.debug('[去重] 已处理:', comment.text);
                return;
            }
            this.seenComments.add(key);

            setTimeout(() => {
                // 安全删除：避免重复删除报错
                if (this.seenComments.has(key)) {
                    this.seenComments.delete(key);
                }
            }, 5 * 60 * 1000); // 5分钟后自动清除

            this.isProcessing = true;

            try {
                // 向 background.js 请求 AI 回复
                const response = await chrome.runtime.sendMessage({
                    type: 'callAI',
                    content: comment.text,
                    nickname: comment.user
                });

                if (response?.reply) {
                    // 清理回复内容
                    const clean = response.reply.trim().slice(0, this.config.text.maxLength);
                    await this.insertReply(clean);
                    if (this.config.text.autoSend) {
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
            let blockedKeywords = this.config.text.blockedKeywords;
            return blockedKeywords.some(kw => lower.includes(kw));
        }

        /**
         * 检查是否可以回复（频率控制）
         * @param {string} user - 用户名
         * @returns {boolean} 是否允许回复
         */
        canReplyNow(user) {
            const now = this.utils.now();
            const safeUser = this.utils.normalize(user);
            const last = this.userCooldown.get(safeUser) || 0;
            const onCooldown = now - last < this.config.freq.cooldown;
            const rateLimited = this.replyCount >= this.config.freq.maxPerMinute &&
                (now - this.lastReplyTime) < 60000;
            return !onCooldown && !rateLimited;
        }

        /**
         * 更新统计信息（冷却、计数）
         * @param {string} user - 用户名
         */
        updateStats(user) {
            const safeUser = this.utils.normalize(user);
            this.userCooldown.set(safeUser, this.utils.now());
            this.replyCount++;
            if (this.utils.now() - this.lastReplyTime > 60000) {
                this.replyCount = 1;
                this.lastReplyTime = this.utils.now();
            }
        }

        /**
         * 将回复内容填入输入框
         * @param {string} text - 要填入的文本
         * @returns {Promise<void>}
         */
        async insertReply(text) {
            return new Promise(resolve => {
                this.xpathUtils.waitFor(this.inputSelector, (inputEl) => {
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
                this.xpathUtils.waitFor(this.sendSelector, (btn) => {
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
                const config =window.AutoReplyCore.ConfigManager.get();
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
                                const clean = response.reply.trim().slice(0, config.text.maxLength);
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

    /**
     * 动态注入核心配置和平台专用脚本
     *
     * @param {string} platform - 平台标识，如 'douyin_im'、'xhs_ai' 等
     *                        'unknown' 表示不支持的平台，将直接返回
     *
     * 流程：
     * 1. 检查平台是否有效
     * 2. 初始化全局配置管理器（异步）
     * 3. 获取当前浏览器标签页（tab）
     * 4. 向该标签页注入平台专用处理器脚本（如 douyin_im.js）
     * 5. 等待脚本执行完成
     * 6. 启动 DOM 监听器，开始监听新消息
     */
    async function injectCommentsHandler(platform) {
        console.log("injectCommentsHandler: 正在注入平台脚本", platform);

        if (platform === 'unknown') return;

        try {
            // ✅ 将回调式 init 包装为 Promise
            await new Promise((resolve, reject) => {
                window.AutoReplyCore.ConfigManager.init((config) => {
                    if (config) {
                        console.log('[AutoReply] 配置初始化完成');
                        resolve(config);
                    } else {
                        console.warn('[AutoReply] 配置加载失败，使用默认值继续');
                        resolve(null); // 继续执行，但无配置
                    }
                });
            });

            // ✅ 第二步：通知 background.js 执行脚本注入
            // 注意：content.js 不能直接调用 chrome.scripting.executeScript
            const result = await chrome.runtime.sendMessage({
                type: 'INJECT_COMMENTS_HANDLER_SCRIPT',
                platform: platform
            });

            if (!result?.success) {
                console.error(`[AutoReply] 脚本注入失败:`);
                return;
            }

            console.log(`[AutoReply] ${platform} 平台处理器加载完成`);

            // ✅ 启动监听
            startObserver(platform);

        } catch (error) {
            console.error(`[AutoReply] 脚本注入失败:`, error);
        }
    }

    let observerInstance = null;
    let isObserverStarted = false;  // ✅ 新增：是否已经启动过（包括重试中）
    const processedMessageIds = new Set();// ✅ 记录已处理的消息 ID

    function startObserver(platform) {
        // ✅ 如果已经启动过（无论是成功还是在重试），就不再重复执行
        if (isObserverStarted) {
            console.log('[AutoReply] Observer 已启动或正在重试，跳过');
            return;
        }

        // ✅ 标记为“已启动”，防止后续重复调用
        isObserverStarted = true;

        // 改成你平台的实际选择器
        const containerSelector = window.AutoReplyCore.SELECTORS.COMMENT_CONTAINER[platform];
        // 使用 XPath 工具查询页面中所有匹配的消息项（可能是多个评论 DOM 节点）
        const container_items = window.AutoReplyCore.XPathUtil.query(containerSelector);

        let debounceTimer;

        if(container_items){
            console.log("✅ 找到消息容器:", container_items);

            observerInstance = new MutationObserver((mutations) => {
                // ✅ 只处理有新增节点的情况
                const hasNewNodes = mutations.some(mutation => mutation.addedNodes.length > 0);
                if (!hasNewNodes) return;

                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const container_items = window.AutoReplyCore.XPathUtil.query(containerSelector);

                    if (container_items && typeof window.extractNewComments === 'function') {
                        window.extractNewComments();
                    }
                }, 300);
            });

            observerInstance.observe(container_items, {
                childList: true,
                subtree: true
            });

            console.log('[AutoReply] Observer 已绑定到消息容器');
        }
        else{
            console.warn('[AutoReply] 消息容器未找到，1秒后重试');

            setTimeout(() => {
                // ✅ 重置 isObserverStarted，允许再次尝试
                isObserverStarted = false;
                startObserver(platform);
            }, 1000);
        }
    }

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
    window.custAssistant = new CustAssistant();

    console.log("call injectCommentsHandler:");

    async function start() {
        const platform = getPlatform();
        console.log('[AutoReply] 检测到平台:', platform);

        if (platform === 'unknown') {
            console.log('[AutoReply] 非支持页面，不注入脚本');
            return;
        }

        // ✅ 调用你定义的函数：注入核心配置 + 平台脚本
        await injectCommentsHandler(platform);
    }

    start();

})();