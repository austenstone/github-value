import { readFileSync } from "fs";
import { App, Octokit } from "octokit";
import { QueryService } from "./services/query.service.js";
import WebhookService from './services/smee.js';
import logger from "./services/logger.js";
import updateDotenv from 'update-dotenv';
import { Express } from 'express';
import { Endpoints } from '@octokit/types';

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
  webhooks?: Express;
  input: GitHubInput;
  expressApp: Express;
  installations = [] as {
    installation: Endpoints["GET /app/installations"]["response"]["data"][0],
    octokit: Octokit
    queryService: QueryService
  }[];
  status = 'starting';
  cronExpression = '0 * * * * *';

  constructor(
    input: GitHubInput,
    expressApp: Express,
    public smee: WebhookService
  ) {
    this.input = input;
    this.expressApp = expressApp;
  }

  connect = async (input?: GitHubInput) => {
    this.disconnect();
    if (input) this.setInput(input);
    if (!this.input.appId) throw new Error('App ID is required');
    if (!this.input.privateKey) throw new Error('Private key is required');

    this.app = new App({
      appId: this.input.appId,
      privateKey: this.input.privateKey,
      ...this.input.webhooks?.secret ? { webhooks: { secret: this.input.webhooks.secret } } : {},
      oauth: {
        clientId: null!,
        clientSecret: null!
      }
    });

    await updateDotenv({ GITHUB_APP_ID: this.input.appId })
    await updateDotenv({ GITHUB_APP_PRIVATE_KEY: String(this.input.privateKey) })
    if (this.input.webhooks?.secret) await updateDotenv({ GITHUB_WEBHOOK_SECRET: this.input.webhooks.secret })

    try {
      this.webhooks = this.smee.webhookMiddlewareCreate(this.app, this.expressApp);
    } catch (error) {
      logger.debug(error);
      logger.error('Failed to create webhook middleware')
    }

    for await (const { octokit, installation } of this.app.eachInstallation.iterator()) {
      if (!installation.account?.login) return;
      const queryService = new QueryService(installation.account.login, octokit, {
        cronTime: this.cronExpression
      });
      this.installations.push({
        installation,
        octokit,
        queryService
      });
      logger.info(`${installation.account?.login} cron task ${this.cronExpression} started`);
    }

    return this.app;
  }

  disconnect = () => {
    this.installations.forEach((i) => i.queryService.delete())
    this.installations = [];
  }

  getAppManifest(baseUrl: string) {
    const manifest = JSON.parse(readFileSync('github-manifest.json', 'utf8'));
    const base = new URL(baseUrl);
    manifest.url = base.href;
    manifest.hook_attributes.url = new URL('/api/github/webhooks', base).href;
    manifest.setup_url = new URL('/api/setup/install/complete', base).href;
    manifest.redirect_url = new URL('/api/setup/registration/complete', base).href;
    manifest.hook_attributes.url = this.smee.options.url;
    return manifest;
  };

  async createAppFromManifest(code: string) {
    const {
      data: {
        id,
        pem,
        webhook_secret,
        html_url
      }
    } = await new Octokit().rest.apps.createFromManifest({ code });

    if (!id || !pem) throw new Error('Failed to create app from manifest');

    this.input.appId = id.toString();
    this.input.privateKey = pem;
    if (webhook_secret) {
      this.input.webhooks = {
        secret: webhook_secret
      }
    }

    await updateDotenv({
      GITHUB_APP_ID: id.toString(),
      GITHUB_APP_PRIVATE_KEY: pem
    });
    if (webhook_secret) {
      await updateDotenv({
        GITHUB_WEBHOOK_SECRET: webhook_secret,
      });
    }

    return { id, pem, webhook_secret, html_url };
  }

  async getInstallation(id: string | number) {
    if (!this.app) throw new Error('App is not initialized');
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
      }).finally(() => reject('Installation not found'));
    });
  }

  setInput(input: GitHubInput) {
    this.input = { ...this.input, ...input };
  }
}

export default GitHub;