import { BaseExtractor, Message } from './base';
import { Logger } from '../utils/logger'; // 确保路径正确

export class DouyinExtractor extends BaseExtractor {
    constructor(logger?: Logger) {
        super('douyin', logger); // ✅ 通过构造函数传参
    }

    private parseTimestamp(el: Element, attr = 'data-time'): number {
        const timeStr = el.getAttribute(attr);
        if (!timeStr) return Date.now();
        const ts = parseInt(timeStr);
        return ts < 10000000000 ? ts * 1000 : ts;
    }

    extractComments(): Message[] {
        try {
            const comments: Message[] = [];
            const items = document.querySelectorAll('div[data-airef="comment_item"]');

            for (const el of items) {
                const userEl = el.querySelector('.webcast-chatroom___user-name');
                const msgEl = el.querySelector('.webcast-chatroom___content');

                const user = userEl?.textContent?.trim() || '未知用户';
                const msg = msgEl?.textContent?.trim() || '';

                if (!user || !msg) continue;

                comments.push({
                    id: this.generateId(),        // ✅ 生成唯一 ID
                    user,
                    msg,
                    timestamp: Date.now(),        // ⚠️ 若无法获取真实时间，可用当前时间
                    type: 'comment',
                    platform: this.platform       // ✅ 使用父类 platform
                });
            }

            return comments;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [DouyinExtractorC]');
            return [];
        }
    }

    extractServiceMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const items = document.querySelectorAll('.chat-item.service');

            for (const el of items) {
                const msg = el.querySelector('.msg-content')?.textContent?.trim();
                if (!msg) continue;

                messages.push({
                    id: this.generateId(),
                    user: '客服',
                    msg,
                    timestamp: Date.now(),
                    type: 'service',
                    platform: this.platform
                });
            }

            return messages;
        } catch (err: unknown) {
            this.logger.warn('当前页面不受支持 [DouyinExtractorS]');
            return [];
        }
    }

    extractAnchorMessages(): Message[] {
        try {
            const messages: Message[] = [];
            const items = document.querySelectorAll('.chat-item.anchor');

            for (const el of items) {
                const msg = el.querySelector('.msg-content')?.textContent?.trim();
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
            this.logger.warn('当前页面不受支持 [DouyinExtractorA]');
            return [];
        }
    }

    // 可选：重写 observe，更精细控制
    // observe(callback: () => void): MutationObserver { ... }
    // observer.observe(() => update(), '#chat-list');//调用时可指定区域：
}