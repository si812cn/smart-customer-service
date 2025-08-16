import { Utils } from '../utils/index.js';
import { CozeProvider } from '../services/cozeProvider.js';
import { OpenAIProvider } from '../services/openaiProvider.js';

/**
 * 处理 AI 回复请求
 * @returns {Promise<{ reply?: string, error?: string }>}
 */
export const handleCallAI = async (request, sender) => {
    try {
        // 从 chrome.storage.local 安全地读取用户配置
        // local 存储比 sync 更适合存储敏感信息（如 API Key）
        const config = await chrome.storage.local.get([
            'botId',           // Coze 平台的 Bot 唯一标识
            'apiKey',          // Coze API 认证密钥
            'provider',        // AI模型：coze,gpt
            'model',           // gpt-3.5-turbo
            'replyTemplates',  // 用户自定义的多种回复风格模板（对象）
            'replyTemplate'    // 当前选中的默认模板名称（如 "简洁友好"）
        ]);

        config.botId="7495623233941815337";
        config.apiKey="pat_mshRxvpwBCdBM6VbJbE3sHkUrOfZ6QgsKPjfGHcky5JqeUvsyFz3MLOPo1mJQE6H";

        if (!config.botId || !config.apiKey) {
            return { error: "请先在插件设置中配置 Bot ID 和 API Key" };
        }

        if(!config.provider){
            config.provider="coze";
            config.model="coze";
        }

        const userContent = Utils.sanitizeInput(request.content);
        if (!userContent) {
            return { error: "评论内容不能为空" };
        }

        // 确定本次回复使用的提示词模板：
        // 优先使用请求中指定的模板（request.template）
        // 其次使用用户设置的默认模板（config.replyTemplate）
        // 最后使用内置的默认提示词
        const templateName = request.template || config.replyTemplate || "简洁友好";

        // 根据模板名称查找对应的提示词内容
        // 若未找到，则使用默认的主播口吻提示词
        const templatePrompt = config.replyTemplates?.[templateName] ||
            "你是直播间主播，用亲切自然的语气回复粉丝。不要加‘回复：’等前缀。";

        // 构建最终发送给 AI 的完整提示词
        // sanitizeInput 是一个用于防止 prompt 注入的安全函数（需确保已定义）
        // 在此处，仅使用用户评论内容，不拼接模板（⚠️ 注意：此处逻辑可能存在问题，见下方说明）
        const fullPrompt = `${Utils.sanitizeInput(request.content)}`.trim();

        let providerInstance;

        switch (config.provider?.toLowerCase()) {
            case "coze":
                providerInstance = new CozeProvider(config.botId, config.apiKey);
                break;

            case "openai":
            case "gpt":
                providerInstance = new OpenAIProvider(config.apiKey, config.model);
                break;

            default:
                return { error: `不支持的 AI 提供商: ${config.model}` };
        }

        const aiReply = await providerInstance.chat(
            request.nickname,
            fullPrompt,
            [], // 可从 request 传入历史消息
        );

        // 处理 AI 返回结果
        if (!aiReply) {
            // 若 AI 未返回有效内容，发送错误响应
            return { error: "AI 未能生成有效回复" };
        } else {
            // 成功获取回复，发送 reply 字段
            return { reply: aiReply }; // ✅ 只返回数据
        }
    } catch (error) {
        // 捕获任何异常（网络错误、API 错误、解析错误等）
        // 将错误信息返回给调用方，便于调试
        console.error("【AI调用失败】", error);
        return { error: "AI 回复生成失败，请稍后重试" };
    }
};