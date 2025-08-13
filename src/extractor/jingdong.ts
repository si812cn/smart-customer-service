import { BaseExtractor, Message } from './base';

export class JingDongExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'jingdong';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        document.querySelectorAll('.chat-msg-item').forEach(el => {
            const user = el.querySelector('.user-name')?.textContent || '';
            const msg = el.querySelector('.msg-content')?.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'jingdong'
                });
            }
        });
        return comments;
    }
}