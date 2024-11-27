import { Options, Sequelize } from 'sequelize';
import mysql2 from 'mysql2/promise';
import updateDotenv from 'update-dotenv';
import logger from './services/logger.js';
import { TargetValues } from './models/target-values.model.js';
import { Settings } from './models/settings.model.js';
import { Usage } from './models/usage.model.js';
import { Seat } from './models/copilot.seats.model.js';
import { Team } from './models/teams.model.js';
import { MetricDaily } from './models/metrics.model.js';
import { Survey } from './models/survey.model.js';

// CACHE
// https://github.com/sequelize-transparent-cache/sequelize-transparent-cache?tab=readme-ov-file

class Database {
  sequelize?: Sequelize;
  options: Options = {
    dialect: 'mysql',
    logging: (sql) => logger.debug(sql),
    timezone: '+00:00', // Force UTC timezone
    dialectOptions: {
      timezone: '+00:00' // Force UTC for MySQL connection
    },
  }
  input: string | Options;

  constructor(input: string | Options) {
    this.input = input;
  }

  async connect(options?: Options) {
    this.input = options || this.input;
    if (typeof this.input !== 'string') {
      if (this.input.host) await updateDotenv({ MYSQL_HOST: this.input.host })
      if (this.input.port) await updateDotenv({ MYSQL_PORT: String(this.input.port) })
      if (this.input.username) await updateDotenv({ MYSQL_USER: this.input.username })
      if (this.input.password) await updateDotenv({ MYSQL_PASSWORD: this.input.password })
      if (this.input.database) await updateDotenv({ MYSQL_DATABASE: this.input.database })
    }
    try {
      let sequelize;
      try {
        sequelize = typeof this.input === 'string' ?
          new Sequelize(this.input, {
            pool: {
              max: 10,
              acquire: 30000,
              idle: 10000
            },
            ...this.options
          }) :
          new Sequelize({
            ...this.input,
            ...this.options
          });
      } catch (error) {
        logger.error('Unable to connect to the database');
        throw error;
      }
      logger.info('Connection to the database has been established successfully');

      if (typeof this.input !== 'string') {
        try {
          const connection = await mysql2.createConnection({
            host: this.input.host,
            port: this.input.port,
            user: this.input.username,
            password: this.input.password,
          });

          await connection.query('CREATE DATABASE IF NOT EXISTS ??', [this.input.database]);
          await connection.end();
          await connection.destroy();
        } catch (error) {
          logger.error('Unable to create the database');
          throw error;
        }
        logger.info('Database created successfully');
      }

      try {
        await sequelize.authenticate()
        await this.initializeModels(sequelize);
        this.sequelize = sequelize;
        await sequelize.sync({ alter: true }).then(() => {
          logger.info('Database models were synchronized successfully');
        })
      } catch (error) {
        logger.info('Unable to initialize the database');
        throw error;
      }
      logger.info('Database setup completed successfully');
      return this.sequelize;
    } catch (error) {
      logger.debug(error);
      if (error instanceof Error) {
        logger.error(error.message);
      }
      throw error;
    }
  }

  disconnect() {
    this.sequelize?.connectionManager.close();
    this.sequelize?.close();
  }

  initializeModels(sequelize: Sequelize) {
    Settings.initModel(sequelize);
    Team.initModel(sequelize);
    Seat.initModel(sequelize);
    Survey.initModel(sequelize);
    Usage.initModel(sequelize);
    MetricDaily.initModel(sequelize);
    TargetValues.initModel(sequelize);
  }

}

export default Database;
