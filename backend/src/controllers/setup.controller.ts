import { Request, Response } from 'express';
import app from '../index.js';
import StatusService from '../services/status.service.js';
import logger from '../services/logger.js';

// Type definitions for the diagnostic response
interface OctokitTestResult {
  success: boolean;
  appName?: string;
  appOwner?: string;
  permissions?: Record<string, string | undefined>;
  error?: string;
}

interface InstallationDiagnostic {
  index: number;
  installationId: number;
  accountLogin: string;
  accountId: string | number;
  accountType: string;
  accountAvatarUrl: string;
  appId: number;
  appSlug: string;
  targetType: string;
  permissions: Record<string, string | undefined>;
  events: string[];
  createdAt: string;
  updatedAt: string;
  suspendedAt: string | null;
  suspendedBy: { login: string; id: number } | null;
  hasOctokit: boolean;
  octokitTest: OctokitTestResult | null;
  isValid: boolean;
  validationErrors: string[];
  repositories: {
    count: number;
    list: Array<{
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      html_url: string;
    }>;
  };
}

interface AppInfo {
  name: string;
  description: string;
  owner: string;
  htmlUrl: string;
  permissions: Record<string, string | undefined>;
  events: string[];
}

interface DiagnosticsResponse {
  timestamp: string;
  appConnected: boolean;
  totalInstallations: number;
  installations: InstallationDiagnostic[];
  errors: string[];
  appInfo: AppInfo | null;
  summary: {
    validInstallations: number;
    invalidInstallations: number;
    organizationNames: string[];
    accountTypes: Record<string, number>;
    repositories: {
      totalCount: number;
      publicCount: number;
      privateCount: number;
    };
  };
}

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
      // Initialize diagnostics response with empty summary stats
      const diagnostics: DiagnosticsResponse = {
        timestamp: new Date().toISOString(),
        appConnected: !!app.github.app,
        totalInstallations: app.github.installations.length,
        installations: [],
        errors: [],
        appInfo: null,
        summary: {
          validInstallations: 0,
          invalidInstallations: 0,
          organizationNames: [],
          accountTypes: {},
          repositories: {
            totalCount: 0,
            publicCount: 0,
            privateCount: 0
          }
        }
      };

      // Early exit if GitHub App is not properly initialized
      if (!app.github.app) {
        diagnostics.errors.push('GitHub App is not initialized');
        return res.json(diagnostics);
      }

      // Process each GitHub App installation sequentially
      for (let i = 0; i < app.github.installations.length; i++) {
        const { installation, octokit } = app.github.installations[i];
        
        // Fetch all repositories for this installation using pagination
        let repositories = { count: 0, list: [] as Array<{ id: number; name: string; full_name: string; private: boolean; html_url: string; }> };
        if (octokit) {
          try {
            // Use paginate to get ALL repos across multiple pages
            const repos = await octokit.paginate("GET /installation/repositories");
            repositories = {
              count: repos.length,
              list: repos.map(repo => ({
                id: repo.id,
                name: repo.name,
                full_name: repo.full_name,
                private: repo.private,
                html_url: repo.html_url
              }))
            };
          } catch (error) {
            // Repository fetch failure shouldn't break entire diagnostic
            console.error(`Failed to fetch repos for installation ${installation.id}:`, error);
          }
        }

        const installationDiag: InstallationDiagnostic = {
          index: i,
          installationId: installation.id,
          accountLogin: installation.account?.login || 'MISSING',
          accountId: installation.account?.id || 'MISSING',
          accountType: installation.account?.type || 'MISSING',
          accountAvatarUrl: installation.account?.avatar_url || 'MISSING',
          appId: installation.app_id,
          appSlug: installation.app_slug,
          targetType: installation.target_type,
          permissions: installation.permissions || {},
          events: installation.events || [],
          createdAt: installation.created_at,
          updatedAt: installation.updated_at,
          suspendedAt: installation.suspended_at,
          suspendedBy: installation.suspended_by,
          hasOctokit: !!octokit,
          octokitTest: null,
          isValid: true,
          validationErrors: [],
          repositories: repositories
        };

        // Validate required installation fields for proper functionality
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

        // Verify Octokit can make authenticated API calls
        if (octokit) {
          try {
            // Simple API test to verify authentication works
            const authTest = await octokit.rest.apps.getAuthenticated();
            installationDiag.octokitTest = {
              success: true,
              appName: authTest.data?.name || 'Unknown',
              appOwner: (authTest.data?.owner && 'login' in authTest.data.owner) ? authTest.data.owner.login : 'Unknown',
              permissions: authTest.data?.permissions || {}
            };
          } catch (error) {
            // Mark as invalid if Octokit auth fails
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

        // Aggregate installation status into summary counters
        if (installationDiag.isValid) {
          diagnostics.summary.validInstallations++;
          if (installation.account?.login) {
            diagnostics.summary.organizationNames.push(installation.account.login);
          }
        } else {
          diagnostics.summary.invalidInstallations++;
        }

        // Count installations by account type (Organization vs User)
        const accountType = installation.account?.type || 'Unknown';
        diagnostics.summary.accountTypes[accountType] = (diagnostics.summary.accountTypes[accountType] || 0) + 1;

        // Aggregate repository counts across all installations
        diagnostics.summary.repositories.totalCount += installationDiag.repositories.count;
        installationDiag.repositories.list.forEach(repo => {
          if (repo.private) {
            diagnostics.summary.repositories.privateCount++;
          } else {
            diagnostics.summary.repositories.publicCount++;
          }
        });

        diagnostics.installations.push(installationDiag);
      }

      // Fetch GitHub App metadata for display purposes
      try {
        const appInfo = await app.github.app.octokit.rest.apps.getAuthenticated();
        diagnostics.appInfo = {
          name: appInfo.data?.name || 'Unknown',
          description: appInfo.data?.description || 'No description',
          owner: (appInfo.data?.owner && 'login' in appInfo.data.owner) ? appInfo.data.owner.login : 'Unknown',
          htmlUrl: appInfo.data?.html_url || 'Unknown',
          permissions: appInfo.data?.permissions || {},
          events: appInfo.data?.events || []
        };
      } catch (error) {
        diagnostics.errors.push(`Failed to get app info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sort organization names alphabetically for cleaner display
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