import { Model, DataTypes, Sequelize } from 'sequelize';

type MetricDailyResponseType = {
  date: string;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions?: MetricIdeCompletionsType;
  copilot_dotcom_pull_requests?: MetricPrMetricsType;
  copilot_dotcom_chat?: MetricDotcomChatMetricsType;
  copilot_ide_chat?: MetricIdeChatMetricsType;
}

type MetricDailyType = {
  org: string;
  team?: string;
  date: Date;
  total_active_users: number;
  total_engaged_users: number;
  copilot_ide_code_completions?: MetricIdeCompletionsType;
  copilot_dotcom_pull_requests?: MetricPrMetricsType;
  copilot_dotcom_chat?: MetricDotcomChatMetricsType;
  copilot_ide_chat?: MetricIdeChatMetricsType;
}

type MetricIdeCompletionsType = {
  id?: number;
  total_engaged_users: number;
  total_code_acceptances: number;
  total_code_suggestions: number;
  total_code_lines_accepted: number;
  total_code_lines_suggested: number;
  daily_metric_id: Date;
  editors?: MetricEditorType[];
}

type MetricEditorType = {
  id?: number;
  name: string;
  total_engaged_users: number;
  total_code_acceptances: number;
  total_code_suggestions: number;
  total_code_lines_accepted: number;
  total_code_lines_suggested: number;
  ide_completion_id: number;
  models?: MetricModelStatsType[];
}

type MetricModelStatsType = {
  id?: number;
  name: string;
  is_custom_model: boolean;
  total_engaged_users: number;
  total_code_acceptances: number;
  total_code_suggestions: number;
  total_code_lines_accepted: number;
  total_code_lines_suggested: number;
  editor_id: number;
  languages?: MetricLanguageStatsType[];
}

type MetricLanguageStatsType = {
  id?: number;
  name: string;
  total_engaged_users: number;
  total_code_acceptances: number;
  total_code_suggestions: number;
  total_code_lines_accepted: number;
  total_code_lines_suggested: number;
  model_stat_id: number;
}

type MetricPrRepositoryType = {
  id?: number;
  name: string;
  total_engaged_users: number;
  total_pr_summaries_created: number;
  pr_metrics_id: number;
  models?: MetricPrModelStatsType[];
}

type MetricPrModelStatsType = {
  id?: number;
  name: string;
  is_custom_model: boolean;
  total_engaged_users: number;
  total_pr_summaries_created: number;
  repository_id: number;
}

type MetricPrMetricsType = {
  id?: number;
  total_engaged_users: number;
  total_pr_summaries_created: number;
  daily_metric_id: Date;
  repositories?: MetricPrRepositoryType[];
}

type MetricDotcomChatMetricsType = {
  id?: number;
  total_engaged_users: number;
  total_chats: number;
  daily_metric_id: Date;
  models?: MetricDotcomChatModelStatsType[];
}

type MetricDotcomChatModelStatsType = {
  id?: number;
  name: string;
  is_custom_model: boolean;
  total_engaged_users: number;
  total_chats: number;
  chat_metrics_id: number;
}

type MetricIdeChatMetricsType = {
  id?: number;
  total_engaged_users: number;
  total_chats: number;
  total_chat_copy_events: number;
  total_chat_insertion_events: number;
  daily_metric_id: Date;
  editors?: MetricIdeChatEditorType[];
}

type MetricIdeChatEditorType = {
  id?: number;
  name: string;
  total_engaged_users: number;
  total_chats: number;
  total_chat_copy_events: number;
  total_chat_insertion_events: number;
  chat_metrics_id: number;
  models?: MetricIdeChatModelStatsType[];
}

type MetricIdeChatModelStatsType = {
  id?: number;
  name: string;
  is_custom_model: boolean;
  total_engaged_users: number;
  total_chats: number;
  total_chat_copy_events: number;
  total_chat_insertion_events: number;
  editor_id: number;
}

class MetricDaily extends Model<MetricDailyType> {
  declare org: string;
  declare team: string;
  declare date: Date;
  declare total_active_users: number;
  declare total_engaged_users: number;
  declare copilot_ide_code_completions: MetricIdeCompletionsType | null;
  declare copilot_dotcom_pull_requests: MetricPrMetricsType | null;
  declare copilot_dotcom_chat: MetricDotcomChatMetricsType | null;
  declare copilot_ide_chat: MetricIdeChatMetricsType | null;

  static initModel(sequelize: Sequelize) {
    MetricDaily.init({
      org: DataTypes.STRING,
      team: DataTypes.STRING,
      date: {
        type: DataTypes.DATE,
        primaryKey: true,
      },
      total_active_users: DataTypes.INTEGER,
      total_engaged_users: DataTypes.INTEGER,
    }, {
      sequelize,
      timestamps: false
    });

    MetricIdeCompletions.initModel(sequelize);
    MetricEditor.initModel(sequelize);
    MetricModelStats.initModel(sequelize);
    MetricLanguageStats.initModel(sequelize);
    MetricPrRepository.initModel(sequelize);
    MetricPrModelStats.initModel(sequelize);
    MetricPrMetrics.initModel(sequelize);
    MetricDotcomChatMetrics.initModel(sequelize);
    MetricDotcomChatModelStats.initModel(sequelize);
    MetricIdeChatMetrics.initModel(sequelize);
    MetricIdeChatEditor.initModel(sequelize);
    MetricIdeChatModelStats.initModel(sequelize);
    
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
  }
}

class MetricIdeCompletions extends Model<MetricIdeCompletionsType> {
  declare id?: number;
  declare total_engaged_users: number;
  declare total_code_acceptances: number;
  declare total_code_suggestions: number;
  declare total_code_lines_accepted: number;
  declare total_code_lines_suggested: number;
  declare daily_metric_id: Date;

  static initModel(sequelize: Sequelize) {
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
      total_code_lines_suggested: DataTypes.INTEGER,
      daily_metric_id: DataTypes.DATE
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricEditor extends Model<MetricEditorType> {
  declare id?: number;
  declare name: string;
  declare total_engaged_users: number;
  declare total_code_acceptances: number;
  declare total_code_suggestions: number;
  declare total_code_lines_accepted: number;
  declare total_code_lines_suggested: number;
  declare ide_completion_id: number;

  static initModel(sequelize: Sequelize) {
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
      total_code_lines_suggested: DataTypes.INTEGER,
      ide_completion_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricModelStats extends Model<MetricModelStatsType> {
  declare id: number;
  declare name: string;
  declare is_custom_model: boolean;
  declare total_engaged_users: number;
  declare total_code_acceptances: number;
  declare total_code_suggestions: number;
  declare total_code_lines_accepted: number;
  declare total_code_lines_suggested: number;
  declare editor_id: number;

  static initModel(sequelize: Sequelize) {
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
      total_code_lines_suggested: DataTypes.INTEGER,
      editor_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricLanguageStats extends Model<MetricLanguageStatsType> {
  declare id: number;
  declare name: string;
  declare total_engaged_users: number;
  declare total_code_acceptances: number;
  declare total_code_suggestions: number;
  declare total_code_lines_accepted: number;
  declare total_code_lines_suggested: number;
  declare model_stat_id: number;

  static initModel(sequelize: Sequelize) {
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
      total_code_lines_suggested: DataTypes.INTEGER,
      model_stat_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricPrRepository extends Model<MetricPrRepositoryType> {
  declare id: number;
  declare name: string;
  declare total_engaged_users: number;
  declare total_pr_summaries_created: number;
  declare pr_metrics_id: number;

  static initModel(sequelize: Sequelize) {
    MetricPrRepository.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      total_engaged_users: DataTypes.INTEGER,
      total_pr_summaries_created: DataTypes.INTEGER,
      pr_metrics_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricPrModelStats extends Model<MetricPrModelStatsType> {
  declare id: number;
  declare name: string;
  declare is_custom_model: boolean;
  declare total_engaged_users: number;
  declare total_pr_summaries_created: number;
  declare repository_id: number;

  static initModel(sequelize: Sequelize) {
    MetricPrModelStats.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      is_custom_model: DataTypes.BOOLEAN,
      total_engaged_users: DataTypes.INTEGER,
      total_pr_summaries_created: DataTypes.INTEGER,
      repository_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricPrMetrics extends Model<MetricPrMetricsType> {
  declare id: number;
  declare total_engaged_users: number;
  declare total_pr_summaries_created: number;
  declare daily_metric_id: Date;

  static initModel(sequelize: Sequelize) {
    MetricPrMetrics.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      total_engaged_users: DataTypes.INTEGER,
      total_pr_summaries_created: DataTypes.INTEGER,
      daily_metric_id: DataTypes.DATE
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricDotcomChatMetrics extends Model<MetricDotcomChatMetricsType> {
  declare id: number;
  declare total_engaged_users: number;
  declare total_chats: number;
  declare daily_metric_id: Date;

  static initModel(sequelize: Sequelize) {
    MetricDotcomChatMetrics.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      total_engaged_users: DataTypes.INTEGER,
      total_chats: DataTypes.INTEGER,
      daily_metric_id: DataTypes.DATE
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricDotcomChatModelStats extends Model<MetricDotcomChatModelStatsType> {
  declare id: number;
  declare name: string;
  declare is_custom_model: boolean;
  declare total_engaged_users: number;
  declare total_chats: number;
  declare chat_metrics_id: number;

  static initModel(sequelize: Sequelize) {
    MetricDotcomChatModelStats.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: DataTypes.STRING,
      is_custom_model: DataTypes.BOOLEAN,
      total_engaged_users: DataTypes.INTEGER,
      total_chats: DataTypes.INTEGER,
      chat_metrics_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricIdeChatMetrics extends Model<MetricIdeChatMetricsType> {
  declare id?: number;
  declare total_engaged_users: number;
  declare total_chats: number;
  declare total_chat_copy_events: number;
  declare total_chat_insertion_events: number;
  declare daily_metric_id: Date;

  static initModel(sequelize: Sequelize) {
    MetricIdeChatMetrics.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      total_engaged_users: DataTypes.INTEGER,
      total_chats: DataTypes.INTEGER,
      total_chat_copy_events: DataTypes.INTEGER,
      total_chat_insertion_events: DataTypes.INTEGER,
      daily_metric_id: DataTypes.DATE
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricIdeChatEditor extends Model<MetricIdeChatEditorType> {
  declare id: number;
  declare name: string;
  declare total_engaged_users: number;
  declare total_chats: number;
  declare total_chat_copy_events: number;
  declare total_chat_insertion_events: number;
  declare chat_metrics_id: number;

  static initModel(sequelize: Sequelize) {
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
      total_chat_insertion_events: DataTypes.INTEGER,
      chat_metrics_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

class MetricIdeChatModelStats extends Model<MetricIdeChatModelStatsType> {
  declare id?: number;
  declare name: string;
  declare is_custom_model: boolean;
  declare total_engaged_users: number;
  declare total_chats: number;
  declare total_chat_copy_events: number;
  declare total_chat_insertion_events: number;
  declare editor_id: number;

  static initModel(sequelize: Sequelize) {
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
      total_chat_insertion_events: DataTypes.INTEGER,
      editor_id: DataTypes.INTEGER
    }, {
      sequelize,
      timestamps: false
    });
  }
}

export {
  MetricDaily,
  MetricIdeCompletions,
  MetricEditor,
  MetricModelStats,
  MetricLanguageStats,
  MetricPrRepository,
  MetricPrModelStats,
  MetricPrMetrics,
  MetricDotcomChatMetrics,
  MetricDotcomChatModelStats,
  MetricIdeChatMetrics,
  MetricIdeChatEditor,
  MetricIdeChatModelStats,
  MetricDailyType,
  MetricDailyResponseType
};