import { createWriteStream, WriteStream } from 'fs';

export class Logger {
    private static instance: Logger;
    private logStream: WriteStream;
    private perfStream: WriteStream;
    private readonly logLevel: number;

    private static readonly LEVELS = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    private constructor() {
        this.logLevel = Logger.LEVELS[process.env.LOG_LEVEL as keyof typeof Logger.LEVELS] || Logger.LEVELS.INFO;
        this.logStream = createWriteStream('trading.log', { flags: 'a' });
        this.perfStream = createWriteStream('performance.log', { flags: 'a' });

        process.on('exit', () => {
            this.logStream.end();
            this.perfStream.end();
        });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: string, message: string, meta?: any): string {
        const timestamp = new Date().toISOString();
        const formattedMeta = meta ? ` | ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level}: ${message}${formattedMeta}\n`;
    }

    private shouldLog(level: number): boolean {
        return level <= this.logLevel;
    }

    public tx(signature: string, amount: number, type: string): void {
        if (this.shouldLog(Logger.LEVELS.INFO)) {
            const msg = this.formatMessage('TX', `${signature} | ${amount} SOL | ${type}`);
            this.logStream.write(msg);
            process.stdout.write(msg);
        }
    }

    public error(message: string, error?: Error | unknown): void {
        if (this.shouldLog(Logger.LEVELS.ERROR)) {
            const errorDetails = error instanceof Error ? error.stack : String(error);
            const msg = this.formatMessage('ERROR', message, { error: errorDetails });
            this.logStream.write(msg);
            process.stderr.write(msg);
        }
    }

    public warn(message: string, meta?: any): void {
        if (this.shouldLog(Logger.LEVELS.WARN)) {
            const msg = this.formatMessage('WARN', message, meta);
            this.logStream.write(msg);
            process.stdout.write(msg);
        }
    }

    public info(message: string, meta?: any): void {
        if (this.shouldLog(Logger.LEVELS.INFO)) {
            const msg = this.formatMessage('INFO', message, meta);
            this.logStream.write(msg);
            process.stdout.write(msg);
        }
    }

    public debug(message: string, meta?: any): void {
        if (this.shouldLog(Logger.LEVELS.DEBUG)) {
            const msg = this.formatMessage('DEBUG', message, meta);
            this.logStream.write(msg);
        }
    }


    public async flush(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.logStream.write('', (error) => {
                if (error) reject(error);
                this.perfStream.write('', (error) => {
                    if (error) reject(error);
                    resolve();
                });
            });
        });
    }
}

export const logger = Logger.getInstance();