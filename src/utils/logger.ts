// 通用日志工具类

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: { [key in LogLevel]: number } = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

export class Logger {
    private level: number;

    constructor(level: LogLevel = 'info') {
        this.level = LOG_LEVELS[level];
    }

    debug(...args: any[]): void {
        if (this.level <= LOG_LEVELS.debug) {
            console.log('%c[DEBUG]', 'color: #757575; font-weight: bold', ...args);
        }
    }

    info(...args: any[]): void {
        if (this.level <= LOG_LEVELS.info) {
            console.log('%c[INFO]', 'color: #4CAF50; font-weight: bold', ...args);
        }
    }

    warn(...args: any[]): void {
        if (this.level <= LOG_LEVELS.warn) {
            console.log('%c[WARN]', 'color: #FF9800; font-weight: bold', ...args);
        }
    }

    error(...args: any[]): void {
        if (this.level <= LOG_LEVELS.error) {
            console.log('%c[ERROR]', 'color: #F44336; font-weight: bold', ...args);
        }
    }
}