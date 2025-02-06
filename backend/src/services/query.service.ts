import { CronJob, CronJobParams, CronTime } from 'cron';
import logger from './logger.js';
import { insertUsage } from '../models/usage.model.js';
import SeatService, { SeatEntry } from './seats.service.js';
import { App, Octokit } from 'octokit';
import { MetricDailyResponseType } from '../models/metrics.model.js';
import metricsService from './metrics.service.js';
import teamsService from './teams.service.js';
import adoptionService from './adoption.service.js';

const DEFAULT_CRON_EXPRESSION = '0 0 * * * *';
class QueryService {
  cronJob: CronJob;
  status = {
    usage: false,
    metrics: false,
    copilotSeats: false,
    teamsAndMembers: false,
    dbInitialized: false
  };
  app: App;

  constructor(
    app: App,
    options?: Partial<CronJobParams>
  ) {
    this.app = app;
    const _options: CronJobParams = {
      cronTime: options?.cronTime || DEFAULT_CRON_EXPRESSION,
      onTick: () => {
        this.task();
      },
      start: true,
      ...options
    }
    this.cronJob = CronJob.from(_options);
    this.task();
  }

  delete() {
    this.cronJob.stop();
  }

  private async task() {
    const queryAt = new Date();
    logger.info(`Task started. Last ran at `, this.cronJob.lastDate());
    const tasks = [];
    for await (const { octokit, installation } of this.app.eachInstallation.iterator()) {
      if (!installation.account?.login) return;
      const org = installation.account.login;
      tasks.push(this.orgTask(octokit, queryAt, org));
    }
    const results = await Promise.all(tasks);

    const uniqueSeats = new Map();
    results.forEach((result) => {
      if (result?.copilotSeatAssignments) {
        const { adoption } = result.copilotSeatAssignments;
        if (adoption) {
          adoption.seats.forEach((seat) => {
            if (!uniqueSeats.has(seat.login)) {
              uniqueSeats.set(seat.login, seat);
            }
          });
        }
      }
    });

    const uniqueSeatsArray = Array.from(uniqueSeats.values());
    const enterpriseAdoptionData = {
      enterprise: 'enterprise',
      org: null,
      team: null,
      date: queryAt,
      ...adoptionService.calculateAdoptionTotals(queryAt, uniqueSeatsArray),
      seats: uniqueSeatsArray
    }

    adoptionService.createAdoption(enterpriseAdoptionData);
  }

  private async orgTask(octokit: Octokit, queryAt: Date, org: string) {
    logger.info(`Task started for ${org}`);
    try {
      let teamsAndMembers = null;
      const mostRecentEntry = await teamsService.getLastUpdatedAt();
      const msSinceLastUpdate = new Date().getTime() - new Date(mostRecentEntry).getTime();
      const hoursSinceLastUpdate = msSinceLastUpdate / 1000 / 60 / 60;
      logger.info(`Teams & Members updated ${hoursSinceLastUpdate.toFixed(2)} hours ago for ${org}.`);
      if (mostRecentEntry && hoursSinceLastUpdate > 24) {
        logger.info(`Updating teams and members for ${org}`);
        teamsAndMembers = await this.queryTeamsAndMembers(octokit, org).then(() => {
          this.status.teamsAndMembers = true;
        });
      }

      const queries = [
        this.queryCopilotUsageMetrics(octokit, org).then(result => {
          this.status.usage = true;
          return result;
        }),
        this.queryCopilotUsageMetricsNew(octokit, org).then(result => {
          this.status.metrics = true;
          return result;
        }),
        this.queryCopilotSeatAssignments(octokit, org, queryAt).then(result => {
          this.status.copilotSeats = true;
          return result;
        }),
      ];

      const [usageMetrics, usageMetricsNew, copilotSeatAssignments] = await Promise.all(queries);
      this.status.dbInitialized = true;

      return {
        usageMetrics,
        usageMetricsNew,
        copilotSeatAssignments,
        teamsAndMembers
      }
    } catch (error) {
      logger.error(error);
    }
    logger.info(`${org} finished task`);
  }

  public async queryCopilotUsageMetricsNew(octokit: Octokit, org: string, team?: string) {
    try {
      const metricsArray = await octokit.paginate<MetricDailyResponseType>(
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

  public async queryCopilotUsageMetrics(octokit: Octokit, org: string) {
    try {
      const rsp = await octokit.rest.copilot.usageMetricsForOrg({
        org
      });

      insertUsage(org, rsp.data);
      logger.info(`${org} usage metrics updated`);
    } catch (error) {
      logger.error(`Error updating ${org} usage metrics`, error);
    }
  }

  public async queryCopilotSeatAssignments(octokit: Octokit, org: string, queryAt: Date) {
    try {
      const rsp = await octokit.paginate(octokit.rest.copilot.listCopilotSeats, {
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

      const result = await SeatService.insertSeats(org, queryAt, seatAssignments.seats);

      logger.info(`${org} seat assignments updated`);

      return result;
    } catch (error) {
      logger.debug(error)
      if (error instanceof Error) {
        logger.error('Error updating seat assignments', error.message);
        return;
      }
      logger.error('Error querying copilot seat assignments');
    }
  }

  public async queryTeamsAndMembers(octokit: Octokit, org: string) {
    try {
      const members = await octokit.paginate(octokit.rest.orgs.listMembers, {
        org
      });
      await teamsService.updateMembers(org, members);

      const teams = await octokit.paginate(octokit.rest.teams.list, {
        org
      });
      await teamsService.updateTeams(org, teams);

      await Promise.all(
        teams.map(async (team) => octokit.paginate(octokit.rest.teams.listMembersInOrg, {
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

      logger.info(`${org} teams and members updated`);
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
