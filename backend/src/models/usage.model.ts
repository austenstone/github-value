import { DataTypes, Model, Sequelize } from 'sequelize';
import logger from '../services/logger.js';
import { Endpoints } from '@octokit/types';

type UsageType = {
  org: string;
  team?: string;
  day: string;
  totalSuggestionsCount: number;
  totalAcceptancesCount: number;
  totalLinesSuggested: number;
  totalLinesAccepted: number;
  totalActiveUsers: number;
  totalChatAcceptances: number;
  totalChatTurns: number;
  totalActiveChatUsers: number;
}

type UsageBreakdownType = {
  id?: number;
  usage_day: string;
  language: string;
  editor: string;
  suggestionsCount: number;
  acceptancesCount: number;
  linesSuggested: number;
  linesAccepted: number;
  activeUsers: number;
}

class Usage extends Model<UsageType> {
  declare org: string;
  declare team: string;
  declare day: string;
  declare totalSuggestionsCount: number;
  declare totalAcceptancesCount: number;
  declare totalLinesSuggested: number;
  declare totalLinesAccepted: number;
  declare totalActiveUsers: number;
  declare totalChatAcceptances: number;
  declare totalChatTurns: number;
  declare totalActiveChatUsers: number;

  static initModel(sequelize: Sequelize) {
    Usage.init({
      org: DataTypes.STRING,
      team: DataTypes.STRING,
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
      sequelize,
      modelName: 'Usage',
      timestamps: false,
    });

    UsageBreakdown.initModel(sequelize);
  }
}

class UsageBreakdown extends Model<UsageBreakdownType> {
  declare id: number;
  declare usage_day: string;
  declare language: string;
  declare editor: string;
  declare suggestionsCount: number;
  declare acceptancesCount: number;
  declare linesSuggested: number;
  declare linesAccepted: number;
  declare activeUsers: number;

  static initModel(sequelize: Sequelize) {
    UsageBreakdown.init({
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
      sequelize,
      modelName: 'UsageBreakdown',
      timestamps: false,
    });

    // Set up associations
    Usage.hasMany(UsageBreakdown, { foreignKey: 'usage_day' });
    UsageBreakdown.belongsTo(Usage, { foreignKey: 'usage_day' });
  }
}

async function insertUsage(org: string, data: Endpoints["GET /orgs/{org}/copilot/usage"]["response"]["data"], team?: string) {
  for (const metrics of data) {
    const [createdMetrics, created] = await Usage.findOrCreate({
      where: { day: metrics.day },
      defaults: {
        org,
        ...team ? { team } : undefined,
        totalSuggestionsCount: metrics.total_suggestions_count || 0,
        totalAcceptancesCount: metrics.total_acceptances_count || 0,
        totalLinesSuggested: metrics.total_lines_suggested || 0,
        totalLinesAccepted: metrics.total_lines_accepted || 0,
        totalActiveUsers: metrics.total_active_users || 0,
        totalChatAcceptances: metrics.total_chat_acceptances || 0,
        totalChatTurns: metrics.total_chat_turns || 0,
        totalActiveChatUsers: metrics.total_active_chat_users || 0,
        day: metrics.day,
      }
    });

    if (!created) {
      logger.debug(`Usage for ${metrics.day} already exist`);

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
      logger.warn(`No breakdown data for ${metrics.day}. Skipping...`);
      continue;
    }
    for (const breakdown of metrics.breakdown) {
      await UsageBreakdown.create({
        usage_day: createdMetrics.dataValues.day,
        language: breakdown.language || 'unknown',
        editor: breakdown.editor || 'unknown',
        suggestionsCount: breakdown.suggestions_count || 0,
        acceptancesCount: breakdown.acceptances_count || 0,
        linesSuggested: breakdown.lines_suggested || 0,
        linesAccepted: breakdown.lines_accepted || 0,
        activeUsers: breakdown.active_users || 0,
      });
    }
  }
}

export { Usage, UsageBreakdown, insertUsage };