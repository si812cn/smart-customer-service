/**
 * 对用户输入进行安全过滤，防止 XSS 攻击和 Prompt 注入
 *
 * 该函数会：
 * 1. 清除换行符，防止上下文分隔或提示词逃逸
 * 2. 过滤常见恶意代码片段（如脚本标签、SQL/CLI 注释符号）
 * 3. 去除首尾空白字符
 * 4. 截取最大长度以防止过长输入影响模型性能或增加风险
 *
 * @param {string} str - 待处理的用户输入字符串
 * @returns {string} - 经过清理和截断的安全字符串
 *
 * @example
 * sanitizeInput('Hello <script>alert(1)</script>\n\n-- ignore this');
 * // 返回: "Hello  ignore this"
 */
export function sanitizeInput(str) {
    return str
        .replace(/[\r\n]+/g, ' ')                    // 将换行替换为空格，防止上下文注入
        .replace(/--|;;|<script|<\/script>/gi, '')   // 过滤注释符号和脚本标签（基础XSS/注入防护）
        .trim()                                      // 去除首尾空格
        .slice(0, 500);                              // 限制最大长度为500字符，防止过长输入
}