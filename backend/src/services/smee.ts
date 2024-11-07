import logger from "./logger.js";
import settingsService from "./settings.service.js";

class SmeeService {
  private static instance: SmeeService;
  private webhookProxyUrl: string | undefined;

  private constructor() { }

  public static getInstance(): SmeeService {
    if (!SmeeService.instance) {
      SmeeService.instance = new SmeeService();
    }
    return SmeeService.instance;
  }

  getWebhookProxyUrl = () => {
    if (!this.webhookProxyUrl) {
      throw new Error('Webhook proxy URL is not set');
    }
    return this.webhookProxyUrl;
  }

  private async createSmeeWebhookUrl() {
    const webhookProxyUrl = await this.createWebhookChannel();
    if (!webhookProxyUrl) {
      throw new Error('Unable to create webhook channel');
    }
    this.webhookProxyUrl = webhookProxyUrl;
    await settingsService.updateSetting('webhookProxyUrl', this.webhookProxyUrl);
    return webhookProxyUrl;
  }

  public async createSmeeWebhookProxy(port: number) {
    try {
      this.webhookProxyUrl = await settingsService.getSettingsByName('webhookProxyUrl');
    } catch {
      this.webhookProxyUrl = await this.createSmeeWebhookUrl();
    }
    let eventSource: EventSource | undefined;
    try {
      eventSource = await this.createWebhookProxy({
        url: this.webhookProxyUrl,
        port,
        path: '/api/github/webhooks'
      });
    } catch (error) {
      logger.error('Unable to connect to smee.io. recreating webhook.', error);
      this.webhookProxyUrl = await this.createSmeeWebhookUrl();
      eventSource = await this.createWebhookProxy({
        url: this.webhookProxyUrl,
        port,
        path: '/api/github/webhooks'
      });
      if (!eventSource) throw new Error('Unable to connect to smee.io');
    }
    return { url: this.webhookProxyUrl, eventSource };
  }

  createWebhookProxy = async (
    opts: {
      url: string;
      port?: number;
      path?: string;
      fetch?: Function;
    },
  ): Promise<EventSource | undefined> => {
    try {
      const SmeeClient = (await import("smee-client")).default;
      const smee = new SmeeClient({
        source: opts.url,
        target: `http://localhost:${opts.port}${opts.path}`,
        logger: {
          info: (msg: string, ...args: any[]) => logger.info('Smee', msg, ...args),
          error: (msg: string, ...args: any[]) => logger.error('Smee', msg, ...args),
        }
      });
      return smee.start() as EventSource;
    } catch (error) {
      logger.error('Unable to connect to smee.io', error);
    }
  };

  createWebhookChannel = async (): Promise<string | undefined> => {
    try {
      const SmeeClient = (await import("smee-client")).default;
      return await SmeeClient.createChannel();
    } catch (error) {
      logger.error('Unable to create webhook channel', error);
    }
  }

}

export default SmeeService.getInstance();