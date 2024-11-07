import { Request, Response } from 'express';
import { Usage, UsageBreakdown } from '../models/usage.model';

class UsageController {
  // Get all metrics 📊
  async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await Usage.findAll({
        include: [UsageBreakdown]
      });
      res.status(200).json(metrics); // 🎉 All metrics retrieved!
    } catch (error) {
      res.status(500).json(error); // 🚨 Error handling
    }
  }
}

export default new UsageController();