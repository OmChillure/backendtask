import { Connection, PublicKey } from '@solana/web3.js';
import { CONFIG } from './config';
import { logger } from './logger';

export class Monitor {
    private conn: Connection;
    private backupConn?: Connection;
    private subscriptionId?: number;
    private isHistoricalRunning: boolean = false;

    constructor() {
        this.conn = new Connection(CONFIG.RPC_URL, 'confirmed');
        if (CONFIG.BACKUP_RPC) {
            this.backupConn = new Connection(CONFIG.BACKUP_RPC, 'confirmed');
        }
    }

    async start(address: string, mode: 'realtime' | 'historical' | 'both' = 'both'): Promise<void> {
        logger.info('Starting monitor', { address, mode });

        try {
            if (mode === 'realtime' || mode === 'both') {
                await this.startRealtime(address);
            }

            if (mode === 'historical' || mode === 'both') {
                await this.startHistorical(address);
            }
        } catch (error) {
            logger.error('Failed to start monitor', error);
            throw error;
        }
    }

    private async startRealtime(address: string): Promise<void> {
        try {
            this.subscriptionId = this.conn.onLogs(
                new PublicKey(address),
                async (logs) => {
                    if (logs.err) return;

                    try {
                        const tx = await this.conn.getParsedTransaction(logs.signature);
                        if (tx) {
                            const amount = this.extractAmount(tx);
                            logger.info('New transaction', {
                                signature: logs.signature,
                                amount: amount,
                                blockTime: tx.blockTime
                            });
                        }
                    } catch (error) {
                        logger.error('Realtime processing error', error);
                        this.switchToBackup();
                    }
                },
                'confirmed'
            );

            logger.info('Realtime monitoring started', { subscriptionId: this.subscriptionId });
        } catch (error) {
            logger.error('Failed to start realtime monitoring', error);
            this.switchToBackup();
        }
    }

    private async startHistorical(address: string): Promise<void> {
        this.isHistoricalRunning = true;
        let lastSignature: string | undefined;

        while (this.isHistoricalRunning) {
            try {
                const signatures = await this.conn.getSignaturesForAddress(
                    new PublicKey(address),
                    { before: lastSignature, limit: CONFIG.BATCH_SIZE }
                );

                if (signatures.length === 0) {
                    logger.info('Historical backfill complete');
                    break;
                }

                for (const sig of signatures) {
                    try {
                        const tx = await this.conn.getParsedTransaction(sig.signature);
                        if (tx) {
                            const amount = this.extractAmount(tx);
                            logger.info('Historical transaction', {
                                signature: sig.signature,
                                amount: amount,
                                blockTime: tx.blockTime
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to process historical tx', {
                            signature: sig.signature,
                            error
                        });
                    }
                }

                lastSignature = signatures[signatures.length - 1]?.signature;
                await new Promise(r => setTimeout(r, CONFIG.HISTORY_DELAY));
            } catch (error) {
                logger.error('Historical fetch error', error);
                await new Promise(r => setTimeout(r, CONFIG.RETRY_DELAY));
            }
        }
    }

    private switchToBackup(): void {
        if (this.backupConn && CONFIG.WALLET_ADDRESS) {
            logger.warn('Switching to backup RPC...');
            this.conn = this.backupConn;
            
            if (this.subscriptionId) {
                this.conn.removeOnLogsListener(this.subscriptionId);
            }
            
            this.start(CONFIG.WALLET_ADDRESS, 'realtime')
                .catch(error => logger.error('Failed to switch to backup', error));
        }
    }

    private extractAmount(tx: any): number {
        if (tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
            return Math.abs(tx.meta.preBalances[0] - tx.meta.postBalances[0]) / 1e9;
        }
        return 0;
    }

    public stop(): void {
        if (this.subscriptionId) {
            this.conn.removeOnLogsListener(this.subscriptionId);
            logger.info('Realtime monitoring stopped');
        }
        this.isHistoricalRunning = false;
    }
}