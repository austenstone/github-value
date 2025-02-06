import { Endpoints } from "@octokit/types";
import { TeamType } from "models/teams.model.js";
import mongoose from "mongoose";
import logger from "./logger.js";

class TeamsService {
  async updateTeams(org: string, teams: Endpoints["GET /orgs/{org}/teams"]["response"]["data"]) {
    const Team = mongoose.model('Team');

    for (const team of teams) {
      await Team.findOneAndUpdate(
        { githubId: team.id }, // search criteria
        {
          org,
          team: team.slug,
          githubId: team.id,
          node_id: team.node_id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          privacy: team.privacy || 'unknown',
          notification_setting: team.notification_setting || 'unknown',
          permission: team.permission,
          url: team.url,
          html_url: team.html_url,
          members_url: team.members_url,
          repositories_url: team.repositories_url
        },
        { upsert: true, new: true } // create if doesn't exist, return updated doc
      );
    }

    // Second pass: Update parent relationships 👨‍👦
    for (const team of teams) {
      if (team.parent?.id) {
        const parentTeam = await Team.findOne({ githubId: team.parent.id });
        if (parentTeam) {
          await Team.findOneAndUpdate(
            { githubId: team.id },
            { parent: parentTeam._id }
          );
        }
      }
    }

    await Team.findOneAndUpdate(
      { githubId: -1 },
      {
        org,
        name: 'No Team',
        slug: 'no-team',
        description: 'No team assigned',
        node_id: '',
        permission: '',
        url: '',
        html_url: '',
        members_url: '',
        repositories_url: '',
        githubId: -1
      },
      { upsert: true, new: true }
    );
  }

  async updateMembers(org: string, members: Endpoints["GET /orgs/{org}/teams/{team_slug}/members"]["response"]["data"]) {
    const Members = mongoose.model('Member');
    const bulkOps = members.map((member) => ({
      updateOne: {
        filter: { org, id: member.id },
        update: { $set: member },
        upsert: true
      }
    }));
    await Members.bulkWrite(bulkOps, { ordered: false });
  }

  async addMemberToTeam(teamId: number, memberId: number) {
    const Team = mongoose.model('Team');
    const Member = mongoose.model('Member');
    const TeamMember = mongoose.model('TeamMember');

    // Find Team and Member documents to get their MongoDB _ids
    const team = await Team.findOne({ githubId: teamId });
    const member = await Member.findOne({ id: memberId });

    if (!team || !member) {
      logger.error(`Team ${teamId} or member ${memberId} not found`);
      return;
    }

    // Use MongoDB _ids for the relationship
    return TeamMember.findOneAndUpdate(
      { team: team._id, member: member._id },
      { team: team._id, member: member._id },
      { upsert: true, new: true }
    );
  }

  async deleteMemberFromTeam(teamId: number, memberId: number) {
    const TeamMember = mongoose.model('TeamMember');
    const deleted = await TeamMember.deleteOne({ team: teamId, member: memberId });
    if (deleted.deletedCount === 0) {
      throw new Error(`Member ${memberId} is not part of team ${teamId}`);
    }
    return true;
  }

  async deleteMember(memberId: number) {
    const Member = mongoose.model('Member');
    const TeamMember = mongoose.model('TeamMember');

    await TeamMember.deleteMany({ member: memberId });
    const deleted = await Member.deleteOne({ id: memberId });
    if (deleted.deletedCount === 0) {
      throw new Error(`Member with ID ${memberId} not found`);
    }
    return true;
  }

  async deleteTeam(teamId: number) {
    const Team = mongoose.model('Team');
    const TeamMember = mongoose.model('TeamMember');

    await TeamMember.deleteMany({ team: teamId });
    const deleted = await Team.deleteOne({ githubId: teamId });
    if (deleted.deletedCount === 0) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    return true;
  }

  async getLastUpdatedAt(org?: string): Promise<Date> {
    const Team = mongoose.model('Member');
    const team = await Team.findOne(org ? { org } : {}).sort({ updatedAt: -1 });
    return team?.updatedAt || new Date(0);
  }

  async getMemberByLogin(login: string) {
    const Member = mongoose.model('Member');
    return await Member.findOne({ login })
      .select('login name url avatar_url')
      .exec();
  }

  async getAllMembers(org?: string) {
    const Member = mongoose.model('Member');
    try {
      console.log({ ...org ? { org } : {} })
      return await Member.find({
        ...org ? { org } : {}
      })
        .select('login org name url avatar_url')
        .populate({
          path: 'seat',
          select: '-_id -__v',
          options: { lean: true }
        })
        .sort({ login: 'asc' })
        .exec();
    } catch (error) {
      logger.error('Failed to get all members:', error);
      throw error;
    }
  }

  async getTeams(org?: string) {
    const Team = mongoose.model('Team');
    const Member = mongoose.model('Member');
    return await Team.find({
      ...org ? { org } : {}
    })
      .populate({
        path: 'members',
        select: 'login avatar_url',
        model: Member
      })
      .populate({
        path: 'children',
        select: 'name org slug description html_url',
        populate: {
          path: 'members',
          select: 'login avatar_url',
          model: Member
        }
      })
      .sort({ name: 'asc', 'members.login': 'asc' })
      .exec();
  }
}

export default new TeamsService();
