import { DataTypes } from 'sequelize';
import { sequelize } from '../database.js';

const Settings = sequelize.define('Settings', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  timestamps: false,
});

export { Settings };