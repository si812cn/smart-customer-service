import { ConfigManager} from "../config/defaultConfig";
import {Logger, LogLevel} from "../utils/logger";
import {Message} from "../types/message";

/**
 * 抽取器基类（提供通用能力）
 */
export abstract class BaseExtractor {
    protected platform: string;
    protected logger: Logger;

    constructor(
        platform: string,
        logger?: Logger
    ) {
        this.platform = platform;
        this.logger = logger || (console as unknown as Logger); // 假设 Logger 实现了 console 接口
    }

    // 子类必须实现的具体抽取逻辑
    abstract extractComments(): Message[];
    abstract extractServiceMessages(): Message[];
    abstract extractAnchorMessages(): Message[];

    /**
     * 默认 DOM 变化监听器（子类可重写）
     */
    observe(callback: () => void, targetSelector: string = 'body'): MutationObserver {
        const target = document.querySelector(targetSelector);
        if (!target) {
            this.logger.warn(`[BaseExtractor] 监听目标不存在: ${targetSelector}`);
            return new MutationObserver(() => {});
        }

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList' && m.addedNodes.length > 0) {
                    callback();
                    break;
                }
            }
        });

        observer.observe(target, { childList: true, subtree: true });
        return observer;
    }

    /**
     * 等待某个选择器出现（带超时）
     */
    async waitForSelector(
        selector: string,
        timeout = 5000
    ): Promise<Element | null> {
        return new Promise((resolve) => {
            const start = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                } else if (Date.now() - start < timeout) {
                    setTimeout(check, 50);
                } else {
                    this.logger.warn(`[BaseExtractor] 等待选择器超时: ${selector}`);
                    resolve(null);
                }
            };
            check();
        });
    }

    /**
     * 生成唯一 ID（可选）
     */
    protected generateId(): string {
        return `${this.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}