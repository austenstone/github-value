import { Request, Response } from 'express';
import statusManager from '../services/status.manager.js';
import logger from '../services/logger.js';

/**
 * Status controller for handling status-related API requests
 */
export class StatusController {
  /**
   * Get complete system status information
   * @param req Express request
   * @param res Express response
   */
  getSystemStatus(req: Request, res: Response): void {
    try {
      const systemStatus = {
        status: statusManager.getAllComponentStatuses(),
        componentDetails: statusManager.getAllComponentDetails(),
        isReady: statusManager.isSystemReady(),
        uptime: statusManager.getUptime(),
        startTime: statusManager.getStartTime(),
      };

      res.json(systemStatus);
    } catch (error) {
      logger.error('Error getting system status', error);
      res.status(500).json({ 
        error: 'Failed to retrieve system status',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get status of a specific component
   * @param req Express request
   * @param res Express response
   */
  getComponentStatus(req: Request, res: Response): void {
    try {
      const { componentName } = req.params;

      if (!componentName) {
        res.status(400).json({ error: 'Component name is required' });
        return;
      }

      const componentStatus = statusManager.getComponentStatus(componentName);

      if (!componentStatus) {
        res.status(404).json({ error: `Component '${componentName}' not found` });
        return;
      }

      res.json(componentStatus);
    } catch (error) {
      logger.error(`Error getting component status`, error);
      res.status(500).json({ 
        error: 'Failed to retrieve component status',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Get history of a specific component
   * @param req Express request
   * @param res Express response
   */
  getComponentHistory(req: Request, res: Response): void {
    try {
      const { componentName } = req.params;

      if (!componentName) {
        res.status(400).json({ error: 'Component name is required' });
        return;
      }

      const history = statusManager.getStatusHistory(componentName);
      res.json(history);
    } catch (error) {
      logger.error(`Error getting component history`, error);
      res.status(500).json({ 
        error: 'Failed to retrieve component history',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Trigger manual health checks for all components
   * @param req Express request
   * @param res Express response
   */
  async runHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Manual health check triggered via API');
      const results = await statusManager.runHealthChecks();
      res.json({
        success: true,
        results
      });
    } catch (error) {
      logger.error('Error running health checks', error);
      res.status(500).json({ 
        error: 'Failed to run health checks',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}

export default new StatusController();