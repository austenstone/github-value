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
    repos: Endpoints["GET /installation/repositories"]["response"]["data"]["repositories"];
    repositoryTotalCount?: number; // total_count returned by first page
    repositoriesFetchedCount?: number; // number actually fetched (may be partial)
    partial?: boolean; // true if time limit hit before finishing pagination
    fetchDurationMs?: number; // time spent fetching this installation's repos
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
  
  constructor() { }

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

    // Helper to fetch repositories with a hard time cap (2 min) to avoid long waits
    // Returns partial results if time limit exceeded
    async function fetchReposWithTimeLimit(installation: typeof app.github.installations[0], maxDurationMs = 1* 15 * 1000, perPage = 100) {
      const start = Date.now();
      const repos: Endpoints["GET /installation/repositories"]["response"]["data"]["repositories"] = [] as any;
      let totalCount: number | undefined;
      let page = 1;
      let hasNext = true;
      let partial = false;

      while (hasNext) {
        // Check time limit before issuing next request
        const elapsed = Date.now() - start;
        if (elapsed >= maxDurationMs) {
          partial = true;
          break;
        }
        const response = await installation.octokit.request("GET /installation/repositories", {
          per_page: perPage,
          page
        });

        // Response body shape: { total_count, repositories: [] }
        const data: any = response.data;
        if (totalCount === undefined && typeof data === 'object' && 'total_count' in data) {
          totalCount = data.total_count as number;
        }
        const pageRepos = Array.isArray(data) ? data : data.repositories;
        if (Array.isArray(pageRepos)) {
          repos.push(...pageRepos);
        }

        const linkHeader = response.headers.link;
        const timeAfter = Date.now() - start;
        const timeRemaining = timeAfter < maxDurationMs;
        // Determine if a next page exists AND we still have time budget
        hasNext = !!(linkHeader && linkHeader.includes('rel="next"')) && timeRemaining;
        page += 1;
      }

      return {
        repos,
        totalCount,
        partial,
        duration: Date.now() - start
      };
    }

    status.installations = [];
    for (const installation of app.github.installations) {
      try {
        const result = await fetchReposWithTimeLimit(installation);
        status.installations.push({
          installation: installation.installation,
          repos: result.repos,
          repositoryTotalCount: result.totalCount,
          repositoriesFetchedCount: result.repos.length,
          partial: result.partial,
          fetchDurationMs: result.duration
        });
      } catch (e) {
        // Capture failure gracefully: do not block other installations
        status.installations.push({
          installation: installation.installation,
          repos: [] as any,
          repositoryTotalCount: undefined,
          repositoriesFetchedCount: 0,
          partial: true,
          fetchDurationMs: 0
        });
      }
    }

    // const surveys = await Survey.findAll({
    //   order: [['updatedAt', 'DESC']]
    // });

    // if (surveys) {
    //   status.surveyCount = surveys.length;
    // }

    // Current implementation: count surveys via Mongoose (replaces old commented Sequelize-style findAll)
    try {
      const Survey = mongoose.model('Survey');
      // Use countDocuments for efficiency; add projection-less query
      status.surveyCount = await Survey.countDocuments();
    } catch (err) {
      // Swallow errors so status endpoint still works
      status.surveyCount = 0;
    }

    return status;
  }
}

export default StatusService;