import { Router, Request, Response } from 'express';
import SurveyController from '../controllers/survey.controller';
import usageController from '../controllers/usage.controller';
import settingsController from '../controllers/settings.controller';
import setupController from '../controllers/setup.controller';
import SeatsController from '../controllers/seats.controller';
import metricsController from '../controllers/metrics.controller';
import TeamsController from '../controllers/teams.controller';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

router.get('/survey', SurveyController.getAllSurveys);
router.post('/survey', SurveyController.createSurvey);
router.get('/survey/:id', SurveyController.getSurveyById);
router.put('/survey/:id', SurveyController.updateSurvey);
router.delete('/survey/:id', SurveyController.deleteSurvey);

router.get('/usage', usageController.getUsage);

router.get('/metrics', metricsController.getMetrics);
router.get('/metrics/totals', metricsController.getMetricsTotals);

router.get('/seats', SeatsController.getAllSeats);
router.get('/seats/activity', SeatsController.getActivity);
// TODO - remove this route
router.get('/seats/activity/highcharts', SeatsController.getActivityHighcharts);

router.get('/teams', TeamsController.getAllTeams);
router.get('/members', TeamsController.getAllMembers);

router.get('/settings', settingsController.getAllSettings);
router.post('/settings', settingsController.createSettings);
router.put('/settings', settingsController.updateSettings);
router.get('/settings/:name', settingsController.getSettingsByName);
router.delete('/settings/:name', settingsController.deleteSettings);

router.get('/setup/registration/complete', setupController.registrationComplete);
router.get('/setup/install/complete', setupController.installComplete);
router.get('/setup/install', setupController.getInstall);
router.get('/setup/status', setupController.setupStatus);
router.get('/setup/manifest', setupController.getManifest);
router.post('/setup/existing-app', setupController.addExistingApp);

router.get('*', (req: Request, res: Response) => {
  res.status(404).send('Route not found');
});

export default router;