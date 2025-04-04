import { Router, Request, Response } from 'express';
import surveyController from '../controllers/survey.controller.js';
import settingsController from '../controllers/settings.controller.js';
import setupController from '../controllers/setup.controller.js';
import SeatsController from '../controllers/seats.controller.js';
import metricsController from '../controllers/metrics.controller.js';
import teamsController from '../controllers/teams.controller.js';
import targetValuesController from '../controllers/target.controller.js';
import adoptionController from '../controllers/adoption.controller.js';
import mongoSanitize from 'express-mongo-sanitize';

const router = Router();


router.use(mongoSanitize());

router.get('/', (req: Request, res: Response) => {
  res.send('Hello github-value!');
});

router.get('/survey', surveyController.getAllSurveys);
router.post('/survey', surveyController.createSurvey);
router.get('/survey/:id', surveyController.getSurveyById);
router.put('/survey/:id', surveyController.updateSurvey); // put github survey logic here
router.delete('/survey/:id', surveyController.deleteSurvey);
router.post('/survey/:id/github', surveyController.updateSurveyGitHub);

router.get('/metrics', metricsController.getMetrics);
router.get('/metrics/totals', metricsController.getMetricsTotals);

router.get('/seats', SeatsController.getAllSeats);
router.get('/seats/activity', adoptionController.getAdoptions);
router.get('/seats/activity/totals', adoptionController.getAdoptionTotals);
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

router.get('/targets', targetValuesController.getTargetValues);
router.post('/targets', targetValuesController.updateTargetValues);

router.get('*', (req: Request, res: Response) => {
  res.status(404).send('Route not found');
});

export default router;