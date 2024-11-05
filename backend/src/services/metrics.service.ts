import { CronJob, CronTime } from 'cron';
import { Metrics, Breakdown } from '../models/metrics.model.js';
import setup from './setup.js';
import logger from "./logger.js";
import settingsService from "./settings.service.js";
import { Assignee, AssigningTeam, Seat } from '../models/copilot.seats.js';

class MetricsService {
  private static instance: MetricsService;
  private cronJob: CronJob;

  private constructor(cronExpression: string, timeZone: string) {
    this.cronJob = new CronJob('0 0 * * *', this.cronTask, null, true);
    this.cronTask();
  }

  private async cronTask() {
    // this.queryCopilotUsageMetrics();
    this.queryCopilotSeatAssignments();
  }

  public static createInstance(cronExpression: string, timeZone: string) {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService(cronExpression, timeZone);
    }
  }

  public static getInstance(): MetricsService {
    return MetricsService.instance;
  }

  public async queryCopilotUsageMetrics() {
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

  public async queryCopilotSeatAssignments() {
    try {
      const octokit = await setup.getOctokit();
      const _seatAssignments = await octokit.paginate(octokit.rest.copilot.listCopilotSeats, {
        org: setup.installation.owner?.login
      }) as { total_seats: number, seats: object[] }[];
      const seatAssignments = {
        total_seats: _seatAssignments[0]?.total_seats || 0,
        // octokit paginate returns an array of objects (bug)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        seats: (_seatAssignments).reduce((acc, rsp) => acc.concat(rsp.seats), [] as any[])
      };
      console.log(seatAssignments)

      if (!seatAssignments.seats) {
        logger.info(`No seat assignment data found. Skipping...`);
        return;
      }

      for (const seat of seatAssignments.seats) {
        const assignee = await Assignee.findOrCreate({
          where: { id: seat.assignee.id },
          defaults: {
            login: seat.assignee.login,
            node_id: seat.assignee.node_id,
            avatar_url: seat.assignee.avatar_url,
            gravatar_id: seat.assignee.gravatar_id,
            url: seat.assignee.url,
            html_url: seat.assignee.html_url,
            followers_url: seat.assignee.followers_url,
            following_url: seat.assignee.following_url,
            gists_url: seat.assignee.gists_url,
            starred_url: seat.assignee.starred_url,
            subscriptions_url: seat.assignee.subscriptions_url,
            organizations_url: seat.assignee.organizations_url,
            repos_url: seat.assignee.repos_url,
            events_url: seat.assignee.events_url,
            received_events_url: seat.assignee.received_events_url,
            type: seat.assignee.type,
            site_admin: seat.assignee.site_admin,
          }
        });
  
        const assigningTeam = seat.assigning_team ? await AssigningTeam.findOrCreate({
          where: { id: seat.assigning_team.id },
          defaults: {
            node_id: seat.assigning_team.node_id,
            url: seat.assigning_team.url,
            html_url: seat.assigning_team.html_url,
            name: seat.assigning_team.name,
            slug: seat.assigning_team.slug,
            description: seat.assigning_team.description,
            privacy: seat.assigning_team.privacy,
            notification_setting: seat.assigning_team.notification_setting,
            permission: seat.assigning_team.permission,
            members_url: seat.assigning_team.members_url,
            repositories_url: seat.assigning_team.repositories_url,
            parent: seat.assigning_team.parent,
          }
        }) : null;

        await Seat.create({
          created_at: seat.created_at,
          updated_at: seat.updated_at,
          pending_cancellation_date: seat.pending_cancellation_date,
          last_activity_at: seat.last_activity_at,
          last_activity_editor: seat.last_activity_editor,
          plan_type: (seat as any).plan_type,
          assigneeId: seat.assignee.id,
          assigningTeamId: assigningTeam ? seat.assigning_team?.id : null,
        });
      }
  
      logger.info("Seat assignments successfully updated! ✅");
    } catch (error) {
      logger.error('Error querying copilot seat assignments', error);
    }
  }

  public updateCronJob(cronExpression: string) {
    this.cronJob.setTime(new CronTime(cronExpression));
  }
}

export default MetricsService