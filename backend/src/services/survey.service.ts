import mongoose from 'mongoose';
import SequenceService from './sequence.service.js';
import logger from "./logger.js";

// Define the SurveyType interface here instead of importing it
export interface SurveyType {
  id: number;
  userId: string;
  org?: string;
  repo?: string;
  prNumber?: number;
  usedCopilot?: boolean;
  percentTimeSaved?: number;
  reason?: string;
  timeUsedFor?: string;
  kudos?: number;
  status?: string;
  hits?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    const result = await Survey.updateOne({ id: survey.id }, { $set: survey });
    
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

  /**
   * Get all surveys based on filtering criteria
   */
  async getAllSurveys(params: {
    org?: string;
    team?: string;
    reasonLength?: string;
    since?: string;
    until?: string;
    status?: string;
  }) {
    const { org, team, reasonLength, since, until, status } = params;
    
    const dateFilter: mongoose.FilterQuery<{
      $gte: Date;
      $lte: Date;
    }> = {};
    
    if (since) {
      dateFilter.$gte = new Date(since);
    }
    if (until) {
      dateFilter.$lte = new Date(until);
    }

    const query = {
      filter: {
        ...(org ? { org: String(org) } : {}),
        ...(team ? { team: String(team) } : {}),
        ...(reasonLength ? { $expr: { $and: [{ $gt: [{ $strLenCP: { $ifNull: ['$reason', ''] } }, 40] }, { $ne: ['$reason', null] }] } } : {}),
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
        ...(status ? { status } : {}),
      },
      projection: {
        _id: 0,
        __v: 0,
      }
    };

    const Survey = mongoose.model('Survey');
    return Survey.find(query.filter, query.projection);
  }
}

export default new SurveyService();