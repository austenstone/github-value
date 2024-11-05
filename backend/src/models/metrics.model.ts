import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

const Metrics = sequelize.define('Metrics', {
  day: {
    type: DataTypes.DATEONLY,
    primaryKey: true,
    allowNull: false,
  },
  totalSuggestionsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalAcceptancesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalLinesSuggested: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalLinesAccepted: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalActiveUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalChatAcceptances: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalChatTurns: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalActiveChatUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'metrics',
  timestamps: false,
});

const Breakdown = sequelize.define('Breakdown', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  metricsDay: {
    type: DataTypes.DATEONLY,
    references: {
      model: Metrics,
      key: 'day',
    },
  },
  language: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  editor: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  suggestionsCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  acceptancesCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  linesSuggested: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  linesAccepted: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  activeUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'breakdown',
  timestamps: false,
});

Metrics.hasMany(Breakdown, { foreignKey: 'metricsDay' });
Breakdown.belongsTo(Metrics, { foreignKey: 'metricsDay' });

export { Metrics, Breakdown };