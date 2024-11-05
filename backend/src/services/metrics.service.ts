import { CronJob, CronTime } from 'cron';
import { Metrics, Breakdown } from '../models/metrics.model.js';
import setup from './setup.js';
import logger from "./logger.js";
import settingsService from "./settings.service.js";

class MetricsService {
  private static instance: MetricsService;
  private cronJob: CronJob;

  private constructor(cronExpression: string, timeZone: string) {
    this.cronJob = new CronJob('0 0 * * *', this.queryCopilotMetrics, null, true);
    this.queryCopilotMetrics();
  }

  public static createInstance(cronExpression: string, timeZone: string) {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService(cronExpression, timeZone);
    }
  }

  public static getInstance(): MetricsService {
    return MetricsService.instance;
  }

  public async queryCopilotMetrics() {
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.rest.copilot.usageMetricsForOrg({
        org: setup.installation.owner?.login
      });
      const metricsArray = response.data;

      for (const metrics of metricsArray) {
        const [createdMetrics, created] = await Metrics.findOrCreate({
          where: { day: metrics.day },
          defaults: {
            totalSuggestionsCount: metrics.total_suggestions_count,
            totalAcceptancesCount: metrics.total_acceptances_count,
            totalLinesSuggested: metrics.total_lines_suggested,
            totalLinesAccepted: metrics.total_lines_accepted,
            totalActiveUsers: metrics.total_active_users,
            totalChatAcceptances: metrics.total_chat_acceptances,
            totalChatTurns: metrics.total_chat_turns,
            totalActiveChatUsers: metrics.total_active_chat_users,
          }
        });

        if (!created) {
          logger.info(`Metrics for ${metrics.day} already exist. Updating... ✏️`);
      
          await createdMetrics.update({
            totalSuggestionsCount: metrics.total_suggestions_count,
            totalAcceptancesCount: metrics.total_acceptances_count,
            totalLinesSuggested: metrics.total_lines_suggested,
            totalLinesAccepted: metrics.total_lines_accepted,
            totalActiveUsers: metrics.total_active_users,
            totalChatAcceptances: metrics.total_chat_acceptances,
            totalChatTurns: metrics.total_chat_turns,
            totalActiveChatUsers: metrics.total_active_chat_users,
          });
      
          await Breakdown.destroy({ where: { metricsDay: metrics.day } });
        }

        if (!metrics.breakdown) {
          logger.info(`No breakdown data for ${metrics.day}. Skipping...`);
          continue;
        }
        for (const breakdown of metrics.breakdown) {
          await Breakdown.create({
            metricsDay: createdMetrics.dataValues.day,
            language: breakdown.language,
            editor: breakdown.editor,
            suggestionsCount: breakdown.suggestions_count,
            acceptancesCount: breakdown.acceptances_count,
            linesSuggested: breakdown.lines_suggested,
            linesAccepted: breakdown.lines_accepted,
            activeUsers: breakdown.active_users,
          });
        }
      }

      logger.info("Metrics successfully updated! 📈");
    } catch (error) {
      logger.error('Error querying copilot metrics', error);
    }
  }

  public updateCronJob(cronExpression: string) {
    this.cronJob.setTime(new CronTime(cronExpression));
  }
}

export default MetricsService