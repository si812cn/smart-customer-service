/**
 * AI 提供商接口规范
 */
export class AIProvider {
    /**
     * 发送消息并返回流式响应
     * @param {string} user - 用户 ID
     * @param {string} query - 用户问题
     * @param {Array} messages - 历史消息
     * @param {Object} options - 配置（onChunk, signal 等）
     * @returns {Promise<string>} 完整回复
     */
    async chat(user, query, messages = [], options = {}) {
        throw new Error("子类必须实现 chat 方法");
    }
}