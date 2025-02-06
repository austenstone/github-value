import { Request, Response } from 'express';
import SeatsService from '../services/seats.service.js';
import adoptionService from '../services/adoption.service.js';

class AdoptionController {
  async getAdoptions(req: Request, res: Response): Promise<void> {
    const { enterprise, org, team, since, until, seats } = req.query as { [key: string]: string | undefined };;
    try {
      const dateFilter = {
        ...(since && { $gte: new Date(since) }),
        ...(until && { $lte: new Date(until) })
      };

      const query = {
        filter: {
          ...enterprise || !org && !team ? { enterprise: 'enterprise' } : undefined,
          ...org ? { org } : undefined,
          ...team ? { team } : undefined,
          ...(Object.keys(dateFilter).length && { date: dateFilter }),
        },
        projection: {
          ...seats === '1' ? {} : { seats: 0 },
          _id: 0,
          __v: 0,
        }
      }
      const adoptions = await adoptionService.getAllAdoptions2(query);
      res.status(200).json(adoptions);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getAdoptionTotals(req: Request, res: Response): Promise<void> {
    try {
      const totals = await SeatsService.getMembersActivityTotals2(req.query);
      res.status(200).json(totals);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new AdoptionController();