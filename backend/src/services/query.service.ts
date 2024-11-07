import { CronJob, CronTime } from 'cron';
import logger from './logger';
import setup from './setup';
import { insertUsage } from '../models/usage.model';
import { insertSeats } from '../models/copilot.seats';
import { insertMetrics } from '../models/metrics.model';
import { CopilotMetrics } from '../models/metrics.model.interfaces';

class QueryService {
  private static instance: QueryService;
  private cronJob: CronJob;

  private constructor(cronExpression: string, timeZone: string) {
    this.cronJob = new CronJob('0 0 * * *', this.cronTask, null, true);
    this.cronTask();
  }

  private async cronTask() {
    this.queryCopilotUsageMetrics();
    this.queryCopilotUsageMetricsNew();
    this.queryCopilotSeatAssignments();
    this.queryTeams();
  }

  public static createInstance(cronExpression: string, timeZone: string) {
    if (!QueryService.instance) {
      QueryService.instance = new QueryService(cronExpression, timeZone);
    }
  }

  public static getInstance(): QueryService {
    return QueryService.instance;
  }

  public async queryCopilotUsageMetricsNew() {
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.paginate<CopilotMetrics>('GET /orgs/{org}/copilot/metrics', {
        org: setup.installation.owner?.login
      });
      const metricsArray = response;

      await insertMetrics(metricsArray);

      logger.info("Metrics successfully updated! 📈");
    } catch (error) {
      console.log(error);
      logger.error('Error querying copilot metrics', error);
    }
  }

  public async queryCopilotUsageMetrics() {
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.rest.copilot.usageMetricsForOrg({
        org: setup.installation.owner?.login
      });

      insertUsage(response.data);

      logger.info("Usage successfully updated! 👤");
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

      if (!seatAssignments.seats) {
        logger.info(`No seat assignment data found. Skipping...`);
        return;
      }
      
      insertSeats(seatAssignments.seats);
      
      logger.info("Seat assignments successfully updated! 🪑");
    } catch (error) {
      logger.error('Error querying copilot seat assignments', error);
    }
  }

  public async queryTeams() {
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.rest.teams.list({
        org: setup.installation.owner?.login
      });

      // TODO process the teams
      console.log(response.data);

      logger.info("Teams successfully updated! 🧑‍🤝‍🧑");
    } catch (error) {
      logger.error('Error querying teams', error);
    }
  }

  public updateCronJob(cronExpression: string) {
    this.cronJob.setTime(new CronTime(cronExpression));
  }
}

export default QueryService