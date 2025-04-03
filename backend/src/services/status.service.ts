import mongoose from "mongoose";
import { Router } from 'express';
import { ServerApp } from '../app';
import statusManager, { ComponentStatus, ComponentType } from './status.manager';
import logger from './logger';

export interface StatusType {
  systemStatus: {
    isReady: boolean;
    uptime: number;
    startTime: string;
    components: Record<ComponentType, string>;
  };
  seatsHistory?: {
    oldestCreatedAt: string;
    daysSinceOldestCreatedAt?: number;
  };
  installations: {
    installation: Endpoints["GET /app/installations"]["response"]["data"][0];
    repos: Endpoints["GET /app/installations"]["response"]["data"];
  }[];
  surveyCount: number;
}

/**
 * StatusService - Provides application status information
 */
export class StatusService {
  constructor(private app: ServerApp) {
    // Register the status service as a component in our status system
    statusManager.registerComponent('status-service', 'running', 'Status monitoring active');

    // Set up health check listener for the status service itself
    statusManager.on('healthcheck:status-service', (callback) => {
      callback('running', 'Status service is operational');
    });

    // Schedule periodic health checks
    this.scheduleHealthChecks();
  }

  /**
   * Schedule regular health checks to run automatically
   * @param intervalMinutes Minutes between health checks (default: 5)
   */
  private scheduleHealthChecks(intervalMinutes = 5): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Run an initial health check
    statusManager.runHealthChecks().catch(err => {
      logger.error('Initial health check failed', { error: err });
    });
    
    // Schedule recurring health checks
    setInterval(() => {
      statusManager.runHealthChecks().catch(err => {
        logger.error('Scheduled health check failed', { error: err });
      });
    }, intervalMs);
    
    logger.info(`Scheduled health checks to run every ${intervalMinutes} minutes`);
  }

  /**
   * Get the current system status
   */
  async getStatus(): Promise<StatusType> {
    // Run health checks to ensure statuses are up to date
    await statusManager.runHealthChecks();
    
    // Get basic status report
    const statusReport = statusManager.getStatus();
    
    // Format component statuses to strings for API response
    const componentStatuses: Record<string, string> = {};
    Object.entries(statusReport.status).forEach(([key, value]) => {
      componentStatuses[key] = value;
    });

    const status: StatusType = {
      systemStatus: {
        isReady: statusReport.isReady,
        uptime: statusReport.uptime,
        startTime: statusReport.startTime,
        components: componentStatuses as Record<ComponentType, string>
      },
      installations: [],
      surveyCount: 0
    };

    // Add additional details if database is connected
    if (mongoose.connection.readyState === 1) {
      // Get seats history information
      const Seats = mongoose.model('Seats');
      const oldestSeat = await Seats.findOne().sort({ createdAt: 1 });
      const daysSince = oldestSeat ? Math.floor((new Date().getTime() - oldestSeat.createdAt.getTime()) / (1000 * 3600 * 24)) : undefined;
      
      status.seatsHistory = {
        oldestCreatedAt: oldestSeat?.createdAt.toISOString() || 'No data',
        daysSinceOldestCreatedAt: daysSince
      };

      // Count surveys
      const Survey = mongoose.model('Survey');
      status.surveyCount = await Survey.countDocuments();
    }

    // Get GitHub installations if available
    if (app.github.installations && app.github.installations.length > 0) {
      status.installations = [];
      for (const installation of app.github.installations) {
        const repos = await installation.octokit.request(installation.installation.repositories_url);
        status.installations.push({
          installation: installation.installation,
          repos: repos.data.repositories
        });
      }
    }

    return status;
  }

  /**
   * Get the status of a specific component
   */
  getComponentStatus(componentName: string) {
    return statusManager.getComponentStatus(componentName);
  }

  /**
   * Register a new component with the status system
   */
  registerComponent(componentName: string, initialStatus: ComponentStatus = 'starting', message?: string) {
    return statusManager.registerComponent(componentName, initialStatus, message);
  }

  /**
   * Update a component's status
   */
  updateStatus(componentName: string, status: ComponentStatus, message?: string) {
    return statusManager.updateStatus(componentName, status, message);
  }

  /**
   * Run health checks on all components
   */
  async runHealthChecks() {
    return await statusManager.runHealthChecks();
  }

  /**
   * Checks if the application is ready to serve requests
   */
  isReady() {
    return statusManager.isReady();
  }

  /**
   * Set up status monitoring for a component
   * This method sets listeners for a component's health check events
   */
  monitorComponent(componentName: string, healthCheckFn: () => Promise<{ status: ComponentStatus, message?: string }>) {
    statusManager.on(`healthcheck:${componentName}`, async (callback) => {
      try {
        const result = await healthCheckFn();
        callback(result.status, result.message);
      } catch (error) {
        callback('error', String(error));
      }
    });
  }
}

/**
 * Configure status controller routes
 */
export function configureStatusRoutes(app: ServerApp, statusService: StatusService): Router {
  const router = Router();

  // Get full system status
  router.get('/', (_req, res) => {
    res.json(statusService.getStatus());
  });

  // Get status for a specific component
  router.get('/:componentName', (req, res) => {
    const { componentName } = req.params;
    const status = statusService.getComponentStatus(componentName);
    
    if (status) {
      res.json(status);
    } else {
      res.status(404).json({ error: `Component '${componentName}' not found` });
    }
  });

  // Trigger a manual health check
  router.post('/healthcheck', async (_req, res) => {
    try {
      const results = await statusService.runHealthChecks();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Check if application is ready
  router.get('/ready', (_req, res) => {
    const isReady = statusService.isReady();
    if (isReady) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  });

  app.use('/api/status', router);
  return router;
}

export default StatusService;