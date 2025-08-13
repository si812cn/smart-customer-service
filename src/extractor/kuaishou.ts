import { BaseExtractor, Message } from './base';
import { Logger } from '../utils/logger';

export class KuaishouExtractor extends BaseExtractor {
    constructor(logger?: Logger) {
        super('kuaishou', logger);
    }

    private parseTimestamp(el: Element): number {
        const timeAttr = el.getAttribute('data-timestamp');
        if (!timeAttr) return Date.now();
        const ts = parseInt(timeAttr, 10);
        return isNaN(ts) ? Date.now() : (ts < 10000000000 ? ts * 1000 : ts);
    }

    extractComments(): Message[] {
        try {
            const comments: Message[] = [];
            // 快手评论通常在 .comment-item 中
            const items = document.querySelectorAll('.comment-item:not([data-type="system"])');

            for (const el of items) {
                const userEl = el.querySelector('.username');
                const msgEl = el.querySelector('.content');

                const user = userEl?.textContent?.trim() || '未知用户';
                const msg = msgEl?.textContent?.trim() || '';

                if (!user || !msg) continue;

                comments.push({
                    id: this.generateId(),
                    user,
                    msg,
                    timestamp: Date.now(),
                    type: 'comment',
                    platform: this.platform
                });
            }

            return comments;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [KuaishouExtractorC]');
            return [];
        }
    }

    extractServiceMessages(): Message[] {
        try {
            const messages: Message[] = [];
            // 客服或系统消息，如“欢迎进入直播间”、“系统通知”等
            const items = document.querySelectorAll('.system-msg.service, .service-message');

            for (const el of items) {
                const msg = el.querySelector('.msg-text, .content')?.textContent?.trim();
                if (!msg) continue;

                messages.push({
                    id: this.generateId(),
                    user: '客服',
                    msg,
                    timestamp: this.parseTimestamp(el),
                    type: 'service',
                    platform: this.platform
                });
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [KuaishouExtractorS]');
            return [];
        }
    }

    extractAnchorMessages(): Message[] {
        try {
            const messages: Message[] = [];
            // 主播发言，可能带有 [主播] 标签或特定 class
            const items = document.querySelectorAll('.comment-item[data-user-type="anchor"], .anchor-speech');

            for (const el of items) {
                const msg = el.querySelector('.content')?.textContent?.trim();
                if (!msg) continue;

                messages.push({
                    id: this.generateId(),
                    user: '主播',
                    msg,
                    timestamp: this.parseTimestamp(el),
                    type: 'anchor',
                    platform: this.platform
                });
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [KuaishouExtractorA]');
            return [];
        }
    }
}