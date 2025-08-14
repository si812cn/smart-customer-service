// ==UserScript==
// @name         直播AI助手 - 多平台智能回复（生产版）
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  支持抖音、快手、淘宝、京东、小红书、视频号、百度、TikTok 的B端直播后台AI智能回复，含评论监听、缓存、过滤、防冲突
// @author       您的品牌
// @match        https://buyin.jinritemai.com/*
// @match        https://zs.kwaixiaodian.com/*
// @match        https://ark.xiaohongshu.com/*
// @match        https://channels.weixin.qq.com/*
// @match        https://cecom.baidu.com/*
// @match        https://jlive.jd.com/*
// @match        https://liveplatform.taobao.com/*
// @match        https://seller.tiktok.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @connect      api.your-ai-service.com
// @require      https://cdn.jsdelivr.net/npm/marked/marked.min.js
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    /**
     * ==================== 配置管理 ====================
     */
    const Config = {
        // AI服务配置
        AI: {
            apiUrl: 'https://api.your-ai-service.com/v1/chat/completions',
            apiKey: '',
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 60,
            timeout: 10000
        },

        // 回复策略
        REPLY: {
            cooldown: 3000,        // 同一用户最小间隔（ms）
            maxPerMinute: 20,      // 每分钟最多回复数
            maxLength: 30,         // 最大字数
            autoSend: true         // 是否自动发送
        },

        // 过滤规则
        FILTER: {
            blockedKeywords: ['刷单', '加V', '微信', 'qq', 'vx', 'telegram', 'tg', '返现', '代运营'],
            blockedUsers: [],      // 可通过后台配置
            allowList: []          // 白名单（如管理员）
        },

        // 缓存
        CACHE_TTL: 5 * 60 * 1000   // 5分钟
    };

    /**
     * ==================== 工具函数 ====================
     */
    const Utils = {
        // 获取时间戳
        now() { return Date.now(); },

        // 深拷贝
        deepClone(obj) { return JSON.parse(JSON.stringify(obj)); },

        // 获取平台
        getPlatform() {
            const host = location.host;
            if (host === 'buyin.jinritemai.com') return 'douyin';
            if (host === 'zs.kwaixiaodian.com') return 'kuaishou';
            if (host === 'ark.xiaohongshu.com') return 'xiaohongshu';
            if (host === 'channels.weixin.qq.com') return 'shipinhao';
            if (host === 'cecom.baidu.com') return 'baidu';
            if (host === 'jlive.jd.com') return 'jingdong';
            if (host === 'liveplatform.taobao.com') return 'taobao';
            if (host === 'seller.tiktok.com') return 'tiktok';
            return 'unknown';
        },

        // 本地存储封装
        async getStorage(key, def = null) {
            return await GM_getValue(key, def);
        },
        async setStorage(key, val) {
            await GM_setValue(key, val);
        }
    };

    /**
     * ==================== XPath 工具 ====================
     */
    const XPathUtil = {
        query(xpath, ctx = document) {
            try {
                return document.evaluate(xpath, ctx, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (e) {
                console.warn('[XPath] 查询失败:', xpath, e);
                return null;
            }
        },

        queryAll(xpath, ctx = document) {
            const res = [];
            try {
                const iter = document.evaluate(xpath, ctx, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
                let node;
                while ((node = iter.iterateNext())) res.push(node);
            } catch (e) {
                console.warn('[XPath] 批量查询失败:', xpath, e);
            }
            return res;
        },

        waitFor(xpath, cb, retries = 60, interval = 500) {
            const el = this.query(xpath);
            if (el) cb(el);
            else if (retries > 0) setTimeout(() => this.waitFor(xpath, cb, retries - 1, interval), interval);
            else console.warn('[XPath] 元素未找到:', xpath);
        }
    };

    /**
     * ==================== 平台选择器 ====================
     */
    const SELECTORS = {
        INPUT: {
            douyin: '//textarea[@class="webcast-chatroom___textarea"]',
            kuaishou: '//div[contains(@class,"comment-input")]/textarea',
            xiaohongshu: '//textarea[contains(@class,"d-text")]',
            shipinhao: '//textarea[@class="message-input" and @placeholder="说点什么..."]',
            baidu: '//input[@id="input" and @placeholder="输入评论"]',
            taobao: '//textarea[@placeholder="回复观众或直接enter发评论，输入/可快捷回复"]',
            jingdong: '//textarea[contains(@class,"textArea") and @maxlength="500"]',
            tiktok: '//div[@contenteditable="plaintext-only"]',
        },
        SEND: {
            douyin: '//button[@data-e2e="send-button"] | //span[text()="发送"]/ancestor::button',
            kuaishou: '//button[contains(@class,"submit-button") or @role="button"]',
            xiaohongshu: '//span[text()="发送"]/ancestor::button',
            shipinhao: '//button[contains(@class,"send-btn")] | //*[@role="button" and .//span[text()="发送"]]',
            baidu: '//button[.//text()="发送"] | //*[@role="button" and text()="发送"]',
            taobao: '//button[@data-tblalog-d="AnchorReply__faBu"] | //span[text()="发布"]/ancestor::button',
            jingdong: '//button[contains(@class, "ant-btn") and .//span[text()="发送"]]',
            tiktok: '//button[@aria-label="Send message"] | //button[.//span[text()="Send"]]'
        },
        COMMENT_LIST: {
            douyin: '//div[contains(@class,"comment-item")]',
            kuaishou: '//div[@class="comment-list"]//div[@class="item"]',
            xiaohongshu: '//div[@class="comment-item"]',
            shipinhao: '//div[@class="comment-content"]',
            baidu: '//div[@class="comment-text"]',
            jingdong: '//div[@class="comment-content"]',
            taobao: '//div[contains(@class,"comment-content")]',
            tiktok: '//div[@data-e2e="comment-item"]'
        },
        COMMENT_USER: {
            douyin: './/span[contains(@class,"user-name")]',
            kuaishou: './/div[contains(@class,"user")]//span',
            xiaohongshu: './/span[contains(@class,"username")]',
            shipinhao: './/span[contains(@class,"user-name")]',
            baidu: './/span[contains(@class,"user")]',
            jingdong: './/span[contains(@class,"user-name")]',
            taobao: './/span[contains(@class,"user-nick")]',
            tiktok: './/span[contains(@class,"user-name")]'
        },
        COMMENT_TEXT: {
            douyin: './/span[contains(@class,"comment-text")]',
            kuaishou: './/div[contains(@class,"content")]',
            xiaohongshu: './/span[contains(@class,"content")]',
            shipinhao: './/span[contains(@class,"comment-text")]',
            baidu: './/span[contains(@class,"text")]',
            jingdong: './/span[contains(@class,"content")]',
            taobao: './/span[contains(@class,"text")]',
            tiktok: './/span[contains(@class,"comment-text")]'
        }
    };

    /**
     * ==================== AI 服务 ====================
     */
    class AIReplyService {
        constructor() {
            this.cache = new Map();
            this.loadConfig();
        }

        async loadConfig() {
            const savedKey = await Utils.getStorage('ai_api_key');
            if (savedKey) Config.AI.apiKey = savedKey;
        }

        async generate(prompt) {
            const cacheKey = this.getCacheKey(prompt);
            const cached = this.getCache(cacheKey);
            if (cached) return cached;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: Config.AI.apiUrl,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Config.AI.apiKey}`
                    },
                    data: JSON.stringify({
                        model: Config.AI.model,
                        messages: [
                            { role: 'system', content: '你是专业直播助手，回复要简短、热情、带1-2个emoji，口语化，30字内，不要用markdown。' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: Config.AI.temperature,
                        max_tokens: Config.AI.maxTokens
                    }),
                    timeout: Config.AI.timeout,
                    onload: (res) => {
                        try {
                            const data = JSON.parse(res.responseText);
                            const reply = data.choices?.[0]?.message?.content || '';
                            const clean = this.cleanReply(reply);
                            this.setCache(cacheKey, clean);
                            resolve(clean);
                        } catch (e) {
                            reject(new Error('AI解析失败: ' + e.message));
                        }
                    },
                    onerror: (err) => reject(new Error('网络错误: ' + err.statusText)),
                    ontimeout: () => reject(new Error('请求超时'))
                });
            });
        }

        cleanReply(text) {
            return text
                .replace(/[*_`~\[\]\(\)#\+\-!]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, Config.REPLY.maxLength);
        }

        getCacheKey(text) {
            return text.trim().toLowerCase().substring(0, 50);
        }

        getCache(key) {
            const item = this.cache.get(key);
            if (!item) return null;
            return Utils.now() - item.ts < Config.CACHE_TTL ? item.value : null;
        }

        setCache(key, value) {
            this.cache.set(key, { value, ts: Utils.now() });
        }
    }

    /**
     * ==================== 评论监听器 ====================
     */
    class CommentObserver {
        constructor(onNewComment) {
            this.onNewComment = onNewComment;
            this.seenComments = new Set();
            this.start();
        }

        start() {
            const listXpath = SELECTORS.COMMENT_LIST[Utils.getPlatform()];
            if (!listXpath) return console.warn('不支持的平台评论监听');

            const observer = new MutationObserver(() => {
                this.extractNewComments();
            });

            XPathUtil.waitFor(listXpath.split('|')[0], (listEl) => {
                if (listEl) {
                    observer.observe(listEl, { childList: true, subtree: true });
                    console.log('[评论监听] 已启动');
                }
            });
        }

        extractNewComments() {
            const platform = Utils.getPlatform();
            const items = XPathUtil.queryAll(SELECTORS.COMMENT_LIST[platform]);
            items.forEach(item => {
                const userEl = XPathUtil.query(SELECTORS.COMMENT_USER[platform], item);
                const textEl = XPathUtil.query(SELECTORS.COMMENT_TEXT[platform], item);
                if (!userEl || !textEl) return;

                const user = userEl.textContent.trim();
                const text = textEl.textContent.trim();
                const id = `${user}:${text}`;

                if (!this.seenComments.has(id)) {
                    this.seenComments.add(id);
                    this.onNewComment({ user, text, timestamp: Utils.now() });
                }
            });
        }
    }

    /**
     * ==================== 主助手 ====================
     */
    class LiveAssistant {
        constructor() {
            this.platform = Utils.getPlatform();
            this.ai = new AIReplyService();
            this.inputSelector = SELECTORS.INPUT[this.platform];
            this.sendSelector = SELECTORS.SEND[this.platform];
            this.isProcessing = false;
            this.replyCount = 0;
            this.lastReplyTime = 0;
            this.userCooldown = new Map(); // user -> timestamp
            this.init();
        }

        async init() {
            if (this.platform === 'unknown') {
                console.warn('不支持的平台:', location.host);
                return;
            }

            // 加载配置
            const autoEnable = await Utils.getStorage('auto_enable', true);
            if (!autoEnable) return;

            console.log(`[直播助手] 启动 - 平台: ${this.platform}`);

            // 启动评论监听
            new CommentObserver((comment) => this.handleComment(comment));

            // 防止手动输入时被覆盖
            document.addEventListener('focusin', (e) => {
                if (XPathUtil.query(this.inputSelector, e.target)) {
                    this.isProcessing = true; // 暂停自动回复
                }
            });

            document.addEventListener('focusout', (e) => {
                if (XPathUtil.query(this.inputSelector, e.target)) {
                    setTimeout(() => { this.isProcessing = false; }, 1000);
                }
            });
        }

        async handleComment(comment) {
            // 1. 基础过滤
            if (this.isFiltered(comment.text)) return;

            // 2. 频率控制
            if (!this.canReplyNow(comment.user)) return;

            if (this.isProcessing) return;
            this.isProcessing = true;

            try {
                const prompt = `回复观众「${comment.text}」：`;
                const reply = await this.ai.generate(prompt);
                if (!reply) throw new Error('AI未返回');

                await this.insertReply(reply);
                if (Config.REPLY.autoSend) {
                    await this.sendReply();
                }

                this.updateStats(comment.user);
            } catch (error) {
                console.error('[回复失败]', error.message);
            } finally {
                this.isProcessing = false;
            }
        }

        isFiltered(text) {
            const lower = text.toLowerCase();
            return Config.FILTER.blockedKeywords.some(kw => lower.includes(kw));
        }

        canReplyNow(user) {
            const now = Utils.now();
            const last = this.userCooldown.get(user) || 0;
            const onCooldown = now - last < Config.REPLY.cooldown;
            const rateLimited = this.replyCount >= Config.REPLY.maxPerMinute && (now - this.lastReplyTime) < 60000;

            return !onCooldown && !rateLimited;
        }

        updateStats(user) {
            this.userCooldown.set(user, Utils.now());
            this.replyCount++;
            if (Utils.now() - this.lastReplyTime > 60000) {
                this.replyCount = 1;
                this.lastReplyTime = Utils.now();
            }
        }

        async insertReply(text) {
            return new Promise(resolve => {
                XPathUtil.waitFor(this.inputSelector, (inputEl) => {
                    if (!inputEl) return resolve();

                    if (inputEl.tagName === 'TEXTAREA' || inputEl.tagName === 'INPUT') {
                        inputEl.value = text;
                        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    } else if (inputEl.isContentEditable) {
                        inputEl.textContent = text;
                        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    setTimeout(resolve, 300);
                });
            });
        }

        async sendReply() {
            return new Promise(resolve => {
                XPathUtil.waitFor(this.sendSelector, (btn) => {
                    if (btn && !btn.disabled) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        btn.click();
                        console.log('[已发送]');
                    }
                    setTimeout(resolve, 500);
                });
            });
        }
    }

    /**
     * ==================== 启动 ====================
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start);
        } else {
            start();
        }
    }

    function start() {
        setTimeout(() => {
            new LiveAssistant();
        }, 1000);
    }

    // 菜单命令
    if (typeof GM_registerMenuCommand !== 'undefined') {
        GM_registerMenuCommand('启动直播助手', start, 'A');
    }

    // 启动
    init();

})();