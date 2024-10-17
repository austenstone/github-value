import { Webhooks } from '@octokit/webhooks';
import { App } from 'octokit';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET || 'your-secret',
});

webhooks.onAny(({ id, name, payload }) => {
  console.log(name, 'event received:', payload);
  // Process the webhook event here
});

export const setupWebhookListeners = (octokit: App) => {
  const baseURL = "http://localhost:3000";
  octokit.webhooks.on("pull_request.opened", ({ octokit, payload }) => {
    console.log("Pull request opened", payload);
    return octokit.rest.issues.createComment({
      owner: payload.repository.owner.login,
      repo: payload.repository.name,
      issue_number: payload.pull_request.number,
      body: `Did you use copilot for this? Fill out this [survey](${baseURL}/survey)`,
    });
  });
}

export default webhooks;
