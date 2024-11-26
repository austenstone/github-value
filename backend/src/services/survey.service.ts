import { Survey, SurveyType } from "../models/survey.model.js";

class SurveyService {
  async createSurvey(survey: SurveyType) {
    return await Survey.create(survey);
  }

  async updateSurvey(survey: SurveyType) {
    await Survey.update(survey, {
      where: { id: survey.id }
    });
    return await Survey.findByPk(survey.id);
  }
}

export default new SurveyService();