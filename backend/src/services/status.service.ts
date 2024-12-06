import app from "../index.js";
import { Seat } from "../models/copilot.seats.model.js";
import { Survey } from "../models/survey.model.js";
import { Member } from "../models/teams.model.js";
import { Endpoints } from "@octokit/types";

export interface StatusType {
  github?: boolean;
  seatsHistory?: {
    oldestCreatedAt: string;
    daysSinceOldestCreatedAt?: number;
  };
  installations: {
    installation: Endpoints["GET /app/installations"]["response"]["data"][0]
    repos: Endpoints["GET /app/installations"]["response"]["data"];
  }[];
  surveyCount: number;
}

class StatusService {
  constructor() {
    
  }

  async getStatus(): Promise<StatusType> {
    const status = {} as StatusType;

    const assignee = await Member.findOne();
    if (assignee) {
      const seats = await Seat.findAll({
        include: [{
          model: Member,
          as: 'assignee'
        }],
        where: {
          assignee_id: assignee.id
        },
        order: [['createdAt', 'ASC']],
      });
      const oldestSeat = seats.find(seat => seat.createdAt);
      const daysSince = oldestSeat ? Math.floor((new Date().getTime() - oldestSeat.createdAt.getTime()) / (1000 * 3600 * 24)) : undefined;
      status.seatsHistory = {
        oldestCreatedAt: oldestSeat?.createdAt.toISOString() || 'No data',
        daysSinceOldestCreatedAt: daysSince
      }
    }


    status.installations = [];
    for (const installation of app.github.installations) {
      const repos = await installation.octokit.request(installation.installation.repositories_url);
      status.installations.push({
        installation: installation.installation,
        repos: repos.data.repositories
      });
    }

    const surveys = await Survey.findAll({
      order: [['updatedAt', 'DESC']]
    });

    if (surveys) {
      status.surveyCount = surveys.length;
    }

    return status;
  }
}

export default StatusService;