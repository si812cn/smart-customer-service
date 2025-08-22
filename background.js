// background.js
// 背景服务脚本 | Chrome 扩展核心
// 职责：管理 AI 请求、状态持久化、跨内容脚本通信
// 作者：Qwen
// 日期：2025-08-14

// 导入核心模块
import { createHandler } from './ui/middleware/index.js';
import { withLogging } from './ui/middleware/logging.js';
import { withAuth } from './ui/middleware/auth.js'; // 可选
import { handleCallAI } from './ui/handlers/ai.js';
import { DEFAULT_CONFIG } from './ui/handlers/config.js';
import { handleInitConfig } from './ui/handlers/config.js';
import { handleGetConfig } from './ui/handlers/config.js';
import { handleSaveConfig } from './ui/handlers/config.js';

// 初始化：如果 storage 没有配置，写入默认值
// 扩展安装或浏览器启动后检查更新
chrome.runtime.onStartup.addListener(handleInitConfig);
chrome.runtime.onInstalled.addListener(handleInitConfig);

// === AI 自动回复请求处理 ===
// 当收到类型为 "callAI" 的消息时，触发 AI 回复生成流程
const messageHandler = createHandler()
    .use(withLogging)           // 注入日志中间件：自动记录请求、响应与异常
    .use(withAuth)              // 注入权限中间件：可选地验证发送方权限（如是否来自合法页面）
    .handle('callAI', handleCallAI)        // 注册消息类型 'callAI' 的处理器：调用 AI 生成回复
    .handle('getConfig', handleGetConfig) // 注册消息类型 'getConfig' 的处理器：获取用户配置
    .handle('saveConfig', handleSaveConfig) // 注册消息类型 'saveConfig' 的处理器：保存用户配置
    .build();                   // 构建并返回最终的消息处理器函数

/**
 * 设置 Chrome 扩展的消息监听机制
 * 监听来自其他组件（如 content.js 或 popup.js）的消息
 * 使用 async/await 以支持异步操作（如存储读取、API 调用）
 * 使用自定义的中间件式处理器（Handler Pipeline），根据消息类型分发到对应的处理函数
 * 支持日志记录、权限校验等横切关注点（cross-cutting concerns）
 * 支持转发消息到 content.js
 * 在 messageHandler 处理完 AI 请求后，增加转发逻辑
 *
 * @param {Object} request - 消息请求体，包含动作类型和数据
 * @param {Object} sender - 发送消息的上下文信息（标签页、帧等）
 * @param {Function} sendResponse - 用于异步返回响应的回调函数
 *
 * 注意：由于使用了 async/await，必须返回 true 以保持 sendResponse 回调有效
 * 参见：https://developer.chrome.com/docs/extensions/mv3/messaging/#returning-responses-from-event-listeners
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    // 如果不是 AI 请求，则尝试转发给 content.js
    if (['showConfigHtml', 'testAI', 'copyCookie', 'networkCatch'].includes(message.type)) {
        // 查找目标标签页
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (!tab) {
                sendResponse({ error: 'No active tab' });
                return;
            }

            // 转发消息给 content.js
            chrome.tabs.sendMessage(tab.id, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Forward failed:', chrome.runtime.lastError.message);
                    sendResponse({ error: 'Content script not ready' });
                } else {
                    sendResponse(response);
                }
            });
        });

        return true; // 保持异步响应通道
    }
    else if (message.type === 'INJECT_COMMENTS_HANDLER_SCRIPT') {
        const { platform } = message;
        const tabId = sender.tab.id;

        chrome.scripting.executeScript({
            target: { tabId },
            files: [`ui/handlers/${platform}.js`]
        })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error('注入失败:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // 保持异步响应通道
    }
    else{
        // 先让中间件处理器处理 AI 相关请求
        const handledByHandler = messageHandler(message, sender, sendResponse);
        if (handledByHandler) {
            return true; // 已处理（如 callAI）
        }
    }

    // 默认：未处理该消息 ===
    console.log("Unhandled message type:", message.type);
    return false;
});