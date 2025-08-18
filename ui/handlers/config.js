// 默认配置
export const DEFAULT_CONFIG = {
    text: {
        autoSend: false,
        maxLength: 50,
        qaKeywords: '你好#你好呀\n发货#已安排',
        finalReplay: '感谢关注，有疑问随时问我哦～',
        questions: '欢迎来到直播间\n今天有新品上架',
        blockedKeywords: ['广告', '加微信', '刷单', '加V', '微信', 'qq', 'vx',
            'telegram', 'tg', '返现', '代运营'],
        douyinNickname: '小助手',
        blackWords: '测试#demo',
        replyCommentStatus: true
    },
    freq: {
        timeLimit: 5,
        speakLimit: 30,
        speakBreak: 60,
        insertPlaceholder: true,
        kefuBreak: 2,
        feigeHumanWords: '人工#转人工',
        feigeHumanAccount: ''
    },
    auto: {
        speakNum: '',
        pushProduct: '',
        pushQuan: ''
    },
    api: {
        provider: 'coze', // 注意：原 DEFAULT_CONFIG 没有 provider，建议加上
        model: 'coze',   // 同上
        gptApi: 'https://api.openai.com/v1/chat/completions',
        gptKey: '',
        cozeBotid: '7495623233941815337',
        cozeApikey: 'pat_mshRxvpwBCdBM6VbJbE3sHkUrOfZ6QgsKPjfGHcky5JqeUvsyFz3MLOPo1mJQE6H',
        apiBase: '',
        hookBase: '',
        audioBase: ''
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