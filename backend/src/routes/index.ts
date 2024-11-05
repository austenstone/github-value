import { Router, Request, Response } from 'express';
import SurveyController from '../controllers/survey.controller.js';
import metricsController from '../controllers/metrics.controller.js';
import settingsController from '../controllers/settings.controller.js';
import setupController from '../controllers/setup.controller.js';
import SeatsController from '../controllers/seats.controller.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

router.get('/survey', SurveyController.getAllSurveys);
router.post('/survey', SurveyController.createSurvey);
router.get('/survey/:id', SurveyController.getSurveyById);
router.put('/survey/:id', SurveyController.updateSurvey);
router.delete('/survey/:id', SurveyController.deleteSurvey);

router.get('/metrics', metricsController.getAllMetrics);
router.get('/metrics/:day', metricsController.getMetricsByDay);

router.get('/seats', SeatsController.getAllSeats);
router.get('/seats/:login', SeatsController.getSeatByLogin);
router.get('/seats/:login/activity', SeatsController.getSeatActivityByLogin);

router.get('/settings', settingsController.getAllSettings);
router.post('/settings', settingsController.createSettings);
router.get('/settings/:name', settingsController.getSettingsByName);
router.put('/settings/:name', settingsController.updateSettings);
router.delete('/settings/:name', settingsController.deleteSettings);

router.get('/setup/registration/complete', setupController.registrationComplete);
router.get('/setup/install/complete', setupController.installComplete);
router.get('/setup/install', setupController.getInstall);
router.get('/setup/status', setupController.isSetup);
router.get('/setup/manifest', setupController.getManifest);
router.post('/setup/existing-app', setupController.addExistingApp);

// get all other routes
router.get('*', (req: Request, res: Response) => {
  res.status(404).send('Route not found');
});

export default router;