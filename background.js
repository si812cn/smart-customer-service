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
import { handleSaveConfig } from './ui/handlers/config.js';

// === AI 自动回复请求处理 ===
// 当收到类型为 "callAI" 的消息时，触发 AI 回复生成流程
const messageHandler = createHandler()
    .use(withLogging)           // 注入日志中间件：自动记录请求、响应与异常
    .use(withAuth)              // 注入权限中间件：可选地验证发送方权限（如是否来自合法页面）
    .handle('callAI', handleCallAI)        // 注册消息类型 'callAI' 的处理器：调用 AI 生成回复
    .handle('saveConfig', handleSaveConfig) // 注册消息类型 'saveConfig' 的处理器：保存用户配置
    .build();                   // 构建并返回最终的消息处理器函数

/**
 * 设置 Chrome 扩展的消息监听机制
 * 监听来自其他组件（如 content.js 或 popup.js）的消息
 * 使用 async/await 以支持异步操作（如存储读取、API 调用）
 * 使用自定义的中间件式处理器（Handler Pipeline），根据消息类型分发到对应的处理函数
 * 支持日志记录、权限校验等横切关注点（cross-cutting concerns）
 *
 * @param {Object} request - 消息请求体，包含动作类型和数据
 * @param {Object} sender - 发送消息的上下文信息（标签页、帧等）
 * @param {Function} sendResponse - 用于异步返回响应的回调函数
 *
 * 注意：由于使用了 async/await，必须返回 true 以保持 sendResponse 回调有效
 * 参见：https://developer.chrome.com/docs/extensions/mv3/messaging/#returning-responses-from-event-listeners
 */
chrome.runtime.onMessage.addListener(messageHandler);