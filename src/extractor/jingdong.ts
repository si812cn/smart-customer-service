import { BaseExtractor, Message } from './base';

/**
 * 京东直播 消息提取器
 * 用于提取直播间内的用户评论、主播发言等
 */
export class JingDongExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'jd-live'; // ✅ 统一平台标识
    }

    /**
     * 提取直播间用户评论
     */
    extractComments(): Message[] {
        const comments: Message[] = [];
        // 京东直播常见聊天消息类名（根据公开页面结构推测）
        document.querySelectorAll('.chat-item, .msg-item').forEach(el => {
            try {
                // 用户名
                const userEl = el.querySelector('.user-name, .nickname');
                // 消息内容
                const msgEl = el.querySelector('.msg-content, .content');

                const user = userEl?.textContent?.trim() || '匿名用户';
                const msg = msgEl?.textContent?.trim() || '';

                if (!msg) return;

                // 排除系统消息（如“进入直播间”、“关注了主播”）
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
                console.debug('[JdLiveExtractor] 解析评论失败', e);
            }
        });
        return comments;
    }

    /**
     * 判断是否为系统消息
     */
    private isSystemMessage(text: string): boolean {
        return /进入直播间|关注了|送出了礼物|点赞了/.test(text);
    }

    /**
     * 提取主播发言（通常有特殊标识）
     */
    extractAnchorMessages(): Message[] {
        const messages: Message[] = [];
        document.querySelectorAll('.chat-item, .msg-item').forEach(el => {
            try {
                const roleTag = el.querySelector('.role-label, .anchor-tag')?.textContent;
                const isAnchor = roleTag === '主播' || roleTag === 'Host';

                if (!isAnchor) return;

                const user = '主播';
                const msg = el.querySelector('.msg-content, .content')?.textContent?.trim();

                if (!msg) return;

                messages.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'anchor',
                    platform: this.platform
                });
            } catch (e) {
                console.debug('[JdLiveExtractor] 解析主播消息失败', e);
            }
        });
        return messages;
    }
}