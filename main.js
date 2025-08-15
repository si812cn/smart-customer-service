/**
 * 发送消息到 background.js
 */
function sendMessageToBackground(message) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error("消息发送到 background.js 失败:", chrome.runtime.lastError.message);
                resolve(false);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * 显示短暂反馈信息
 * @param {string} msg
 * @param {'success'|'error'|'info'} type
 */
function showFeedback(msg, type = 'info') {
    const el = document.getElementById('feedback');
    if (!el) return;

    el.textContent = msg;
    el.className = `feedback ${type}`;
    el.style.opacity = 1;

    setTimeout(() => {
        el.style.opacity = 0;
    }, 2000);
}

// 直接调用 background.js 的 callAI 方法
await sendMessageToBackground({ type: 'CALL_AI', userInput: '103斤穿几码', userId: 'testUserId' });
showFeedback("AI 调用请求已发送", "success");