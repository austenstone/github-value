import { Request, Response } from 'express';
import { Metrics, Breakdown } from '../models/metrics.model.js';

class MetricsController {
  // Get all metrics 📊
  async getAllMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await Metrics.findAll({
        include: [Breakdown]
      });
      res.status(200).json(metrics); // 🎉 All metrics retrieved!
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  // Get metrics by day 📅
  async getMetricsByDay(req: Request, res: Response): Promise<void> {
    try {
      const { day } = req.params;
      const metrics = await Metrics.findOne({
        where: { day },
        include: [Breakdown]
      });
      if (metrics) {
        res.status(200).json(metrics); // 🎉 Metrics found!
      } else {
        res.status(404).json({ error: 'Metrics not found' }); // 🚨 Metrics not found
      }
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }
}

export default new MetricsController();