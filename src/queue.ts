import { TxInfo, QueueItem } from './types';
import { logger } from './logger';
import { performance } from 'perf_hooks';

export class TransactionQueue {
    private static instance: TransactionQueue;
    private queue: QueueItem[] = [];
    private processing: boolean = false;
    private processCallback?: (tx: TxInfo) => Promise<void>;

    private constructor() {}

    public static getInstance(): TransactionQueue {
        if (!TransactionQueue.instance) {
            TransactionQueue.instance = new TransactionQueue();
        }
        return TransactionQueue.instance;
    }

    public setProcessor(callback: (tx: TxInfo) => Promise<void>): void {
        this.processCallback = callback;
    }

    public async enqueue(tx: TxInfo, priority: number = 1): Promise<void> {
        const item: QueueItem = {
            tx,
            priority,
            timestamp: Date.now()
        };

        const insertIndex = this.queue.findIndex(i => i.priority < priority);
        if (insertIndex === -1) {
            this.queue.push(item);
        } else {
            this.queue.splice(insertIndex, 0, item);
        }

        logger.debug('Enqueued transaction', { signature: tx.signature, queueLength: this.queue.length });

        if (!this.processing) {
            this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (!this.processCallback || this.processing) return;

        this.processing = true;
        
        try {
            while (this.queue.length > 0) {
                const batch = this.queue.splice(0, Math.min(10, this.queue.length));
                
                await Promise.all(batch.map(async (item) => {
                    try {
                        const startTime = performance.now();
                        await this.processCallback!(item.tx);
                        const processingTime = performance.now() - startTime;
                        
                        logger.debug('Processed transaction', {
                            signature: item.tx.signature,
                            processingTime
                        });
                    } catch (error) {
                        logger.error('Failed to process transaction', {
                            signature: item.tx.signature,
                            error
                        });
                        
                        const age = Date.now() - item.timestamp;
                        if (age < 60000 && item.priority > 0) {  
                            await this.enqueue(item.tx, item.priority - 1);
                        }
                    }
                }));

                await new Promise(resolve => setTimeout(resolve, 10));
            }
        } finally {
            this.processing = false;
            
            if (this.queue.length > 0) {
                this.processQueue();
            }
        }
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    public clear(): void {
        this.queue = [];
    }
}

export const txQueue = TransactionQueue.getInstance();