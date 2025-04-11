import { Request, Response } from 'express';
import teamsService from '../services/teams.service.js';

class TeamsController {
  async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const { org } = req.query;
      if (org && typeof org !== 'string') {
        res.status(400).json({ message: 'Invalid org parameter' });
        return;
      }
      const teams = teamsService.getTeams(org);
      res.json(teams);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getAllMembers(req: Request, res: Response): Promise<void> {
    try {
      const { org } = req.query;
      if (org && typeof org !== 'string') {
        res.status(400).json({ message: 'Invalid org parameter' });
        return;
      }
      const members = await teamsService.getAllMembers(org);
      res.json(members);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getMemberByLogin(req: Request, res: Response): Promise<void> {
    try {
      const { login } = req.params;
      const exact = req.query.exact === 'true';
      const member = await teamsService.getMemberByLogin(login, exact);
      if (member) {
        res.json(member);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async searchMembersByLogin(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ message: 'Invalid query parameter' });
        return;
      }
      const members = await teamsService.searchMembersByLogin(query);
      res.json(members);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new TeamsController();