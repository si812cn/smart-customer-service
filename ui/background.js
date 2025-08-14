// background.js
// 作者：Qwen，融合网络监听 + AI 回复功能
// 功能：网络抓包、模拟输入、AI自动回复（Coze）
// 环境：Chrome Extension Manifest V3

// ========================================
// 1. 数据存储与状态管理
// ========================================

// 存储每个 tab 的请求数据 { tabId: Map<requestId, requestData> }
const tabRequestData = new Map();

// 存储已 attach debugger 的 tabId 集合
const debuggerAttachedTabs = new Set();

// 存储每个 tab 的 AI 配置状态 { tabId: { enabled: boolean } }
const tabAIConfig = new Map();

// 启动周期性清理（防止内存泄漏）
function startCleanupInterval() {
    setInterval(() => {
        const now = Date.now();
        for (const [tabId, requests] of tabRequestData) {
            // 检查 tab 是否还存在
            chrome.tabs.get(tabId, () => {
                if (chrome.runtime.lastError) {
                    // tab 已关闭，清理所有相关数据
                    tabRequestData.delete(tabId);
                    debuggerAttachedTabs.delete(tabId);
                    tabAIConfig.delete(tabId);
                    const oldListener = chrome.debugger[`eventListener_${tabId}`];
                    if (oldListener) {
                        chrome.debugger.onEvent.removeListener(oldListener);
                        delete chrome.debugger[`eventListener_${tabId}`];
                    }
                    return;
                }

                // 清理超过 5 分钟的请求
                for (const [id, data] of requests) {
                    if (data.timestamp && now - data.timestamp > 5 * 60 * 1000) {
                        requests.delete(id);
                    }
                }
            });
        }
    }, 60 * 1000); // 每分钟执行一次
}

// 启动清理任务
startCleanupInterval();

// ========================================
// 2. AI 回复系统（Coze）
// ========================================

/**
 * 调用 Coze AI 获取回复（流式）
 * @param {string} botId
 * @param {string} apiKey
 * @param {string} user 用户ID（会话ID）
 * @param {string} query 问题
 * @returns {Promise<string>}
 */
async function chatCozeAPI(botId, apiKey, user, query) {
    const url = "https://api.coze.cn/v3/chat";

    const params = {
        bot_id: botId,
        user_id: user,
        query: query,
        stream: true,
        auto_save_history: true
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(params)
    };

    // 添加超时控制（30秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(url, { ...requestOptions, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = "";
        let buffer = ""; // 缓存未完成的行

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 保留未完成的行

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === "[DONE]") continue;

                if (trimmed.startsWith("data:")) {
                    const dataStr = trimmed.slice(5).trim();
                    if (dataStr === "[DONE]") continue;

                    try {
                        const data = JSON.parse(dataStr);
                        // 仅提取 AI 回复文本
                        if (data.event === "message" && data.message?.type === "answer" && data.message.content_type === "text") {
                            result += data.message.content || "";
                        }
                    } catch (e) {
                        console.warn("SSE JSON parse error:", e, dataStr);
                    }
                }
            }
        }

        return result.trim();
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("AI请求超时");
        } else {
            console.error("AI请求失败：", error);
        }
        return "";
    } finally {
        clearTimeout(timeoutId);
    }
}

// 输入过滤（防 XSS / Prompt 注入）
function sanitizeInput(str) {
    return str?.toString().replace(/<script.*?>.*?<\/script>/gi, '') || '';
}

// ========================================
// 3. 消息监听主入口
// ========================================

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    // === 模拟输入 ===
    if (request.action === "simulateInput") {
        const { xpath, input } = request;
        if (!xpath || !input) {
            console.warn("Missing xpath or input");
            return;
        }
        executeSimulateEditableInput(sender.tab.id, xpath, input);
        return true; // 保持异步通道
    }

    // === 网络监听启动 ===
    if (request.type === "networkCatch") {
        const targetTabId = request.tabId;
        const hookBase = request.hookBase || "";

        // 先清理旧状态（避免重复 attach）
        if (debuggerAttachedTabs.has(targetTabId)) {
            chrome.debugger.detach({ tabId: targetTabId });
            const oldListener = chrome.debugger[`eventListener_${targetTabId}`];
            if (oldListener) {
                chrome.debugger.onEvent.removeListener(oldListener);
                delete chrome.debugger[`eventListener_${targetTabId}`];
            }
            debuggerAttachedTabs.delete(targetTabId);
        }

        if (!tabRequestData.has(targetTabId)) {
            tabRequestData.set(targetTabId, new Map());
        }

        const reqResp = tabRequestData.get(targetTabId);

        // 附加 Debugger
        chrome.debugger.attach({ tabId: targetTabId }, "1.3", () => {
            if (chrome.runtime.lastError) {
                console.error("Attach failed:", chrome.runtime.lastError.message);
                return;
            }

            debuggerAttachedTabs.add(targetTabId);
            console.log("✅ Debugger attached to tab", targetTabId);

            chrome.debugger.sendCommand({ tabId: targetTabId }, "Network.enable");

            // 定义事件监听器
            const eventListener = (debuggeeId, method, params) => {
                if (debuggeeId.tabId !== targetTabId) return;

                // 可选：只监听特定域名
                if (hookBase && method === "Network.requestWillBeSent") {
                    if (!params.request.url.startsWith(hookBase)) return;
                }

                if (method === "Network.requestWillBeSent") {
                    reqResp.set(params.requestId, {
                        url: params.request.url,
                        headers: params.request.headers,
                        method: params.request.method,
                        post: params.request.postData,
                        timestamp: Date.now()
                    });
                }

                if (method === "Network.responseReceived") {
                    const reqData = reqResp.get(params.requestId);
                    if (reqData) {
                        reqData.statusCode = params.response.status;
                    }
                }

                if (method === "Network.loadingFinished" && params.encodedDataLength > 0) {
                    const reqData = reqResp.get(params.requestId);
                    if (reqData && reqData.resp) return;

                    // 尝试获取响应体（带重试）
                    tryGetResponseBody(targetTabId, params.requestId, reqData, reqResp);
                }
            };

            // 绑定事件监听
            chrome.debugger.onEvent.addListener(eventListener);
            chrome.debugger[`eventListener_${targetTabId}`] = eventListener;
        });

        return true;
    }

    // === AI 自动回复请求 ===
    if (request.action === "callAI") {
        try {
            // 从 local 读取配置（更安全）
            const config = await chrome.storage.local.get([
                'botId', 'apiKey', 'replyTemplates', 'replyTemplate'
            ]);

            const templateName = request.template || config.replyTemplate || "简洁友好";
            const templatePrompt = config.replyTemplates?.[templateName] ||
                "你是直播间主播，用亲切自然的语气回复粉丝。不要加‘回复：’等前缀。";

            const fullPrompt = `
${templatePrompt}

粉丝昵称：${sanitizeInput(request.nickname)}
粉丝评论：${sanitizeInput(request.content)}
`.trim();

            const aiReply = await chatCozeAPI(
                config.botId,
                config.apiKey,
                request.nickname,
                fullPrompt
            );

            if (!aiReply) {
                sendResponse({ error: "AI 返回为空" });
            } else {
                sendResponse({ reply: aiReply });
            }
        } catch (error) {
            sendResponse({ error: error.message });
        }
        return true;
    }

    // === 获取当前 tab 的 AI 配置状态 ===
    if (request.action === "getAIStatus") {
        const status = tabAIConfig.get(sender.tab.id) || { enabled: false };
        sendResponse(status);
        return true;
    }

    // === 设置 AI 状态（启用/禁用）===
    if (request.action === "setAIStatus") {
        tabAIConfig.set(sender.tab.id, { enabled: request.enabled });
        sendResponse({ success: true });
        return true;
    }

    // === 通用 POST 请求（可选）===
    if (request.action === "sendPost") {
        sendPostRequest(request.url, request.data, (err, res) => {
            if (err) {
                sendResponse({ error: err.message });
            } else {
                sendResponse({ data: res });
            }
        });
        return true;
    }

    return true; // 默认保持异步通道
});

// 重试获取响应体
function tryGetResponseBody(tabId, requestId, reqData, reqResp, retryCount = 0) {
    const maxRetries = 3;

    chrome.debugger.sendCommand(
        { tabId },
        "Network.getResponseBody",
        { requestId },
        (response) => {
            if (chrome.runtime.lastError) {
                if (retryCount < maxRetries) {
                    setTimeout(() => tryGetResponseBody(tabId, requestId, reqData, reqResp, retryCount + 1), 500 * (retryCount + 1));
                } else {
                    console.warn(`Failed to get body for ${requestId} after ${maxRetries} retries`);
                    reqResp.set(requestId, { ...reqData, resp: null });
                    chrome.tabs.sendMessage(tabId, {
                        type: "networkCatchResponse",
                        data: { ...reqData, resp: null }
                    });
                }
            } else {
                let body;
                try {
                    body = typeof response.body === "string" ? JSON.parse(response.body) : response.body;
                } catch (e) {
                    body = response.body;
                }

                reqResp.set(requestId, {
                    ...reqData,
                    resp: body,
                    encodedDataLength: response.encodedLength || 0
                });

                chrome.tabs.sendMessage(tabId, {
                    type: "networkCatchResponse",
                    data: { ...reqData, resp: body }
                });
            }
        }
    );
}

// ========================================
// 4. 模拟输入函数（安全版）
// ========================================

function executeSimulateEditableInput(tabId, xpath, input) {
    const escapedInput = input
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');

    const code = `
        (function() {
            const xpath = \`${xpath}\`;
            const input = "${escapedInput}";
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (!element) {
                console.warn("Element not found by xpath:", xpath);
                return;
            }

            element.focus();
            if ('value' in element) element.value = input;
            if ('textContent' in element) element.textContent = input;

            ['input', 'change', 'blur'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                element.dispatchEvent(event);
            });

            console.log("✅ Simulated input to:", input);
        })();
    `;

    // 使用 debugger 执行脚本（比 executeScript 更可靠）
    chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
            console.error("Debugger attach failed:", chrome.runtime.lastError);
            return;
        }

        chrome.debugger.sendCommand(
            { tabId },
            'Runtime.evaluate',
            { expression: code, awaitPromise: true },
            (result) => {
                if (result.exceptionDetails) {
                    console.error("Script execution error:", result.exceptionDetails);
                } else {
                    console.log("Script executed successfully");
                }
                // 可选：detach（但可能影响其他功能）
            }
        );
    });
}

// ========================================
// 5. 通用 POST 请求（可选工具）
// ========================================

function sendPostRequest(url, data, callback) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // 设置超时
    xhr.timeout = 10000;
    xhr.ontimeout = () => callback(new Error("Request timeout"));

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(null, xhr.responseText);
            } else {
                callback(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`), null);
            }
        }
    };

    xhr.onerror = () => callback(new Error("Network error"));

    xhr.send(JSON.stringify(data));
}

// ========================================
// 6. 清理资源：监听 tab 关闭
// ========================================

chrome.tabs.onRemoved.addListener((tabId) => {
    tabRequestData.delete(tabId);
    debuggerAttachedTabs.delete(tabId);
    tabAIConfig.delete(tabId);
    const oldListener = chrome.debugger[`eventListener_${tabId}`];
    if (oldListener) {
        chrome.debugger.onEvent.removeListener(oldListener);
        delete chrome.debugger[`eventListener_${tabId}`];
    }
});