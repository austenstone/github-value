import { CronJob, CronJobParams, CronTime } from 'cron';
import logger from './logger.js';
import { insertUsage } from '../models/usage.model.js';
import SeatService, { SeatEntry } from '../services/copilot.seats.service.js';
import { Octokit } from 'octokit';
import metricsService from './metrics.service.js';
import { MetricDailyResponseType } from '../models/metrics.model.js';
import teamsService from './teams.service.js';

const DEFAULT_CRON_EXPRESSION = '0 * * * *';
class QueryService {
  cronJob: CronJob;
  status = {
    usage: false,
    metrics: false,
    copilotSeats: false,
    teamsAndMembers: false,
    dbInitialized: false
  };

  constructor(
    public org: string,
    public octokit: Octokit,
    options?: Partial<CronJobParams>
  ) {
    // Consider Timezone
    const _options: CronJobParams = {
      cronTime: DEFAULT_CRON_EXPRESSION,
      onTick: () => {
        this.task(this.org);
      },
      start: true,
      ...options
    }
    this.cronJob = CronJob.from(_options);
    this.task(this.org);
  }

  delete() {
    this.cronJob.stop();
  }

  private async task(org: string) {
    logger.info(`${org} task started`);
    try {
      const queries = [
        this.queryCopilotUsageMetrics(org).then(() => this.status.usage = true),
        this.queryCopilotUsageMetricsNew(org).then(() => this.status.metrics = true),
        this.queryCopilotSeatAssignments(org).then(() => this.status.copilotSeats = true),
      ]

      const lastUpdated = await teamsService.getLastUpdatedAt();
      const elapsedHours = (new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      if (elapsedHours > 24) {
        queries.push(
          this.queryTeamsAndMembers(org).then(() =>
            this.status.teamsAndMembers = true
          )
        );
      } else {
        this.status.teamsAndMembers = true
      }

      await Promise.all(queries).then(() => {
        this.status.dbInitialized = true;
      });
    } catch (error) {
      logger.error(error);
    }
    logger.info(`${org} finished task`);
  }

  public async queryCopilotUsageMetricsNew(org: string, team?: string) {
    try {
      const metricsArray = await this.octokit.paginate<MetricDailyResponseType>(
        'GET /orgs/{org}/copilot/metrics',
        {
          org: org
        }
      );
      await metricsService.insertMetrics(org, metricsArray, team);
      logger.info(`${org} metrics updated`);
    } catch (error) {
      logger.error(org, `Error updating ${org} metrics`, error);
    }
  }

  public async queryCopilotUsageMetrics(org: string) {
    try {
      const rsp = await this.octokit.rest.copilot.usageMetricsForOrg({
        org
      });

      insertUsage(org, rsp.data);
      logger.info(`${this.org} usage metrics updated`);
    } catch (error) {
      logger.error(`Error updating ${this.org} usage metrics`, error);
    }
  }

  public async queryCopilotSeatAssignments(org: string) {
    try {
      const rsp = await this.octokit.paginate(this.octokit.rest.copilot.listCopilotSeats, {
        org
      }) as { total_seats: number, seats: SeatEntry[] }[];

      const seatAssignments = {
        total_seats: rsp[0]?.total_seats || 0,
        seats: (rsp).reduce((acc, rsp) => acc.concat(rsp.seats), [] as SeatEntry[])
      };

      if (!seatAssignments.seats) {
        logger.info(`No seat assignment data found.`);
        return;
      }

      await SeatService.insertSeats(org, seatAssignments.seats);

      logger.info(`${org} seat assignments updated`);
    } catch (error) {
      logger.debug(error)
      logger.error('Error querying copilot seat assignments');
    }
  }

  public async queryTeamsAndMembers(org: string) {
    const members = await this.octokit.paginate("GET /orgs/{org}/members", {
      org
    });
    await teamsService.updateMembers(org, members);
    try {
      const teams = await this.octokit.paginate(this.octokit.rest.teams.list, {
        org
      });
      await teamsService.updateTeams(org, teams);

      await Promise.all(
        teams.map(async (team) => this.octokit.paginate(this.octokit.rest.teams.listMembersInOrg, {
          org,
          team_slug: team.slug
        }).then(async (members) =>
          await Promise.all(
            members.map(async (member) => teamsService.addMemberToTeam(team.id, member.id))
          )).catch((error) => {
            logger.debug(error);
            logger.error('Error updating team members for team', { team: team, error: error });
          })
        )
      )
      logger.info("Teams & Members successfully updated! 🧑‍🤝‍🧑");
    } catch (error) {
      logger.error('Error querying teams', error);
    }
  }

  public updateCronJob(cronExpression: string) {
    if (!this.cronJob) return;
    if (!cronExpression) cronExpression = DEFAULT_CRON_EXPRESSION;
    this.cronJob.setTime(new CronTime(cronExpression));
  }
}

export {
  QueryService
}
