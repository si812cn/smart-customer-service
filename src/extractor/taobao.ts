import { BaseExtractor, Message } from './base';

export class TaobaoExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'taobao';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        document.querySelectorAll('#broad-list li').forEach(el => {
            const user = el.querySelector('.user')?.textContent || '';
            const msg = el.querySelector('.msg')?.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'taobao'
                });
            }
        });
        return comments;
    }

    extractServiceMessages(): Message[] {
        const messages: Message[] = [];
        document.querySelectorAll('.service-msg').forEach(el => {
            const msg = el.textContent || '';
            if (msg) {
                messages.push({
                    user: '客服',
                    msg,
                    time: Date.now(),
                    type: 'service',
                    platform: 'taobao'
                });
            }
        });
        return messages;
    }
}