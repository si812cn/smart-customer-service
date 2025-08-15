/**
 * 中间件类型定义
 * @typedef {Function} Middleware
 * @param {Function} next - 下一个处理器
 * @returns {Function} 包装后的处理器 (request, sender, sendResponse) => Promise<boolean>
 */

/**
 * 创建一个可链式调用的消息处理器
 */
export function createHandler() {
    const handlers = new Map();
    const middlewares = [];

    return {
        /**
         * 注册中间件（如日志、鉴权）
         * @param {Function} middleware
         */
        use(middleware) {
            middlewares.push(middleware);
            return this;
        },

        /**
         * 绑定 action 与处理器
         * @param {string} action
         * @param {Function} handler
         */
        handle(action, handler) {
            handlers.set(action, handler);
            return this;
        },

        /**
         * 构建最终的监听函数
         * @returns {Function} Chrome onMessage 回调
         */
        build() {
            // Step 1: 创建路由分发器，内部使用 createResponseHandler 包装实际 handler
            const routeHandler = createRouteHandler(handlers);

            // Step 2: 从外到内包裹中间件（执行时从内到外）
            let finalHandler = routeHandler;
            // 逆序应用中间件（A -> B -> C，执行时 C -> B -> A）
            for (let i = middlewares.length - 1; i >= 0; i--) {
                finalHandler = middlewares[i](finalHandler);
            }

            // Step 3: 返回 Chrome 消息监听器要求的格式
            return (request, sender, sendResponse) => {
                finalHandler(request, sender, sendResponse);
                return true; // ✅ 必须返回 true 支持异步响应
            };
        }
    };
}

/**
 * 路由分发处理器
 */
function createRouteHandler(handlers) {
    return (request, sender, sendResponse) => {
        const handler = handlers.get(request.type);
        if (!handler) {
            sendResponse({ error: "未知消息类型" });
            return true; // ✅ 显式返回 true
        }

        // ✅ 不再直接执行 handler，而是交给 createResponseHandler 包装
        // 即：每个路由处理器都会被 createResponseHandler 包一层
        const responseWrappedHandler = createResponseHandler(handler);
        responseWrappedHandler(request, sender, sendResponse);
        return true; // ✅ 必须返回 true
    };
}

/**
 * 中间件：自动调用 sendResponse 返回结果
 * 将处理器返回的 { reply, error } 发送给调用方
 */
export function createResponseHandler(handler) {
    return async (request, sender, sendResponse) => {
        try {
            const result = await handler(request, sender); // 注意：handler 不再接收 sendResponse
            sendResponse(result);
        } catch (error) {
            console.error(`【处理器异常】类型=${request.type}`, error);
            sendResponse({ error: "内部错误，请稍后重试" });
        }
    };
}