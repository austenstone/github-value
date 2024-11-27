import { Request, Response } from 'express';
import { Usage, UsageBreakdown } from '../models/usage.model.js';

class UsageController {
   async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await Usage.findAll({
        include: [UsageBreakdown],
        where: {
          ...req.query.org ? { userId: req.query.org as string } : {}
        }
      });
      res.status(200).json(metrics);    } catch (error) {
      res.status(500).json(error);    }
  }
}

export default new UsageController();