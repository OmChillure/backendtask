import { Monitor } from './src/monitor';
import { logger } from './src/logger';
import { CONFIG } from './src/config';
import inquirer from 'inquirer';

async function getMonitoringMode() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'mode',
            message: 'Select monitoring mode:',
            choices: [
                'realtime',
                'historical',
            ]
        }
    ]);
    return answers.mode;
}

async function getWalletAddress() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'address',
            message: 'Enter wallet address (press enter to use from .env):',
            default: CONFIG.WALLET_ADDRESS,
        }
    ]);
    return answers.address;
}

async function main() {
    try {
        const mode = await getMonitoringMode();
        
        const address = await getWalletAddress();

        if (!address) {
            console.error('No wallet address provided!');
            process.exit(1);
        }

        console.log(`\n🚀 Starting Solana Monitor...`);
        console.log(`Mode: ${mode.toUpperCase()}`);
        console.log(`Wallet: ${address}`);
        console.log(`RPC: ${CONFIG.RPC_URL}\n`);

        const monitor = new Monitor();
        await monitor.start(address, mode);

        process.on('SIGINT', () => {
            console.log('\nShutting down monitor...');
            monitor.stop();
            process.exit(0);
        });

    } catch (error) {
        logger.error('Fatal error:', error);
        process.exit(1);
    }
}


process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
    process.exit(1);
});

main().catch((error) => {
    logger.error('Startup error:', error);
    process.exit(1);
});