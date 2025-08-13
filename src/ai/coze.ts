// Coze API 代理
export class CozeAI {
    private botId: string;
    private apiKey: string;

    constructor(botId: string, apiKey: string) {
        this.botId = botId;
        this.apiKey = apiKey;
    }

    async reply(msg: string, context: any[] = []): Promise<string> {
        const response = await fetch(`https://api.coze.com/v1/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: this.botId,
                user_id: 'user-123',
                query: msg,
                conversation_id: 'conv-123',
                stream: false
            })
        });

        const data = await response.json();
        return data.messages?.find((m: any) => m.type === 'answer')?.content || '请稍等';
    }
}