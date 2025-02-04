import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { logger } from './logger';
import { CONFIG } from './config';
import { TxInfo } from './types';
import { performance } from 'perf_hooks';

export async function validateConnection(conn: Connection): Promise<boolean> {
    try {
        const start = performance.now();
        await conn.getLatestBlockhash();
        const latency = performance.now() - start;
        
        logger.debug('RPC health check', { latency });
        return latency < 1000;
    } catch {
        return false;
    }
}

export function extractTxInfo(tx: ParsedTransactionWithMeta): TxInfo {
    try {
        const signature = tx.transaction.signatures[0];
        const sender = tx.transaction.message.accountKeys[0].pubkey.toBase58();
        const receiver = tx.transaction.message.accountKeys[1].pubkey.toBase58();
        
        let amount = 0;
        let type = 'unknown';
        
        if (tx.meta && tx.meta.preBalances && tx.meta.postBalances) {
            amount = Math.abs(
                tx.meta.preBalances[0] - tx.meta.postBalances[0]
            ) / 1e9;
            type = determineTxType(tx);
        }

        return {
            signature,
            timestamp: tx.blockTime || Date.now(),
            sender,
            receiver,
            amount,
            type,
            raw: tx
        };
    } catch (error) {
        logger.error('Failed to extract tx info', error);
        throw error;
    }
}

export function determineTxType(tx: ParsedTransactionWithMeta): string {
    if (!tx.meta) return 'unknown';

    const instructions = tx.transaction.message.instructions;
    if (instructions.length === 0) return 'unknown';

    const programId = instructions[0].programId.toString();
    
    switch (programId) {
        case '11111111111111111111111111111111':
            return 'transfer';
        case 'SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8':
            return 'swap';
        case 'Stake11111111111111111111111111111111111111':
            return 'stake';
        default:
            return 'other';
    }
}

export function chunk<T>(arr: T[], size: number): T[][] {
    return Array.from(
        { length: Math.ceil(arr.length / size) },
        (_, i) => arr.slice(i * size, i * size + size)
    );
}

export function createBackoffDelay(attempt: number): number {
    return Math.min(CONFIG.RETRY_DELAY * Math.pow(2, attempt), 10000);
}

export function isValidPublicKey(key: string): boolean {
    try {
        new PublicKey(key);
        return true;
    } catch {
        return false;
    }
}

export function formatSolAmount(lamports: number): string {
    return (lamports / 1e9).toFixed(4);
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}