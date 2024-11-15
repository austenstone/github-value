import { DataTypes } from 'sequelize';
import { sequelize } from '../database';
import logger from '../services/logger';
import { Endpoints } from '@octokit/types';

const Usage = sequelize.define('Usage', {
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
  timestamps: false,
});

const UsageBreakdown = sequelize.define('UsageBreakdown', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usage_day: {
    type: DataTypes.DATEONLY,
    references: {
      model: Usage,
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
  timestamps: false,
});

Usage.hasMany(UsageBreakdown, { foreignKey: 'usage_day' });
UsageBreakdown.belongsTo(Usage, { foreignKey: 'usage_day' });

async function insertUsage(data: Endpoints["GET /orgs/{org}/copilot/usage"]["response"]["data"]) {
  for (const metrics of data) {
    const [createdMetrics, created] = await Usage.findOrCreate({
      where: { day: metrics.day },
      defaults: {
        totalSuggestionsCount: metrics.total_suggestions_count,
        totalAcceptancesCount: metrics.total_acceptances_count,
        totalLinesSuggested: metrics.total_lines_suggested,
        totalLinesAccepted: metrics.total_lines_accepted,
        totalActiveUsers: metrics.total_active_users,
        totalChatAcceptances: metrics.total_chat_acceptances,
        totalChatTurns: metrics.total_chat_turns,
        totalActiveChatUsers: metrics.total_active_chat_users,
      }
    });

    if (!created) {
      logger.info(`Usage for ${metrics.day} already exist. Updating... ✏️`);

      await createdMetrics.update({
        totalSuggestionsCount: metrics.total_suggestions_count,
        totalAcceptancesCount: metrics.total_acceptances_count,
        totalLinesSuggested: metrics.total_lines_suggested,
        totalLinesAccepted: metrics.total_lines_accepted,
        totalActiveUsers: metrics.total_active_users,
        totalChatAcceptances: metrics.total_chat_acceptances,
        totalChatTurns: metrics.total_chat_turns,
        totalActiveChatUsers: metrics.total_active_chat_users,
      });

      await UsageBreakdown.destroy({ where: { usage_day: metrics.day } });
    }

    if (!metrics.breakdown) {
      logger.info(`No breakdown data for ${metrics.day}. Skipping...`);
      continue;
    }
    for (const breakdown of metrics.breakdown) {
      await UsageBreakdown.create({
        usage_day: createdMetrics.dataValues.day,
        language: breakdown.language,
        editor: breakdown.editor,
        suggestionsCount: breakdown.suggestions_count,
        acceptancesCount: breakdown.acceptances_count,
        linesSuggested: breakdown.lines_suggested,
        linesAccepted: breakdown.lines_accepted,
        activeUsers: breakdown.active_users,
      });
    }
  }
}

export { Usage, UsageBreakdown, insertUsage };