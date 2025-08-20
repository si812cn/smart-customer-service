// ==UserScript==
// @name         抖音IM平台 - 新消息提取处理器
// @description  注入到抖音客服系统页面，用于提取新用户评论/消息
// @version      1.0
// @author       AutoReply
// ==/UserScript==

// 使用立即执行函数（IIFE）避免变量污染全局作用域
(function () {
    // 从全局共享的核心模块中解构出所需工具和配置
    // 这些是在 core.js 中定义并注入的通用能力
    const { ConfigManager, Utils, SELECTORS, XPathUtil, DateUtils } = window.AutoReplyCore;

    // 动态获取当前所在的平台（例如：'douyin_im'）
    // 用于后续选择正确的 XPath 选择器
    const platform = "douyin_im";

    /**
     * 全局函数：提取页面上的所有新评论/消息
     * 该函数会被 content.js 中的 MutationObserver 触发调用
     * 实现“发现新消息 → 解析 → 过滤 → 处理”的流程
     */
    window.extractNewComments = function () {
        // ✅ 同步获取配置（无 await，无 callback）
        const config = ConfigManager.get();

        // 使用 XPath 工具查询页面中所有匹配的消息项（可能是多个评论 DOM 节点）
        const items = XPathUtil.queryAll(SELECTORS.COMMENT_LIST[platform]);

        // 在当前评论节点内，查找“用户名”对应的 DOM 元素
        const userEl = XPathUtil.query(SELECTORS.COMMENT_USER[platform]);

        if(!userEl) return;

        const user = userEl.textContent.trim();

        // 使用 Set 记录已处理过的消息唯一键，防止重复处理（去重）
        const seenKeys = new Set();

        console.log("开始循环：");
        // 遍历每一个找到的评论 DOM 节点
        for (const item of items) {
            // 在当前评论节点内，查找“评论内容”对应的 DOM 元素
            const textEl = XPathUtil.query(SELECTORS.COMMENT_TEXT[platform], item);

            // 如果找不到评论内容，则跳过此条记录
            if (!textEl) continue;

            // 提取文本内容并去除首尾空白
            const text = textEl.textContent.trim();

            // 获取第一个直接子级 div
            const firstChildDiv = item.querySelector(':scope > div');

            if (!firstChildDiv) continue;

            const dataId = firstChildDiv.dataset.id;
            console.log(dataId); // 输出 data-id 的值

            // 生成该条评论的唯一标识 key（基于用户+内容生成，已做规范化处理）
            // const key = Utils.createCommentKey(user, text);

            // 如果这个 dataId 已经处理过，说明是重复消息，跳过
            if (seenKeys.has(dataId)) continue;

            // 将本次消息的 key 加入已处理集合，避免后续重复处理
            seenKeys.add(dataId);

            // === 消息过滤阶段 ===
            // 检查评论内容是否包含屏蔽关键词（如“微信”、“刷单”等）
            // 如果包含任一关键词，则忽略这条消息
            if (config.text.blockedKeywords.some(kw => text.includes(kw))) {
                console.log('[过滤] 屏蔽关键词:', { user, text, keyword: config.text.blockedKeywords.find(kw => text.includes(kw)) });
                continue;
            }

            // 获取消息发送时间
            const el = item.querySelector('div.leaveMessage.messageNotMe');
            const org_comment_time = el?.nextElementSibling?.firstElementChild?.textContent?.trim() || null;
            const date_comment_time = DateUtils.parseTimeText(org_comment_time);
            const comment_time = DateUtils.formatDateTime(date_comment_time);

            // === 成功提取到有效新消息！===
            console.log('[新消息]', { user, text, platform, dataId, comment_time });

            if(window.custAssistant){
                window.custAssistant.handleComment({
                    user,
                    text,
                    timestamp: Utils.now(),
                    dataId,
                    comment_time
                });
            }

        }

        console.log("结束循环：");
    };

    // 脚本加载完成提示，便于调试
    console.log('[AutoReply] douyin_im.js 已成功注入，准备监听新消息...');
})();