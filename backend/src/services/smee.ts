import { createWebhookChannel, createWebhookProxy } from "../helpers/webhook-proxy";

export const createSmeeWebhookProxy = async (port: number) => {
  const url = await createWebhookChannel();
  if (!url) return;
  await createWebhookProxy({
    url,
    port,
    path: '/api/github/webhooks'
  });
}