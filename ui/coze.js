/**
 * Coze API 客户端类，用于与 Coze Bot 进行交互。
 * 支持创建会话、发送消息，并通过 SSE 流式接收 AI 响应。
 *
 * @class Coze
 */
class Coze {
    /**
     * 单例实例
     * @type {Coze|null}
     * @private
     */
    static instance = null;

    /**
     * 构造函数
     * @param {string} BOT_ID - Bot 的唯一标识符
     * @param {string} API_KEY - 用户的 API 密钥（Bearer Token）
     */
    constructor(BOT_ID, API_KEY) {
        if (Coze.instance) {
            console.warn("Coze 已初始化，返回已有实例。");
            return Coze.instance;
        }

        if (!BOT_ID || !API_KEY) {
            throw new Error("BOT_ID 和 API_KEY 是必需的参数。");
        }

        this.BOT_ID = BOT_ID;
        this.API_KEY = API_KEY;
        this.conversations = {}; // 存储用户与 conversation_id 的映射

        Coze.instance = this;
    }

    /**
     * 为指定用户创建一个新的会话（若尚未存在）
     * @param {string} user - 用户唯一标识
     * @returns {Promise<string>} 返回 conversation_id，失败时返回空字符串
     */
    async CreateConversation(user) {
        if (this.conversations[user]) {
            return this.conversations[user];
        }

        const url = "https://api.coze.cn/v1/conversation/create";
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`
            },
            body: JSON.stringify({})
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`创建会话失败 [${response.status}]:`, errorData);
                return "";
            }

            const data = await response.json();
            const conversationId = data.data?.id;

            if (conversationId) {
                this.conversations[user] = conversationId;
                return conversationId;
            } else {
                console.error("创建会话成功但未返回 ID:", data);
                return "";
            }
        } catch (error) {
            console.error("网络或请求错误，创建会话失败：", error);
            return "";
        }
    }

    /**
     * 向 Coze Bot 发送消息并流式接收响应
     * @param {string} conversation_id - 会话 ID（可选，将被 CreateConversation 覆盖）
     * @param {string} user - 用户唯一标识
     * @param {string} query - 用户输入的问题
     * @param {Array<Object>} messages - 历史消息列表（格式：{ role: 'user' | 'assistant', content: string, content_type: 'text' }）
     * @returns {Promise<string>} AI 的完整响应文本
     */
    async ChatCozeV3(conversation_id, user, query, messages) {
        // 确保每个用户都有独立的会话
        conversation_id = await this.CreateConversation(user);
        if (!conversation_id) {
            console.error("无法获取有效的 conversation_id");
            return "";
        }

        const url = `https://api.coze.cn/v3/chat?conversation_id=${conversation_id}`;
        const payload = {
            bot_id: this.BOT_ID,
            user_id: user,
            query: query,
            additional_messages: [...messages, {
                role: "user",
                content: query,
                content_type: "text"
            }],
            stream: true,
            auto_save_history: true
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`
            },
            body: JSON.stringify(payload)
        };

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Chat 请求失败 [${response.status}]:`, errorText);
                return "";
            }

            if (!response.body) {
                console.error("响应体为空，无法读取流数据。");
                return "";
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let result = "";

            // 流式解析 Server-Sent Events (SSE)
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();

                    // 检查是否为 delta 事件
                    if (line.startsWith("event:conversation.message.delta")) {
                        // 查找紧接着的 data: 行
                        let dataLine = null;
                        for (let j = i + 1; j < lines.length; j++) {
                            if (lines[j].startsWith("data:")) {
                                dataLine = lines[j];
                                break;
                            }
                        }

                        if (dataLine) {
                            try {
                                const jsonString = dataLine.slice(5).trim(); // 移除 "data:"
                                const data = JSON.parse(jsonString);

                                // 只处理文本内容
                                if (data.content_type === "text" && data.content) {
                                    result += data.content;
                                }
                            } catch (e) {
                                console.warn("解析 SSE 数据失败：", e, dataLine);
                            }
                        }
                    }
                }
            }

            return result.trim();
        } catch (error) {
            console.error("AI 请求过程中发生异常：", error);
            return "";
        }
    }
}

/**
 * 便捷函数：直接调用 Coze Bot 并返回响应
 * @param {string} botId - Bot ID
 * @param {string} apiKey - API Key
 * @param {string} user - 用户标识
 * @param {string} query - 用户提问内容
 * @returns {Promise<string>} AI 的响应文本
 *
 * @example
 * const response = await chatCozeAPI("7xxxxxxxx", "your-api-key", "user123", "你好呀！");
 * console.log(response);
 */
async function chatCozeAPI(botId, apiKey, user, query) {
    try {
        const coze = new Coze(botId, apiKey);
        const response = await coze.ChatCozeV3("", user, query, []);
        return response;
    } catch (error) {
        console.error("调用 chatCozeAPI 时出错：", error);
        return "";
    }
}

// 可选导出（适用于模块环境）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Coze, chatCozeAPI };
}