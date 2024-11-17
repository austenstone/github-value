import { Sequelize } from 'sequelize';
import mysql2 from 'mysql2/promise';
import logger from './services/logger.js';

const sequelize = process.env.JAWSDB_URL ?
  new Sequelize(process.env.JAWSDB_URL, {
    dialect: 'mysql',
    pool: {
      max: 10,
      acquire: 30000,
      idle: 10000
    },
    logging: (sql) => logger.debug(sql),
    timezone: '+00:00', // Force UTC timezone
    dialectOptions: {
      timezone: '+00:00' // Force UTC for MySQL connection
    },
  }) :
  new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'octocat',
    database: process.env.MYSQL_DATABASE || 'value',
    logging: (sql) => logger.debug(sql),
    timezone: '+00:00', // Force UTC timezone
    dialectOptions: {
      timezone: '+00:00' // Force UTC for MySQL connection
    },
  });

const dbConnect = async () => {
  try {
    if (!process.env.JAWSDB_URL) { // If we are not using JAWSDB, we need to create the database
      const connection = await mysql2.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'octocat',
      });
  
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\`;`,);
      await connection.end();
    }
  } catch (error) {
    logger.error('Unable to connect to the database', error);
    throw error;
  }
  try {
    await sequelize.authenticate()
    await sequelize.sync({ alter: true }).then(() => {
      logger.info('All models were synchronized successfully. 🚀');
    }).catch((error) => {
      logger.error('Error synchronizing models', error);
    });
  } catch (error) {
    logger.info('Unable to initialize the database', error);
    throw error;
  }
};

export { dbConnect, sequelize };