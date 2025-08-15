import { AIProvider } from './AIProvider.js';

export class OpenAIProvider extends AIProvider {
    constructor(apiKey, model = "gpt-3.5-turbo") {
        super();
        this.apiKey = apiKey;
        this.model = model;
    }

    async chat(user, query, messages = [], { onChunk, signal } = {}) {
        const url = "https://api.openai.com/v1/chat/completions";

        const payload = {
            model: this.model,
            messages: [
                ...messages,
                { role: "user", content: query }
            ],
            stream: !!onChunk // 有 onChunk 才开启流
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'User-Agent': 'MyAIProxy/1.0'
            },
            body: JSON.stringify(payload),
            signal
        };

        let result = "";

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(`OpenAI Error: ${error.error?.message || response.status}`);
            }

            if (onChunk && response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        if (line.startsWith("data:")) {
                            const dataStr = line.slice(5).trim();
                            if (dataStr === "[DONE]") continue;

                            try {
                                const data = JSON.parse(dataStr);
                                const text = data.choices[0]?.delta?.content || "";
                                if (text) {
                                    result += text;
                                    onChunk(text);
                                }
                            } catch (e) {
                                // 忽略解析错误
                            }
                        }
                    }
                }
            } else {
                // 非流式
                const data = await response.json();
                result = data.choices[0]?.message?.content || "";
            }

            return result.trim();
        } catch (error) {
            if (signal?.aborted) return result;
            console.error("OpenAI 请求失败：", error);
            return result || "";
        }
    }
}