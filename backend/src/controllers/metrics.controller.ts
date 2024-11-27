import { Request, Response } from 'express';
import MetricsService from '../services/metrics.service.js';

class MetricsController {
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await MetricsService.getMetrics(req.query)
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getMetricsTotals(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await MetricsService.getMetricsTotals(req.query)
      res.status(200).json(metrics);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new MetricsController();