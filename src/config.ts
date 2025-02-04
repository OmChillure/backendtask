import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

function validateConfig() {
    const requiredVars = ['RPC_URL', 'WALLET_ADDRESS'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

try {
    validateConfig();
} catch (error) {
    logger.error('Configuration error', error);
    process.exit(1);
}

export const CONFIG = {
    RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
    BACKUP_RPC: process.env.BACKUP_RPC,
    WALLET_ADDRESS: process.env.WALLET_ADDRESS || '',

    BATCH_SIZE: 30,                   
    MAX_CACHE_SIZE: 5000,          
    PARALLEL_LIMIT: 20,             
    
    RETRY_DELAY: 500,          
    HISTORY_DELAY: 200,       
    
    CHUNK_SIZE: 1000,                  
    FLUSH_INTERVAL: 5000, 
    
    MIN_TRADE_AMOUNT: 100,             
    MAX_SLIPPAGE: 0.05,          
    
    ENABLE_BACKUP_RPC: Boolean(process.env.BACKUP_RPC),
    DEBUG_MODE: process.env.DEBUG === 'true'
} as const;