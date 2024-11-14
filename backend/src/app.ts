import 'dotenv/config'
import express from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import apiRoutes from "./routes/index"
import { dbConnect } from './database';
import setup from './services/setup';
import settingsService from './services/settings.service';
import SmeeService from './services/smee';
import logger, { expressLoggerMiddleware } from './services/logger';

const PORT = Number(process.env.PORT) || 80;

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

  try {
    const appId = process.env.GITHUB_APP_ID || process.env.GH_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY || process.env.GH_APP_PRIVATE_KEY;
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || process.env.GH_WEBHOOK_SECRET;
    if (!appId) throw new Error('GITHUB_APP_ID is not set');
    if (!privateKey) throw new Error('GITHUB_APP_PRIVATE_KEY is not set');
    if (!webhookSecret) throw new Error('GITHUB_WEBHOOK_SECRET is not set');
    await setup.createAppFromExisting(appId, privateKey, webhookSecret);
    logger.info('App created from environment ✅');
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

  const frontendPath = path.join(__dirname, '../../frontend/dist/github-value/browser');
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