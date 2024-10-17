export const createWebhookProxy = async (
  opts: WebhookProxyOptions,
): Promise<EventSource | undefined> => {
  try {
    const SmeeClient = (await import("smee-client")).default;
    const smee = new SmeeClient({
      source: opts.url,
      target: `http://localhost:${opts.port}${opts.path}`,
      logger: console
    });
    return smee.start() as EventSource;
  } catch (error) {
    console.warn(
      "Run `npm install --save-dev smee-client` to proxy webhooks to localhost.",
    );
    return;
  }
};


export const createWebhookChannel = async (): Promise<string | undefined> => {
  try {
    const SmeeClient = (await import("smee-client")).default;

    const WEBHOOK_PROXY_URL = await SmeeClient.createChannel();
    // save to db
    return WEBHOOK_PROXY_URL;
  } catch (error) {
    // Smee is not available, so we'll just move on
    console.warn("Unable to connect to smee.io, try restarting your server.");
    return void 0;
  }
}

export interface WebhookProxyOptions {
  url: string;
  port?: number;
  path?: string;
  fetch?: Function;
}