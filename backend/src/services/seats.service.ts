import { Endpoints } from '@octokit/types';
import { SeatType } from "../models/seats.model.js";
import { components } from "@octokit/openapi-types";
import mongoose from 'mongoose';
import { MemberActivityType, MemberType } from 'models/teams.model.js';
import fs from 'fs';
import adoptionService from './adoption.service.js';
import logger from './logger.js';

type _Seat = NonNullable<Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"]>[0];
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

interface ActivityTotalDocument {
  org: string;
  date: Date;
  assignee: mongoose.Types.ObjectId;
  assignee_id: number;
  assignee_login: string;
  total_active_time_ms?: number;
  last_activity_at?: Date;
  last_activity_editor?: string;
}

interface MemberDocument {
  _id: mongoose.Types.ObjectId;
  id: number;
  login: string;
  [key: string]: any; // For other properties
}

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

  /**
   * Retrieves all seat activity records for a user by their GitHub ID
   * @param id GitHub user ID
   * @param params Optional parameters for filtering (since, until)
   */
  async getAssignee(id: number, params: { since?: string; until?: string } = {}) {
    const Seats = mongoose.model('Seats');
    const Member = mongoose.model('Member');
    // First find the member document by GitHub user ID
    const member = await Member.findOne({ id }).sort({ org: -1 }); //this temporarily resolves a bug where one org fails but the other one succeeds

    if (!member) {
      throw new Error(`Member with id ${id} not found`); // Updated to throw a proper Error
    }

    // Build query with date range filtering if provided
    // Using a more specific type instead of any
    interface SeatQuery {
      assignee: mongoose.Types.ObjectId;
      createdAt?: {
        $gte?: Date;
        $lte?: Date;
      };
    }
    
    const query: SeatQuery = {
      assignee: member._id  // This is the MongoDB ObjectId that links to the Member document
    };

    // Add date range filters if provided
    if (params.since || params.until) {
      query.createdAt = {
        ...(params.since && { $gte: new Date(params.since) }),
        ...(params.until && { $lte: new Date(params.until) })
      };
    }

    // Query all seat activity records where the assignee field matches the member's _id
    // This returns the complete activity history for this user
    return Seats.find(query)
      .sort({ createdAt: 1 }) // Sort by creation time ascending (oldest first)
      .lean()  // Convert Mongoose documents to plain JavaScript objects
      .populate({
        path: 'assignee',  // Link to Member model 👤
        model: Member,
        select: 'login id avatar_url -_id'  // Only select needed fields 🎯
      });
  }

  /**
   * Retrieves all seat activity records for a user by their GitHub login (username)
   * @param login GitHub username
   * @param params Optional parameters for filtering (since, until)
   */
  async getAssigneeByLogin(login: string, params: { since?: string; until?: string } = {}) {
    const Seats = mongoose.model('Seats');
    const Member = mongoose.model('Member');
    // First find the member document by GitHub username
    const member = await Member.findOne({ login });

    if (!member) {
      throw `Member with id ${login} not found`
    }

    // Build query with date range filtering if provided
    const query: mongoose.FilterQuery<any> = {
      assignee: member._id
    };

    // Add date range filters if provided
    if (params.since || params.until) {
      query.createdAt = {
        ...(params.since && { $gte: new Date(params.since) }),
        ...(params.until && { $lte: new Date(params.until) })
      };
    }

    // Query all seat activity records where the assignee field matches the member's _id
    // This returns the complete activity history for this user
    return Seats.find(query)
      .sort({ createdAt: 1 }) // Sort by creation time ascending (oldest first)
      .lean()
      .populate({
        path: 'assignee',  // Link to Member model 👤
        model: Member,
        select: 'login id avatar_url -_id'  // Only select needed fields 🎯
      });
  }

  /**
   * Improved method to find seat information by either ID or login
   * @param identifier Either a numeric ID or string login
   * @param params Optional parameters for filtering (since, until, org)
   */
  async getSeat(identifier: string | number, params: { since?: string; until?: string; org?: string } = {}) {
    const Seats = mongoose.model('Seats');
    const Member = mongoose.model('Member');
    
    try {
      //console.log('========== SEAT LOOKUP START ==========');
      //console.log(`Looking up seat for identifier: ${identifier}, params:`, JSON.stringify(params));
      
      // Force console output to appear immediately
      process.stdout.write(''); 
      
      // Determine if identifier is numeric
      const isNumeric = !isNaN(Number(identifier)) && String(Number(identifier)) === String(identifier);
      let numericId: number | null = null;
      
      // If it's a login, look up the ID first
      if (!isNumeric) {
        // Ensure identifier is treated as string before calling replace
        const identifierString = String(identifier);
        
        try {
          // Find the member by login - exact match with explicit type casting
          const member = await Member.findOne({ login: identifierString }).lean() as MemberDocument | null;
          
          if (!member) {
            // Try case-insensitive search as a fallback
            const regex = new RegExp(`^${identifierString.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
            const memberCaseInsensitive = await Member.findOne({ 
              login: regex
            }).lean() as MemberDocument | null;
            
            // Check if we got a document and then safely access properties
            console.log(`Case-insensitive search result:`, 
                        memberCaseInsensitive ? `Found ${memberCaseInsensitive.login}` : 'Not found');
            
            if (!memberCaseInsensitive) {
              return []; // Return empty array if no member found
            }
            
            // Now TypeScript knows memberCaseInsensitive has these properties
            numericId = memberCaseInsensitive.id;
          } else {
            // Now TypeScript knows member has these properties
            numericId = member.id;
          }
        } catch (memberLookupError: unknown) {
          // Properly type the error
          return []; // Return empty array on error
        }
      } else {
        numericId = Number(identifier);
        //console.log(`Using numeric ID directly: ${numericId}`);
      }
      
      // Build query
      const query: Record<string, any> = { assignee_id: numericId };
      
      // Add filters
      if (params.org) {
        query.org = params.org;
       // console.log(`Added org filter: ${params.org}`);
      }
      
      if (params.since || params.until) {
        query.createdAt = {};
        if (params.since) {
          query.createdAt.$gte = new Date(params.since);
        //  console.log(`Added since filter: ${params.since}`);
        }
        if (params.until) {
          query.createdAt.$lte = new Date(params.until);
        //  console.log(`Added until filter: ${params.until}`);
        }
      }
      
     // console.log(`Final query:`, JSON.stringify(query));
      
      // Execute the query
      //console.log(`Executing Seats.find() with query`);
      const results = await Seats.find(query)
        .sort({ createdAt: 1 })
        .populate({
          path: 'assignee',
          model: Member,
          select: 'login id avatar_url name url html_url'
        })
        .lean()
        .exec(); // Explicitly call exec()
      
      logger.debug(`Query complete. Found ${results?.length || 0} seat records`);
      //console.log('========== SEAT LOOKUP END ==========');
      
      return results || [];
      
    } catch (error: unknown) {
      console.error('========== SEAT LOOKUP ERROR ==========');
      console.error(`Error retrieving seat data for ${identifier}:`, error);
      // Safe access to stack property
      console.error(`Stack trace:`, error instanceof Error ? error.stack : 'No stack trace available');
      console.error('=======================================');
      
      // Return empty results rather than throwing error
      return [];
    }
  }

  async insertSeats(org: string, queryAt: Date, data: SeatEntry[], team?: string) {
    const Members = mongoose.model('Member');
    const Seats = mongoose.model('Seats');
    const ActivityTotals = mongoose.model('ActivityTotals');

    // fill the data to 10,000 entries for testing
    // data = new Array(10000).fill(0).map((entry, index) => {
    //   const seat = data[index % data.length];
    //   return {
    //     ...seat,
    //     plan_type: seat.plan_type || 'unknown',
    //     assignee: {
    //       ...seat.assignee,
    //       id: seat.assignee.id + index,
    //       login: seat.assignee.login ||
    //         `test-login-${index}`,
    //       node_id: seat.assignee.node_id || `test-node-id-${index}`,
    //       avatar_url: seat.assignee.avatar_url ||
    //         `https://avatars.githubusercontent.com/u/${index}?v=4`,
    //       gravatar_id: seat.assignee.gravatar_id || `test-gravatar-id-${index}`,
    //       url: seat.assignee.url || `https://api.github.com/users/test-login-${index}`,
    //       html_url: seat.assignee.html_url || ``,
    //       followers_url: seat.assignee.followers_url || `https://api.github.com/users/test-login-${index}/followers`,
    //       following_url: seat.assignee.following_url || `https://api.github.com/users/test-login-${index}/following{/other_user}`,
    //       gists_url: seat.assignee.gists_url || `https://api.github.com/users/test-login-${index}/gists{/gist_id}`,
    //       starred_url: seat.assignee.starred_url || `https://api.github.com/users/test-login-${index}/starred{/owner}{/repo}`,
    //       subscriptions_url: seat.assignee.subscriptions_url || `https://api.github.com/users/test-login-${index}/subscriptions`,
    //       organizations_url: seat.assignee.organizations_url || `https://api.github.com/users/test-login-${index}/orgs`,
    //       repos_url: seat.assignee.repos_url || `https://api.github.com/users/test-login-${index}/repos`,
    //       events_url: seat.assignee.events_url || `https://api.github.com/users/test-login-${index}/events{/privacy}`,
    //       received_events_url: seat.assignee.received_events_url || `https://api.github.com/users/test-login-${index}/received_events`,
    //       type: seat.assignee.type || `User`,
    //       site_admin: seat.assignee.site_admin || false
    //     }
    //   }
    // });

    logger.info(`Inserting ${data.length} seat assignments for ${org}`);

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

    logger.debug(`Writing ${memberUpdates.length} members`);
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
    logger.debug(`Writing ${seatsData.length} seats`);

    const seatInsertOperations = seatsData.map(seat => ({
      insertOne: {
        document: seat
      }
    }));
    const bulkWriteResult = await Seats.bulkWrite(seatInsertOperations, { ordered: false });
    logger.debug(`Inserted ${bulkWriteResult.insertedCount} seats`);
    const seatResults = await Seats.find({
      queryAt,
      org,
      assignee_id: { $in: data.map(seat => seat.assignee.id) }
    }).sort({ createdAt: -1 }).limit(seatsData.length);

    const memberSeatUpdates = seatResults.map(seat => ({
      updateOne: {
        filter: { org, id: seat.assignee_id },
        update: {
          $set: { seat: seat._id }
        }
      }
    }));
    logger.debug(`Writing ${memberSeatUpdates.length} member seat updates`);
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
    logger.debug(`Writing ${adoptionData.seats.length} adoption data`);
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
      logger.debug(`Writing ${activityUpdates.length} activity updates`);
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
  } = {}): Promise<MemberDailyActivity> {
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

    const match: mongoose.FilterQuery<SeatEntry> = {};
    if (org) match.org = org;
    if (since || until) {
      match.createdAt = {
        ...(since && { $gte: new Date(since) }),
        ...(until && { $lte: new Date(until) })
      };
    }

    const assignees: MemberType[] = await Member
      .aggregate([
        { $match: match },
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

    return Object.entries(activityTotals).sort((a: [string, number], b: [string, number]) => b[1] - a[1]);
  }

  async getMembersActivityTotals2(params: {
    org?: string;
    since?: string;
    until?: string;
    limit?: number;
  }) {
    const ActivityTotals = mongoose.model('ActivityTotals');
    const { org, since, until } = params;
    const limit = typeof params.limit === 'string' ? parseInt(params.limit) : (params.limit || 100);

        const match: mongoose.FilterQuery<MemberActivityType> = {};
    if (org) match.org = org;
    if (since || until) {
      match.date = {
        ...(since && { $gte: new Date(since) }),
        ...(until && { $lte: new Date(until) })
      };
    }

    const totals = await ActivityTotals.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            date: "$date",
            login: "$assignee_login"
          },
          daily_time: { $sum: "$total_active_time_ms" },
          last_activity_at: { $max: "$last_activity_at" },
          last_activity_editor: { $last: "$last_activity_editor" },
          assignee_id: { $first: "$assignee_id" }
        }
      },
      {
        $lookup: {
          from: 'members',
          localField: '_id.login',
          foreignField: 'login',
          as: 'memberDetails'
        }
      },
      {
        $unwind: {
          path: '$memberDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id.login",
          total_time: { $sum: "$daily_time" },
          last_activity_at: { $max: "$last_activity_at" },
          last_activity_editor: { $last: "$last_activity_editor" },
          assignee_id: { $first: "$assignee_id" },
          avatar_url: { $first: "$memberDetails.avatar_url" },
          name: { $first: "$memberDetails.name" },
          url: { $first: "$memberDetails.url" },
          html_url: { $first: "$memberDetails.html_url" },
          team: { $first: "$memberDetails.team" },
          org: { $first: "$memberDetails.org" },
          type: { $first: "$memberDetails.type" }
        }
      },
      { $sort: { total_time: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          login: '$_id',
          total_time: 1,
          last_activity_at: 1,
          last_activity_editor: 1,
          assignee_id: 1,
          avatar_url: 1,
          name: 1,
          url: 1,
          html_url: 1,
          team: 1,
          org: 1,
          type: 1
        }
      }
    ]);

    return totals;
  }
}

export default new SeatsService();

export {
  MemberDailyActivity
}