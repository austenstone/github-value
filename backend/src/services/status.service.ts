import mongoose from "mongoose";
import app from "../index.js";
import { Endpoints } from "@octokit/types";
import { Request } from "express";

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
  auth?: {
    user?: string;
    email?: string;
    authenticated: boolean;
    groups?: string[];
    headers?: string[]; // Add this to store header names
  };
}

class StatusService {
  constructor() {
    
  }

  async getStatus(req?: Request): Promise<StatusType> {
    const status = {} as StatusType;

    // Add authentication information if request is provided
    if (req) {
      const user = req.headers['x-auth-request-user'] as string;
      const email = req.headers['x-auth-request-email'] as string;
      const groups = req.headers['x-auth-request-groups'] as string[];
      
      status.auth = {
        user,
        email,
        authenticated: !!user,
        groups,
        headers: Object.keys(req.headers) // Add all header names as an array
      };
    }

    const Seats = mongoose.model('Seats');

    const oldestSeat = await Seats.findOne().sort({ createdAt: 1 });
    const daysSince = oldestSeat ? Math.floor((new Date().getTime() - oldestSeat.createdAt.getTime()) / (1000 * 3600 * 24)) : undefined;
    status.seatsHistory = {
      oldestCreatedAt: oldestSeat?.createdAt.toISOString() || 'No data',
      daysSinceOldestCreatedAt: daysSince
    }

    status.installations = [];
    for (const installation of app.github.installations) {
      const repos = await installation.octokit.request(installation.installation.repositories_url);
      status.installations.push({
        installation: installation.installation,
        repos: repos.data.repositories
      });
    }

    // const surveys = await Survey.findAll({
    //   order: [['updatedAt', 'DESC']]
    // });

    // if (surveys) {
    //   status.surveyCount = surveys.length;
    // }

    return status;
  }
}

export default StatusService;