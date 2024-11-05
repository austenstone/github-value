import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

class Survey extends Model {
  public id!: number;
  public dateTime!: Date;
  public userId!: number;
  public usedCopilot!: boolean;
  public percentTimeSaved!: number;
  public timeUsedFor!: string;
  public owner!: string;
  public repo!: string;
  public prNumber!: number;
}

Survey.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  usedCopilot: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  percentTimeSaved: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  timeUsedFor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  repo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  sequelize,
  modelName: 'Survey',
});

export { Survey };