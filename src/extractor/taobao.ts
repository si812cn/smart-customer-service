import { BaseExtractor, Message } from './base';

/**
 * 淘宝直播 消息提取器
 * 用于提取直播间内的用户评论、主播发言、系统消息等
 * 页面示例：https://v.taobao.com/
 */
export class TaobaoExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'taobao-live'; // ✅ 统一平台标识
    }

    /**
     * 提取用户弹幕/评论
     */
    extractComments(): Message[] {
        const comments: Message[] = [];
        // 淘宝直播常见消息容器类名
        document.querySelectorAll('.comment-item, .barrage-item, .msg-item').forEach(el => {
            try {
                // 用户名（可能被隐藏或匿名）
                const userEl = el.querySelector('.usernick, .sender-nick, .user-name');
                // 消息内容
                const msgEl = el.querySelector('.text-content, .content-text, .msg-content');

                const user = userEl?.textContent?.trim() || '匿名买家';
                const msg = msgEl?.textContent?.trim() || '';

                if (!msg) return;

                // 过滤系统行为（进入、关注、点赞等）
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
                console.debug('[TaobaoLiveExtractor] 解析评论失败', e);
            }
        });
        return comments;
    }

    /**
     * 提取主播发言（通常有“主播”标签）
     */
    extractAnchorMessages(): Message[] {
        const messages: Message[] = [];
        document.querySelectorAll('.comment-item, .msg-item').forEach(el => {
            try {
                const roleTag = el.querySelector('.role-label, .anchor-tag')?.textContent;
                const isAnchor = roleTag === '主播' || roleTag === 'host';

                if (!isAnchor) return;

                const user = '主播';
                const msg = el.querySelector('.text-content, .content-text')?.textContent?.trim();

                if (!msg) return;

                messages.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'anchor',
                    platform: this.platform
                });
            } catch (e) {
                console.debug('[TaobaoLiveExtractor] 解析主播消息失败', e);
            }
        });
        return messages;
    }

    /**
     * 判断是否为系统消息（如“XXX进入直播间”、“点赞”等）
     */
    private isSystemMessage(text: string): boolean {
        return /进入直播间|点赞了|关注了|送出了|加入粉丝团|拍下订单|分享了/.test(text);
    }

    /**
     * 提取商品推荐消息（可选）
     */
    extractProductTips(): Message[] {
        const tips: Message[] = [];
        document.querySelectorAll('.item-recommend, .product-tip').forEach(el => {
            try {
                const product = el.querySelector('.title, .product-name')?.textContent?.trim();
                if (!product) return;

                tips.push({
                    user: '系统',
                    msg: `推荐商品：${product}`,
                    time: Date.now(),
                    type: 'product',
                    platform: this.platform,
                    metadata: {
                        product
                    }
                });
            } catch (e) {
                console.debug('[TaobaoLiveExtractor] 解析商品提示失败', e);
            }
        });
        return tips;
    }
}