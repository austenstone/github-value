import { Sequelize } from 'sequelize';
import { Settings } from './models/settings.model.js';
import { Metrics, Breakdown } from './models/metrics.model.js';
import { Survey } from './models/survey.model.js';
import logger from './services/logger.js';

const sequelize = new Sequelize({
  dialect: 'mysql',
  database: process.env.MYSQL_DATABASE || 'value',
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'octocat',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  logging: (sql: string, timing?: number) => {
    logger.info(sql);
  }
});

const dbConnect = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
  } catch (error) {
    logger.info('Unable to initialize the database', error);
  }
};

export { dbConnect, sequelize };