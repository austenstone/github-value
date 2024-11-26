import bunyan from 'bunyan';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { Request, Response, NextFunction } from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = path.resolve(__dirname, '../../logs');

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

const packageJsonPath = path.resolve(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
export const appName = packageJson.name || 'GitHub Value';

const logger = bunyan.createLogger({
  name: appName,
  level: 'debug',
  serializers: {
    ...bunyan.stdSerializers,
    req: (req: Request) => ({
      method: req.method,
      url: req.url,
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort
    }),
    res: (res: Response) => ({
      statusCode: res.statusCode
    }),
  },
  streams: [
    {
      level: 'info',
      stream: process.stdout
    },
    {
      level: 'error',
      stream: process.stderr
    },
    {
      path: `${logsDir}/debug.json`,
      period: '1d',
      count: 14,
      level: 'debug'
    }
  ]
});

export const expressLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.info({ req }, 'request');
  res.on('finish', () => logger.info({ res }, 'response'));
  next();
};

export default logger;
