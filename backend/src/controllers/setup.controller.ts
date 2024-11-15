import { Request, Response } from 'express';
import setup, { SetupStatus } from '../services/setup';

class SetupController {
  async registrationComplete(req: Request, res: Response) {
    try {
      const { code } = req.query;

      const data = await setup.createAppFromCode(code as string);

      res.redirect(`${data.html_url}/installations/new`);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async installComplete(req: Request, res: Response) {
    try {
      const { installation_id } = req.query;

      if (isNaN(Number(installation_id))) {
        throw new Error('installation_id must be a number');
      }
      await setup.createAppFromInstallationId(Number(installation_id));
      res.redirect(process.env.WEB_URL || '/');
    } catch (error) {
      res.status(500).json(error);
    }
  }

  getManifest(req: Request, res: Response) {
    try {
      const manifest = setup.getManifest(`${req.protocol}://${req.hostname}`);
      res.json(manifest);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async addExistingApp(req: Request, res: Response) {
    try {
      const { appId, privateKey, webhookSecret } = req.body;

      if (!appId || !privateKey || !webhookSecret) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      await setup.createAppFromExisting(appId, privateKey, webhookSecret);

      res.json({ installUrl: setup.installUrl });
    } catch (error) {
      res.status(500).json(error);
    }
  }

  isSetup(req: Request, res: Response) {
    try {
      res.json({ isSetup: setup.isSetup() });
    } catch (error) {
      res.status(500).json(error);
    }
  }

  setupStatus(req: Request, res: Response) {
    try {
         const requestedFields = req.query.fields ? (req.query.fields as string).split(',') : [];
         const fullStatus = setup.getSetupStatus();
         if (!requestedFields.length) {
             return res.json(fullStatus);
         }
         const filteredStatus: SetupStatus = {};
         requestedFields.forEach(field => {
          if (field === 'isSetup') {
            filteredStatus.isSetup = fullStatus.isSetup;
          }
          if (field === 'dbInitialized') {
            filteredStatus.dbInitialized = fullStatus.dbInitialized;
          }
          if (field === 'dbsInitialized') {
            filteredStatus.dbsInitialized = fullStatus.dbsInitialized;
          }
          if (field === 'installation') {
            filteredStatus.installation = fullStatus.installation;
          }
         });
         return res.json(filteredStatus);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  getInstall(req: Request, res: Response) {
    try {
      if (!setup.installation) {
        throw new Error('No installation found');
      }
      res.json(setup.installation);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new SetupController();