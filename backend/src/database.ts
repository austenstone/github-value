import updateDotenv from 'update-dotenv';
import logger from './services/logger.js';
import mongoose, { Schema } from 'mongoose';
import util from 'util';

class Database {
  mongoose: mongoose.Mongoose | null = null;
  mongodbUri?: string;

  constructor() { }

  async connect(mongodbUri: string) {
    logger.info('Connecting to the database', mongodbUri);
    try {
      this.mongoose = await mongoose.connect(mongodbUri, {
        socketTimeoutMS: 90000,
        connectTimeoutMS: 60000,
        serverSelectionTimeoutMS: 30000,
        retryWrites: true,
        readPreference: 'primaryPreferred',
        retryReads: true,
        w: 'majority',
        maxPoolSize: 10,        // Limit maximum connections
        minPoolSize: 5,         // Keep minimum connections ready
        maxIdleTimeMS: 30000,   // Close idle connections after 30 seconds
        heartbeatFrequencyMS: 10000,  // Check connection status every 10 seconds
        bufferCommands: true,   // Queue operations when connection is lost
        monitorCommands: true // Add connection pool monitoring
      });
      mongoose.set('debug', (collectionName: string, methodName: string, ...methodArgs: unknown[]) => {
        const msgMapper = (m: unknown) => {
          return util.inspect(m, false, 10, true)
            .replace(/\n/g, '').replace(/\s{2,}/g, ' ');
        };
        // logger.debug(`\x1B[0;36mMongoose:\x1B[0m: ${collectionName}.${methodName}` + `(${methodArgs.map(msgMapper).join(', ')})`);
        logger.debug(`[Mongoose] ${collectionName}.${methodName}(${methodArgs.map(msgMapper).join(', ')})`);
      });
      
      if (mongodbUri) await updateDotenv({ MONGODB_URI: mongodbUri });
      this.mongodbUri = mongodbUri;
      logger.info('Database connected');
      
      this.setupSchemas();
      logger.info('Database schemas setup complete');
    } catch (error) {
      logger.debug(error);
      if (error instanceof Error) {
        logger.error(`Database connection error: ${error.message}`);
      }
      throw error;
    }
  }

  async disconnect() {
    await this.mongoose?.disconnect();
  }

  async setupSchemas() {
    mongoose.model('Settings', new mongoose.Schema({
      name: String,
      value: {}
    }));
    mongoose.model('Usage', new mongoose.Schema({
      org: String,
      team: String,
      day: Date,
      total_suggestions_count: Number,
      total_acceptances_count: Number,
      total_lines_suggested: Number,
      total_lines_accepted: Number,
      total_active_users: Number,
      total_chat_acceptances: Number,
      total_chat_turns: Number,
      total_active_chat_users: Number,
      breakdown: [{
        language: String,
        editor: String,
        suggestions_count: Number,
        acceptances_count: Number,
        lines_suggested: Number,
        lines_accepted: Number,
        active_users: Number
      }]
    }));

    // Language Schema 📝
    const LanguageSchema = new mongoose.Schema({
      name: String,
      total_engaged_users: Number,
      total_code_acceptances: Number,
      total_code_suggestions: Number,
      total_code_lines_accepted: Number,
      total_code_lines_suggested: Number
    });

    // Model Schema 🤖
    const ModelSchema = new mongoose.Schema({
      name: String,
      is_custom_model: Boolean,
      total_engaged_users: Number,
      total_code_acceptances: Number,
      total_code_suggestions: Number,
      total_code_lines_accepted: Number,
      total_code_lines_suggested: Number,
      languages: [LanguageSchema],
      total_chats: Number,
      total_chat_copy_events: Number,
      total_chat_insertion_events: Number,
      total_pr_summaries_created: Number
    });

    // Editor Schema 🖥️
    const EditorSchema = new mongoose.Schema({
      name: String,
      total_engaged_users: Number,
      total_code_acceptances: Number,
      total_code_suggestions: Number,
      total_code_lines_accepted: Number,
      total_code_lines_suggested: Number,
      models: [ModelSchema],
      total_chats: Number,
      total_chat_copy_events: Number,
      total_chat_insertion_events: Number
    });

    // Repository Schema 📚
    const RepositorySchema = new mongoose.Schema({
      name: String,
      total_engaged_users: Number,
      total_pr_summaries_created: Number,
      models: [ModelSchema]
    });

    mongoose.model('Metrics', new mongoose.Schema({
      org: String,
      team: String,
      date: Date,
      total_active_users: Number,
      total_engaged_users: Number,

      copilot_ide_code_completions: {
        total_engaged_users: Number,
        total_code_acceptances: Number,
        total_code_suggestions: Number,
        total_code_lines_accepted: Number,
        total_code_lines_suggested: Number,
        editors: [EditorSchema]
      },
      copilot_ide_chat: {
        total_engaged_users: Number,
        total_chats: Number,
        total_chat_copy_events: Number,
        total_chat_insertion_events: Number,
        editors: [EditorSchema]
      },
      copilot_dotcom_chat: {
        total_engaged_users: Number,
        total_chats: Number,
        models: [ModelSchema]
      },
      copilot_dotcom_pull_requests: {
        total_engaged_users: Number,
        total_pr_summaries_created: Number,
        repositories: [RepositorySchema]
      }
    }));

    const teamSchema = new Schema({
      org: { type: String, required: true },
      team: String,
      githubId: { type: Number, required: true, unique: true }, // renamed from id
      node_id: String,
      name: String,
      slug: String,
      description: String,
      privacy: String,
      notification_setting: String,
      permission: String,
      url: String,
      html_url: String,
      members_url: String,
      repositories_url: String,
      parent: { type: Schema.Types.ObjectId, ref: 'Team' }
    }, {
      timestamps: true
    });

    const memberSchema = new Schema({
      org: { type: String, required: true },
      login: { type: String, required: true },
      id: { type: Number, required: true },
      node_id: String,
      avatar_url: String,
      gravatar_id: String,
      url: String,
      html_url: String,
      followers_url: String,
      following_url: String,
      gists_url: String,
      starred_url: String,
      subscriptions_url: String,
      organizations_url: String,
      repos_url: String,
      events_url: String,
      received_events_url: String,
      type: String,
      site_admin: Boolean,
      name: String,
      email: String,
      starred_at: String,
      user_view_type: String,
      seat: {
        type: Schema.Types.ObjectId,
        ref: 'Seats'
      }
    }, {
      timestamps: true,
    });
    memberSchema.index({ org: 1, login: 1, id: 1 }, { unique: true });
    memberSchema.index({ seat: 1 });
    memberSchema.virtual('seats', {
      ref: 'Seats',
      localField: '_id',
      foreignField: 'assignee'
    });

    const teamMemberSchema = new Schema({
      team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
      member: { type: Schema.Types.ObjectId, ref: 'Member', required: true }
    }, {
      timestamps: false
    });
    teamMemberSchema.index({ team: 1, member: 1 }, { unique: true });

    mongoose.model('Team', teamSchema);
    mongoose.model('Member', memberSchema);
    mongoose.model('TeamMember', teamMemberSchema);

    const seatsSchema = new mongoose.Schema({
      org: String,
      team: String,
      created_at: Date,
      updated_at: Date,
      pending_cancellation_date: Date,
      last_activity_at: Date,
      last_activity_editor: String,
      plan_type: String,
      assignee: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
      },
      queryAt: Date,
      assignee_id: Number,
      assignee_login: String,
    }, {
      timestamps: true
    });

    seatsSchema.index({ org: 1, queryAt: 1, last_activity_at: -1 });
    seatsSchema.index({ org: 1, team: 1, queryAt: 1, assignee_id: 1 }, { unique: true });
    mongoose.model('Seats', seatsSchema);

    const adoptionSchema = new Schema({
      enterprise: String,
      org: String,
      team: String,
      date: {
        type: Date,
        required: true
      },
      totalSeats: Number,
      totalActive: Number,
      totalInactive: Number,
      seats: [{
        login: String,
        last_activity_at: Date,
        last_activity_editor: String,
        _assignee: {
          required: true,
          type: Schema.Types.ObjectId,
          ref: 'Member'
        },
        _seat: {
          required: true,
          type: Schema.Types.ObjectId,
          ref: 'Seats'
        }
      }]
    }, {
      timestamps: true
    });

    // Create indexes
    adoptionSchema.index({ enterprise: 1, org: 1, team: 1, date: 1 }, { unique: true });

    mongoose.model('Adoption', adoptionSchema);

    const activityTotalsSchema = new mongoose.Schema({
      org: String,
      assignee: {
        type: Schema.Types.ObjectId,
        ref: 'Member'
      },
      assignee_id: Number,
      assignee_login: String,
      date: Date,
      total_active_time_ms: Number,
      last_activity_at: Date,
      last_activity_editor: String
    }, {
      timestamps: true
    });

    activityTotalsSchema.index({ org: 1, date: 1, assignee: 1 }, { unique: true });
    activityTotalsSchema.index({ date: 1 }); // For date range queries

    mongoose.model('ActivityTotals', activityTotalsSchema);

    mongoose.model('Survey', new mongoose.Schema({
      id: Number,
      userId: String,
      org: String,
      repo: String,
      prNumber: String,
      usedCopilot: Boolean,
      percentTimeSaved: Number,
      reason: String,
      timeUsedFor: String,
      kudos: Number,
      status: String,
      hits: Number
    }, {
      timestamps: true
    }));

    const TargetsDetailSchema = new mongoose.Schema({
      seats: Number,
      adoptedDevs: Number,
      monthlyDevsReportingTimeSavings: Number,
      percentSeatsReportingTimeSavings: Number,
      percentSeatsAdopted: Number,
      percentMaxAdopted: Number,
      dailySuggestions: Number,
      dailyAcceptances: Number,
      dailyChatTurns: Number,
      dailyDotComChats: Number,
      weeklyPRSummaries: Number,
      weeklyTimeSaved: Number,
      monthlyTimeSavings: Number,
      annualTimeSavingsDollars: Number,
      productivityBoost: Number,
      asOfDate: Number
    });

    const TargetsSchema = new mongoose.Schema({
      current: TargetsDetailSchema,
      target: TargetsDetailSchema,
      max: TargetsDetailSchema
    });

    mongoose.model('Targets', TargetsSchema);

    const CounterSchema = new mongoose.Schema({
      _id: { type: String, required: true },
      seq: { type: Number, default: 0 }
    });

    mongoose.model('Counter', CounterSchema);
  }

}

export default Database;
