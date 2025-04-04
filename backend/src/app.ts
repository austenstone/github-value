import 'dotenv/config'
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import * as http from 'http';
import Database from './database.js';
import logger, { expressLoggerMiddleware } from './services/logger.js';
import GitHub from './github.js';
import SettingsService from './services/settings.service.js';
import apiRoutes from "./routes/index.js"
import WebhookService from './services/smee.js';
import TargetValuesService from './services/target.service.js';
import statusManager from './services/status.manager.js';

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
    this.port = port;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:' + port;
    this.e = express();
    logger.info(`Starting application on port ${this.port}`);
    
    // Initialize status manager for all components
    statusManager.updateStatus('database', 'starting', 'Database initializing');
    statusManager.updateStatus('github', 'starting', 'GitHub initializing');
    statusManager.updateStatus('settings', 'starting', 'Settings initializing');
    statusManager.updateStatus('targets', 'stopped', 'Targets not initialized yet');
    statusManager.updateStatus('webhooks', 'stopped', 'Webhooks not started yet');
    
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
      webhookProxyUrl: process.env.WEBHOOK_PROXY_URL,
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
        statusManager.updateStatus('database', 'starting', 'Connecting to MongoDB', { uri: process.env.MONGODB_URI });
        
        try {
          await this.database.connect(process.env.MONGODB_URI);
          logger.info('Database connected');
          statusManager.updateStatus('database', 'running', 'Database connected successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          statusManager.updateStatus('database', 'error', `Database connection failed: ${errorMessage}`);
          logger.error(`Database connection error: ${errorMessage}`);
        }

        logger.info('Initializing settings...');
        statusManager.updateStatus('settings', 'starting', 'Loading application settings');
        
        try {
          await this.initializeSettings();
          logger.info('Settings initialized');
          statusManager.updateStatus('settings', 'running', 'Settings initialized successfully');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          statusManager.updateStatus('settings', 'error', `Settings initialization failed: ${errorMessage}`);
          logger.error(`Settings initialization error: ${errorMessage}`);
        }
  
        logger.info('GitHub App starting...');
        statusManager.updateStatus('github', 'starting', 'Connecting to GitHub API');
        
        try {
          await this.github.connect();
          logger.info('GitHub App connected');
          statusManager.updateStatus('github', 'running', 'GitHub API connected successfully', {
            appId: this.github.input.appId,
            installations: this.github.installations.length
          });
          
          logger.info('Targets initializing...');
          statusManager.updateStatus('targets', 'starting', 'Initializing target values');
          
          try {
            await TargetValuesService.initialize();
            logger.info('Targets initialized');
            statusManager.updateStatus('targets', 'running', 'Target values initialized successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            statusManager.updateStatus('targets', 'error', `Target values initialization failed: ${errorMessage}`);
            logger.error(`Target values initialization error: ${errorMessage}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          statusManager.updateStatus('github', 'error', `GitHub connection failed: ${errorMessage}`);
          logger.warn('GitHub App failed to connect', errorMessage);
        }
      } else {
        statusManager.updateStatus('database', 'stopped', 'No MongoDB URI provided');
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
    statusManager.updateStatus('database', 'stopping', 'Disconnecting from database');
    await this.database.disconnect();
    statusManager.updateStatus('database', 'stopped', 'Database disconnected');
    
    statusManager.updateStatus('github', 'stopping', 'Disconnecting GitHub services');
    await this.github.disconnect();
    statusManager.updateStatus('github', 'stopped', 'GitHub disconnected');
    
    await new Promise(resolve => this.eListener?.close(resolve));
    statusManager.updateStatus('webhooks', 'stopped', 'Webhooks stopped');
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

    const __dirname = path.resolve();
    const frontendPath = path.resolve(__dirname, '../frontend/dist/github-value/browser');
    this.e.use(express.static(frontendPath));
    this.e.get('*', (_, res) => res.sendFile(path.join(frontendPath, 'index.html')));

    this.eListener = this.e.listen(this.port, '0.0.0.0');
    logger.info(`eListener on port ${this.port} (http://localhost:${this.port})`);
  }

  private async initializeSettings() {
    return this.settingsService.initialize()
      .then(async (settings) => {
        if (settings.webhookSecret) {
          this.github.setInput({
            webhooks: {
              secret: process.env.GITHUB_WEBHOOK_SECRET || settings.webhookSecret
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
        await this.settingsService.updateSetting('webhookSecret', this.github.input.webhooks?.secret || '', false);
        await this.settingsService.updateSetting('webhookProxyUrl', this.github.webhookService.url!, false);
        await this.settingsService.updateSetting('metricsCronExpression', this.github.cronExpression!, false);
      })
  }
}

export {
  App as default
};
