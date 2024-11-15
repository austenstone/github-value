import { Model, DataTypes, BaseError } from 'sequelize';
import { sequelize } from '../database.ts';
import { CopilotMetrics } from './metrics.model.interfaces.ts';
import logger from '../services/logger.ts';

export class MetricDaily extends Model {
  public date!: Date;
  public total_active_users!: number;
  public total_engaged_users!: number;
  copilot_ide_code_completions?: MetricIdeCompletions;
  copilot_ide_chat?: MetricIdeChatMetrics;
  copilot_dotcom_chat?: MetricDotcomChatMetrics;
  copilot_dotcom_pull_requests?: MetricPrMetrics;
}
export class MetricIdeCompletions extends Model {
  public id!: number;
  public total_engaged_users!: number;
  public total_code_acceptances!: number;
  public total_code_suggestions!: number;
  public total_code_lines_accepted!: number;
  public total_code_lines_suggested!: number;
  public daily_metric_id!: Date;
  editors?: MetricEditor[];
}
export class MetricEditor extends Model {
  public id!: number;
  public name!: string;
  public total_engaged_users!: number;
  public total_code_acceptances!: number;
  public total_code_suggestions!: number;
  public total_code_lines_accepted!: number;
  public total_code_lines_suggested!: number;
  public ide_completion_id!: number;
  models?: MetricModelStats[];
}
export class MetricModelStats extends Model {
  public id!: number;
  public name!: string;
  public is_custom_model!: boolean;
  public total_engaged_users!: number;
  public total_code_acceptances!: number;
  public total_code_suggestions!: number;
  public total_code_lines_accepted!: number;
  public total_code_lines_suggested!: number;
  public editor_id!: number;
  languages?: MetricLanguageStats[];
}
export class MetricLanguageStats extends Model {
  public id!: number;
  public name!: string;
  public total_engaged_users!: number;
  public total_code_acceptances!: number;
  public total_code_suggestions!: number;
  public total_code_lines_accepted!: number;
  public total_code_lines_suggested!: number;
  public model_stat_id!: number;
}
export class MetricPrRepository extends Model {
  public id!: number;
  public name!: string;
  public total_engaged_users!: number;
  public total_pr_summaries_created!: number;
  models?: MetricPrModelStats[];
}
export class MetricPrModelStats extends Model {
  public id!: number;
  public name!: string;
  public is_custom_model!: boolean;
  public total_engaged_users!: number;
  public total_pr_summaries_created!: number;
}
export class MetricPrMetrics extends Model {
  public id!: number;
  public total_engaged_users!: number;
  public total_pr_summaries_created!: number;
  repositories?: MetricPrRepository[];
}
export class MetricDotcomChatMetrics extends Model {
  public id!: number;
  public total_engaged_users!: number;
  public total_chats!: number;
  models?: MetricDotcomChatModelStats[];
}
export class MetricDotcomChatModelStats extends Model {
  public id!: number;
  public name!: string;
  public is_custom_model!: boolean;
  public total_engaged_users!: number;
  public total_chats!: number;
}
export class MetricIdeChatMetrics extends Model {
  public id!: number;
  public total_engaged_users!: number;
  public total_chats!: number;
  public total_chat_copy_events!: number;
  public total_chat_insertion_events!: number;
  editors?: MetricIdeChatEditor[];
}
export class MetricIdeChatEditor extends Model {
  public id!: number;
  public name!: string;
  public total_engaged_users!: number;
  public total_chats!: number;
  public total_chat_copy_events!: number;
  public total_chat_insertion_events!: number;
  models?: MetricIdeChatModelStats[];
}
export class MetricIdeChatModelStats extends Model {
  public id!: number;
  public name!: string;
  public is_custom_model!: boolean;
  public total_engaged_users!: number;
  public total_chats!: number;
  public total_chat_copy_events!: number;
  public total_chat_insertion_events!: number;
}
MetricDaily.init({
  date: {
    type: DataTypes.DATE,
    primaryKey: true,
  },
  total_active_users: DataTypes.INTEGER,
  total_engaged_users: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});

MetricIdeChatMetrics.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_engaged_users: DataTypes.INTEGER,
  total_chats: DataTypes.INTEGER,
  total_chat_copy_events: DataTypes.INTEGER,
  total_chat_insertion_events: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricIdeChatEditor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  total_engaged_users: DataTypes.INTEGER,
  total_chats: DataTypes.INTEGER,
  total_chat_copy_events: DataTypes.INTEGER,
  total_chat_insertion_events: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricIdeChatModelStats.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  is_custom_model: DataTypes.BOOLEAN,
  total_engaged_users: DataTypes.INTEGER,
  total_chats: DataTypes.INTEGER,
  total_chat_copy_events: DataTypes.INTEGER,
  total_chat_insertion_events: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});

MetricIdeCompletions.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_engaged_users: DataTypes.INTEGER,
  total_code_acceptances: DataTypes.INTEGER,
  total_code_suggestions: DataTypes.INTEGER,
  total_code_lines_accepted: DataTypes.INTEGER,
  total_code_lines_suggested: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricEditor.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  total_engaged_users: DataTypes.INTEGER,
  total_code_acceptances: DataTypes.INTEGER,
  total_code_suggestions: DataTypes.INTEGER,
  total_code_lines_accepted: DataTypes.INTEGER,
  total_code_lines_suggested: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricModelStats.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  is_custom_model: DataTypes.BOOLEAN,
  total_engaged_users: DataTypes.INTEGER,
  total_code_acceptances: DataTypes.INTEGER,
  total_code_suggestions: DataTypes.INTEGER,
  total_code_lines_accepted: DataTypes.INTEGER,
  total_code_lines_suggested: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricLanguageStats.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  total_engaged_users: DataTypes.INTEGER,
  total_code_acceptances: DataTypes.INTEGER,
  total_code_suggestions: DataTypes.INTEGER,
  total_code_lines_accepted: DataTypes.INTEGER,
  total_code_lines_suggested: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});

MetricPrMetrics.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_engaged_users: DataTypes.INTEGER,
  total_pr_summaries_created: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricPrRepository.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  total_engaged_users: DataTypes.INTEGER,
  total_pr_summaries_created: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricPrModelStats.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  is_custom_model: DataTypes.BOOLEAN,
  total_engaged_users: DataTypes.INTEGER,
  total_pr_summaries_created: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});

MetricDotcomChatMetrics.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_engaged_users: DataTypes.INTEGER,
  total_chats: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricDotcomChatModelStats.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  is_custom_model: DataTypes.BOOLEAN,
  total_engaged_users: DataTypes.INTEGER,
  total_chats: DataTypes.INTEGER
}, {
  sequelize,
  timestamps: false
});
MetricDaily.hasOne(MetricIdeCompletions, {
  as: 'copilot_ide_code_completions', foreignKey: 'daily_metric_id',
  sourceKey: 'date'
});
MetricDaily.hasOne(MetricPrMetrics, {
  as: 'copilot_dotcom_pull_requests',
  foreignKey: 'daily_metric_id'
});
MetricDaily.hasOne(MetricDotcomChatMetrics, {
  as: 'copilot_dotcom_chat',
  foreignKey: 'daily_metric_id'
});
MetricDaily.hasOne(MetricIdeChatMetrics, {
  as: 'copilot_ide_chat',
  foreignKey: 'daily_metric_id'
});

MetricIdeChatMetrics.belongsTo(MetricDaily, {
  foreignKey: 'daily_metric_id'
});
MetricIdeChatMetrics.hasMany(MetricIdeChatEditor, {
  as: 'editors',
  foreignKey: 'chat_metrics_id'
});
MetricIdeChatEditor.belongsTo(MetricIdeChatMetrics, {
  foreignKey: 'chat_metrics_id'
});
MetricIdeChatEditor.hasMany(MetricIdeChatModelStats, {
  as: 'models',
  foreignKey: 'editor_id'
});
MetricIdeChatModelStats.belongsTo(MetricIdeChatEditor, {
  foreignKey: 'editor_id'
});

MetricIdeCompletions.belongsTo(MetricDaily, {
  as: 'DailyMetric',
  foreignKey: 'daily_metric_id',
  targetKey: 'date'
});
MetricIdeCompletions.hasMany(MetricEditor, {
  as: 'editors', foreignKey: 'ide_completion_id'
});
MetricEditor.belongsTo(MetricIdeCompletions, {
  as: 'copilot_ide_code_completions',
  foreignKey: 'ide_completion_id'
});
MetricEditor.hasMany(MetricModelStats, {
  as: 'models', foreignKey: 'editor_id'
});
MetricModelStats.belongsTo(MetricEditor, {
  as: 'editor',
  foreignKey: 'editor_id'
});
MetricModelStats.hasMany(MetricLanguageStats, {
  as: 'languages',
  foreignKey: 'model_stat_id'
});
MetricLanguageStats.belongsTo(MetricModelStats, {
  as: 'model',
  foreignKey: 'model_stat_id'
});

MetricPrMetrics.belongsTo(MetricDaily, {
  foreignKey: 'daily_metric_id',
  targetKey: 'date'
});
MetricPrMetrics.hasMany(MetricPrRepository, {
  as: 'repositories',
  foreignKey: 'pr_metrics_id'
});
MetricPrRepository.belongsTo(MetricPrMetrics, {
  foreignKey: 'pr_metrics_id'
});
MetricPrRepository.hasMany(MetricPrModelStats, {
  as: 'models',
  foreignKey: 'repository_id'
});
MetricPrModelStats.belongsTo(MetricPrRepository, {
  foreignKey: 'repository_id'
});

MetricDotcomChatMetrics.belongsTo(MetricDaily, {
  foreignKey: 'daily_metric_id',
  targetKey: 'date'
});
MetricDotcomChatMetrics.hasMany(MetricDotcomChatModelStats, {
  as: 'models',
  foreignKey: 'chat_metrics_id'
});
MetricDotcomChatModelStats.belongsTo(MetricDotcomChatMetrics, {
  foreignKey: 'chat_metrics_id'
});

export async function insertMetrics(data: CopilotMetrics[]) {
  for (const day of data) {
    const parts = day.date.split('-').map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12));
    let metric: MetricDaily;
    try {
      metric = await MetricDaily.create({
        date: date,
        total_active_users: day.total_active_users,
        total_engaged_users: day.total_engaged_users,
      });
      logger.info(`Metrics for ${day.date} inserted successfully! ✅`);
    } catch (error) {
      if (error instanceof BaseError && error.name === 'SequelizeUniqueConstraintError') {
        logger.info(`Metrics for ${day.date} already exist. Skipping... ⏭️`);
      } else {
        logger.error(error);
      }
      continue;
    }

    if (day.copilot_ide_chat) {
      const chatTotals = {
        chats: 0,
        copyEvents: 0,
        insertionEvents: 0
      };

      const chatMetrics = await MetricIdeChatMetrics.create({
        daily_metric_id: metric.date,
        total_engaged_users: day.copilot_ide_chat.total_engaged_users
      });

      for (const editor of day.copilot_ide_chat.editors) {
        const chatTotalsEditor = {
          chats: 0,
          copyEvents: 0,
          insertionEvents: 0
        };
        const editorRecord = await MetricIdeChatEditor.create({
          chat_metrics_id: chatMetrics.id,
          name: editor.name,
          total_engaged_users: editor.total_engaged_users
        });

        await Promise.all(editor.models.map(model => {
          if ('total_chats' in model) {
            chatTotals.chats += model.total_chats || 0;
            chatTotals.copyEvents += model.total_chat_copy_events || 0;
            chatTotals.insertionEvents += model.total_chat_insertion_events || 0;

            return MetricIdeChatModelStats.create({
              editor_id: editorRecord.id,
              name: model.name,
              is_custom_model: model.is_custom_model,
              total_engaged_users: model.total_engaged_users,
              total_chats: model.total_chats,
              total_chat_copy_events: model.total_chat_copy_events,
              total_chat_insertion_events: model.total_chat_insertion_events
            })
          }
        }));

        await editorRecord.update({
          total_chats: chatTotalsEditor.chats,
          total_chat_copy_events: chatTotalsEditor.copyEvents,
          total_chat_insertion_events: chatTotalsEditor.insertionEvents
        });
      }

      await chatMetrics.update({
        total_chats: chatTotals.chats,
        total_chat_copy_events: chatTotals.copyEvents,
        total_chat_insertion_events: chatTotals.insertionEvents
      });
    }

    if (day.copilot_ide_code_completions) {
      const completions = await MetricIdeCompletions.create({
        total_engaged_users: day.copilot_ide_code_completions.total_engaged_users,
        daily_metric_id: metric.date,
        total_code_acceptances: 0,
        total_code_suggestions: 0,
        total_code_lines_accepted: 0,
        total_code_lines_suggested: 0
      });

      const dailyTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

      for (const editor of day.copilot_ide_code_completions.editors) {
        const editorRecord = await MetricEditor.create({
          name: editor.name,
          total_engaged_users: editor.total_engaged_users,
          ide_completion_id: completions.id,
          total_code_acceptances: 0,
          total_code_suggestions: 0,
          total_code_lines_accepted: 0,
          total_code_lines_suggested: 0
        });

        const editorTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

        for (const model of editor.models) {
          const modelRecord = await MetricModelStats.create({
            name: model.name,
            is_custom_model: model.is_custom_model,
            total_engaged_users: model.total_engaged_users,
            editor_id: editorRecord.id,
            total_code_acceptances: 0,
            total_code_suggestions: 0,
            total_code_lines_accepted: 0,
            total_code_lines_suggested: 0
          });

          const modelTotals = { acceptances: 0, suggestions: 0, linesAccepted: 0, linesSuggested: 0 };

          if ('languages' in model) {
            for (const lang of model.languages) {
              await MetricLanguageStats.create({
                name: lang.name,
                total_engaged_users: lang.total_engaged_users,
                total_code_acceptances: lang.total_code_acceptances,
                total_code_suggestions: lang.total_code_suggestions,
                total_code_lines_accepted: lang.total_code_lines_accepted,
                total_code_lines_suggested: lang.total_code_lines_suggested,
                model_stat_id: modelRecord.id
              });

              modelTotals.acceptances += lang.total_code_acceptances || 0;
              modelTotals.suggestions += lang.total_code_suggestions || 0;
              modelTotals.linesAccepted += lang.total_code_lines_accepted || 0;
              modelTotals.linesSuggested += lang.total_code_lines_suggested || 0;
            }
          }

          await modelRecord.update({
            total_code_acceptances: modelTotals.acceptances,
            total_code_suggestions: modelTotals.suggestions,
            total_code_lines_accepted: modelTotals.linesAccepted,
            total_code_lines_suggested: modelTotals.linesSuggested
          });

          editorTotals.acceptances += modelTotals.acceptances;
          editorTotals.suggestions += modelTotals.suggestions;
          editorTotals.linesAccepted += modelTotals.linesAccepted;
          editorTotals.linesSuggested += modelTotals.linesSuggested;
        }

        await editorRecord.update({
          total_code_acceptances: editorTotals.acceptances,
          total_code_suggestions: editorTotals.suggestions,
          total_code_lines_accepted: editorTotals.linesAccepted,
          total_code_lines_suggested: editorTotals.linesSuggested
        });

        dailyTotals.acceptances += editorTotals.acceptances;
        dailyTotals.suggestions += editorTotals.suggestions;
        dailyTotals.linesAccepted += editorTotals.linesAccepted;
        dailyTotals.linesSuggested += editorTotals.linesSuggested;
      }

      await completions.update({
        total_code_acceptances: dailyTotals.acceptances,
        total_code_suggestions: dailyTotals.suggestions,
        total_code_lines_accepted: dailyTotals.linesAccepted,
        total_code_lines_suggested: dailyTotals.linesSuggested
      });
    }

    if (day.copilot_dotcom_pull_requests) {
      let totalPrSummaries = 0;
      const prMetrics = await MetricPrMetrics.create({
        daily_metric_id: metric.date,
        total_engaged_users: day.copilot_dotcom_pull_requests.total_engaged_users
      });

      if (day.copilot_dotcom_pull_requests.repositories) {
        for (const repo of day.copilot_dotcom_pull_requests.repositories) {
          let totalPrSummariesRepo = 0;
          const repository = await MetricPrRepository.create({
            pr_metrics_id: prMetrics.id,
            name: repo.name,
            total_engaged_users: repo.total_engaged_users
          });

          await Promise.all(repo.models.map(model => {
            totalPrSummaries += model.total_pr_summaries_created || 0; totalPrSummariesRepo += model.total_pr_summaries_created || 0;

            MetricPrModelStats.create({
              repository_id: repository.id,
              name: model.name,
              is_custom_model: model.is_custom_model,
              total_engaged_users: model.total_engaged_users,
              total_pr_summaries_created: model.total_pr_summaries_created
            })
          }));
          repository.update({
            total_pr_summaries_created: totalPrSummariesRepo
          });
        }
      }

      await prMetrics.update({
        total_pr_summaries_created: totalPrSummaries
      });
    }

    if (day.copilot_dotcom_chat) {
      let totalChats = 0;
      const chatMetrics = await MetricDotcomChatMetrics.create({
        daily_metric_id: metric.date,
        total_engaged_users: day.copilot_dotcom_chat.total_engaged_users
      });

      await Promise.all(day.copilot_dotcom_chat.models.map(model => {
        totalChats += model.total_chats || 0; MetricDotcomChatModelStats.create({
          chat_metrics_id: chatMetrics.id,
          name: model.name,
          is_custom_model: model.is_custom_model,
          total_engaged_users: model.total_engaged_users,
          total_chats: model.total_chats
        })
      }));

      await chatMetrics.update({
        total_chats: totalChats
      });
    }
  }
}