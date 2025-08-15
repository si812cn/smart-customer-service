/**
 * 处理配置保存请求
 * @param {Object} request - 消息请求 { type: 'saveConfig', data: { ... } }
 * @param {Object} sender - 发送方信息
 * @returns {Promise<{ success?: boolean, error?: string }>}
 */
export const handleSaveConfig = async (request, sender) => {
    const { data } = request;

    if (!data || typeof data !== 'object') {
        return { error: "无效的配置数据" };
    }

    try {
        await chrome.storage.local.set(data);
        return { success: true };
    } catch (error) {
        console.error("【配置保存失败】", error);
        return { error: `配置保存失败: ${error.message || "未知错误"}` };
    }
};