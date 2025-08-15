/**
 *
 * 日志中间件
 * 自动记录请求、响应、错误
 * 支持异步 sendResponse 且不阻塞
 */
export function withLogging(next) {
    return (request, sender, sendResponse) => {
        const startTime = Date.now();
        const tabId = sender.tab?.id;
        const action = request.action || request.type;

        console.log(`[Action] ${action} 开始`, { request, tabId, timestamp: new Date().toISOString() });

        // 监听 sendResponse 调用
        const originalSendResponse = sendResponse;
        let responded = false;
        const logResponse = (response) => {
            if (!responded) {
                responded = true;
                console.log(`[Action] ${action} 响应`, {
                    response,
                    tabId,
                    duration: Date.now() - startTime
                });
            }
        };

        const wrappedSendResponse = (...args) => {
            logResponse(args[0]);
            return originalSendResponse(...args);
        };

        try {
            // ✅ 不要 await！直接调用 next，并让它自行处理 sendResponse
            const result = next(request, sender, wrappedSendResponse);

            // 如果 next 返回的是 Promise（即异步 handler），我们可以 .catch()
            if (result && typeof result.catch === 'function') {
                result.catch((error) => {
                    console.error(`[Error] ${action} 异步失败`, {
                        error: error.message,
                        stack: error.stack,
                        tabId,
                        duration: Date.now() - startTime
                    });
                });
            }
        } catch (error) {
            console.error(`[Error] ${action} 同步失败`, {
                error: error.message,
                stack: error.stack,
                tabId,
                duration: Date.now() - startTime
            });
            throw error;
        }

        // ✅ 必须返回 true，表示使用 sendResponse 异步响应
        return true;
    };
}