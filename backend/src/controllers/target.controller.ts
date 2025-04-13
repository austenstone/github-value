import { Request, Response } from 'express';
import TargetValuesService from '../services/target.service.js';
import { TargetCalculationService } from '../services/target-calculation-service.js';

class TargetValuesController {
  async getTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const targetValues = await TargetValuesService.getTargetValues();
      res.status(200).json(targetValues);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async updateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const updatedTargetValues = await TargetValuesService.updateTargetValues(req.body);
      res.status(200).json(updatedTargetValues);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  /**
   * Calculate targets based on current metrics, adoption, and survey data
   * @route GET /targets/calculate
   */
  async calculateTargetValues(req: Request, res: Response): Promise<void> {
    try {
      const org = req.query.org || 'enterprise';
      const enableLogging = req.query.enableLogging === 'true';
      const includeLogsInResponse = req.query.includeLogs === 'true';
      
      // Create an instance of the calculation service
      const calculationService = new TargetCalculationService();
      
      // Fetch data and calculate targets with optional logging and logs in response
      const result = await calculationService.fetchAndCalculateTargets(
        org as string, 
        enableLogging,
        includeLogsInResponse
      );
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error calculating target values:', error);
      res.status(500).json({ error: 'Failed to calculate target values' });
    }
  }
}

export default new TargetValuesController();
