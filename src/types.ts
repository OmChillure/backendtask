import { ParsedTransactionWithMeta } from '@solana/web3.js';

export interface TxInfo {
    signature: string;
    timestamp: number;
    sender: string;
    receiver: string;
    amount: number;
    type: string;
    raw?: ParsedTransactionWithMeta;
    priority?: number;     
    processingTime?: number; 
}

export interface ProcessedTx extends TxInfo {
    processed: boolean;
    error?: string;
    processingAttempts?: number;
    lastProcessed?: number;
}

export interface MonitorStats {
    processedCount: number;
    errorCount: number;
    avgProcessingTime: number;
    lastProcessedTimestamp?: number;
}

export interface QueueItem {
    tx: TxInfo;
    priority: number;
    timestamp: number;
}

export type ProcessingCallback = (tx: ProcessedTx) => Promise<void>;