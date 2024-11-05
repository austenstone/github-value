import { DataTypes } from 'sequelize';
import { sequelize } from '../database';

const Assignee = sequelize.define('Assignee', {
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
  tableName: 'assignees',
  timestamps: false,
});

const AssigningTeam = sequelize.define('AssigningTeam', {
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
  tableName: 'assigning_teams',
  timestamps: false,
});

const Seat = sequelize.define('Seat', {
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
      model: Assignee,
      key: 'id',
    }
  },
  assigningTeamId: {
    type: DataTypes.INTEGER,
    references: {
      model: AssigningTeam,
      key: 'id',
    },
  },
}, {
  tableName: 'seats',
  timestamps: false,
});

Seat.belongsTo(Assignee, { foreignKey: 'assigneeId', as: 'assignee' });
Seat.belongsTo(AssigningTeam, { foreignKey: 'assigningTeamId', as: 'assigning_team' });

export { Assignee, AssigningTeam, Seat };