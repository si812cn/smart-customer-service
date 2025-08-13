import { BaseExtractor, Message } from './base';

export class XiaoHongShuExtractor extends BaseExtractor {
    constructor() {
        super();
        this.platform = 'xiaohongshu';
    }

    extractComments(): Message[] {
        const comments: Message[] = [];
        document.querySelectorAll('.comment-content').forEach(el => {
            const user = el.querySelector('.user')?.textContent || '';
            const msg = el.textContent || '';
            if (user && msg) {
                comments.push({
                    user,
                    msg,
                    time: Date.now(),
                    type: 'comment',
                    platform: 'xiaohongshu'
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