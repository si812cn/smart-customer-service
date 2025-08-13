import { BaseExtractor, Message } from './base';

/**
 * TikTok 直播 消息提取器
 * 用于提取 TikTok 直播间内的用户评论、主播发言等
 * 注意：TikTok 页面结构为英文类名，且高度动态
 */
export class TikTokExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'tiktok-live'; // ✅ 统一平台标识
    }

    /**
     * 提取用户评论（弹幕）
     */
    extractComments(): Message[] {
        const comments: Message[] = [];
        // TikTok 直播常见消息容器（基于公开页面结构分析）
        document.querySelectorAll('div[data-e2e="chat-item"], .chat-item, .message-item').forEach(el => {
            try {
                // 用户名（TikTok 常见 data-e2e 属性）
                const userEl = el.querySelector('[data-e2e="chat-author-name"], .chat-author-name');
                // 消息内容
                const msgEl = el.querySelector('[data-e2e="chat-content"], .chat-content, .message-content');

                const user = userEl?.textContent?.trim() || 'Anonymous';
                const msg = msgEl?.textContent?.trim() || '';

                if (!msg) return;

                // 过滤系统行为（进入、点赞、送礼等）
                if (this.isSystemMessage(msg)) {
                    return;
                }

                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: this.platform
                });
            } catch (e) {
                console.debug('[TikTokLiveExtractor] Failed to parse comment', e);
            }
        });
        return comments;
    }

    /**
     * 判断是否为系统消息（如 "joined live", "sent gift"）
     */
    private isSystemMessage(text: string): boolean {
        const lower = text.toLowerCase();
        return /joined the live|sent a gift|liked the stream|is now following/.test(lower);
    }

    /**
     * 提取主播发言（通常有特殊标识或高亮样式）
     */
    extractAnchorMessages(): Message[] {
        const messages: Message[] = [];
        document.querySelectorAll('div[data-e2e="chat-item"]').forEach(el => {
            try {
                // 主播消息可能有特殊样式或包含 "Host" 标签
                const roleTag = el.querySelector('.role-label, .host-tag, [data-e2e="host-label"]');
                const isAnchor = !!roleTag && ['Host', '主播'].includes(roleTag.textContent?.trim());

                if (!isAnchor) return;

                const user = 'Host';
                const msg = el.querySelector('[data-e2e="chat-content"]')?.textContent?.trim();

                if (!msg) return;

                messages.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'anchor',
                    platform: this.platform
                });
            } catch (e) {
                console.debug('[TikTokLiveExtractor] Failed to parse host message', e);
            }
        });
        return messages;
    }
}