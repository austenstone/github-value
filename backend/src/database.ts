import mongoose from "mongoose";
import statusManager from "./services/status.manager.js";
import logger from "./services/logger.js";
import { setupSchemas } from "models/schema-registry.js";

class Database {
  constructor() {
    statusManager.registerComponent('database', 'starting', 'Database initializing');

    statusManager.on('healthcheck:database', async (callback) => {
      if (mongoose.connection.readyState === 1) {
        callback('running', 'Connected to MongoDB');
      } else if (mongoose.connection.readyState === 2) {
        callback('warning', 'MongoDB connection in progress');
      } else if (mongoose.connection.readyState === 0) {
        callback('error', 'Disconnected from MongoDB');
      } else {
        callback('error', `MongoDB connection in unknown state: ${mongoose.connection.readyState}`);
      }
    });
  }

  async connect(uri: string) {
    try {
      statusManager.updateStatus('database', 'starting', 'Connecting to MongoDB');
      
      await mongoose.connect(uri);
      setupSchemas();
      
      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', err);
        statusManager.updateStatus('database', 'error', `MongoDB connection error: ${err.message}`);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        statusManager.updateStatus('database', 'error', 'MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        statusManager.updateStatus('database', 'running', 'MongoDB reconnected');
      });
      
      statusManager.updateStatus('database', 'running', 'Connected to MongoDB successfully');
      return mongoose.connection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      statusManager.updateStatus('database', 'error', `Failed to connect to MongoDB: ${errorMessage}`);
      throw error;
    }
  }

  async disconnect() {
    try {
      statusManager.updateStatus('database', 'stopping', 'Disconnecting from MongoDB');
      await mongoose.disconnect();
      statusManager.updateStatus('database', 'stopped', 'Disconnected from MongoDB');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown disconnection error';
      statusManager.updateStatus('database', 'error', `Error disconnecting from MongoDB: ${errorMessage}`);
      throw error;
    }
  }
}

export {
  Database as default
};
