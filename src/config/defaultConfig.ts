// 配置管理类
import {Config} from "./config";

export class ConfigManager {
    private cache: Map<string, any> = new Map(); // 本地缓存配置项，提高读取效率
    private config: Config = {
        gptKey: '',
        cozeBotid: '',
        cozeApikey: '',
        qaKeywords: '',
        finalReplay: '您好，请稍等', // 默认结束语
        timeLimit: 30,              // 默认超时时间为30秒
        speakLimit: 5,              // 默认用户最多连续发言5次
        blackWords: '',
        pushQuan: false,            // 默认不开启推送功能
        enableCrowd: false,          // 默认不启用人群互动// 默认为 info，避免生产环境刷屏
        logLevel: 'info'
    };

    /**
     * 从 Chrome 浏览器的同步存储中加载所有配置项
     * 使用 chrome.storage.sync 可实现多设备间配置同步
     */
    async load(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.sync.get(null, (items) => {
                // 将所有存储的配置项写入内存缓存
                Object.keys(items).forEach(key => {
                    this.cache.set(key, items[key]);
                });
                resolve();
            });
        });
    }

    /**
     * 根据键名获取配置项的值
     * @param key - 配置项的键名
     * @returns 对应配置项的值，若不存在则返回 undefined
     */
    get<T>(key: string): T | undefined {
        return this.cache.get(key) as T;
    }

    /**
     * 获取所有当前配置项的副本
     * 注意：此处原代码有误，应返回合并了缓存后的完整配置
     * @returns 包含所有配置项的对象
     */
    getAll(): Config {
        // 修正建议：应合并默认配置与缓存中的实际值
        return { ...this.config, ...Object.fromEntries(this.cache) }; // 修复原代码错误
    }

    /**
     * 设置某个配置项的值
     * @param key - 配置项的键名
     * @param value - 要设置的值
     * @returns Promise<void>，表示异步保存操作完成
     */
    async set(key: string, value: any): Promise<void> {
        this.cache.set(key, value); // 更新内存缓存
        return new Promise((resolve) => {
            const obj: any = {};
            obj[key] = value;
            // 将配置项持久化到 Chrome 同步存储中
            chrome.storage.sync.set(obj, () => resolve());
        });
    }
}