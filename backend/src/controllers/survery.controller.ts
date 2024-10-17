import { Request, Response } from 'express';
import { Survey } from '../models/survey.model';

class SurveyController {
    async createSurvey(req: Request, res: Response): Promise<void> {
    }

    async getAllSurveys(req: Request, res: Response) {
      return res.status(200).json({ message: 'All surveys' });
    }

    async getSurveyById(req: Request, res: Response): Promise<void> {
    }

    async updateSurvey(req: Request, res: Response): Promise<void> {
    }

    async deleteSurvey(req: Request, res: Response): Promise<void> {
    }
}

export const surveyController = new SurveyController();