import { BaseExtractor, Message } from './base';

export class ShipinHaoExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'shipinhao';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        // 视频号直播间评论选择器
        document.querySelectorAll('.comment-item').forEach(el => {
            const user = el.querySelector('.nickname')?.textContent || '';
            const msg = el.querySelector('.content')?.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'shipinhao'
                });
            }
        });
        return comments;
    }

    extractAnchorMessages(): Message[] {
        const messages: Message[] = [];
        document.querySelectorAll('.anchor-comment').forEach(el => {
            const msg = el.textContent || '';
            if (msg) {
                messages.push({
                    user: '主播',
                    msg,
                    time: Date.now(),
                    type: 'anchor',
                    platform: 'shipinhao'
                });
            }
        });
        return messages;
    }
}