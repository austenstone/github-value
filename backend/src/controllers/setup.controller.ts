import { Request, Response } from 'express';
import app from '../app.js';

class SetupController {
  async registrationComplete(req: Request, res: Response) {
    try {
      const { code } = req.query;
      const { html_url } = await app.github.createAppFromManifest(code as string);
      res.redirect(`${html_url}/installations/new`);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async installComplete(req: Request, res: Response) {
    try {
      const installationUrl = await app.github.app?.getInstallationUrl();
      if (!installationUrl) throw new Error('No installation URL found');
      res.redirect(installationUrl);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  getManifest(req: Request, res: Response) {
    try {
      const manifest = app.github.getAppManifest(`${req.protocol}://${req.hostname}`);
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
        dbConnected: await app.database.sequelize?.authenticate().then(() => true).catch(() => false),
        isSetup: app.github.app !== undefined,
        installations: app.github.installations.map(i => ({
          installation: i.installation,
          ...i.queryService.status
        }))
      };
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
      await app.database.connect(req.body.url || {
        database: req.body.database || 'value',
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        password: req.body.password
      });
      res.json({ message: 'DB setup started' });
    } catch (error) {
      res.status(500).json(error);
    }
  }


}

export default new SetupController();