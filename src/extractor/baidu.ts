import { BaseExtractor, Message } from './base';

export class BaiduExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'baidu';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        document.querySelectorAll('.chat-item').forEach(el => {
            const user = el.querySelector('.user-name')?.textContent || '';
            const msg = el.querySelector('.msg-text')?.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'baidu'
                });
            }
        });
        return comments;
    }
}