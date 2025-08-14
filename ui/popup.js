// popup.js
// 作者：Qwen
// 功能：控制面板（启动配置、测试、抓包、复制 Cookie）
// 依赖：content.js 接收消息并执行 DOM 操作

document.addEventListener('DOMContentLoaded', function () {
    // ========================
    // 工具函数
    // ========================

    /**
     * 获取当前激活的标签页
     * @returns {Promise<chrome.tabs.Tab>}
     */
    function getCurrentTab() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.error("Tab query error:", chrome.runtime.lastError);
                    resolve(null);
                } else {
                    resolve(tabs?.[0] || null);
                }
            });
        });
    }

    /**
     * 发送消息并处理错误
     * @param {number} tabId
     * @param {object} message
     */
    function sendMessage(tabId, message) {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Message send failed:", chrome.runtime.lastError.message);
                showFeedback("发送失败，请刷新页面重试", "error");
            } else {
                showFeedback("指令已发送", "success");
            }
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

    // ========================
    // 权限检查（可选）
    // ========================
    /*
    chrome.permissions.contains({ permissions: ['scripting'] }, (hasPermission) => {
        if (!hasPermission) {
            showFeedback("缺少权限，请允许扩展运行脚本", "error");
        }
    });
    */

    // ========================
    // 按钮事件绑定
    // ========================

    const buttons = {
        start: { type: "showConfigHtml" },
        test: { type: "showTestDialog" },
        copyCookie: { type: "copyCookie" },
        networkCatch: { type: "networkCatch" }
    };

    for (const [id, message] of Object.entries(buttons)) {
        const btn = document.getElementById(id);
        if (!btn) continue;

        btn.addEventListener('click', async function () {
            // 添加 loading 状态
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '发送中...';

            const tab = await getCurrentTab();
            if (!tab) {
                showFeedback("无法获取当前标签页", "error");
                btn.disabled = false;
                btn.textContent = originalText;
                return;
            }

            sendMessage(tab.id, { ...message, tabId: tab.id });

            // 恢复按钮
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            }, 1000);
        });
    }
});