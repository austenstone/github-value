import { DataTypes } from 'sequelize';
import { sequelize } from '../database';

const CopilotAssignee = sequelize.define('CopilotAssignee', {
  login: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  node_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gravatar_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  html_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  followers_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  following_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gists_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  starred_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subscriptions_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  organizations_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  repos_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  events_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  received_events_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  site_admin: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
}, {
  timestamps: false,
});

const CopilotAssigningTeam = sequelize.define('CopilotAssigningTeam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  node_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  html_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  privacy: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notification_setting: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  permission: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  members_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  repositories_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: false,
});

const CopilotSeat = sequelize.define('CopilotSeat', {
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  pending_cancellation_date: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_activity_editor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  plan_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    references: {
      model: CopilotAssignee,
      key: 'id',
    }
  },
  assigningTeamId: {
    type: DataTypes.INTEGER,
    references: {
      model: CopilotAssigningTeam,
      key: 'id',
    },
  },
}, {
  timestamps: false,
});

CopilotSeat.belongsTo(CopilotAssignee, { foreignKey: 'assigneeId', as: 'assignee' });
CopilotSeat.belongsTo(CopilotAssigningTeam, { foreignKey: 'assigningTeamId', as: 'assigning_team' });

async function insertSeats(data: any[]) {
  for (const seat of data) {
    const assignee = await CopilotAssignee.findOrCreate({
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

    const assigningTeam = seat.assigning_team ? await CopilotAssigningTeam.findOrCreate({
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

    await CopilotSeat.create({
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
}

export { CopilotAssignee, CopilotAssigningTeam, CopilotSeat, insertSeats };