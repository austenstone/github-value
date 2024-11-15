import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database';

class Team extends Model {
  public id!: number;
  public node_id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public privacy!: string;
  public notification_setting!: string;
  public permission!: string;
  public url!: string;
  public html_url!: string;
  public members_url!: string;
  public repositories_url!: string;
}

class Member extends Model {
  public login!: string;
  public id!: number;
  public node_id!: string;
  public avatar_url!: string;
  public gravatar_id!: string | null;
  public url!: string;
  public html_url!: string;
  public followers_url!: string;
  public following_url!: string;
  public gists_url!: string;
  public starred_url!: string;
  public subscriptions_url!: string;
  public organizations_url!: string;
  public repos_url!: string;
  public events_url!: string;
  public received_events_url!: string;
  public type!: string;
  public site_admin!: boolean;
  public name!: string | null;
  public email!: string | null;
  public starred_at?: string;
  public user_view_type?: string;
}

class TeamMemberAssociation extends Model {
  public TeamId!: number;
  public MemberId!: number;
}

Team.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  node_id: DataTypes.STRING,
  name: DataTypes.STRING,
  slug: DataTypes.STRING,
  description: DataTypes.STRING,
  privacy: DataTypes.STRING,
  notification_setting: DataTypes.STRING,
  permission: DataTypes.STRING,
  url: DataTypes.STRING,
  html_url: DataTypes.STRING,
  members_url: DataTypes.STRING,
  repositories_url: DataTypes.STRING,
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  timestamps: false
});

Member.init({
  login: DataTypes.STRING,
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  node_id: DataTypes.STRING,
  avatar_url: DataTypes.STRING,
  gravatar_id: DataTypes.STRING,
  url: DataTypes.STRING,
  html_url: DataTypes.STRING,
  followers_url: DataTypes.STRING,
  following_url: DataTypes.STRING,
  gists_url: DataTypes.STRING,
  starred_url: DataTypes.STRING,
  subscriptions_url: DataTypes.STRING,
  organizations_url: DataTypes.STRING,
  repos_url: DataTypes.STRING,
  events_url: DataTypes.STRING,
  received_events_url: DataTypes.STRING,
  type: DataTypes.STRING,
  site_admin: DataTypes.BOOLEAN,
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  starred_at: DataTypes.STRING,
  user_view_type: DataTypes.STRING
}, {
  sequelize,
  timestamps: false
});

TeamMemberAssociation.init({
  TeamId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Team,
      key: 'id'
    }
  },
  MemberId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Member,
      key: 'id'
    }
  }
}, {
  sequelize,
  timestamps: false
});

Team.belongsToMany(Member, { 
  through: TeamMemberAssociation,
  foreignKey: 'TeamId',
  otherKey: 'MemberId',
  as: 'members'
});
Member.belongsToMany(Team, { 
  through: TeamMemberAssociation,
  foreignKey: 'MemberId',
  otherKey: 'TeamId',
  as: 'teams'
});
// Parent-child relationship for nested teams 👨‍👦
Team.belongsTo(Team, { as: 'parent', foreignKey: 'parent_id' });
Team.hasMany(Team, { as: 'children', foreignKey: 'parent_id' });

export {
  Team,
  Member,
  TeamMemberAssociation
};
