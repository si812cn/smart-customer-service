// 配置项接口
export interface Config {
    gptKey: string;          // 用于调用 GPT 模型的 API 密钥
    cozeBotid: string;       // Coze 平台机器人的唯一标识 ID
    cozeApikey: string;      // 调用 Coze API 所需的认证密钥
    qaKeywords: string;      // 触发问答功能的关键词列表（以逗号或其他分隔符分隔的字符串）
    finalReplay: string;     // 当无法继续回复或对话结束时，使用的默认回复语句，默认为“您好，请稍等”
    timeLimit: number;       // 每次响应的最大等待时间限制（单位：秒），超时将触发默认回复
    speakLimit: number;      // 用户连续发言次数限制，超过后可能触发冷却或自动回复
    blackWords: string;      // 屏蔽词列表（以逗号或其他分隔符分隔的字符串），包含这些词的消息将被过滤
    pushQuan: boolean;       // 是否开启消息推送至“圈组”或社交动态功能
    enableCrowd: boolean;    // 是否启用人群互动功能（如弹幕聚合、热点话题识别等）
    [key: string]: any;      // 支持动态扩展的任意配置项// 新增：日志级别
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}