import { Request, Response } from 'express';
import { Team, Member } from '../models/teams.model.js';

class TeamsController {
  async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const teams = await Team.findAll({
        where: {
          ...req.query.org ? { '$Team.org$': req.query.org as string } : {}
        },
        include: [
          {
            model: Member,
            as: 'members',
            through: {
              attributes: []
            },
            attributes: ['login', 'avatar_url']
          },
          {
            model: Team,
            as: 'children',
            include: [{
              model: Member,
              as: 'members',
              through: {
                attributes: []
              },
              attributes: ['login', 'avatar_url']
            }],
            attributes: ['name', 'org', 'slug', 'description', 'html_url']
          }
        ],
        attributes: ['name', 'org', 'slug', 'description', 'html_url'],
        order: [
          ['name', 'ASC'],
          [{ model: Member, as: 'members' }, 'login', 'ASC']
        ]
      });
  
      res.json(teams);
    } catch (error) {
      res.status(500).json(error);
    }
  }

  async getAllMembers(req: Request, res: Response): Promise<void> {
    try {
      const members = await Member.findAll({
        attributes: ['login', 'name', 'url', 'avatar_url'],
        order: [
          ['login', 'ASC']
        ]
      });
  
      res.json(members);
    } catch (error) {
      res.status(500).json(error);
    }
  }
}

export default new TeamsController();