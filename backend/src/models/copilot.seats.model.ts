import { Model, DataTypes, Sequelize, CreationOptional } from 'sequelize';
import { Member, Team } from './teams.model.js';

type SeatType = {
  id?: number;
  org: string;
  team?: string;
  queryAt: Date;
  created_at: string | null;
  updated_at: string | null;
  pending_cancellation_date: string | null;
  last_activity_at: string | null;
  last_activity_editor: string | null;
  plan_type: string;
  assignee_id: number;
  assigning_team_id: number | null;
};

class Seat extends Model<SeatType> {
  declare id: number;
  declare org: string;
  declare team: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare pending_cancellation_date: Date | null;
  declare last_activity_at: Date;
  declare last_activity_editor: string;
  declare plan_type: string;
  declare assignee_id: number;
  declare assigning_team_id: number;
  declare queryAt: Date;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  static initModel(sequelize: Sequelize) {
    Seat.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      queryAt: DataTypes.DATE,
      org: DataTypes.STRING,
      team: DataTypes.STRING,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE,
      pending_cancellation_date: DataTypes.DATE,
      last_activity_at: DataTypes.DATE,
      last_activity_editor: DataTypes.STRING,
      plan_type: DataTypes.STRING,
      assignee_id: {
        type: DataTypes.INTEGER,
      },
      assigning_team_id: {
        type: DataTypes.INTEGER,
      }
    }, {
      sequelize,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['assignee_id', 'last_activity_at']
        }
      ]
    });
    
    Seat.belongsTo(Member, { 
      as: 'assignee', 
      foreignKey: 'assignee_id' 
    });
    Seat.belongsTo(Team, { 
      as: 'assigning_team', 
      foreignKey: 'assigning_team_id' 
    });
    Member.hasMany(Seat, { 
      as: 'activity',
      foreignKey: 'assignee_id' 
    });
    Team.hasMany(Seat, { 
      as: 'activity',
      foreignKey: 'assigning_team_id' 
    });
  }
}

export { Seat };