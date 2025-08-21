import { Request, Response } from 'express';
import app from '../index.js';
import StatusService from '../services/status.service.js';
import logger from '../services/logger.js';

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
        res.status(400).json({ error: 'All fields are required' });
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
      res.json(status);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getStatus(req: Request, res: Response) {
    try {
      const statusService = new StatusService();
      const status = await statusService.getStatus(req);
      res.json(status);
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

  async validateInstallations(req: Request, res: Response) {
    try {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        appConnected: !!app.github.app,
        totalInstallations: app.github.installations.length,
        installations: [] as any[],
        errors: [] as string[],
        appInfo: null as any,
        summary: {
          validInstallations: 0,
          invalidInstallations: 0,
          organizationNames: [] as string[],
          accountTypes: {} as Record<string, number>
        }
      };

      // Basic app validation
      if (!app.github.app) {
        diagnostics.errors.push('GitHub App is not initialized');
        return res.json(diagnostics);
      }

      // Validate each installation
      for (let i = 0; i < app.github.installations.length; i++) {
        const { installation, octokit } = app.github.installations[i];
        
        const installationDiag = {
          index: i,
          installationId: installation.id,
          accountLogin: installation.account?.login || 'MISSING',
          accountId: installation.account?.id || 'MISSING',
          accountType: installation.account?.type || 'MISSING',
          accountAvatarUrl: installation.account?.avatar_url || 'MISSING',
          appId: installation.app_id,
          appSlug: installation.app_slug,
          targetType: installation.target_type,
          permissions: installation.permissions,
          events: installation.events,
          createdAt: installation.created_at,
          updatedAt: installation.updated_at,
          suspendedAt: installation.suspended_at,
          suspendedBy: installation.suspended_by,
          hasOctokit: !!octokit,
          octokitTest: null as any,
          isValid: true,
          validationErrors: [] as string[]
        };

        // Validate required fields
        if (!installation.account?.login) {
          installationDiag.isValid = false;
          installationDiag.validationErrors.push('Missing account.login (organization name)');
        }
        
        if (!installation.account?.id) {
          installationDiag.isValid = false;
          installationDiag.validationErrors.push('Missing account.id');
        }

        if (!installation.account?.type) {
          installationDiag.isValid = false;
          installationDiag.validationErrors.push('Missing account.type');
        }

        // Test Octokit functionality
        if (octokit) {
          try {
            // Test basic API call with the installation's octokit
            const authTest = await octokit.rest.apps.getAuthenticated();
            installationDiag.octokitTest = {
              success: true,
              appName: authTest.data?.name || 'Unknown',
              appOwner: (authTest.data?.owner as any)?.login || 'Unknown',
              permissions: authTest.data?.permissions || {}
            };
          } catch (error) {
            installationDiag.octokitTest = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            installationDiag.isValid = false;
            installationDiag.validationErrors.push(`Octokit API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          installationDiag.isValid = false;
          installationDiag.validationErrors.push('Octokit instance is missing');
        }

        // Update summary
        if (installationDiag.isValid) {
          diagnostics.summary.validInstallations++;
          if (installation.account?.login) {
            diagnostics.summary.organizationNames.push(installation.account.login);
          }
        } else {
          diagnostics.summary.invalidInstallations++;
        }

        // Track account types
        const accountType = installation.account?.type || 'Unknown';
        diagnostics.summary.accountTypes[accountType] = (diagnostics.summary.accountTypes[accountType] || 0) + 1;

        diagnostics.installations.push(installationDiag);
      }

      // Additional app-level diagnostics
      try {
        const appInfo = await app.github.app.octokit.rest.apps.getAuthenticated();
        diagnostics.appInfo = {
          name: appInfo.data?.name || 'Unknown',
          description: appInfo.data?.description || 'No description',
          owner: (appInfo.data?.owner as any)?.login || 'Unknown',
          htmlUrl: appInfo.data?.html_url || 'Unknown',
          permissions: appInfo.data?.permissions || {},
          events: appInfo.data?.events || []
        };
      } catch (error) {
        diagnostics.errors.push(`Failed to get app info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sort organization names for easier reading
      diagnostics.summary.organizationNames.sort();

      res.json(diagnostics);
    } catch (error) {
      logger.error('Installation validation failed', error);
      res.status(500).json({ 
        error: 'Installation validation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }


}

export default new SetupController();