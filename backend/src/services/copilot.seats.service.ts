import { Endpoints } from '@octokit/types';
import { Seat } from "../models/copilot.seats.model.js";
import { Op, QueryTypes, Sequelize } from 'sequelize';
import { components } from "@octokit/openapi-types";
import { Member, Team } from '../models/teams.model.js';
import app from '../index.js';

type _Seat = NonNullable<Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"]>[0];
export interface SeatEntry extends _Seat {
  plan_type: string;
  assignee: components['schemas']['simple-user'];
}

type MemberDailyActivity = {
  [date: string]: {
    totalSeats: number,
    totalActive: number,
    totalInactive: number,
    active: {
      [assignee: string]: Seat
    },
    inactive: {
      [assignee: string]: Seat
    }
  };
};

class SeatsService {
  async getAllSeats(org?: string) {
    const latestQuery = await Seat.findOne({
      attributes: [[Sequelize.fn('MAX', Sequelize.col('queryAt')), 'queryAt']],
      where: {
        ...(org ? { org } : {}),
      }
    });

    return Seat.findAll({
      include: [{
        model: Member,
        as: 'assignee',
        attributes: ['login', 'id', 'avatar_url']
      }],
      where: {
        ...(org ? { org } : {}),
        queryAt: latestQuery?.queryAt
      },
      order: [['last_activity_at', 'DESC']]
    });
  }

  async getAssignee(id: number) {
    return Seat.findAll({
      include: [{
        model: Member,
        as: 'assignee'
      }],
      where: {
        assignee_id: id
      }
    });
  }

  async getAssigneeByLogin(login: string) {
    const assignee = await Member.findOne({
      where: {
        login
      }
    });
    if (!assignee) throw new Error(`Assignee ${login} not found`);
    return Seat.findAll({
      include: [{
        model: Member,
        as: 'assignee'
      }],
      where: {
        assignee_id: assignee.id
      }
    });
  }

  async insertSeats(org: string, data: SeatEntry[], team?: string) {
    const queryAt = new Date();
    for (const seat of data) {
      const [assignee] = await Member.findOrCreate({
        where: { id: seat.assignee.id },
        defaults: {
          org,
          ...team ? { team } : undefined,
          id: seat.assignee.id,
          login: seat.assignee.login,
          node_id: seat.assignee.node_id,
          avatar_url: seat.assignee.avatar_url,
          gravatar_id: seat.assignee.gravatar_id || '',
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

      const [assigningTeam] = seat.assigning_team ? await Team.findOrCreate({
        where: { id: seat.assigning_team.id },
        defaults: {
          org,
          id: seat.assigning_team.id,
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
          repositories_url: seat.assigning_team.repositories_url
        }
      }) : [null];

      await Seat.create({
        queryAt,
        org,
        team,
        created_at: seat.created_at,
        updated_at: seat.updated_at,
        pending_cancellation_date: seat.pending_cancellation_date,
        last_activity_at: seat.last_activity_at,
        last_activity_editor: seat.last_activity_editor,
        plan_type: seat.plan_type,
        assignee_id: assignee.id,
        assigning_team_id: assigningTeam?.id
      });
    }
  }

  async getMembersActivity(params: {
    org?: string;
    daysInactive?: number;
    precision?: 'hour' | 'day' | 'minute';
    since?: string;
    until?: string;
  } = {}): Promise<MemberDailyActivity> {
    const { org, daysInactive = 30, precision = 'day', since, until } = params;
    if (!app.database.sequelize) throw new Error('No database connection available');
    // const assignees = await app.database.sequelize.query<Member>(
    //   `SELECT 
    //       Member.login,
    //       Member.id,
    //       activity.id AS 'activity.id',
    //       activity.createdAt AS 'activity.createdAt',
    //       activity.last_activity_at AS 'activity.last_activity_at',
    //       activity.last_activity_editor AS 'activity.last_activity_editor'
    //   FROM Members AS Member 
    //   INNER JOIN Seats AS activity ON Member.id = activity.assignee_id
    //   ${org ? 'WHERE activity.org = :org' : ''}
    //   ORDER BY activity.last_activity_at ASC`,
    //   {
    //     replacements: {
    //       org
    //     },
    //     type: QueryTypes.SELECT,
    //     nest: true,
    //     mapToModel: true // 🎯 Maps results to the Model
    //   }
    // );
    
    const dateFilter = {
      ...(since && { [Op.gte]: new Date(since as string) }),
      ...(until && { [Op.lte]: new Date(until as string) })
    };
    const assignees = await Member.findAll({
      attributes: ['login', 'id'],
      include: [
        {
          model: Seat,
          as: 'activity',
          attributes: ['createdAt', 'last_activity_at', 'last_activity_editor'],
          order: [['last_activity_at', 'ASC']],
          where: {
            ...(org ? { org } : {}),
            ...Object.getOwnPropertySymbols(dateFilter).length ? { createdAt: dateFilter } : {}
          }
        }
      ],
      order: [
        [{ model: Seat, as: 'activity' }, 'last_activity_at', 'ASC']
      ]
    });
    const activityDays: MemberDailyActivity = {};
    assignees.forEach((assignee) => {
      assignee.activity.forEach((activity) => {
        const fromTime = activity.last_activity_at?.getTime() || 0;
        const toTime = activity.createdAt.getTime();
        const diff = Math.floor((toTime - fromTime) / 86400000);
        const dateIndex = new Date(activity.createdAt);
        if (precision === 'day') {
          dateIndex.setUTCHours(0, 0, 0, 0);
        } else if (precision === 'hour') {
          dateIndex.setUTCMinutes(0, 0, 0);
        } else if (precision === 'minute') {
          dateIndex.setUTCSeconds(0, 0);
        }
        const dateIndexStr = new Date(dateIndex).toISOString();
        if (!activityDays[dateIndexStr]) {
          activityDays[dateIndexStr] = {
            totalSeats: 0,
            totalActive: 0,
            totalInactive: 0,
            active: {},
            inactive: {}
          }
        }
        if (activityDays[dateIndexStr].active[assignee.login] || activityDays[dateIndexStr].inactive[assignee.login]) {
          return; // already processed for this day
        }
        if (diff > daysInactive) {
          activityDays[dateIndexStr].inactive[assignee.login] = assignee.activity[0];
        } else {
          activityDays[dateIndexStr].active[assignee.login] = assignee.activity[0];
        }
      });
    });
    Object.entries(activityDays).forEach(([date, activity]) => {
      activityDays[date].totalSeats = Object.values(activity.active).length + Object.values(activity.inactive).length
      activityDays[date].totalActive = Object.values(activity.active).length
      activityDays[date].totalInactive = Object.values(activity.inactive).length
    });

    const sortedActivityDays = Object.fromEntries(
      Object.entries(activityDays)
        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
    );

    return sortedActivityDays;
  }

  async getMembersActivityTotals(params: {
    org?: string;
    since?: string;
    until?: string;
  }) {
    // const assignees2 = await app.database.sequelize?.query(`
    //   SELECT \`Member\`.\`login\`, \`Member\`.\`id\`, \`activity\`.\`id\` AS \`activity.id\`, \`activity\`.\`last_activity_at\` AS \`activity.last_activity_at\`
    //   FROM \`Members\` AS \`Member\`
    //   INNER JOIN \`Seats\` AS \`activity\` ON \`Member\`.\`id\` = \`activity\`.\`assignee_id\`
    // `, {
    //   replacements: { org },
    //   type: QueryTypes.SELECT
    // });
    const { org, since, until } = params;    
    const dateFilter = {
      ...(since && { [Op.gte]: new Date(since as string) }),
      ...(until && { [Op.lte]: new Date(until as string) })
    };
    const assignees = await Member.findAll({
      attributes: ['login', 'id'],
      include: [{
        model: Seat,
        as: 'activity',
        attributes: ['last_activity_at'],
        order: [['last_activity_at', 'ASC']],
        where: {
          ...(org ? { org } : {}),
          ...Object.getOwnPropertySymbols(dateFilter).length ? { createdAt: dateFilter } : {}
        }
      }]
    });

    const activityTotals = assignees.reduce((totals, assignee) => {
      totals[assignee.login] = assignee.activity.reduce((totalMs, activity, index) => {
        if (index === 0) return totalMs;
        const prev = assignee.activity[index - 1];
        const diff = activity.last_activity_at?.getTime() - prev.last_activity_at?.getTime();
        if (diff) {
          if (diff > 1000 * 60 * 30) {
            totalMs += 1000 * 60 * 30;
          } else {
            totalMs += diff;
          }
        }
        return totalMs;
      }, 0);
      return totals;
    }, {} as { [assignee: string]: number });

    return Object.entries(activityTotals).sort((a, b) => b[1] - a[1]);
  }
}

export default new SeatsService();

export {
  MemberDailyActivity
}