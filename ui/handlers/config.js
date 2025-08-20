// lib/DEFAULT_CONFIG.js 或 config.js
export const DEFAULT_CONFIG = {
    text: {
        autoSend: false, // 是否自动发送回复
        maxLength: 50,   // 回复最大字数
        qaKeywords: '你好#你好呀\n发货#已安排', // 关键词自动回复规则（格式：关键词#回复内容，每行一条）
        finalReplay: '感谢关注，有疑问随时问我哦～', // 最终回复语（可选）
        questions: '欢迎来到直播间\n今天有新品上架', // 主动提问内容（循环发送的话术）
        blockedKeywords: [
            '广告', '加微信', '刷单', '加V', '微信', 'qq', 'vx',
            'telegram', 'tg', '返现', '代运营', '测试', 'demo'
        ], // 屏蔽关键词列表（包含这些词的评论将被忽略）
        douyinNickname: '小助手', // 抖音助手显示的昵称
        blackWords: '测试#demo', // 黑词自动回复规则（匹配后自动回复指定内容）
        replyCommentStatus: true // 是否启用评论自动回复功能
    },
    freq: {
        timeLimit: 3,        // 回复评论的最小时间间隔：3秒
        speakLimit: 30,      // 循环话术推送频率：每30秒发送一次主动话术
        speakBreak: 30,      // 每轮话术发送后的休息时长：30秒
        cooldown: 3000,         // 用户级冷却时间：同一用户3秒内不重复回复
        maxPerMinute: 20,       // 每分钟最多自动回复20条，防止被平台限流
        insertPlaceholder: true, // 是否插入“正在输入…”等占位提示
        kefuBreak: 2,           // 客服模式下休息时间（单位：分钟）
        feigeHumanWords: '人工#转人工', // 触发转人工的关键词（支持多关键词，用#分隔）
        feigeHumanAccount: ''   // 指定转接的人工客服账号（可选）
    },
    auto: {
        speakNum: '',           // 自动发言频率控制（可为空，扩展用）
        pushProduct: '',        // 推荐商品的触发关键词（可选）
        pushQuan: ''            // 推荐优惠券的触发关键词（可选）
    },
    api: {
        provider: 'coze',       // AI 服务提供商：支持 coze / openai / custom
        model: 'coze',          // 使用的 AI 模型名称（coze 专用）
        gptApi: 'https://api.openai.com/v1/chat/completions', // OpenAI API 地址
        gptKey: '',             // OpenAI API Key（若使用 OpenAI）
        cozeBotid: '7495623233941815337', // Coze 机器人 Bot ID
        cozeApikey: 'pat_mshRxvpwBCdBM6VbJbE3sHkUrOfZ6QgsKPjfGHcky5JqeUvsyFz3MLOPo1mJQE6H', // Coze API Key
        apiBase: '',            // 自定义 API 基地址（备用，用于私有化部署）
        hookBase: '',           // Webhook 回调地址（可选，用于事件通知）
        audioBase: ''           // 语音合成（TTS）API 地址（可选）
    }
};

// utils/storage.js

export const storageGet = (keys) =>
    new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
            chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve(result);
        });
    });

export const storageSet = (data) =>
    new Promise((resolve, reject) => {
        chrome.storage.local.set(data, () => {
            chrome.runtime.lastError ? reject(chrome.runtime.lastError) : resolve();
        });
    });

/**
 * 处理保存配置请求
 * @param {Object} request - { type: 'saveConfig', data: { ... } }
 * @param {Object} sender
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const handleSaveConfig = async (request, sender) => {

    const { data } = request;

    if (!data || typeof data !== 'object') {
        return { success: false, error: '无效的配置数据' };
    }

    try {
        await storageSet({ config: data });
        console.log('✅ 配置已保存');
        return { success: true };
    } catch (error) {
        console.error('【保存配置失败】', error);
        return { success: false, error: error.message || '未知错误' };
    }
};

/**
 * 处理获取配置请求
 * @param {Object} request - { type: 'getConfig' }
 * @param {Object} sender
 * @returns {Promise<Object>} { success: boolean, config?: Object, error?: string }
 */
export const handleGetConfig = async (request, sender) => {
    try {
        const result = await storageGet(['config']);
        let config = result.config;

        // 如果没有配置，写入默认值
        if (!config) {
            config = DEFAULT_CONFIG;
            await storageSet({ config });
            console.log('✅ 默认配置已自动写入');
        }

        return { success: true, config };
    } catch (error) {
        console.error('【获取配置失败】', error);
        return { success: false, error: error.message || '未知错误' };
    }
};