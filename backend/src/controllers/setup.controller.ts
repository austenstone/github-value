import { Request, Response } from 'express';
import app from '../index.js';
import StatusService from '../services/status.service.js';
import logger from '../services/logger.js';
import statusManager from 'services/status.manager.js';

class SetupController {
  async registrationComplete(req: Request, res: Response) {
    try {
      logger.info(`GitHub registrationComplete`, req.query);
      const { code } = req.query;
      const { html_url } = await app.github.createAppFromManifest(code as string);
      res.redirect(`${html_url}/installations/new`);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async installComplete(req: Request, res: Response) {
    try {
      logger.info(`GitHub installComplete`, req.query);
      await app.github.connect();
      res.redirect(app.baseUrl || '/');
    } catch (error) {
      res.status(500).json(error);
    }
  }

  getManifest(req: Request, res: Response) {
    try {
      app.baseUrl = `${req.protocol}://${req.get('host')}`;
      const manifest = app.github.getAppManifest();
      res.json(manifest);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async addExistingApp(req: Request, res: Response) {
    try {
      logger.info(`GitHub addExistingApp`, req.body);
      const { appId, privateKey, webhookSecret } = req.body;

      if (!appId || !privateKey || !webhookSecret) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      await app.github.connect({
        appId: appId,
        privateKey: privateKey,
        webhooks: {
          secret: webhookSecret
        }
      });

      res.json({ installUrl: await app.github.app?.getInstallationUrl() });
    } catch (error) {
      res.status(500).json(error);
    }
  }

  isSetup(req: Request, res: Response) {
    try {
      res.json({ isSetup: app.github.app !== undefined });
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async setupStatus(req: Request, res: Response) {
    try {
      const status = {
        dbConnected: app.database.mongoose?.connection.readyState === 1,
        isSetup: app.github.app !== undefined,
        installations: app.github.installations.map(i => ({
          installation: i.installation,
        }))
      };
      return res.json(status);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const status = await statusManager.getStatus();
      return res.json(status);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getInstall(req: Request, res: Response) {
    try {
      const { installation } = await app.github.getInstallation(req.body.id || req.body.owner)
      if (!installation) {
        throw new Error('No installation found');
      }
      res.json(installation);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async setupDB(req: Request, res: Response) {
    try {
      await app.database.connect(req.body.uri);
      res.json({ message: 'DB setup started' });
    } catch (error) {
      res.status(500).json(error);
    }
  }


}

export default new SetupController();