import { Model, DataTypes, Sequelize } from 'sequelize';

type TargetValuesType = {
  targetedRoomForImprovement: number;
  targetedNumberOfDevelopers: number;
  targetedPercentOfTimeSaved: number;
}

class TargetValues extends Model<TargetValuesType> {
  declare targetedRoomForImprovement: number;
  declare targetedNumberOfDevelopers: number;
  declare targetedPercentOfTimeSaved: number;

  static initModel(sequelize: Sequelize) {
    TargetValues.init({
      targetedRoomForImprovement: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      targetedNumberOfDevelopers: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      targetedPercentOfTimeSaved: {
        type: DataTypes.FLOAT,
        allowNull: false,
      }
    }, {
      sequelize,
      modelName: 'TargetValues',
      timestamps: false,
    });
  }
}

export { TargetValues };
