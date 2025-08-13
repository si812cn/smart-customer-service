export class GPTAI {
    private apiKey: string;
    private model: string = 'gpt-3.5-turbo';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async reply(prompt: string, context: { role: string; content: string }[] = []): Promise<string> {
        const messages = [
            ...context,
            { role: 'user', content: prompt }
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await response.json();
        return data.choices[0].message.content;
    }
}