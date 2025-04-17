import { Request, Response } from 'express';
import SeatsService from '../services/seats.service.js';

class SeatsController {
  async getAllSeats(req: Request, res: Response): Promise<void> {
    const org = req.query.org?.toString()
    try {
      const seats = await SeatsService.getAllSeats(org);
      res.status(200).json(seats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }

  async getSeat(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { since, until, org } = req.query as { [key: string]: string | undefined };
    
    try {
      // Create params object with all query parameters
      const params = { since, until, org };
      
      // Use our new unified getSeat method that handles both ID and login
      // Pass the ID directly without conversion - the service will handle it
      const seat = await SeatsService.getSeat(id, params);
      
      res.status(200).json(seat);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const sanitizedId = encodeURIComponent(id);
      console.error(`Error in getSeat controller for id=${sanitizedId}:`, errorMessage);
      res.status(500).json({ error: errorMessage });
    }
  }

  async getActivity(req: Request, res: Response): Promise<void> {
    const org = req.query.org?.toString()
    const { daysInactive, precision } = req.query;
    const _daysInactive = Number(daysInactive);
    if (!daysInactive || isNaN(_daysInactive)) {
      res.status(400).json({ error: 'daysInactive query parameter is required' });
      return;
    }
    try {
      const activityDays = await SeatsService.getMembersActivity({
        org,
        daysInactive: _daysInactive,
        precision: precision as 'hour' | 'day'
      });
      res.status(200).json(activityDays);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
}

export default new SeatsController();