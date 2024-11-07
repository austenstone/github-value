import { Request, Response } from 'express';
import { Survey } from '../models/survey.model.js';
import setup from '../services/setup.js';
import logger from '../services/logger.js';

class SurveyController {
  async createSurvey(req: Request, res: Response): Promise<void> {
    try {
      const survey = await Survey.create(req.body);
      res.status(201).json(survey);
      try {
        const octokit = await setup.getOctokit();
        const comments = await octokit.rest.issues.listComments({
          owner: survey.owner,
          repo: survey.repo,
          issue_number: survey.prNumber
        })
        const comment = comments.data.find(comment => comment.user?.login.startsWith(setup.installation.slug));
        if (comment) {
          octokit.rest.issues.updateComment({
            owner: survey.owner,
            repo: survey.repo,
            comment_id: comment.id,
            body: `Thanks for filling out the copilot survey @${survey.userId}!`
          })
        } else {
          logger.info(`No comment found for survey from ${setup.installation.slug}`)
        }
      } catch (error) {
        logger.error('Error updating survey comment', error);
      }
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  async getAllSurveys(req: Request, res: Response): Promise<void> {
    try {
      const surveys = await Survey.findAll();
      res.status(200).json(surveys); // 🎉 All surveys retrieved!
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  async getSurveyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const survey = await Survey.findByPk(id);
      if (survey) {
        res.status(200).json(survey); // 🎉 Survey found!
      } else {
        res.status(404).json({ error: 'Survey not found' }); // 🚨 Survey not found
      }
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  async updateSurvey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { daytime, userId, usedCopilot, pctTimesaved, timeUsedFor } = req.body;
      const [updated] = await Survey.update({ daytime, userId, usedCopilot, pctTimesaved, timeUsedFor }, {
        where: { id }
      });
      if (updated) {
        const updatedSurvey = await Survey.findByPk(id);
        res.status(200).json(updatedSurvey); // 🎉 Survey updated!
      } else {
        res.status(404).json({ error: 'Survey not found' }); // 🚨 Survey not found
      }
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  async deleteSurvey(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await Survey.destroy({
        where: { id }
      });
      if (deleted) {
        res.status(204).send(); // 🎉 Survey deleted!
      } else {
        res.status(404).json({ error: 'Survey not found' }); // 🚨 Survey not found
      }
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }
}

export default new SurveyController();