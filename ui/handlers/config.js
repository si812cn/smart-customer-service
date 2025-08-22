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
    },
    sys: {
        dataCenterUrl : 'http://127.0.0.1:8089', //数据中心服务器地址
        lastUpdate : ''         //在 storage 中记录上次从服务器获取最新配置的更新时间，
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

const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`; // 本地日期
};

/**
 * 从远程配置服务器获取最新配置（如 cozeApiKey）
 *
 * ✅ 功能特点：
 * - 支持超时控制，避免请求卡死
 * - 自动解析 JSON 并处理解析错误
 * - 校验关键字段，防止无效配置
 * - 提供清晰的错误信息，便于调试
 *
 * @param {Object} options - 配置选项
 * @param {string} options.dataCenterUrl - 配置服务器基础地址，例如 'http://127.0.0.1:8089'
 * @param {number} [options.timeout=5000] - 请求超时时间（毫秒），默认 5 秒
 *
 * @returns {Promise<{ success: boolean, config?: Object, error?: string }>}
 *          返回结果对象：
 *          - success: 是否成功获取并解析配置
 *          - config: 成功时返回服务器配置（如 { cozeApikey: "xxx" }）
 *          - error: 失败时返回错误描述
 *
 * @example
 * const result = await fetchLatestConfig({ dataCenterUrl: 'http://localhost:8089' });
 * if (result.success) {
 *   console.log('获取到 apiKey:', result.config.cozeApikey);
 * } else {
 *   console.error('失败原因:', result.error);
 * }
 */
const fetchLatestConfig = async ({ dataCenterUrl, timeout = 5000 } = {}) => {
    // 1. 参数校验
    if (!dataCenterUrl) {
        console.error('❌ 缺少 dataCenterUrl，无法请求配置');
        return { success: false, error: '缺少服务器地址' };
    }

    try {
        // 2. 创建 AbortController 用于实现请求超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout); // 超时后中断请求

        // 3. 发起网络请求
        const response = await fetch(`${dataCenterUrl}/getSetting`, {
            method: 'GET', // 使用 GET 方法获取配置
            headers: {
                'Content-Type': 'application/json', // 声明期望返回 JSON
                // 可选：如果接口需要认证，可添加 token
                // 'Authorization': 'Bearer your-token-here'
            },
            signal: controller.signal // 将 AbortController 的 signal 绑定到请求
        });

        // 4. 清除超时定时器（请求已完成）
        clearTimeout(timeoutId);

        // 5. 检查 HTTP 状态码（如 404, 500 等错误）
        if (!response.ok) {
            let errorMsg;
            try {
                // 尝试读取错误信息（可能是后端返回的错误详情）
                errorMsg = await response.text();
            } catch (e) {
                errorMsg = `HTTP ${response.status}`;
            }
            console.error(`【HTTP ${response.status}】获取配置失败:`, errorMsg);
            return { success: false, error: `服务器错误 (${response.status})` };
        }

        // 6. 解析 JSON 响应（注意：这也可能失败）
        let remoteConfig;
        try {
            remoteConfig = await response.json();
        } catch (jsonError) {
            console.error('❌ 响应内容不是合法的 JSON 格式');
            return { success: false, error: '服务器返回数据格式错误，非 JSON' };
        }

        // 7. （可选）校验关键字段是否存在且有效
        if (!remoteConfig.cozeApikey || typeof remoteConfig.cozeApikey !== 'string') {
            console.warn('⚠️ 服务器返回缺少或无效的 cozeApikey 字段:', remoteConfig);
            return { success: false, error: '服务器返回的 API Key 无效或缺失' };
        }

        // 8. 成功：返回解析后的配置
        return { success: true, config: remoteConfig };

    } catch (err) {
        // 9. 捕获所有异常（网络错误、超时、中止等）
        if (err.name === 'AbortError') {
            // 超时或手动中止
            console.error('❌ 请求已超时或被中止');
            return { success: false, error: '请求超时，请检查服务器是否运行或网络是否通畅' };
        }

        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            // 常见网络错误（如 DNS 失败、连接拒绝）
            console.error('❌ 网络请求失败:', err.message);
            return { success: false, error: '网络连接失败，请检查服务器地址是否正确' };
        }

        // 其他未知错误
        console.error('❌ 未知错误:', err);
        return { success: false, error: `请求异常: ${err.message}` };
    }
};

/**
 * 首次安装或者启动浏览器时初始化配置信息
 *
 * @returns {Promise<Object>} { success: boolean, error?: string }
 */
export const handleInitConfig = async () => {
    const today = getToday(); // 本地日期

    let config;
    let lastUpdate = '';

    try {
        const result = await storageGet(['config']);
        config = result.config;

        // 首次安装：写入默认配置
        if (!config) {
            config = JSON.parse(JSON.stringify(DEFAULT_CONFIG)); // 深拷贝避免引用
            config.sys.lastUpdate = ''; // 初始为空，表示从未更新
        }

        lastUpdate = config.sys.lastUpdate || '';

        // ✅ 判断是否需要更新：只有今天还没更新过才更新
        if (lastUpdate === today) {
            console.log('✅ 今日已更新过配置，跳过');
            return { success: true };
        }

        // ✅ 开始更新流程
        console.log('🕒 正在拉取远程配置...');
        const remoteResult = await fetchLatestConfig({
            dataCenterUrl: config.sys.dataCenterUrl
        });

        if (!remoteResult.success) {
            console.warn('⚠️ 远程配置获取失败，使用本地配置');
            // 不中断，继续保存 lastUpdate
        } else {
            // ✅ 只更新 cozeApikey（或其他需要更新的字段）
            config.api.cozeApikey = remoteResult.config.cozeApikey;
            // 其他字段如需要也可合并
        }

        // ✅ 更新 lastUpdate 时间
        config.sys.lastUpdate = today;

        // ✅ 保存配置（包含新的 lastUpdate 和可能的新 apiKey）
        await storageSet({ config });
        console.log('✅ 配置初始化完成，lastUpdate 已更新');

        return { success: true };

    } catch (error) {
        console.error('❌ 配置初始化失败:', error);
        return { success: false, error: error.message || '配置初始化失败' };
    }
};

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