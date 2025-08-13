import { BaseExtractor, Message } from './base';
import { Logger } from '../utils/logger';

/**
 * 微信视频号（WeChat Video）评论提取器
 * 适用于视频号直播/短视频评论区（运行于内嵌环境或模拟器）
 */
export class ShipinHaoExtractor extends BaseExtractor {
    constructor(logger?: Logger) {
        super('wechat-video', logger); // ✅ 统一平台标识
    }

    // 评论项通用类名（根据逆向分析常见结构）
    private readonly COMMENT_ITEM_SELECTOR = '.comment-item, .feeds-item .comment-content';
    private readonly USER_NAME_SELECTOR = '.nickname, .username';
    private readonly CONTENT_SELECTOR = '.text, .content';
    private readonly TIMESTAMP_SELECTOR = '.time';
    private readonly ANCHOR_TAG_SELECTOR = '.role-label[role="anchor"], .anchor-badge';

    /**
     * 提取普通用户评论
     */
    extractComments(): Message[] {
        try {
            const messages: Message[] = [];
            const items = document.querySelectorAll(this.COMMENT_ITEM_SELECTOR);

            for (const item of items) {
                try {
                    const userEl = item.querySelector(this.USER_NAME_SELECTOR);
                    const contentEl = item.querySelector(this.CONTENT_SELECTOR);
                    const timeEl = item.querySelector(this.TIMESTAMP_SELECTOR);

                    if (!userEl || !contentEl) continue;

                    const user = userEl.textContent?.trim() || '未知用户';
                    const msg = contentEl.textContent?.trim() || '';
                    const timestamp = timeEl
                        ? this.parseTime(timeEl.textContent || '')
                        : Date.now();

                    // 排除主播发言（属于 anchor 类型）
                    if (item.querySelector(this.ANCHOR_TAG_SELECTOR)) {
                        continue;
                    }

                    // 排除系统消息（如“XXX 进入直播间”）
                    if (this.isSystemMessage(msg)) {
                        continue;
                    }

                    messages.push({
                        id: this.generateId(),
                        user,
                        msg,
                        timestamp,
                        type: 'comment',
                        platform: this.platform
                    });
                } catch (error) {
                    this.logger.debug('[微信视频号] 解析单条评论失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [WeChatVideoExtractorC]');
            return [];
        }
    }

    /**
     * 提取系统消息（进入、关注、礼物等）
     */
    extractServiceMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const liveArea = document.querySelector('.live-comment-container') ||
                document.querySelector('.chat-room');

            if (!liveArea) return messages;

            // 系统消息通常以独立样式存在
            const systemItems = liveArea.querySelectorAll('.system-msg, .gift-msg, .action-msg');
            for (const el of systemItems) {
                try {
                    const text = el.textContent?.trim();
                    if (!text || !this.isSystemMessage(text)) continue;

                    messages.push({
                        id: this.generateId(),
                        user: '系统',
                        msg: text,
                        timestamp: Date.now(),
                        type: 'service',
                        platform: this.platform
                    });
                } catch (error) {
                    this.logger.debug('[微信视频号] 解析系统消息失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [WeChatVideoExtractorS]');
            return [];
        }
    }

    /**
     * 提取主播发言
     */
    extractAnchorMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const items = document.querySelectorAll(this.COMMENT_ITEM_SELECTOR);

            for (const item of items) {
                try {
                    const userEl = item.querySelector(this.USER_NAME_SELECTOR);
                    const contentEl = item.querySelector(this.CONTENT_SELECTOR);

                    if (!userEl || !contentEl) continue;

                    // 判断是否为主播
                    if (!item.querySelector(this.ANCHOR_TAG_SELECTOR)) {
                        continue;
                    }

                    const user = '主播';
                    const msg = contentEl.textContent?.trim() || '';

                    messages.push({
                        id: this.generateId(),
                        user,
                        msg,
                        timestamp: Date.now(),
                        type: 'anchor',
                        platform: this.platform
                    });
                } catch (error) {
                    this.logger.debug('[微信视频号] 解析主播消息失败', error);
                }
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [WeChatVideoExtractorA]');
            return [];
        }
    }

    /**
     * 判断是否为系统消息
     */
    private isSystemMessage(text: string): boolean {
        return /进入直播间|关注了主播|送出了礼物|点亮了|加入粉丝团|开通了会员/.test(text);
    }

    /**
     * 解析时间文本（如“刚刚”、“5分钟前”、“14:20”）
     */
    private parseTime(timeText: string): number {
        const now = Date.now();
        if (!timeText) return now;

        // 示例处理（可根据实际格式扩展）
        if (timeText === '刚刚') return now;
        if (timeText.includes('分钟前')) {
            const minutes = parseInt(timeText, 10);
            return now - minutes * 60 * 1000;
        }
        if (timeText.includes('小时前')) {
            const hours = parseInt(timeText, 10);
            return now - hours * 60 * 60 * 1000;
        }
        if (/\d{2}:\d{2}/.test(timeText)) {
            const [h, m] = timeText.split(':').map(Number);
            const today = new Date();
            today.setHours(h, m, 0, 0);
            return today.getTime();
        }

        return now;
    }
}