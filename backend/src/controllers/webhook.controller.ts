import { App, RequestError } from 'octokit';
import logger from '../services/logger.js';
import surveyService from '../services/survey.service.js';
import app from '../index.js';
import teamsService from '../services/teams.service.js';
import { Endpoints } from '@octokit/types';

export const setupWebhookListeners = (github: App) => {
  github.webhooks.onAny(async ({ id, name, payload }) => {
    app.github.webhookPingReceived = true;
    logger.debug(`GitHub Webhook event`, { id, name, payload });
    logger.info(`GitHub Webhook event`, { id, name });
  });

  github.webhooks.on(["pull_request.opened"], async ({ octokit, payload }) => {
    try {
      if (payload.pull_request.user.type === 'Bot') {
        logger.debug(`Ignoring PR from bot user: ${payload.pull_request.user.login}`);
        return;
      }

      const survey = await surveyService.createSurvey({
        id: Date.now(), // or some other numeric ID generation approach
        status: 'pending',
        hits: 0,
        userId: payload.pull_request.user.login,
        org: payload.repository.owner.login,
        repo: payload.repository.name,
        prNumber: payload.pull_request.number,
        usedCopilot: false,
        percentTimeSaved: -1,
        reason: '',
        timeUsedFor: '',
      })

      const surveyUrl = new URL(`copilot/surveys/new/${survey.id}`, app.baseUrl);

      surveyUrl.searchParams.append('url', payload.pull_request.html_url);
      surveyUrl.searchParams.append('author', payload.pull_request.user.login);

      // if (payload.installation) {
      //   const _octokit = await github.getInstallationOctokit(payload.installation.id);
      //   await _octokit.rest.issues.createComment({
      //     owner: payload.repository.owner.login,
      //     repo: payload.repository.name,
      //     issue_number: payload.pull_request.number,
      //     body: `Hi @${payload.pull_request.user.login}! \
      // Please fill out this [survey](${surveyUrl.toString()}) \
      // to help us understand if you leveraged Copilot in your pull request.`
      //   });
      // }
      await octokit.rest.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: `Hi @${payload.pull_request.user.login}! \
      Quick dev estimate—did you use Copilot in your pull request? Let us know [here](${surveyUrl.toString()})`
      });
    } catch (error) {
      logger.debug(error);
      if (error instanceof RequestError && error.status === 422) {
        logger.info('Survey comment created. (422)');
      } else {
        logger.error('Error creating survey comment');
      }
    };
  });

  github.webhooks.on("team", async ({ payload }) => {
    try {
      switch (payload.action) {
        case 'created':
        case 'edited':
          await teamsService.updateTeams(payload.organization.login, [payload.team] as Endpoints["GET /orgs/{org}/teams"]["response"]["data"]);
          break;
        case 'deleted':
          await teamsService.deleteTeam(payload.team.id);
          break;
      }
    } catch (error) {
      logger.error('Error processing team event', error);
    }
  });

  github.webhooks.on("membership", async ({ payload }) => {
    const queryService = app.github.queryService;
    if (!queryService) throw new Error('No query service found');
    try {
      if (payload.member) {
        switch (payload.action) {
          case 'added':
            await teamsService.addMemberToTeam(payload.team.id, payload.member.id);
            break;
          case 'removed':
            await teamsService.deleteMemberFromTeam(payload.team.id, payload.member.id)
            break;
        }
      }
    } catch (error) {
      logger.error('Error processing membership event', error);
    }
  });

  github.webhooks.on("member", async ({ payload }) => {
    try {
      if (payload.member) {
        switch (payload.action) {
          case 'added':
          case 'edited':
            if (payload.organization?.login) {
              await teamsService.updateMembers(payload.organization?.login, [payload.member] as Endpoints["GET /orgs/{org}/teams/{team_slug}/members"]["response"]["data"]);
            }
            break;
          case 'removed':
            await teamsService.deleteMember(payload.member.id)
            break;
        }
      }
    } catch (error) {
      logger.error('Error processing member event', error);
    }
  });
}
