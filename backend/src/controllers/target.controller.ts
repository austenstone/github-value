import { Request, Response } from 'express';
import TargetValuesService from '../services/target.service.js';
import { TargetCalculationService } from '../services/target-calculation-service.js';
import logger from '../services/logger.js';

class TargetValuesController {
  async getTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const targetValues = await TargetValuesService.getTargetValues();
      res.status(200).json(targetValues);
    } catch (error) {
      logger.error('Error getting target values:', error);
      res.status(500).json(error);
    }
  }

  async updateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const updatedTargetValues = await TargetValuesService.updateTargetValues(req.body);
      res.status(200).json(updatedTargetValues);
    } catch (error) {
      logger.error('Error updating target values:', error);
      res.status(500).json(error);
    }
  }

  /**
   * Calculate targets based on current metrics, adoption, and survey data
   * @route GET /targets/calculate
   */
  async calculateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      // Only use org if it's explicitly passed in the query parameters
      const org = req.query.org ? String(req.query.org) : null;
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
