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

const period = process.env.LOG_ROTATION_PERIOD || '1d';
const count = process.env.LOG_ROTATION_COUNT ? parseInt(process.env.LOG_ROTATION_COUNT) : 14;

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
      level: 'debug',
      stream: process.stdout
    },
    {
      level: 'error',
      stream: process.stderr
    },
    {
      path: `${logsDir}/error.json`,
      type: 'rotating-file',
      period,
      count,
      level: 'error'
    },
    {
      path: `${logsDir}/debug.json`,
      type: 'rotating-file',
      period,
      count,
      level: 'debug'
    }
  ]
});

export const expressLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  logger.debug(req);
  res.on('finish', () => logger.debug(res));
  next();
};

export default logger;
