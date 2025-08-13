/**
 * 消息统一结构
 */
export interface Message {
    id: string;                    // 唯一 ID（可用时间戳+随机数生成）
    user: string;
    msg: string;
    timestamp: number;             // 统一使用 timestamp（比 time 更明确）
    type: 'comment' | 'service' | 'anchor' | 'system'; // 保留 system 类型（如“欢迎进入直播间”）
    platform: string;              // 支持多平台（douyin, kuaishou, bilibili...）
}