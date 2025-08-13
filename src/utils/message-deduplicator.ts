// utils/message-deduplicator.ts
import { Message } from '../types/message'; // 根据你的路径调整
import { Logger } from './logger';

export class MessageDeduplicator {
    private seenIds = new Set<string>();
    private seenContent = new Set<string>(); // 可选：基于内容去重
    private readonly maxCacheSize = 1000;    // 最多缓存最近 1000 条

    constructor(
        private logger?: Logger,
        private useContentDedupe = false // 是否启用内容级去重
    ) {}

    /**
     * 过滤重复消息
     * @param messages 待去重的消息数组
     * @returns 去重后的消息数组
     */
    filter(messages: Message[]): Message[] {
        const result: Message[] = [];

        for (const msg of messages) {
            const isDuplicate = this.isDuplicate(msg);
            if (!isDuplicate) {
                result.push(msg);
                this.track(msg);
            } else {
                this.logger?.debug(`[Deduplicator] 忽略重复消息: ${msg.id} - ${msg.user}: ${msg.msg}`);
            }
        }

        return result;
    }

    private isDuplicate(msg: Message): boolean {
        if (this.seenIds.has(msg.id)) {
            return true;
        }

        if (this.useContentDedupe) {
            const contentKey = `${msg.user}_${msg.msg}`;
            return this.seenContent.has(contentKey);
        }

        return false;
    }

    private track(msg: Message): void {
        this.seenIds.add(msg.id);

        if (this.useContentDedupe) {
            const contentKey = `${msg.user}_${msg.msg}`;
            this.seenContent.add(contentKey);
        }

        // 超出缓存大小时清理旧数据（FIFO）
        if (this.seenIds.size > this.maxCacheSize) {
            const firstId = this.seenIds.values().next().value;
            this.seenIds.delete(firstId);
        }

        if (this.seenContent.size > this.maxCacheSize) {
            const firstKey = this.seenContent.values().next().value;
            this.seenContent.delete(firstKey);
        }
    }

    /**
     * 清空去重缓存（可选，比如换直播间时调用）
     */
    clear(): void {
        this.seenIds.clear();
        this.seenContent.clear();
        this.logger?.info('[Deduplicator] 去重缓存已清空');
    }
}