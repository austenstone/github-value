import { Model, DataTypes, Sequelize } from 'sequelize';

type SettingsType = {
  name: string;
  value: string;
}

class Settings extends Model<SettingsType> {
  declare name: string;
  declare value: string;

  static initModel(sequelize: Sequelize) {
    Settings.init({
      name: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    }, {
      sequelize,
      modelName: 'Settings',
      timestamps: false,
    });
  }
}

export { Settings };