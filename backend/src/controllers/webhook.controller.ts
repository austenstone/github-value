import { Webhooks } from '@octokit/webhooks';
import { App } from 'octokit';
import logger from '../services/logger.js';
import settingsService from '../services/settings.service.js';

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET || 'your-secret',
  log: {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error
  }
});

export const setupWebhookListeners = (github: App) => {
  github.webhooks.on("pull_request.opened", ({ octokit, payload }) => {
    const surveyUrl = new URL(`/surveys/new`, settingsService.baseUrl);

    surveyUrl.searchParams.append('url', payload.pull_request.html_url);
    surveyUrl.searchParams.append('author', payload.pull_request.user.login);
    
    try {
      octokit.rest.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: `Hi @${payload.pull_request.user.login}! \
  Please fill out this [survey](${surveyUrl.toString()}) \
  to help us understand if you leveraged Copilot in your pull request.`
      });
    } catch (error) {
      logger.error('Error creating survey comment', error);
    };
  });
}

export default webhooks;
