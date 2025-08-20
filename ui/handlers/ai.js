import { Utils } from '../utils/index.js';
import { handleGetConfig } from './config.js';
import { CozeProvider } from '../services/cozeProvider.js';
import { OpenAIProvider } from '../services/openaiProvider.js';

/**
 * 处理 AI 回复请求
 * @returns {Promise<{ reply?: string, error?: string }>}
 */
export const handleCallAI = async (request, sender) => {
    try {
        // 脚本加载完成后，向 background.js 请求当前配置
        const responseConfig = await handleGetConfig(request, sender);

        if (!responseConfig || !responseConfig.config || !responseConfig.config.api || !responseConfig.config.api.cozeBotid || !responseConfig.config.api.cozeApikey) {
            return { error: "请先在插件设置中配置 Bot ID 和 API Key" };
        }

        const config = responseConfig.config.api;

        if (!config.cozeBotid || !config.cozeApikey) {
            return { error: "请先在插件设置中配置 Bot ID 和 API Key" };
        }

        const userContent = Utils.sanitizeInput(request.content);
        if (!userContent) {
            return { error: "评论内容不能为空" };
        }

        // 确定本次回复使用的提示词模板：
        // 优先使用请求中指定的模板（request.template）
        // 其次使用用户设置的默认模板（config.replyTemplate）
        // 最后使用内置的默认提示词
        // const templateName = request.template || config.replyTemplate || "简洁友好";

        // 根据模板名称查找对应的提示词内容
        // 若未找到，则使用默认的主播口吻提示词
        // const templatePrompt = config.replyTemplates?.[templateName] ||
        //     "你是直播间主播，用亲切自然的语气回复粉丝。不要加‘回复：’等前缀。";

        // 构建最终发送给 AI 的完整提示词
        // sanitizeInput 是一个用于防止 prompt 注入的安全函数（需确保已定义）
        // 在此处，仅使用用户评论内容，不拼接模板（⚠️ 注意：此处逻辑可能存在问题，见下方说明）
        const fullPrompt = `${Utils.sanitizeInput(request.content)}`.trim();

        let providerInstance;

        switch (config.provider?.toLowerCase()) {
            case "coze":
                providerInstance = new CozeProvider(config.cozeBotid, config.cozeApikey);
                break;

            case "openai":
            case "gpt":
                providerInstance = new OpenAIProvider(config.cozeApikey, config.model);
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