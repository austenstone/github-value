import 'dotenv/config'
import express from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import apiRoutes from "./routes/index.js";
import { dbConnect } from './database.js';
import setup from './services/setup.js';
import settingsService from './services/settings.service.js';
import SmeeService from './services/smee.js';
import logger, { expressLoggerMiddleware } from './services/logger.js';

const PORT = Number(process.env.PORT) || 80;

export const app = express();
app.use(cors());
app.use(expressLoggerMiddleware);

await dbConnect();

(async () => {
  await dbConnect();
  await settingsService.initializeSettings();

  const { url: webhookProxyUrl } = await SmeeService.createSmeeWebhookProxy(PORT);

  try {
    await setup.createAppFromEnv();
  } catch (error) {
    logger.info('Failed to create app from environment. This is expected if the app is not yet installed.');
  }

  app.use((req, res, next) => {
    if (req.path === '/api/github/webhooks') {
      return next();
    }
    bodyParser.json()(req, res, next);
  }, bodyParser.urlencoded({ extended: true }));  
  app.use('/api', apiRoutes);

  // Angular Frontend
  const frontendPath = path.join(__dirname, '../../frontend/dist/github-value/browser');
  app.use(express.static(frontendPath));
  app.get('*', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // limit each IP to 100 requests per windowMs
  }), (_, res) => res.sendFile(path.join(frontendPath, 'index.html')));

  app.listen(PORT, () => {
    logger.info(`Server is running at http://localhost:${PORT} 🚀`);
    if (process.env.WEB_URL) {
      logger.debug(`Frontend is running at ${process.env.WEB_URL} 🚀`);
    }
  });
})();