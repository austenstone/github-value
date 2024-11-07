import { Sequelize } from 'sequelize';
<<<<<<< HEAD
import logger from './services/logger';
import mysql2 from 'mysql2/promise';
=======
import { Settings } from './models/settings.model.js';
import { Metrics, Breakdown } from './models/metrics.model.js';
import { Survey } from './models/survey.model.js';
import { Assignee, AssigningTeam, Seat } from './models/copilot.seats.js';
import logger from './services/logger.js';
>>>>>>> 518279f0bc3ac0923b7498bd46ecf4fa4794e860

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'octocat',
  database: process.env.MYSQL_DATABASE || 'value',
  logging: (sql: string, timing?: number) => {
    logger.info(sql);
  }
});

const dbConnect = async () => {
  try {
    const connection = await mysql2.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'octocat',
    });

    const query = await connection.query(`CREATE DATABASE IF NOT EXISTS \`value\`;`,);
    
    console.log(query);
    await connection.end();
  } catch (error) {
    logger.error('Unable to connect to the database', error);
    throw error;
  }
  try {
    await sequelize.authenticate()
    await sequelize.sync({ force: false }).then(() => {
      logger.info('All models were synchronized successfully. 🚀');
    }).catch((error) => {
      console.log(error);
      logger.error('Error synchronizing models', error);
    });
  } catch (error) {
    logger.info('Unable to initialize the database', error);
    throw error;
  }
};

export { dbConnect, sequelize };