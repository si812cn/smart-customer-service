import { Message } from '../extractor/base';
import { CozeAI } from './coze';
import { GPTAI } from './gpt';

export class AIContext {
    private coze: CozeAI;
    private gpt: GPTAI;
    private chatHistory: { role: string; content: string }[] = [];

    constructor(cozeBotId: string, cozeKey: string, gptKey: string) {
        this.coze = new CozeAI(cozeBotId, cozeKey);
        this.gpt = new GPTAI(gptKey);
    }

    async process(message: Message): Promise<string> {
        // 添加用户消息到上下文
        this.chatHistory.push({ role: 'user', content: message.msg });

        // 使用 Coze 优先回复
        let reply = await this.coze.reply(message.msg, this.chatHistory);

        // 如果 Coze 失败，使用 GPT 备用
        if (!reply || reply.includes('错误')) {
            reply = await this.gpt.reply(message.msg, this.chatHistory);
        }

        // 添加 AI 回复到上下文
        this.chatHistory.push({ role: 'assistant', content: reply });

        return reply;
    }

    clear(): void {
        this.chatHistory = [];
    }
}