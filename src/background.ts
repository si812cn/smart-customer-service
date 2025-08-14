chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CONFIG') {
        chrome.storage.sync.get(['autoReply', 'aiModel', 'replyDelay'], (items) => {
            sendResponse(items);
        });
        return true;
    }

    if (request.type === 'LOG') {
        console.log(`[SCS] ${request.msg}`, request.data);
    }
});