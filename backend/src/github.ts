import { readFileSync } from "fs";
import { App, createNodeMiddleware, Octokit } from "octokit";
import { QueryService } from "./services/query.service.js";
import WebhookService from './services/smee.js';
import logger from "./services/logger.js";
import updateDotenv from 'update-dotenv';
import { Express } from 'express';
import { Endpoints } from '@octokit/types';
import { setupWebhookListeners } from "./controllers/webhook.controller.js";
import app from "./index.js";
import statusManager from "./services/status.manager.js";

interface SetupStatusDbsInitialized {
  usage?: boolean;
  metrics?: boolean;
  copilotSeats?: boolean;
  teamsAndMembers?: boolean;
  [key: string]: boolean | undefined;
}
export interface SetupStatus {
  isSetup?: boolean;
  dbConnected?: boolean;
  dbInitialized?: boolean;
  dbsInitialized?: SetupStatusDbsInitialized,
  installation?: Endpoints["GET /app"]["response"]['data'];
}

export interface GitHubInput {
  appId?: string;
  privateKey?: string;
  webhooks?: {
    secret?: string;
  };
  oauth?: {
    clientId: never;
    clientSecret: never;
  };
}
class GitHub {
  app?: App;
  queryService?: QueryService;
  webhooks?: Express;
  webhookPingReceived = false;
  input: GitHubInput;
  expressApp: Express;
  installations = [] as {
    installation: Endpoints["GET /app/installations"]["response"]["data"][0],
    octokit: Octokit
  }[];
  cronExpression = '0 0 * * * *';

  constructor(
    input: GitHubInput,
    expressApp: Express,
    public webhookService: WebhookService,
    private baseUrl: string
  ) {
    this.input = input;
    this.expressApp = expressApp;
  }

  connect = async (input?: GitHubInput) => {
    statusManager.updateStatus('github', 'starting', 'Connecting to GitHub App');
    
    if (input) this.setInput(input);
    if (!this.input.appId) {
      statusManager.updateStatus('github', 'error', 'GitHub App ID is missing');
      throw new Error('GITHUB_APP_ID is required');
    }
    if (!this.input.privateKey) {
      statusManager.updateStatus('github', 'error', 'GitHub App private key is missing');
      throw new Error('GITHUB_APP_PRIVATE_KEY is required');
    }

    try {
      this.app = new App({
        appId: this.input.appId,
        privateKey: this.input.privateKey,
        ...this.input.webhooks?.secret ? { webhooks: { secret: this.input.webhooks.secret } } : {},
        oauth: {
          clientId: null,
          clientSecret: null
        } as {
          clientId: never;
          clientSecret: never;
        }
      });
  
      await updateDotenv({ GITHUB_APP_ID: this.input.appId })
      await updateDotenv({ GITHUB_APP_PRIVATE_KEY: String(this.input.privateKey) })
      if (this.input.webhooks?.secret) await updateDotenv({ GITHUB_WEBHOOK_SECRET: this.input.webhooks.secret })
  
      try {
        await this.webhookService.connect();
        statusManager.updateStatus('webhooks', 'starting', 'Webhook service connecting');
      } catch (error) {
        logger.error('Failed to connect to webhook Smee', error);
        statusManager.updateStatus('webhooks', 'error', 'Failed to connect to webhook service');
      }

      try {
        if (!this.app) throw new Error('GitHub App is not initialized')
        if (!this.expressApp) throw new Error('Express app is not initialized')
        const webhookMiddlewareIndex = this.expressApp._router.stack.findIndex((layer: {
          name: string;
        }) => layer.name === 'bound middleware');
        if (webhookMiddlewareIndex > -1) {
          this.expressApp._router.stack.splice(webhookMiddlewareIndex, 1);
        }
        setupWebhookListeners(this.app);
        this.webhooks = this.expressApp.use(createNodeMiddleware(this.app));
        statusManager.updateStatus('webhooks', 'running', 'GitHub webhook middleware configured');
      } catch (error) {
        logger.debug(error);
        logger.error('Failed to create webhook middleware');
        statusManager.updateStatus('webhooks', 'error', 'Failed to create webhook middleware');
      }
      
      for await (const { octokit, installation } of this.app.eachInstallation.iterator()) {
        if (!installation.account?.login) continue;
        this.installations.push({
          installation,
          octokit
        });
      }
  
      if (!this.queryService) {
        this.queryService = new QueryService(this.app, {
          cronTime: this.cronExpression
        });
        await this.queryService.start();
        logger.info(`CRON task ${this.cronExpression} started`);
        statusManager.updateStatus('tasks', 'running', `Scheduled tasks started with cron: ${this.cronExpression}`);
      }
      
      statusManager.updateStatus('github', 'running', 'GitHub App connected successfully', {
        appId: this.input.appId,
        installations: this.installations.length
      });
      
      return this.app;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      statusManager.updateStatus('github', 'error', `GitHub connection failed: ${errorMessage}`);
      throw error;
    }
  }

  disconnect = () => {
    statusManager.updateStatus('github', 'stopping', 'Disconnecting GitHub services');
    this.queryService?.delete();
    statusManager.updateStatus('tasks', 'stopped', 'Scheduled tasks stopped');
    this.installations = [];
    statusManager.updateStatus('github', 'stopped', 'GitHub services disconnected');
  }

  getAppManifest() {
    const manifest = JSON.parse(readFileSync('github-manifest.json', 'utf8'));
    const base = new URL(this.baseUrl || 'localhost');
    manifest.url = base.href;
    manifest.setup_url = new URL('/api/setup/install/complete', base).href;
    manifest.redirect_url = new URL('/api/setup/registration/complete', base).href;
    manifest.hook_attributes.url = this.webhookService.url;
    if (!manifest.hook_attributes.url) manifest.hook_attributes.url = 'https://example.com/github/events';
    return manifest;
  };

  async createAppFromManifest(code: string) {
    statusManager.updateStatus('github', 'starting', 'Creating GitHub App from manifest');
    
    try {
      const {
        data: {
          id,
          pem,
          webhook_secret,
          html_url
        }
      } = await new Octokit().rest.apps.createFromManifest({ code });
  
      if (!id || !pem) {
        statusManager.updateStatus('github', 'error', 'Failed to create app from manifest: missing ID or private key');
        throw new Error('Failed to create app from manifest');
      }
  
      this.input.appId = id.toString();
      this.input.privateKey = pem;
  
      if (webhook_secret) {
        this.input.webhooks = {
          secret: webhook_secret
        }
        await updateDotenv({
          GITHUB_WEBHOOK_SECRET: webhook_secret,
        });
        app.settingsService.updateSetting('webhookSecret', webhook_secret, false);
        statusManager.updateStatus('webhooks', 'running', 'Webhook secret configured');
      }
      
      await updateDotenv({
        GITHUB_APP_ID: id.toString(),
        GITHUB_APP_PRIVATE_KEY: pem
      });
  
      statusManager.updateStatus('github', 'running', 'GitHub App created from manifest successfully', {
        appId: id.toString(),
        appUrl: html_url
      });
      
      return { id, pem, webhook_secret, html_url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      statusManager.updateStatus('github', 'error', `Failed to create app from manifest: ${errorMessage}`);
      throw error;
    }
  }

  async getInstallation(id: string | number) {
    if (!this.app) {
      statusManager.updateStatus('github', 'error', 'App is not initialized');
      throw new Error('App is not initialized');
    }
    
    return new Promise<{
      installation: Endpoints["GET /app/installations"]["response"]["data"][0],
      octokit: Octokit
    }>((resolve, reject) => {
      this.app?.eachInstallation(async ({ installation, octokit }) => {
        if (
          (typeof id === 'string' && id === installation.account?.login) ||
          id === installation.id
        ) {
          resolve({ installation, octokit });
        }
      }).finally(() => {
        statusManager.updateStatus('github', 'warning', `Installation not found: ${id}`);
        reject('Installation not found');
      });
    });
  }

  setInput(input: GitHubInput) {
    this.input = { ...this.input, ...input };
    return this.input;
  }
}

export default GitHub;