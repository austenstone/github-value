import 'dotenv/config'
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as http from 'http';
import Database from './database.js';
import logger, { expressLoggerMiddleware } from './services/logger.js';
import GitHub from './github.js';
import SettingsService from './services/settings.service.js';
import apiRoutes from "./routes/index.js"
import WebhookService from './services/smee.js';

class App {
  e: Express;
  eListener?: http.Server;
  baseUrl?: string;
  public database: Database;
  public github: GitHub;
  public settingsService: SettingsService;

  constructor(
    public port: number
  ) {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:' + port;
    this.e = express();
    this.port = port;
    logger.info(`Starting application on port ${this.port}`);
    // if (!process.env.MONGODB_URI) {
    //   throw new Error('MONGODB_URI must be set');
    // }
    this.database = new Database();
    const webhookService = new WebhookService({
      url: process.env.WEBHOOK_PROXY_URL,
      path: '/api/github/webhooks',
      port
    });
    this.github = new GitHub(
      {
        // adding GH_APP_* so you can set these as codespaces secrets, can't use GITHUB_* as a prefix for those
        appId: process.env.GITHUB_APP_ID || process.env.GH_APP_ID,  
        privateKey: process.env.GITHUB_APP_PRIVATE_KEY || process.env.GH_APP_PRIVATE_KEY,
        webhooks: {
          secret: process.env.GITHUB_WEBHOOK_SECRET || process.env.GH_WEBHOOK_SECRET
        }
      },
      this.e,
      webhookService,
      this.baseUrl
    )
    this.settingsService = new SettingsService({
      baseUrl: this.baseUrl,
      webhookProxyUrl: process.env.GITHUB_WEBHOOK_PROXY_URL,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
      metricsCronExpression: process.env.CRON || '0 * * * *',
      devCostPerYear: '100000',
      developerCount: '100',
      hoursPerYear: '2080',
      percentTimeSaved: '20',
      percentCoding: '20'
    })
  }

  public async start() {
    try {
      logger.info('Starting application...');

      logger.info('Express setup...');
      this.setupExpress();
      logger.info('Express setup complete');

      if (process.env.MONGODB_URI) {
        logger.info('Database connecting...');
        await this.database.connect(process.env.MONGODB_URI);
        logger.info('Database connected');

        logger.info('Initializing settings...');
        await this.initializeSettings();
        logger.info('Settings initialized');
  
        logger.info('GitHub App starting...');
        await this.github.connect();
        logger.info('GitHub App connected');
      }

      return this.e;
    } catch (error) {
      logger.error('Failed to start application ❌');
      if (error instanceof Error) {
        logger.error(error.message);
      }
      logger.debug(error);
    }
  }

  public async stop() {
    await new Promise(resolve => this.eListener?.close(resolve));
    await this.database.disconnect();
    await this.github.disconnect();
  }

  private setupExpress() {
    this.e.use(cors());
    this.e.use((req, res, next) => {
      if (req.path === '/api/github/webhooks') {
        return next();
      }
      bodyParser.json()(req, res, next);
    }, bodyParser.urlencoded({ extended: true }));

    this.e.use(expressLoggerMiddleware);
    this.e.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // max 100 requests per windowMs
      skip: (req) => req.path === '/api/github/webhooks'
    }));
    this.e.use('/api', apiRoutes);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const frontendPath = path.resolve(__dirname, '../../frontend/dist/github-value/browser');
    this.e.use(express.static(frontendPath));
    this.e.get('*', (_, res) => res.sendFile(path.join(frontendPath, 'index.html')));

    this.eListener = this.e.listen(this.port, '0.0.0.0');
    logger.info(`eListener on port ${this.port}`);
  }

  private initializeSettings() {
    this.settingsService.initialize()
      .then(async (settings) => {
        if (settings.webhookProxyUrl) {
          this.github.smee.options.url = settings.webhookProxyUrl
        }
        if (settings.webhookSecret) {
          this.github.setInput({
            webhooks: {
              secret: settings.webhookSecret
            }
          });
        }
        if (settings.metricsCronExpression) {
          this.github.cronExpression = settings.metricsCronExpression;
        }
        if (settings.baseUrl) {
          this.baseUrl = settings.baseUrl;
        }
      })
      .finally(async () => {
        await this.github.smee.connect()
        await this.settingsService.updateSetting('webhookSecret', this.github.input.webhooks?.secret || '');
        await this.settingsService.updateSetting('webhookProxyUrl', this.github.smee.options.url!);
        await this.settingsService.updateSetting('metricsCronExpression', this.github.cronExpression!);
      });
  }
}

export {
  App as default
};
