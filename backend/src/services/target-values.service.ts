import { TargetValues } from '../models/target-values.model.js';

class TargetValuesService {
  async getTargetValues() {
    return await TargetValues.findAll();
  }

  async updateTargetValues(data: {
    targetedRoomForImprovement: number,
    targetedNumberOfDevelopers: number,
    targetedPercentOfTimeSaved: number
  }) {
    const [targetValues] = await TargetValues.findOrCreate({
      where: {},
      defaults: data
    });

    if (!targetValues.isNewRecord) {
      await targetValues.update(data);
    }

    return targetValues;
  }
}

export default new TargetValuesService();
