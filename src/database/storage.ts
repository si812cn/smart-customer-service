import { Message } from '../extractor/base';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface MessageDB extends DBSchema {
    messages: {
        key: number;
        value: Message & { timestamp: number; platform: string };
        indexes: {
            timestamp: number;
            platform: string;
            type: string;
        };
    };
}

let dbPromise: Promise<IDBPDatabase<MessageDB>> | null = null;

export const storage = {
    async db(): Promise<IDBPDatabase<MessageDB>> {
        if (!dbPromise) {
            dbPromise = openDB<MessageDB>('SmartCustomerService', 1, {
                upgrade(db) {
                    const store = db.createObjectStore('messages', {
                        keyPath: 'id',
                        autoIncrement: true,
                    });
                    store.createIndex('timestamp', 'timestamp');
                    store.createIndex('platform', 'platform'); // 如 message 有 platform 字段
                    store.createIndex('type', 'type');         // 如 comment/service/anchor
                },
            });
        }
        return dbPromise;
    },

    async add(message: Message): Promise<void> {
        const db = await this.db();
        await db.add('messages', {
            ...message,
            timestamp: Date.now(),
        });
    },

    async getAll(): Promise<(Message & { timestamp: number })[]> {
        const db = await this.db();
        return await db.getAll('messages');
    },

    async getByIndex(index: 'timestamp' | 'platform' | 'type', value: string | number): Promise<(Message & { timestamp: number })[]> {
        const db = await this.db();
        return await db.getAllFromIndex('messages', index, IDBKeyRange.only(value));
    },

    async clear(): Promise<void> {
        const db = await this.db();
        await db.clear('messages');
    },

    async count(): Promise<number> {
        const db = await this.db();
        return await db.count('messages');
    }
};