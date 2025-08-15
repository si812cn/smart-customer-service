/**
 * 鉴权中间件：确保敏感操作有合法凭证
 */
export function withAuth(next) {
    return async (request, sender, sendResponse) => {
        // 示例：某些 action 需要 token 校验
        if (['saveConfig', 'updateAPIKey'].includes(request.action)) {
            if (!request.adminToken || request.adminToken !== 'valid-token') {
                respond(sendResponse, { error: '权限不足' }, '鉴权失败', sender.tab?.id);
                return true;
            }
        }
        return next(request, sender, sendResponse);
    };
}