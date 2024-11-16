import 'dotenv/config'
import express from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import path, { dirname } from 'path';
import apiRoutes from "./routes/index.js"
import { dbConnect } from './database.js';
import setup from './services/setup.js';
import settingsService from './services/settings.service.js';
import SmeeService from './services/smee.js';
import logger, { expressLoggerMiddleware } from './services/logger.js';
import { fileURLToPath } from 'url';

const PORT: any = Number(process.env.PORT) || 80;

export const app = express();
app.use(cors());
app.use(expressLoggerMiddleware);

(async () => {
  await dbConnect();
  logger.info('DB Connected ✅');
  await settingsService.initializeSettings();
  logger.info('Settings loaded ✅');
  await SmeeService.createSmeeWebhookProxy(PORT);
  logger.info('Created Smee webhook proxy ✅');

  if (true === true) {
    throw new Error('Test error');
  }
  try {
    await setup.createAppFromEnv();
    logger.info('Created GitHub App from environment ✅');
  } catch (error) {
    logger.info('Failed to create app from environment. This is expected if the app is not yet installed.', error);
  }

  app.use((req, res, next) => {
    if (req.path === '/api/github/webhooks') {
      return next();
    }
    bodyParser.json()(req, res, next);
  }, bodyParser.urlencoded({ extended: true }));
  app.use('/api', apiRoutes);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const frontendPath = path.resolve(__dirname, '../../frontend/dist/github-value/browser');

  app.use(express.static(frontendPath));
  app.get('*', rateLimit({
    windowMs: 15 * 60 * 1000, max: 5000,
  }), (_, res) => res.sendFile(path.join(frontendPath, 'index.html')));

  app.listen(PORT, () => {
    logger.info(`Server is running at http://localhost:${PORT} 🚀`);
    if (process.env.WEB_URL) {
      logger.debug(`Frontend is running at ${process.env.WEB_URL} 🚀`);
    }
  });
})();