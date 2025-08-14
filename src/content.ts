import { Logger } from './utils/logger';
import { getExtractor } from './extractor';

// 检查是否应注入
function shouldRun(): boolean {
    const host = window.location.hostname;
    const path = window.location.pathname;

    if (host.endsWith('jinritemai.com') &&
        (path.includes('/compass') || path.includes('/buyin'))) {
        return true;
    }
    if (host.endsWith('kwaixiaodian.com') && path.includes('/zs')) {
        return true;
    }
    if (host.endsWith('xiaohongshu.com') && path.includes('/ark')) {
        return true;
    }
    return false;
}

(async () => {
    if (!shouldRun()) {
        return;
    }

    Logger.log('启动智能客服助手', window.location.href);

    const extractor = getExtractor();
    if (!extractor) {
        Logger.error('不支持的平台');
        return;
    }

    let lastCount = 0;

    function checkNewMessages() {
        const messages = extractor.extractComments();
        const newMsgs = messages.slice(lastCount);
        if (newMsgs.length > 0) {
            chrome.runtime.sendMessage({
                type: 'NEW_MESSAGES',
                messages: newMsgs
            });
            lastCount = messages.length;
        }
    }

    // 初次检查
    setTimeout(checkNewMessages, 2000);

    // 监听 DOM 变化
    extractor.observe(checkNewMessages);
})();