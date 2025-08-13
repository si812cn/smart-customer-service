import { ConfigManager } from '../config/config';

export class WaterArmy {
    private config = new ConfigManager();
    private speakingCount: number = 0;
    private lastSpeakTime: number = 0;

    async speak(msg: string): Promise<void> {
        const now = Date.now();
        const limit = this.config.get<number>('speakLimit');
        const timeLimit = this.config.get<number>('timeLimit') * 1000;

        // 频率控制
        if (now - this.lastSpeakTime < timeLimit) {
            if (this.speakingCount >= limit) {
                return; // 超过发言频率
            }
        } else {
            this.speakingCount = 0;
        }

        // 模拟真实用户输入
        this.simulateTyping(msg);
        this.speakingCount++;
        this.lastSpeakTime = now;
    }

    private simulateTyping(msg: string): void {
        // 模拟打字机效果
        const input = document.querySelector('input.comment-input') as HTMLInputElement;
        if (input) {
            input.focus();
            for (let i = 0; i < msg.length; i++) {
                setTimeout(() => {
                    input.value = msg.slice(0, i + 1);
                    input.dispatchEvent(new Event('input'));
                }, i * 100);
            }
            setTimeout(() => {
                // 触发表单提交
                const btn = document.querySelector('.send-btn');
                btn?.dispatchEvent(new Event('click'));
            }, msg.length * 100 + 500);
        }
    }
}