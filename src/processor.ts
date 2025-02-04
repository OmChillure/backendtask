import { TxInfo, ProcessedTx } from './types';
import { logger } from './logger';
import { performance } from 'perf_hooks';
import { CONFIG } from './config';

class TransactionProcessor {
    private static instance: TransactionProcessor;
    private processedTxs: Map<string, ProcessedTx>;
    private tradingCallback?: (tx: ProcessedTx) => Promise<void>;
    
    private constructor() {
        this.processedTxs = new Map();
        
        setInterval(() => this.cleanup(), CONFIG.FLUSH_INTERVAL);
    }

    public static getInstance(): TransactionProcessor {
        if (!TransactionProcessor.instance) {
            TransactionProcessor.instance = new TransactionProcessor();
        }
        return TransactionProcessor.instance;
    }

    public setTradingCallback(callback: (tx: ProcessedTx) => Promise<void>): void {
        this.tradingCallback = callback;
    }

    public async processTx(txInfo: TxInfo): Promise<void> {
        const startTime = performance.now();

        try {
            if (this.processedTxs.has(txInfo.signature)) {
                return;
            }

            const processedTx: ProcessedTx = {
                ...txInfo,
                processed: true,
                processingAttempts: 1,
                lastProcessed: Date.now()
            };

            if (this.processedTxs.size >= CONFIG.MAX_CACHE_SIZE) {
                const oldestKey = this.processedTxs.keys().next().value;
                if (oldestKey) {
                    this.processedTxs.delete(oldestKey);
                }
            }

            if (txInfo.amount >= CONFIG.MIN_TRADE_AMOUNT) {
                logger.info('Large transfer detected', {
                    signature: txInfo.signature,
                    amount: txInfo.amount
                });

                if (this.tradingCallback) {
                    await this.tradingCallback(processedTx);
                }
            }


            this.processedTxs.set(txInfo.signature, processedTx);
            const processingTime = performance.now() - startTime;

        } catch (error) {
            logger.error('Processing error', {
                signature: txInfo.signature,
                error
            });
            throw error;
        }
    }

    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [signature, tx] of this.processedTxs.entries()) {
            if (now - tx.lastProcessed! > CONFIG.FLUSH_INTERVAL) {
                this.processedTxs.delete(signature);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Cleaned processed transactions', { count: cleaned });
        }
    }

    public getStats(): { processed: number; cacheSize: number } {
        return {
            processed: this.processedTxs.size,
            cacheSize: CONFIG.MAX_CACHE_SIZE
        };
    }
}

export const processor = TransactionProcessor.getInstance();