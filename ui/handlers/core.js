// core.js
// 所有平台共享的通用逻辑

window.AutoReplyCore = {

    Utils: {
        now() { return Date.now(); },

        normalize(str, maxLength = 32) {
            return String(str)
                .replace(/:/g, '：')
                .replace(/\s+/g, '_')
                .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.：]/g, '')
                .substring(0, maxLength)
                .toLowerCase();
        },

        createCommentKey(user, text, prefix="comment") {
            const safeUser = this.normalize(user);
            const safeText = this.normalize(text, 20);
            return `${prefix}:${safeUser}:${safeText}`;
        }
    },

    /**
     * 各平台关键元素的 XPath 选择器
     * 支持多路径（用 | 分隔）作为回退机制
     */
    SELECTORS: {
        INPUT: {
            douyin_live: '//textarea[@class="webcast-chatroom___textarea"]',
            douyin_im: '//textarea[contains(@class,"input-area") or @data-e2e="chat-input"]' +
                '| //div[@contenteditable="true" and contains(@class,"chat-input")]',
            kuaishou: '//textarea[contains(@class,"comment-input")]',
            xiaohongshu: '//textarea[contains(@class,"d-text")]',
            shipinhao: '//textarea[@class="message-input"]',
            baidu: '//input[@id="input"]',
            taobao: '//textarea[@placeholder="回复观众"]',
            jingdong: '//textarea[contains(@class,"textArea")]',
            tiktok: '//div[@contenteditable="plaintext-only"]'
        },
        SEND: {
            douyin_live: '//button[@data-e2e="send-button"]',
            douyin_im: '//button[.//span[text()="发送"] or @data-e2e="send-msg-btn"]',
            kuaishou: '//button[contains(@class,"submit-button")]',
            xiaohongshu: '//span[text()="发送"]/ancestor::button',
            shipinhao: '//button[contains(@class,"send-btn")]',
            baidu: '//button[.//text()="发送"]',
            taobao: '//span[text()="发布"]/ancestor::button',
            jingdong: '//button[.//span[text()="发送"]]',
            tiktok: '//button[@aria-label="Send message"]'
        },
        COMMENT_LIST: {
            douyin_live: '//div[contains(@class,"comment-item")]',
            douyin_im: `
                        //div[
                            @data-qa-id = "qa-message-warpper"
                            and (
                                .//*[contains(@class, "chatd-card-main")]
                                or
                                .//*[contains(@class, "leaveMessage") and contains(@class, "messageNotMe")]
                            )
                        ]
                    `,
            kuaishou: '//div[@class="item"]',
            xiaohongshu: '//div[@class="comment-item"]',
            shipinhao: '//div[@class="comment-content"]',
            baidu: '//div[@class="comment-text"]',
            taobao: '//div[contains(@class,"comment-content")]',
            jingdong: '//div[@class="comment-content"]',
            tiktok: '//div[@data-e2e="comment-item"]'
        },
        COMMENT_USER: {
            douyin_live: './/span[contains(@class,"user-name")]',
            douyin_im: '//*[@id="workspace-chat"]/div[3]/div[1]/div[1]/span/div',
            kuaishou: './/div[contains(@class,"user")]//span',
            xiaohongshu: './/span[contains(@class,"username")]',
            shipinhao: './/span[contains(@class,"user-name")]',
            baidu: './/span[contains(@class,"user")]',
            taobao: './/span[contains(@class,"user-nick")]',
            jingdong: './/span[contains(@class,"user-name")]',
            tiktok: './/span[contains(@class,"user-name")]'
        },
        COMMENT_TEXT: {
            douyin_live: './/span[contains(@class,"comment-text")]',
            douyin_im: './/*[contains(@class, "leaveMessage") and contains(@class, "messageNotMe")]//pre/span',
            kuaishou: './/div[contains(@class,"content")]',
            xiaohongshu: './/span[contains(@class,"content")]',
            shipinhao: './/span[contains(@class,"comment-text")]',
            baidu: './/span[contains(@class,"text")]',
            taobao: './/span[contains(@class,"text")]',
            jingdong: './/span[contains(@class,"content")]',
            tiktok: './/span[contains(@class,"comment-text")]'
        }
    },

    XPathUtil: class {
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
    },
    /**
     * 配置管理器：负责从 storage 加载配置，并提供同步访问
     */
    /**
     * 配置管理器：统一加载 & 缓存配置，避免重复请求
     */
    ConfigManager: (function () {
        let currentConfig = null;
        let isLoaded = false;
        const callbacks = []; // 等待配置加载完成的回调队列

        return {
            /**
             * 初始化：从 background 获取配置（只执行一次）
             * @param {Function} callback - (config) => {}
             */
            init(callback) {
                // 如果已加载，直接返回
                if (isLoaded && currentConfig) {
                    if (callback) callback(currentConfig);
                    return this;
                }

                // 如果正在加载中，加入等待队列
                if (callback) callbacks.push(callback);

                // 防止重复发送请求
                if (currentConfig !== null) return this;

                console.log('[ConfigManager] 正在从 background 请求配置...');

                // 发送消息给 background.js 获取配置
                chrome.runtime.sendMessage({ type: 'getConfig' }, (response) => {
                    // 检查通信错误
                    if (chrome.runtime.lastError) {
                        console.error('[ConfigManager] 与 background 通信失败:', chrome.runtime.lastError);
                        this._useFallbackConfig(); // 使用默认值兜底
                        this._notifyAll();
                        return;
                    }

                    // 检查响应是否成功
                    if (response?.success && response.config) {
                        currentConfig = response.config;
                        isLoaded = true;
                        console.log('[ConfigManager] 配置加载成功:', currentConfig);
                    } else {
                        console.warn('[ConfigManager] 配置获取失败，使用默认值');
                        this._useFallbackConfig();
                    }

                    // 通知所有等待中的回调
                    this._notifyAll();
                });

                return this;
            },

            /**
             * 同步获取当前配置（必须确保已 init）
             * @returns {Object|null} 当前配置，未加载时返回 null
             */
            get() {
                if (!isLoaded) {
                    console.warn('[ConfigManager] 配置尚未加载完成，请先调用 init()');
                }
                return currentConfig;
            },

            /**
             * 异步获取配置（自动等待加载完成）
             * @param {Function} callback
             */
            getAsync(callback) {
                if (isLoaded && currentConfig) {
                    callback(currentConfig);
                } else {
                    this.init(callback);
                }
            },

            /**
             * 内部：通知所有等待回调
             */
            _notifyAll() {
                callbacks.forEach(cb => cb && cb(currentConfig));
                callbacks.length = 0; // 清空
            },

            /**
             * 内部：使用默认配置兜底（防止 background 未响应）
             */
            _useFallbackConfig() {
                currentConfig = null;
                isLoaded = false;
                console.log('background 未响应 [ConfigManager] 默认配置加载失败');
            },

            /**
             * 外部调用：当 background 主动推送更新时使用
             * @param {Object} newConfig
             */
            onUpdate(newConfig) {
                if (newConfig) {
                    currentConfig = newConfig;
                    isLoaded = true;
                    console.log('[ConfigManager] 配置已热更新:', newConfig);
                }
            }
        };
    })(),
    DateUtils: {
        parseTimeText(text) {
            const now = new Date();
            const year = now.getFullYear();
            let month, day, hour, minute, second;

            // 提取时间部分（HH:mm:ss）
            const timeMatch = text.match(/(\d{1,2}):(\d{2}):(\d{2})/);
            if (!timeMatch) return null;

            [, hour, minute, second] = timeMatch.map(Number);

            // 情况1：包含“昨天”
            if (text.includes('昨天')) {
                const yesterday = new Date(now);
                yesterday.setDate(now.getDate() - 1);
                month = yesterday.getMonth() + 1;
                day = yesterday.getDate();
            }
            // 情况2：包含“月”“日”（如 "8月18日"）
            else if (text.includes('月') && text.includes('日')) {
                const dateMatch = text.match(/(\d+)月(\d+)日/);
                if (dateMatch) {
                    month = Number(dateMatch[1]);
                    day = Number(dateMatch[2]);
                }
            }
            // 情况3：只有时间（默认是今天）
            else {
                month = now.getMonth() + 1;
                day = now.getDate();
            }

            // 处理跨年问题（比如现在是1月，但时间是12月）
            let targetDate = new Date(year, month - 1, day, hour, minute, second);

            // 如果解析出的日期比今天大（不合理），说明是去年的日期
            if (targetDate > now) {
                targetDate = new Date(year - 1, month - 1, day, hour, minute, second);
            }

            return targetDate;
        },

        // 格式化为 YYYY-MM-DD HH:mm:ss
        formatDateTime(date) {
            if (!date) return null;
            const pad = n => n.toString().padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        }
    }
};