import { Member, Team, TeamMemberAssociation } from "../models/teams.model.js";
import { Endpoints } from "@octokit/types";

class TeamsService {
  async updateTeams(org: string, teams: Endpoints["GET /orgs/{org}/teams"]["response"]["data"]) {
    // First pass: Create all teams without parent relationships
    for (const team of teams) {
      await Team.upsert({
        org,
        team: team.slug,
        id: team.id,
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
      });
    }

    // Second pass: Update parent relationships
    for (const team of teams) {
      if (team.parent?.id) {
        await Team.update(
          { parent_id: team.parent.id },
          { where: { id: team.id } }
        );
      }
    }

    await Team.upsert({
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
      id: -1
    });
  }

  async updateMembers(org: string, members: Endpoints["GET /orgs/{org}/teams/{team_slug}/members"]["response"]["data"], teamId?: number) {
    return Promise.all(members.map(async member => {
      const [dbMember] = await Member.upsert({
        org,
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

      if (teamId) {
        await this.addMemberToTeam(dbMember.id, teamId);
      }
    }));
  }

  async addMemberToTeam(teamId: number, memberId: number) {
    return TeamMemberAssociation.upsert({
      TeamId: teamId,
      MemberId: memberId
    });
  }

  async deleteMemberFromTeam(teamId: number, memberId: number) {
    const team = await Team.findByPk(teamId);
    const member = await Member.findByPk(memberId);
    if (!team) throw new Error(`Team with ID ${teamId} not found`)
    if (!member) throw new Error(`Member with ID ${memberId} not found`)

    const deleted = await TeamMemberAssociation.destroy({
      where: { TeamId: teamId, MemberId: memberId }
    });
    if (deleted === 0) {
      throw new Error(`Member ${memberId} is not part of team ${teamId}`);
    }

    return true;
  };

  async deleteMember(memberId: number) {
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error(`Member with ID ${memberId} not found`);
    }

    await TeamMemberAssociation.destroy({
      where: {
        MemberId: memberId
      }
    });

    await Member.destroy({
      where: {
        id: memberId
      }
    });

    return true;
  };

  async deleteTeam(teamId: number) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    await TeamMemberAssociation.destroy({
      where: {
        TeamId: teamId
      }
    });

    await Team.destroy({
      where: {
        id: teamId
      }
    });

    return true;
  }

  async getLastUpdatedAt() {
    const team = await Team.findOne({
      order: [
        ['updatedAt', 'DESC']
      ]
    });
    if (!team?.updatedAt) {
      return new Date(0);
    }
    return team.updatedAt;
  }
}

export default new TeamsService();