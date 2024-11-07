import { Request, Response } from 'express';
import { CopilotSeat, CopilotAssignee, CopilotAssigningTeam } from '../models/copilot.seats';

class SeatsController {
  // Get all metrics 📊
  async getAllSeats(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await CopilotSeat.findAll({
        include: [
          { model: CopilotAssignee, as: 'assignee' },
          { model: CopilotAssigningTeam, as: 'assigning_team' }
        ]
      });
      res.status(200).json(metrics); // 🎉 All metrics retrieved!
    } catch (error) {
      console.log(error);
      res.status(500).json(error); // 🚨 Error handling
    }
  }

  async getSeatByLogin(req: Request, res: Response): Promise<void> {
    try {
      const { login } = req.params;
      const assignee = await CopilotAssignee.findOne({
        where: { login }
      });
      if (!assignee) {
        res.status(404).json({ error: 'Assignee not found' }); // 🚨 Assignee not foun
        return;
      }
      const metrics = await CopilotSeat.findOne({
        where: { assigneeId: assignee?.dataValues.id },
        include: [
          { model: CopilotAssignee, as: 'assignee' },
          { model: CopilotAssigningTeam, as: 'assigning_team' }
        ]
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

  // WIP need to decide how to return all seat activity
  async getSeatActivityByLogin(req: Request, res: Response): Promise<void> {
    try {
      const { login } = req.params;
      const metrics = await CopilotSeat.findAndCountAll({
        where: { login },
        include: [
          { model: CopilotAssignee, as: 'assignee' },
          { model: CopilotAssigningTeam, as: 'assigning_team' }
        ]
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

export default new SeatsController();