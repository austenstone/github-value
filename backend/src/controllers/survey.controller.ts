import { Request, Response } from 'express';
import { SurveyType } from '../models/survey.model.js';
import logger from '../services/logger.js';
import surveyService from '../services/survey.service.js';
import app from '../index.js';
import mongoose from 'mongoose';

class SurveyController {
  async updateSurveyGitHub(req: Request, res: Response): Promise<void> {
    let survey: SurveyType;
    try {
      const sanitizedBody = {
        id: req.body.id,
        userId: req.body.userId,
        org: req.body.org,
        repo: req.body.repo,
        prNumber: req.body.prNumber,
        usedCopilot: req.body.usedCopilot,
        percentTimeSaved: req.body.percentTimeSaved,
        reason: req.body.reason,
        timeUsedFor: req.body.timeUsedFor,
        kudos: req.body.kudos,
        hits: 0,
        status: 'completed'
      };
      const _survey = await surveyService.updateSurvey(sanitizedBody);
      if (!_survey) throw new Error('Survey not found');
      survey = _survey;
      res.status(201).json(survey);
    } catch (error) {
      res.status(500).json(error);
      return;
    }
    try {
      const { installation, octokit } = await app.github.getInstallation(survey.org);
      const surveyUrl = new URL(`copilot/surveys/${survey.id}`, app.baseUrl);

      if (!survey.repo || !survey.org || !survey.prNumber) {
        logger.warn('Cannot process survey comment: missing survey data');
        return;
      }
      const comments = await octokit.rest.issues.listComments({
        owner: survey.org,
        repo: survey.repo,
        issue_number: survey.prNumber
      });
      const comment = comments.data.find(comment => comment.user?.login.startsWith(installation.app_slug));
      if (comment) {
        octokit.rest.issues.updateComment({
          owner: survey.org,
          repo: survey.repo,
          comment_id: comment.id,
          body: `Thanks for filling out the [copilot survey](${surveyUrl.toString()}) @${survey.userId}!`
        });
      } else {
        logger.info(`No comment found for survey from ${survey.org}`);
      }
    } catch (error) {
      logger.error('Error updating survey comment', error);
      throw error;
    }
  }

  async createSurvey(req: Request, res: Response): Promise<void> {
    try {
      const newSurvey = req.body;
      // TODO: validate the user belong to the org.
      const survey = surveyService.createSurvey(newSurvey);
      res.status(201).json(survey);
    } catch (error) {
      res.status(500).json((error as Error).message);
      return;
    }
  }

  async getAllSurveys(req: Request, res: Response): Promise<void> {
    try {
      const { org, team, reasonLength, since, until, status, userId } = req.query as { [key: string]: string | undefined };
      
      const surveys = await surveyService.getAllSurveys({
        org,
        team,
        reasonLength,
        since,
        until,
        status,
        userId
      });
      
      res.status(200).json(surveys);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getSurveyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (isNaN(Number(id))) {
        res.status(400).json({ message: 'Invalid survey ID' });
        return;
      }
      const Survey = mongoose.model('Survey');
      const survey = await Survey.findOne({ id: { $eq: Number(id) } }); // Use $eq operator
      if (!survey) {
        res.status(404).json({ message: 'Survey not found' });
        return;
      }
      res.status(200).json(survey);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async updateSurvey(req: Request, res: Response): Promise<void> {
    try {
      const Survey = mongoose.model('Survey');
      const { id } = req.params;
      const updated = await Survey.findOneAndUpdate(
        { id: { $eq: Number(id) } },
        { 
          $set: {
            ...req.body,
            hits: 0,
            status: 'completed'
          }
        }
      );
      if (updated) {
        res.status(200).json({ _id: id, ...req.body });
      } else {
        res.status(404).json({ error: 'Survey not found' });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async deleteSurvey(req: Request, res: Response): Promise<void> {
    try {
      const Survey = mongoose.model('Survey');
      const { id } = req.params;
      if (isNaN(Number(id))) {
        res.status(400).json({ message: 'Invalid survey ID' });
        return;
      }
      const deleted = await Survey.findOneAndDelete({ id: { $eq: Number(id) } }); // Use $eq operator
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Survey not found' });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }
}


export default new SurveyController();