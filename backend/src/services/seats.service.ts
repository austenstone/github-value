import { Endpoints } from '@octokit/types';
import { SeatType } from "../models/seats.model.js";
import { components } from "@octokit/openapi-types";
import mongoose from 'mongoose';
import { MemberActivityType, MemberType } from 'models/teams.model.js';
import fs from 'fs';
import adoptionService from './adoption.service.js';

type _Seat = any;// NonNullable<Endpoints["GET /orgs/{org}/copilot"]["response"]["data"]["seats"]>[0];
export interface SeatEntry extends _Seat {
  plan_type: "business" | "enterprise" | "unknown";
  assignee: components['schemas']['simple-user'];
}

type MemberDailyActivity = {
  [date: string]: {
    totalSeats: number,
    totalActive: number,
    totalInactive: number,
    active: {
      [assignee: string]: SeatType
    },
    inactive: {
      [assignee: string]: SeatType
    }
  };
};

class SeatsService {
  async getAllSeats(org?: string) {
    const Member = mongoose.model('Member');

    const seats = await Member.find({
      ...(org ? { org } : {})
    })
      .select('org login id name url avatar_url')
      .populate({
        path: 'seat',
        select: '-_id -__v',
        options: { lean: true }
      })
      .sort({ 'seat.last_activity_at': -1 })
      .exec();

    return seats;
  }

  async getAssignee(id: number) {
    const Seats = mongoose.model('Seats');
    const Member = mongoose.model('Member');
    const member = await Member.findOne({id}).sort({org: -1}); //this temporarily resolves a bug where one org fails but the other one succeeds

    if (!member) {
      throw `Member with id ${id} not found`
    }

    return Seats.find({
      assignee: member._id
    })
      .lean()
      .populate({
        path: 'assignee',  // Link to Member model 👤
        model: Member,
        select: 'login id avatar_url -_id'  // Only select needed fields 🎯
      });
  }

  async getAssigneeByLogin(login: string) {
    const Seats = mongoose.model('Seats');
    const Member = mongoose.model('Member');
    const member = await Member.findOne({ login });

    if (!member) {
      throw `Member with id ${login} not found`
    }

    return Seats.find({
      assignee: member._id
    })
      .lean()
      .populate({
        path: 'assignee',  // Link to Member model 👤
        model: Member,
        select: 'login id avatar_url -_id'  // Only select needed fields 🎯
      });
  }

  async insertSeats(org: string, queryAt: Date, data: SeatEntry[], team?: string) {
    const Members = mongoose.model('Member');
    const Seats = mongoose.model('Seats');
    const ActivityTotals = mongoose.model('ActivityTotals');

    const memberUpdates = data.map(seat => ({
      updateOne: {
        filter: { org, id: seat.assignee.id },
        update: {
          $set: {
            ...team ? { team } : undefined,
            org,
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
        },
        upsert: true,
      }
    }));
    await Members.bulkWrite(memberUpdates);

    const updatedMembers = await Members.find({
      org,
      id: { $in: data.map(seat => seat.assignee.id) }
    });

    const seatsData = data.map((seat) => ({
      queryAt,
      org,
      team,
      ...seat,
      assignee_id: seat.assignee.id,
      assignee_login: seat.assignee.login,
      assignee: updatedMembers.find(m => m.id === seat.assignee.id)?._id
    }));
    const seatResults = await Seats.insertMany(seatsData);

    // Add member seat updates
    const memberSeatUpdates = seatResults.map(seat => ({
      updateOne: {
        filter: { org, id: seat.assignee_id },
        update: {
          $set: { seat: seat._id }
        }
      }
    }));
    await Members.bulkWrite(memberSeatUpdates);

    const adoptionData = {
      enterprise: null,
      org: org,
      team: null,
      date: queryAt,
      ...adoptionService.calculateAdoptionTotals(queryAt, data),
      seats: seatResults.map(seat => ({
        login: seat.assignee_login,
        last_activity_at: seat.last_activity_at,
        last_activity_editor: seat.last_activity_editor,
        _assignee: seat.assignee,
        _seat: seat._id,
      }))
    }

    await adoptionService.createAdoption(adoptionData);

    const today = new Date(queryAt);
    // add 1 to day
    // today.setDate(today.getDate() + 1);
    today.setUTCHours(0, 0, 0, 0);
    const activityUpdates = seatResults.map(seat => ({
      updateOne: {
        filter: {
          org,
          assignee: seat.assignee,
          assignee_id: seat.assignee_id,
          assignee_login: seat.assignee_login,
          date: today
        },
        update: [{
          $set: {
            total_active_time_ms: {
              $cond: {
                if: { $eq: [seat.last_activity_at, null] },
                then: { $ifNull: ["$total_active_time_ms", 0] },
                else: {
                  $add: [
                    { $ifNull: ["$total_active_time_ms", 0] },
                    {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $or: [
                                { $eq: ["$last_activity_at", null] },
                                { $lt: ["$last_activity_at", seat.last_activity_at] }
                              ]
                            },
                            { $gt: [seat.last_activity_at, today] }
                          ]
                        },
                        then: 1,
                        else: 0
                      }
                    }
                  ]
                }
              }
            }
          }
        }, {
          $set: {
            last_activity_editor: seat.last_activity_editor,
            last_activity_at: seat.last_activity_at
          }
        }],
        upsert: true
      }
    })).filter(update => update !== null);

    if (activityUpdates.length > 0) {
      await ActivityTotals.bulkWrite(activityUpdates);
    }

    return {
      seats: seatResults,
      members: updatedMembers,
      adoption: adoptionData
    }
  }

  async getMembersActivity(params: {
    org?: string;
    daysInactive?: number;
    precision?: 'hour' | 'day' | 'minute';
    since?: string;
    until?: string;
  } = {}): Promise<any> { // Promise<MemberDailyActivity> {
    const Seats = mongoose.model('Seats');
    // const seats = await Seats.find({})
    // return seats.length;

    // return;
    // const Member = mongoose.model('Member');
    const { org, daysInactive = 30, precision = 'day', since, until } = params;
    const assignees: MemberActivityType[] = await Seats.aggregate([
      {
        $match: {
          ...(org && { org }),
          ...(since && { createdAt: { $gte: new Date(since) } }),
          ...(until && { createdAt: { $lte: new Date(until) } }),
          last_activity_at: { $ne: null } // Only get records with activity
        }
      },
      {
        $lookup: {
          from: 'members',
          localField: 'assignee',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      {
        $unwind: '$memberDetails'
      },
      {
        $group: {
          _id: '$memberDetails._id',
          login: { $first: '$memberDetails.login' },
          id: { $first: '$memberDetails.id' },
          activity: {
            $push: {
              last_activity_at: '$last_activity_at',
              createdAt: '$createdAt',
              last_activity_editor: '$last_activity_editor'
            }
          }
        }
      }
    ])
    // .hint({ org: 1, createdAt: 1 })
    // .allowDiskUse(true)
    // .explain('executionStats');

    const activityDays: MemberDailyActivity = {};
    assignees.forEach((assignee) => {
      if (!assignee.activity) return;
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

    fs.writeFileSync('sortedActivityDays.json', JSON.stringify(sortedActivityDays, null, 2), 'utf-8');

    return sortedActivityDays;
  }

  async getMembersActivityTotals(params: {
    org?: string;
    since?: string;
    until?: string;
  }) {
    const { org, since, until } = params;
    const Member = mongoose.model('Member');

    const assignees: MemberType[] = await Member
      .aggregate([
        {
          $lookup: {
            from: 'seats',          // MongoDB collection name (lowercase)
            localField: '_id',      // Member model field
            foreignField: 'assignee', // Seats model field
            as: 'activity'            // Name for the array of seats
          }
        }
      ]);

    const activityTotals = assignees.reduce((totals, assignee) => {
      if (assignee.activity) {
        totals[assignee.login] = assignee.activity.reduce((totalMs, activity, index) => {
          if (index === 0) return totalMs;
          if (!activity.last_activity_at) return totalMs;
          const prev = assignee.activity?.[index - 1];
          const diff = activity.last_activity_at?.getTime() - (prev?.last_activity_at?.getTime() || 0);
          if (diff) {
            if (diff > 1000 * 60 * 30) {
              totalMs += 1000 * 60 * 30;
            } else {
              totalMs += diff;
            }
          }
          return totalMs;
        }, 0);
      }
      return totals;
    }, {} as { [assignee: string]: number });

    return Object.entries(activityTotals).sort((a: any, b: any) => b[1] - a[1]);
  }

  async getMembersActivityTotals2(params: {
    org?: string;
    since?: string;
    until?: string;
  }) {
    const ActivityTotals = mongoose.model('ActivityTotals');
    const { org, since, until } = params;

    const match: any = {};
    if (org) match.org = org;
    if (since || until) {
      match.date = {
        ...(since && { $gte: new Date(since) }),
        ...(until && { $lte: new Date(until) })
      };
    }

    const totals = await ActivityTotals.aggregate([
      // Match documents within date range and org
      { $match: match },
      // First group by date AND assignee_login
      {
        $group: {
          _id: {
            date: "$date",
            login: "$assignee_login"
          },
          daily_time: { $sum: "$total_active_time_ms" }
        }
      },
      // Then group by just assignee_login to sum across days
      {
        $group: {
          _id: "$_id.login",
          total_time: { $sum: "$daily_time" }
        }
      },
      // Sort by total time descending
      { $sort: { total_time: -1 } },
      // Project final fields
      {
        $project: {
          _id: 0,
          login: '$_id',
          total_time: 1
        }
      }
    ]);

    return totals.map(t => [t.login, t.total_time]);
  }
}

export default new SeatsService();

export {
  MemberDailyActivity
}