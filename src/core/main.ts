import { ConfigManager} from "../config/defaultConfig";
import {Logger, LogLevel} from "../utils/logger";
import { escapeRegExp1 } from '../utils/string';
import { BaseExtractor, Message } from '../extractor/base';
import { DouyinExtractor } from '../extractor/douyin';
import { KuaishouExtractor } from '../extractor/kuaishou';
import { XiaoHongShuExtractor } from '../extractor/xiaohongshu';
import { ShipinHaoExtractor } from '../extractor/shipinhao';
import { BaiduExtractor } from '../extractor/baidu';
import { TaobaoExtractor } from '../extractor/taobao';
import { JingDongExtractor } from '../extractor/jingdong';
import { TikTokExtractor } from '../extractor/tiktok';
import { storage } from '../database/storage';
import { AIContext } from '../ai/context';
import { WaterArmy } from '../crowd/waterArmy';

/**
 * 🧠 智能客服主系统
 *
 * 功能说明：
 * - 自动识别当前直播/电商后台平台（抖音、快手、小红书等）
 * - 实时监听用户评论、客服消息、主播发言
 * - 基于关键词或黑名单判断是否需要回复
 * - 调用 AI（Coze 或 GPT）生成智能回复
 * - 通过“水军”模块模拟真人发送回复（自动化操作）
 * - 支持单页应用（SPA）的 URL 变化监听与热重载
 */
class SmartCustomerService {
    private config: ConfigManager;
    private logger!: Logger; // 使用 ! 断言，会在 init 中初始化

    private extractor: BaseExtractor | null = null; // 当前平台的内容提取器
    private ai: AIContext | null = null;            // AI 回复引擎
    private waterArmy: WaterArmy | null = null;     // 自动化回复执行器（“水军”）
    private observer: MutationObserver | null = null; // DOM 监听器
    private qaKeywords: string[] = [];              // 触发回复的关键词列表
    private blackWords: string[] = [];              // 屏蔽词列表

    // 在 initKeywords() 中预编译正则
    private qaRegex: RegExp | null = null;
    private blackRegex: RegExp | null = null;

    // 在类中定义最大并发数
    private readonly MAX_CONCURRENT = 3;

    constructor() {
        this.config = new ConfigManager(); // 假设 ConfigManager 有默认构造
    }

    /**
     * 🚀 初始化系统
     * 加载配置 → 初始化关键词/AI/水军 → 选择平台提取器 → 开始监听
     */
    async init(): Promise<void> {
        try {
            await this.config.load();           // 从浏览器存储加载用户配置
            // 初始化日志系统
            const logLevel = this.config.get<LogLevel>('logLevel') || 'info';
            this.logger = new Logger(logLevel);

            this.logger.info('【智能客服系统】初始化开始...');

            this.initKeywords();                // 解析关键词和黑名单
            this.initAI();                      // 初始化 AI 回复模型
            this.initWaterArmy();               // 初始化自动化回复模块
            this.extractor = this.getExtractor(); // 根据域名匹配平台

            if (!this.extractor) {
                this.logger.warn('当前页面不受支持');
                return;
            }

            // 先等待评论区出现
            const container = await this.extractor.waitForSelector('div[data-airef="chat_container"]');

            if (container) {
                this.logger.info(`【智能客服】已启动 - 平台: ${this.extractor.constructor.name}`);
                this.startListening(); // 开始监听页面动态
            }
        } catch (error) {
            this.logger.error('[智能客服] 初始化失败:', error);
        }
    }

    /**
     * 🔤 初始化关键词和黑名单（从配置中读取并分割为数组）
     */
    private initKeywords(): void {
        const keywords = this.config.get<string>('qaKeywords');
        this.qaKeywords = keywords ? keywords.split(',').map(k => k.trim()) : [];

        const blackWords = this.config.get<string>('blackWords');
        this.blackWords = blackWords ? blackWords.split(',').map(k => k.trim()) : [];

        // 预编译正则表达式
        this.qaRegex = this.qaKeywords.length > 0
            ? new RegExp(this.qaKeywords.map(escapeRegExp1).join('|'), 'i')
            : null;

        this.blackRegex = this.blackWords.length > 0
            ? new RegExp(this.blackWords.map(escapeRegExp1).join('|'), 'i')
            : null;

        this.logger.debug('关键词初始化完成', { qa: this.qaKeywords, black: this.blackWords });
    }

    /**
     * 🤖 初始化 AI 回复引擎
     * 支持两种模式：Coze Bot 或 GPT API
     */
    private initAI(): void {
        const cozeBotId = this.config.get<string>('cozeBotid');
        const cozeKey = this.config.get<string>('cozeApikey');
        const gptKey = this.config.get<string>('gptKey');

        if ((cozeBotId && cozeKey) || gptKey) {
            this.ai = new AIContext(cozeBotId, cozeKey, gptKey);
            this.logger.info('[AI] 已启用');
        }
    }

    /**
     * 💬 初始化“水军”系统（即自动化操作机器人）
     * 用于模拟人工点击、输入、发送消息
     */
    private initWaterArmy(): void {
        if (this.config.get<boolean>('enableCrowd')) {
            this.waterArmy = new WaterArmy();
            this.logger.info('[水军] 已启用');
        }
    }

    /**
     * 🌐 根据当前页面域名自动选择对应的提取器
     * 支持多个主流直播/电商后台平台
     */
    private getExtractor(): BaseExtractor | null {
        const host = location.host;
        const pathname = location.pathname;

        if (host.includes('jinritemai.com')) {
            return new DouyinExtractor(this.logger); // 抖音小店
        }
        if (host.includes('kwaixiaodian.com')) {
            return new KuaishouExtractor(this.logger); // 快手小店
        }
        if (host.includes('xiaohongshu.com')) {
            return new XiaoHongShuExtractor(this.logger); // 小红书商家后台
        }
        if (host.includes('weixin.qq.com') && location.pathname.startsWith('/mp')) {
            return new ShipinHaoExtractor(this.logger); // 微信视频号
        }
        if (host.includes('baidu.com')) {
            return new BaiduExtractor(this.logger); // 百度优选
        }
        if (host.includes('taobao.com')) {
            return new TaobaoExtractor(this.logger); // 淘宝直播
        }
        if (host.includes('jd.com')) {
            return new JingDongExtractor(this.logger); // 京东直播
        }
        if (host.includes('tiktok.com')) {
            return new TikTokExtractor(this.logger); // TikTok 后台
        }

        return null; // 不支持的平台
    }

    /**
     * 👂 开始监听页面 DOM 变化，检测新消息
     */
    private startListening(): void {
        if (!this.extractor) return;

        // 使用 extractor 提供的 observe 方法创建 MutationObserver
        this.observer = this.extractor.observe(async () => {
            await this.processNewMessages();
        });

        // 初始执行一次，处理已存在的消息
        setTimeout(() => this.processNewMessages(), 1000);
    }
    /**
     * 📥 处理所有新出现的消息（评论、客服消息、主播发言）
     */
    private async processNewMessages(): Promise<void> {
        if (!this.extractor) return;

        const comments = this.extractor.extractComments();
        const serviceMsgs = this.extractor.extractServiceMessages();
        const anchorMsgs = this.extractor.extractAnchorMessages();

        const allMessages = [...comments, ...serviceMsgs, ...anchorMsgs];

        // ✅ 1. 先存储所有消息到数据库
        for (const msg of allMessages) {
            await storage.add(msg); // 所有消息都记录
        }

        // ✅ 2. 过滤出需要自动回复的评论
        const replyTasks = allMessages
            .filter(msg => msg.type === 'comment' && this.shouldReply(msg.msg));

        if (replyTasks.length === 0) return;

        this.logger.info(`发现 ${replyTasks.length} 条需回复的评论，开始并发处理...`);

        // ✅ 3. 并发处理回复任务（只处理一次）
        await this.runWithConcurrencyLimit(
            replyTasks,
            this.handleReply.bind(this),
            this.MAX_CONCURRENT
        );
    }

    /**
     * 通用并发控制函数
     */
    private async runWithConcurrencyLimit<T>(
        tasks: T[],
        processor: (task: T) => Promise<any>,
        limit: number
    ): Promise<void> {
        const executing: Array<Promise<any>> = [];

        for (const task of tasks) {
            const p = processor(task).then(() => {
                executing.splice(executing.indexOf(p), 1);
            });

            executing.push(p);

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }

        await Promise.all(executing);
    }

    /**
     * ❓ 判断某条消息是否需要回复
     * 规则：
     * 1. 不包含黑名单词汇
     * 2. 包含任一关键词（若设置了关键词），或未设置关键词时默认都回复
     */
    private shouldReply(msg: string): boolean {
        // 黑名单匹配（忽略大小写）
        if (this.blackRegex && this.blackRegex.test(msg)) {
            this.logger.debug('消息命中黑名单，跳过回复:', msg);
            return false;
        }

        // 无关键词 → 全部回复
        if (!this.qaRegex) {
            return true;
        }

        // 关键词匹配（忽略大小写）
        const result = this.qaRegex.test(msg);
        if (result) {
            this.logger.debug('消息命中关键词，准备回复:', msg);
        }
        return result;
    }

    /**
     * 💬 处理回复逻辑
     * 优先使用 AI 生成回复，失败时降级为默认回复
     */
    private async handleReply(msg: Message): Promise<void> {
        this.logger.debug('正在处理回复:', msg);

        if (!this.ai) {
            // AI 未启用时使用配置中的默认回复语
            const finalReplay = this.config.get<string>('finalReplay') || '您好，请稍等';
            if (this.waterArmy) {
                await this.waterArmy.speak(finalReplay); // 由水军发送
            }
            return;
        }

        try {
            const reply = await this.ai.process(msg); // 调用 AI 生成回复
            if (this.waterArmy && reply) {
                await this.waterArmy.speak(reply); // 发送 AI 回复
            }
        } catch (error) {
            this.logger.error('[AI回复失败]', error);
            // AI 出错时降级处理
            const fallback = this.config.get<string>('finalReplay') || '稍后回复您';
            if (this.waterArmy) {
                await this.waterArmy.speak(fallback);
            }
        }
    }

    /**
     * 🛑 销毁资源，停止监听
     * 用于页面跳转或插件卸载时清理内存
     */
    destroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.logger.info('[智能客服] 已停止');
    }
}

// ==================== 🚪 启动逻辑 ====================

let scs: SmartCustomerService | null = null;

/**
 * 页面准备就绪后启动系统
 */
function onReady() {
    if (scs) return; // 防止重复初始化
    scs = new SmartCustomerService();
    scs.init();
}

// 支持页面加载中或已加载两种情况
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
} else {
    onReady();
}

// 🔁 监听 URL 变化（支持单页应用 SPA）
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // URL 变化时重新初始化系统
        if (scs) scs.destroy();
        setTimeout(onReady, 1000); // 延迟确保新页面加载完成
    }
}).observe(document, { subtree: true, childList: true });

// 🎉 启动提示（绿色加粗）
console.log('%c[智能客服系统] 已注入', 'color: #4CAF50; font-weight: bold; font-size: 14px;');