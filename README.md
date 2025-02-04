# Backend Task
A high-performance, real-time Solana transaction monitoring system with historical backfilling capabilities. This tool enables tracking transactions for specific wallet addresses with configurable alerts and comprehensive logging features.

## Features

- Real-time transaction monitoring with minimal latency
- Historical transaction backfilling for data completeness
- Automatic RPC failover for high availability
- Performance monitoring and metrics collection
- Efficient caching system for optimized data access
- Detailed logging system with configurable levels

## Prerequisites
- Node.js
- pnpm 
- TypeScript 
- Solana RPC endpoint (mainnet/devnet)

## Project Structure

```bash
backendtask/
├── src/
│   ├── monitor.ts     # Core monitoring logic 
│   ├── config.ts      # Configuration settings
│   ├── logger.ts      # Logging system
│   ├── queue.ts       #queue logic
│   ├── processor.ts   # processor functions
│   ├── types.ts       # types
│   ├── utils.ts       # Utility functions
│
├── index.ts          # Entry point
├── .env              # Environment variables
├── package.json      # Project dependencies
├── tsconfig.json     # TypeScript configuration
├── .gitignore
└── pnpm-lock.yaml
```

## Installation

1. Clone the repository:
```bash
git clone [REPO_URL]
cd ....
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following content:
```env
RPC_URL=your_helius_rpc_url
BACKUP_RPC=your_backup_rpc_url
WALLET_ADDRESS=your_wallet_address
```

4. Start the project:
```bash
pnpm start
```

## Usage

Upon starting the application, you'll be prompted to select:
- Monitoring mode (realtime/historical)
- Wallet address (or use from .env)

### Configuration Options

You can customize the following parameters in `config.ts`:
- `BATCH_SIZE`: Number of transactions to process in parallel
- `HISTORY_DELAY`: Delay between historical transaction fetches
- `LOG_LEVEL`: Logging verbosity level
- `CACHE_SIZE`: Duration to cache transaction data

## Error Handling
The system implements robust error handling mechanisms:

- Automatic RPC failover for network resilience
- Exponential backoff for failed request retries
- Comprehensive error logging with stack traces
- Graceful shutdown handling for clean process termination

## Performance Optimization
To achieve optimal performance:

- Adjust `BATCH_SIZE` based on your RPC provider's rate limits
- Fine-tune `HISTORY_DELAY` for historical transaction processing
- Monitor `performance.log` for potential bottlenecks
- Utilize backup RPC endpoints for improved reliability
