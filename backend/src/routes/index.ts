import { Router, Request, Response } from 'express';
import surveyController from '../controllers/survey.controller.js';
import usageController from '../controllers/usage.controller.js';
import settingsController from '../controllers/settings.controller.js';
import setupController from '../controllers/setup.controller.js';
import SeatsController from '../controllers/seats.controller.js';
import metricsController from '../controllers/metrics.controller.js';
import teamsController from '../controllers/teams.controller.js';
import targetValuesController from '../controllers/target-values.controller.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

router.get('/survey', surveyController.getAllSurveys);
router.post('/survey', surveyController.createSurvey);
router.get('/survey/:id', surveyController.getSurveyById);
router.put('/survey/:id', surveyController.updateSurvey); // put github survey logic here
router.delete('/survey/:id', surveyController.deleteSurvey);
router.put('/survey/:id/github', surveyController.updateSurveyGitHub);

router.get('/usage', usageController.getUsage);

router.get('/metrics', metricsController.getMetrics);
router.get('/metrics/totals', metricsController.getMetricsTotals);

router.get('/seats', SeatsController.getAllSeats);
router.get('/seats/activity', SeatsController.getActivity);
router.get('/seats/activity/totals', SeatsController.getActivityTotals);
router.get('/seats/:id', SeatsController.getSeat);

router.get('/teams', teamsController.getAllTeams);
router.get('/members', teamsController.getAllMembers);
router.get('/members/:login', teamsController.getMemberByLogin);

router.get('/settings', settingsController.getAllSettings);
router.post('/settings', settingsController.createSettings);
router.put('/settings', settingsController.updateSettings);
router.get('/settings/:name', settingsController.getSettingsByName);
router.delete('/settings/:name', settingsController.deleteSettings);

router.get('/setup/registration/complete', setupController.registrationComplete);
router.get('/setup/install/complete', setupController.installComplete);
router.get('/setup/install', setupController.getInstall);
router.get('/setup/manifest', setupController.getManifest);
router.post('/setup/existing-app', setupController.addExistingApp);
router.post('/setup/db', setupController.setupDB);
router.get('/setup/status', setupController.setupStatus);

router.get('/status', setupController.getStatus);

router.get('/predictive-modeling/targets', targetValuesController.getTargetValues);
router.post('/predictive-modeling/targets', targetValuesController.updateTargetValues);

router.get('*', (req: Request, res: Response) => {
  res.status(404).send('Route not found');
});

export default router;