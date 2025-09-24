import { Request, Response } from 'express';
import TargetValuesService from '../services/target.service.js';
import { TargetCalculationService } from '../services/target-calculation-service.js';
import logger from '../services/logger.js';

class TargetValuesController {
  async getTargetValues(req: Request, res: Response): Promise<void> {
    try {
      // Extract org parameter: support both 'org' and 'orgOrEnterprise' for flexibility
      // org name for org-specific targets, undefined defaults to enterprise-wide
      const org = (req.query.orgOrEnterprise || req.query.org) as string;
      logger.info(`Target API: GET request for scope: ${org || 'enterprise-wide'}`);
      
      const targetValues = await TargetValuesService.getTargetValues(org);
      
      if (!targetValues) {
        logger.warn(`No targets found for scope: ${org || 'enterprise-wide'}`);
        res.status(404).json({ error: 'No targets found for the specified scope' });
        return;
      }
      
      logger.info(`Target API: Successfully retrieved targets for scope: ${org || 'enterprise-wide'}`);
      res.status(200).json(targetValues);
    } catch (error) {
      logger.error('Error getting target values:', error);
      res.status(500).json({ 
        error: 'Internal server error while fetching target values',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async updateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      // Extract org parameter for scoped updates: support both 'org' and 'orgOrEnterprise'
      const org = (req.query.orgOrEnterprise || req.query.org) as string;
      logger.info(`Target API: POST request for scope: ${org || 'enterprise-wide'}`);
      
      const updatedTargetValues = await TargetValuesService.updateTargetValues(req.body, org);
      
      logger.info(`Target API: Successfully updated targets for scope: ${org || 'enterprise-wide'}`);
      res.status(200).json(updatedTargetValues);
    } catch (error) {
      logger.error('Error updating target values:', error);
      res.status(500).json({ 
        error: 'Internal server error while updating target values',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calculate targets based on current metrics, adoption, and survey data
   * @route GET /targets/calculate
   */
  async calculateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      // Support both 'org' and 'orgOrEnterprise' query parameters
      const orgParam = req.query.orgOrEnterprise || req.query.org;
      const org = orgParam ? String(orgParam) : null;
      const enableLogging = req.query.enableLogging === 'true';
      const includeLogsInResponse = req.query.includeLogs === 'true';
      
      
      // Use the static method from TargetCalculationService to avoid instantiation issues
      const result = await TargetCalculationService.fetchAndCalculateTargets(
        org,  // Pass null if no org was provided
        enableLogging,
        includeLogsInResponse
      );
      
      // Check if we have logs before sending the response
      if (includeLogsInResponse) {
        logger.info(`Response will include ${result.logs?.length || 0} logs`);
      }
      
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error calculating target values:', error);
      res.status(500).json({ error: `Failed to calculate target values: ${error}` });
    }
  }
}

export default new TargetValuesController();
