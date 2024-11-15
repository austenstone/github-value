import { CronJob, CronTime } from 'cron';
import logger from './logger';
import setup from './setup';
import { insertUsage } from '../models/usage.model';
import SeatService from '../services/copilot.seats.service';
import { insertMetrics } from '../models/metrics.model';
import { CopilotMetrics } from '../models/metrics.model.interfaces';
import { Member, Team, TeamMemberAssociation } from '../models/teams.model';

const DEFAULT_CRON_EXPRESSION = '0 0 * * *';
class QueryService {
  private static instance: QueryService;
  private cronJob: CronJob;

  private constructor(cronExpression: string, timeZone: string) {
    this.cronJob = new CronJob(cronExpression || DEFAULT_CRON_EXPRESSION, this.task, null, true, timeZone);
    this.task();
  }

  private async task() {
    await Promise.all([
      this.queryCopilotUsageMetrics().then(() =>
        setup.setSetupStatusDbInitialized({ usage: true })),
      this.queryCopilotUsageMetricsNew().then(() =>
        setup.setSetupStatusDbInitialized({ metrics: true })),
      this.queryCopilotSeatAssignments().then(() =>
        setup.setSetupStatusDbInitialized({ copilotSeats: true })),
      this.queryTeamsAndMembers().then(() =>
        setup.setSetupStatusDbInitialized({ teamsAndMembers: true })),
    ]);
    setup.setSetupStatus({
      dbInitialized: true
    })
  }

  public static createInstance(cronExpression: string, timeZone: string) {
    if (!QueryService.instance) {
      QueryService.instance = new QueryService(cronExpression, timeZone);
    }
    return QueryService.instance;
  }

  public static getInstance(): QueryService {
    return QueryService.instance;
  }

  public async queryCopilotUsageMetricsNew() {
    if (!setup.installation?.owner?.login) throw new Error('No installation found')
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.paginate<CopilotMetrics>('GET /orgs/{org}/copilot/metrics', {
        org: setup.installation.owner?.login
      });
      const metricsArray = response;

      await insertMetrics(metricsArray);

      logger.info("Metrics successfully updated! 📈");
    } catch (error) {
      logger.error('Error querying copilot metrics', error);
    }
  }

  public async queryCopilotUsageMetrics() {
    if (!setup.installation?.owner?.login) throw new Error('No installation found')
    try {
      const octokit = await setup.getOctokit();
      const response = await octokit.rest.copilot.usageMetricsForOrg({
        org: setup.installation.owner?.login
      });

      insertUsage(response.data);

      logger.info("Usage successfully updated! 📈");
    } catch (error) {
      logger.error('Error querying copilot metrics', error);
    }
  }

  public async queryCopilotSeatAssignments() {
    if (!setup.installation?.owner?.login) throw new Error('No installation found')
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
        logger.info(`No seat assignment data found.`);
        return;
      }

      SeatService.insertSeats(seatAssignments.seats);

      logger.info("Seat assignments successfully updated! 🪑");
    } catch (error) {
      logger.error('Error querying copilot seat assignments', error);
    }
  }

  public async queryTeamsAndMembers() {
    if (!setup.installation?.owner?.login) throw new Error('No installation found')
    try {
      const octokit = await setup.getOctokit();
      const teams = await octokit.paginate(octokit.rest.teams.list, {
        org: setup.installation.owner?.login
      });

      // First pass: Create all teams without parent relationships 🏗️
      for (const team of teams) {
        await Team.upsert({
          id: team.id,
          node_id: team.node_id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          privacy: team.privacy,
          notification_setting: team.notification_setting,
          permission: team.permission,
          url: team.url,
          html_url: team.html_url,
          members_url: team.members_url,
          repositories_url: team.repositories_url
        });
      }

      // Second pass: Update parent relationships 👨‍👦
      for (const team of teams) {
        if (team.parent?.id) {
          await Team.update(
            { parent_id: team.parent.id },
            { where: { id: team.id } }
          );
        }
      }

      // Third pass: Add team members 👥
      for (const team of teams) {
        const members = await octokit.paginate(octokit.rest.teams.listMembersInOrg, {
          org: setup.installation.owner?.login,
          team_slug: team.slug
        });

        if (members?.length) {
          await Promise.all(members.map(async member => {
            const [dbMember] = await Member.upsert({
              id: member.id,
              login: member.login,
              node_id: member.node_id,
              avatar_url: member.avatar_url,
              gravatar_id: member.gravatar_id || null,
              url: member.url,
              html_url: member.html_url,
              followers_url: member.followers_url,
              following_url: member.following_url,
              gists_url: member.gists_url,
              starred_url: member.starred_url,
              subscriptions_url: member.subscriptions_url,
              organizations_url: member.organizations_url,
              repos_url: member.repos_url,
              events_url: member.events_url,
              received_events_url: member.received_events_url,
              type: member.type,
              site_admin: member.site_admin
            });

            // Create team-member association 🤝
            await TeamMemberAssociation.upsert({
              TeamId: team.id,
              MemberId: dbMember.id
            });
          }));
        }

        logger.info(`Team ${team.name} successfully updated! ✏️`);
      }


      await Team.upsert({
        name: 'No Team',
        slug: 'no-team',
        description: 'No team assigned',
        id: -1
      });

      const members = await octokit.paginate(octokit.rest.orgs.listMembers, {
        org: setup.installation?.owner?.login
      });
      if (members?.length) {
        await Promise.all(members.map(async member => {
          const [dbMember] = await Member.upsert({
            id: member.id,
            login: member.login,
            node_id: member.node_id,
            avatar_url: member.avatar_url,
            gravatar_id: member.gravatar_id || null,
            url: member.url,
            html_url: member.html_url,
            followers_url: member.followers_url,
            following_url: member.following_url,
            gists_url: member.gists_url,
            starred_url: member.starred_url,
            subscriptions_url: member.subscriptions_url,
            organizations_url: member.organizations_url,
            repos_url: member.repos_url,
            events_url: member.events_url,
            received_events_url: member.received_events_url,
            type: member.type,
            site_admin: member.site_admin
          });

          // Create team-member association 🤝
          await TeamMemberAssociation.upsert({
            TeamId: -1,
            MemberId: dbMember.id
          });
        }));
      }

      logger.info("Teams & Members successfully updated! 🧑‍🤝‍🧑");
    } catch (error) {
      logger.error('Error querying teams', error);
    }
  }

  public updateCronJob(cronExpression: string) {
    if (!cronExpression) cronExpression = DEFAULT_CRON_EXPRESSION;
    this.cronJob.setTime(new CronTime(cronExpression));
  }
}

export {
  QueryService
}
