import { AIProvider } from './AIProvider.js';
import { Utils } from '../utils/index.js';

/**
 * Coze API 接口常量
 */
const COZE_API = {
    CONVERSATION_CREATE: "https://api.coze.cn/v1/conversation/create",
    CHAT_STREAM: "https://api.coze.cn/v3/chat"
    // 后续可扩展其他接口
};

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
        this.conversations = new Map(); // 推荐使用 Map 更安全

        Coze.instance = this;
    }

    /**
     * 为指定用户创建一个新的会话（若尚未存在）
     * @param {string} botId - 直播间主播ID
     * @param {string} nickname - 用户昵称
     * @returns {Promise<string>} 返回 conversation_id，失败时返回空字符串
     */
    async createConversation(botId, nickname) {
        // 1. 参数校验
        if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
            console.error("❌ 用户昵称不能为空或非字符串");
            return "";
        }

        const cleanUser = nickname.trim();
        // 使用 botId + user 生成 sessionKey（防止不同 bot 的会话冲突）
        const sessionKey = Utils.createSessionKey(botId, nickname);

        // 2. 检查缓存
        const cachedId = this.conversations.get(sessionKey);
        if (cachedId) {
            return cachedId;
        }

        // 3. 配置请求
        const url = COZE_API.CONVERSATION_CREATE;
        const controller = new AbortController();
        const timeoutMs = 10000; // 10秒超时
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`,
                'User-Agent': 'CozeJSClient/1.0 (ChromeExtension)'
            },
            body: JSON.stringify({}),
            signal: controller.signal
        };

        // 4. 重试机制（最多 2 次）
        const MAX_RETRIES = 2;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(url, requestOptions);

                // 清除超时定时器
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.msg || `HTTP ${response.status}`;

                    if (attempt < MAX_RETRIES) {
                        const delay = 1000 * Math.pow(2, attempt); // 1s, 2s
                        console.warn(`⚠️ 请求失败 [${errorMsg}]，${delay}ms 后重试...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    } else {
                        console.error(`❌ 最终失败: 创建会话失败 [${errorMsg}]`, errorData);
                        return "";
                    }
                }

                const data = await response.json();
                const conversationId = data?.data?.id;

                if (!conversationId || typeof conversationId !== 'string') {
                    console.error("❌ 创建会话成功但未返回有效的 conversation_id:", data);
                    return "";
                }

                // ✅ 正确设置缓存：sessionKey → conversationId
                this.conversations.set(sessionKey, conversationId);
                console.log(`✅ 会话创建成功: ${sessionKey} → ${conversationId}`);
                return conversationId;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {
                    console.warn(`⏰ 请求超时（${timeoutMs}ms）`);
                } else {
                    console.error("❌ 网络错误:", error);
                }

                if (attempt >= MAX_RETRIES) {
                    console.error("❌ 所有重试均已耗尽");
                    return "";
                }

                // 重试前等待
                const delay = 1000 * Math.pow(2, attempt);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        return "";
    }

    /**
     * 向 Coze Bot 发送消息并流式接收响应
     * @param {string} botId - 直播间主播ID
     * @param {string} nickname - 用户昵称
     * @param {string} query - 用户输入的问题
     * @param {Array<Object>} messages - 历史消息列表
     * @param {Object} options - 可选配置
     * @param {function(string): void} options.onChunk - 每收到一个文本片段时调用
     * @param {AbortSignal} options.signal - 可选的取消信号
     * @returns {Promise<string>} AI 的完整响应文本
     */
    async chatCozeV3(botId, nickname, query, messages = [], { onChunk, signal } = {}) {
        if (!nickname || !query) {
            console.error("用户昵称和查询内容不能为空");
            return "";
        }

        let conversation_id = await this.createConversation(botId, nickname);
        if (!conversation_id) {
            console.error("无法获取有效的 conversation_id");
            return "";
        }

        const url = `${COZE_API.CHAT_STREAM}?conversation_id=${conversation_id}`;
        const payload = {
            bot_id: botId,
            user_id: nickname,
            query: query,
            additional_messages: [
                ...messages,
                { role: "user", content: query, content_type: "text" }
            ],
            stream: true,
            auto_save_history: true
        };

        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.API_KEY}`,
                'User-Agent': 'CozeJSClient/1.0 (ChromeExtension)'
            },
            body: JSON.stringify(payload),
            signal // 支持取消
        };

        let result = "";

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                const errorText = await response.text().catch(() => "未知错误");
                console.error(`Chat 请求失败 [${response.status}]:`, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            if (!response.body) {
                throw new Error("响应体为空，无法读取流数据。");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = ""; // 用于拼接不完整的行

            let isCompletedEvent = false; // 标记是否进入 completed 事件

            while (true) {
                if (signal?.aborted) {
                    reader.cancel();
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                const lines = buffer.split("\n");
                buffer = lines.pop() || ""; // 保留未完整行

                for (const line of lines) {
                    const trimmed = line.trim();

                    // === 处理事件类型 ===
                    if (trimmed.startsWith("event:")) {
                        const eventType = trimmed.slice(6).trim();
                        if (eventType === "conversation.message.completed") {
                            isCompletedEvent = true;
                            // 不做任何拼接！避免重复
                        } else if (eventType === "conversation.message.delta") {
                            isCompletedEvent = false; // 重置
                        }
                        continue;// 下一行是 data
                    }

                    // === 处理数据 ===
                    if (trimmed.startsWith("data:")) {
                        const jsonString = trimmed.slice(5).trim();
                        if (!jsonString || jsonString === "[DONE]") continue;

                        try {
                            const data = JSON.parse(jsonString);

                            // 只处理 delta 事件中的文本增量
                            if (!isCompletedEvent && data.content_type === "text" && data.content) {
                                result += data.content;
                                onChunk?.(data.content); // 实时返回增量内容
                            }

                            // 如果是 completed 事件，只取最终内容（可选：覆盖 result）
                            if (isCompletedEvent && data.event === "conversation.message.completed") {
                                // 可选：用 completed 的 content 覆盖 result（更准确）
                                // 但通常 delta 已完整，可忽略
                                console.log("【completed】完整响应已接收");
                            }
                        } catch (e) {
                            console.warn("解析 SSE 数据失败：", e, jsonString);
                        }
                    }
                }
            }

            // 处理最后 buffer 中可能的残留
            if (buffer.trim()) {
                try {
                    const data = JSON.parse(buffer.trim());

                    // ✅ 只有在不是 completed 事件时，才处理 text 类型的增量
                    if (!isCompletedEvent && data.content_type === "text" && data.content) {
                        result += data.content;
                        onChunk?.(data.content);
                    }

                    // 如果是 completed 事件，不要拼接（避免重复）
                    // 可以在这里做收尾日志
                    if (isCompletedEvent && data.event === "conversation.message.completed") {
                        console.log("【completed】最终消息已接收");
                    }

                } catch (e) {
                    console.warn("解析残留数据失败：", e, buffer);
                }
            }

            return result.trim();
        } catch (error) {
            if (signal?.aborted) {
                console.log("请求已取消");
                return result.trim(); // 返回已接收的部分
            }
            console.error("AI 请求过程中发生异常：", error);
            return result.trim(); // 失败时也返回已接收内容
        }
    }
}

/**
 * CozeProvider 类
 *
 * 说明：
 * 这是一个适配器类，用于将 Coze API 封装成符合 AIProvider 接口规范的实现。
 * 它使得 Coze 可以和其他 AI 服务（如 OpenAI）一样，通过统一的 handleCallAI 入口调用。
 *
 * 设计模式：适配器模式（Adapter Pattern）
 * 目的：解耦主逻辑与具体 AI 平台的实现细节
 */
export class CozeProvider extends AIProvider {
    /**
     * 构造函数：初始化 Coze 提供商实例
     *
     * @param {string} botId - Coze 平台中机器人的唯一标识 ID
     * @param {string} apiKey - 用于身份认证的 API 密钥（Bearer Token）
     *
     * 注意：
     * - botId 和 apiKey 是调用 Coze API 所必需的身份凭证
     * - 建议通过环境变量或安全存储传入，避免硬编码在代码中
     */
    constructor(botId, apiKey) {
        // 调用父类 AIProvider 的构造函数（虽然当前为空，但保留扩展性）
        super();

        // 保存传入的 botId，用于后续 API 调用
        this.botId = botId;

        // 保存 API 密钥，用于请求头 Authorization 字段
        this.apiKey = apiKey;

        // 创建 Coze SDK 实例，复用已有的 chatCozeV3 等方法
        // 优点：避免重复实现网络请求、流式处理等复杂逻辑
        this.coze = new Coze(botId, apiKey);
    }

    /**
     * 实现父类的 chat 方法：发送消息并获取 AI 回复
     *
     * @param {string} user - 用户唯一标识（可用于会话跟踪）
     * @param {string} query - 用户输入的查询内容
     * @param {Array} messages - 历史对话消息列表（格式：{ role: "user"|"assistant", content: "..." }）
     * @param {Object} options - 可选配置项
     *   - {Function} onChunk: 流式输出回调函数，接收每次返回的文本片段
     *   - {AbortSignal} signal: 用于取消请求的信号（AbortController.signal）
     *
     * @returns {Promise<string>} 返回完整的 AI 回复文本
     *
     * 异常处理：
     * - 如果调用失败，捕获错误并返回空字符串，保证调用方不会因异常中断
     * - 错误信息会输出到控制台，便于调试
     */
    async chat(user, query, messages = [], options = {}) {
        try {
            // 调用 Coze 实例的 chatCozeV3 方法，发起流式或非流式请求
            // 支持 onChunk 流式输出 和 signal 请求取消
            const response = await this.coze.chatCozeV3(this.botId, user, query, messages, options);

            // 成功时返回完整响应内容
            return response;
        } catch (error) {
            // 捕获所有异常（网络错误、解析错误、超时等）
            console.error("调用 chatCozeAPI 时出错：", error);

            // 返回空字符串作为降级处理，避免调用方崩溃
            // 可根据业务需求改为抛出错误或返回默认回复
            return "";
        }
    }
}

// 兼容性导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Coze, chatCozeAPI };
} else if (typeof window !== 'undefined') {
    window.Coze = Coze;
    window.chatCozeAPI = chatCozeAPI;
}