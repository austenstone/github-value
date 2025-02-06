import { SurveyType } from "../models/survey.model.js";
import mongoose from 'mongoose';
import SequenceService from './sequence.service.js';
import logger from "./logger.js";

class SurveyService {

  async createSurvey(survey: SurveyType) {
    survey.id = await SequenceService.getNextSequenceValue('survey-sequence');
    const Survey = mongoose.model('Survey');
    return await Survey.create(survey);
  }

  async updateSurvey(survey: SurveyType) {
    if (!survey || !survey.id || typeof survey.id !== 'number') {
      throw new Error('Invalid survey data provided');
    }
    const Survey = mongoose.model('Survey');
    const result = await Survey.updateOne({ id: survey.id }, survey);

    // Check if the update modified any document.
    if (result.modifiedCount === 0) {
      throw new Error('Survey update failed: no document was modified');
    }

    const updatedSurvey = await Survey.findOne({ id: survey.id });
    if (!updatedSurvey) {
      throw new Error('Survey update failed: survey not found');
    }

    logger.info(`Survey updated: ${survey.id}`);

    return updatedSurvey;
  }

  async getRecentSurveysWithGoodReasons(minReasonLength: number): Promise<SurveyType[]> {
    if (typeof minReasonLength !== 'number' || isNaN(minReasonLength) || minReasonLength < 1) {
      throw new Error('Invalid minReasonLength provided');
    }
    const Survey = mongoose.model('Survey');
    return Survey.find({
      reason: {
        $and: [
          { $ne: null },
          { $ne: '' },
          { $gte: minReasonLength }
        ]
      }
    }).sort({ updatedAt: -1 }).limit(20).exec();
  }
}

export default new SurveyService();