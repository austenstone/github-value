import { App } from "octokit";

if (!process.env.GITHUB_APP_ID) throw new Error('GITHUB_APP_ID is not set');
if (!process.env.GITHUB_APP_PRIVATE_KEY) throw new Error('GITHUB_APP_PRIVATE_KEY is not set');
if (!process.env.GITHUB_APP_CLIENT_ID) throw new Error('GITHUB_CLIENT_ID is not set');
if (!process.env.GITHUB_APP_CLIENT_SECRET) throw new Error('GITHUB_CLIENT_SECRET is not set');
if (!process.env.GITHUB_WEBHOOK_SECRET) throw new Error('GITHUB_WEBHOOK_SECRET is not set');

const octokit = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
    webhooks: {
        secret: process.env.GITHUB_WEBHOOK_SECRET
    },
    oauth: {
        clientId: process.env.GITHUB_APP_CLIENT_ID,
        clientSecret: process.env.GITHUB_APP_CLIENT_SECRET
    },
});

export default octokit;