import { BaseExtractor, Message } from './base';
import { Logger } from '../utils/logger';

/**
 * 小红书（XiaoHongShu）评论提取器
 * 支持图文笔记、视频笔记、直播页面
 */
export class XiaoHongShuExtractor extends BaseExtractor {
    constructor(logger?: Logger) {
        super('xiaohongshu', logger); // ✅ 统一通过父类设置 platform 和 logger
    }

    private readonly COMMENT_SELECTOR = 'div[data-note-container] div.css-1v2ifuf, div[data-note-container] div.css-1e8nrl3';
    private readonly SERVICE_SELECTOR = 'div[data-note-container] div.css-1r33b0y'; // 官方账号标识
    private readonly USER_SELECTOR = 'span.css-1p8f43i, span.css-1v2ifuf span:first-child';
    private readonly CONTENT_SELECTOR = 'span.css-1p8f43i + span, div.css-1e8nrl3 span:nth-child(2)';
    private readonly TIMESTAMP_SELECTOR = 'time';

    /**
     * 提取普通用户评论
     */
    extractComments(): Message[] {
        try {
            const messages: Message[] = [];
            const commentElements = document.querySelectorAll(this.COMMENT_SELECTOR);

            for (const el of commentElements) {
                try {
                    const userEl = el.querySelector(this.USER_SELECTOR);
                    const contentEl = el.querySelector(this.CONTENT_SELECTOR);
                    const timeEl = el.querySelector(this.TIMESTAMP_SELECTOR);

                    if (!userEl || !contentEl) continue;

                    const user = userEl.textContent?.trim() || '未知用户';
                    const msg = contentEl.textContent?.trim() || '';
                    const timestamp = timeEl ? this.parseTime(timeEl.getAttribute('datetime') || '') : Date.now();

                    // 排除官方账号（属于 service 类型）
                    if (el.querySelector(this.SERVICE_SELECTOR)) {
                        continue;
                    }

                    messages.push({
                        id: this.generateId(), // ✅ 使用父类 generateId()
                        user,
                        msg,
                        timestamp,
                        type: 'comment',
                        platform: this.platform // ✅ 自动注入平台名
                    });
                } catch (error) {
                    this.logger.debug('[小红书] 解析单条评论失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [XiaoHongShuExtractorC]');
            return [];
        }
    }

    /**
     * 提取官方/客服消息
     */
    extractServiceMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const serviceElements = document.querySelectorAll(`${this.SERVICE_SELECTOR} > div`);

            for (const el of serviceElements) {
                try {
                    const parent = el.parentElement?.parentElement;
                    if (!parent) continue;

                    const userEl = parent.querySelector(this.USER_SELECTOR);
                    const contentEl = parent.querySelector(this.CONTENT_SELECTOR);

                    if (!userEl || !contentEl) continue;

                    const user = userEl.textContent?.trim() || '官方';
                    const msg = contentEl.textContent?.trim() || '';

                    messages.push({
                        id: this.generateId(),
                        user,
                        msg,
                        timestamp: Date.now(),
                        type: 'service',
                        platform: this.platform
                    });
                } catch (error) {
                    this.logger.debug('[小红书] 解析客服消息失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [XiaoHongShuExtractorS]');
            return [];
        }
    }

    /**
     * 提取主播消息（直播场景）
     */
    extractAnchorMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const liveChat = document.querySelector('div.chat-room-content');
            if (!liveChat) return messages;

            const chatItems = liveChat.querySelectorAll('div.message-item');
            for (const item of chatItems) {
                try {
                    const nicknameEl = item.querySelector('span.nickname');
                    const contentEl = item.querySelector('span.content');

                    if (!nicknameEl || !contentEl) continue;

                    const user = nicknameEl.textContent?.trim() || '主播';
                    const msg = contentEl.textContent?.trim() || '';

                    // 判断是否为主播发言
                    if (item.classList.contains('anchor') || item.querySelector('.anchor-tag')) {
                        messages.push({
                            id: this.generateId(),
                            user,
                            msg,
                            timestamp: Date.now(),
                            type: 'anchor',
                            platform: this.platform
                        });
                    }
                } catch (error) {
                    this.logger.debug('[小红书直播] 解析主播消息失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [XiaoHongShuExtractorA]');
            return [];
        }
    }

    /**
     * 可选：监听页面变化（与抖音/快手一致）
     */
    // observe(callback: () => void): MutationObserver {
    //     const observer = new MutationObserver((mutations) => {
    //         let shouldCallback = false;
    //         for (const mutation of mutations) {
    //             if (mutation.type === 'childList') {
    //                 for (const node of mutation.addedNodes) {
    //                     if (node.nodeType === 1) {
    //                         const el = node as Element;
    //                         if (
    //                             el.matches(this.COMMENT_SELECTOR) ||
    //                             el.querySelector(this.COMMENT_SELECTOR) ||
    //                             el.querySelector(this.SERVICE_SELECTOR) ||
    //                             el.querySelector('div.chat-room-content')
    //                         ) {
    //                             shouldCallback = true;
    //                             break;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         if (shouldCallback) {
    //             setTimeout(callback, 500); // 防抖
    //         }
    //     });
    //
    //     observer.observe(document.body, {
    //         childList: true,
    //         subtree: true
    //     });
    //
    //     return observer;
    // }

    /**
     * 解析时间字符串（ISO 格式或相对时间）
     */
    private parseTime(timeStr: string): number {
        if (!timeStr) return Date.now();
        const date = new Date(timeStr);
        return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }
}