import { BaseExtractor, Message } from './base';

export class TikTokExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'tiktok';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        document.querySelectorAll('div[data-e2e="comment-item"]').forEach(el => {
            const user = el.querySelector('p[data-e2e="comment-username"]')?.textContent || '';
            const msg = el.querySelector('p[data-e2e="comment-text"]')?.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'tiktok'
                });
            }
        });
        return comments;
    }

    extractServiceMessages(): Message[] {
        return [];
    }

    extractAnchorMessages(): Message[] {
        return [];
    }
}