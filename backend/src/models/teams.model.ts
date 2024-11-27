import { Model, DataTypes, Sequelize, CreationOptional } from 'sequelize';
import { Seat } from './copilot.seats.model.js';
import { components } from "@octokit/openapi-types";

export type TeamType = Omit<components["schemas"]["team"], 'parent'> & {
  org: string;
  team?: string;
  parent_id?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  parent?: TeamType | null;
};

class Team extends Model<NonNullable<TeamType>> {
  declare org: string;
  declare team: string;
  declare id: number;
  declare node_id: string;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare privacy: string;
  declare notification_setting: string;
  declare permission: string;
  declare url: string;
  declare html_url: string;
  declare members_url: string;
  declare repositories_url: string;
  declare parent_id: number | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Team.init({
      org: DataTypes.STRING,
      team: DataTypes.STRING,
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
        allowNull: true,
        references: {
          model: Team,
          key: 'id'
        }
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    }, {
      sequelize
    });
    
    Member.initModel(sequelize);
    TeamMemberAssociation.initModel(sequelize);

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
    Team.belongsTo(Team, { as: 'parent', foreignKey: 'parent_id' });
    Team.hasMany(Team, { as: 'children', foreignKey: 'parent_id' });
  }
}

// IMember
type MemberType = {
  org: string;
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string | null;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string | null;
  email: string | null;
  starred_at?: string;
  user_view_type?: string;
  createdAt?: Date;
  updatedAt?: Date;
  activity?: Seat[];
};

class Member extends Model<MemberType> {
  declare org: string;
  declare login: string;
  declare id: number;
  declare node_id: string;
  declare avatar_url: string;
  declare gravatar_id: string | null;
  declare url: string;
  declare html_url: string;
  declare followers_url: string;
  declare following_url: string;
  declare gists_url: string;
  declare starred_url: string;
  declare subscriptions_url: string;
  declare organizations_url: string;
  declare repos_url: string;
  declare events_url: string;
  declare received_events_url: string;
  declare type: string;
  declare site_admin: boolean;
  declare name: string | null;
  declare email: string | null;
  declare starred_at?: string;
  declare user_view_type?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare activity: Seat[];

  static initModel(sequelize: Sequelize) {
    Member.init({
      org: DataTypes.STRING,
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
      user_view_type: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    }, {
      sequelize,
    });
  }
}

type TeamMemberAssociationType = {
  TeamId: number;
  MemberId: number;
};

class TeamMemberAssociation extends Model<TeamMemberAssociationType> {
  declare TeamId: number;
  declare MemberId: number;

  static initModel(sequelize: Sequelize) {
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
  }
}

export {
  Team,
  Member,
  TeamMemberAssociation
};
