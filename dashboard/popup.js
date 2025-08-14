document.addEventListener('DOMContentLoaded', () => {
    const autoReply = document.getElementById('autoReply');

    // 读取配置
    chrome.storage.sync.get(['autoReply'], (result) => {
        autoReply.checked = result.autoReply ?? true;
    });

    // 保存
    autoReply.addEventListener('change', () => {
        chrome.storage.sync.set({ autoReply: autoReply.checked });
    });

    // 获取当前页面信息（可选）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0]?.url;
        let platform = '未知';
        if (url?.includes('jinritemai')) platform = '抖音小店';
        if (url?.includes('kwaixiaodian')) platform = '快手小店';
        if (url?.includes('xiaohongshu')) platform = '小红书';
        document.getElementById('platform').textContent = platform;
    });
});