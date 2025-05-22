import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';
import { Endpoints } from "@octokit/types";
import { Observable, map } from 'rxjs';

// Base GitHub API seat type
export type GitHubSeat = NonNullable<Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"]>[0];

// Extended seat type with backend-specific fields
export interface Seat extends GitHubSeat {
  assignee_id?: number;
  assignee_login?: string;
  org?: string;
  team?: string;
  queryAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AllSeats {
  avatar_url: string,
  login: string,
  id: number,
  org: string,
  url: string,
  seat: Seat;
}
export interface ActivityResponseData {
  totalSeats: number,
  totalActive: number,
  totalInactive: number,
  // active: Record<string, string>,
  // inactive: Record<string, string>,
}
export interface ActivityResponse2 {
  date: Date;
  createdAt: Date;
  totalActive: number
  totalInactive: number
  totalSeats: number;
  updatedAt: Date;
};
export type ActivityResponse = Record<string, ActivityResponseData>;

export interface ActivityTotals {
  total_time: number;
  last_activity_at: string | null;
  last_activity_editor: string | null;
  assignee_id: number;
  avatar_url: string;
  name: string | null;
  url: string;
  html_url: string;
  team: string | null;
  org: string;
  type: string;
  login: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private apiUrl = `${serverUrl}/api/seats`;

  constructor(private http: HttpClient) { }

  getAllSeats(org?: string) {
    return this.http.get<AllSeats[]>(`${this.apiUrl}`, {
      params: org ? { org } : undefined
    });
  }

  /**
   * Get seat activity for a user by ID with optional date filtering 
   */
  getSeat(id: string | number, params?: { since?: string; until?: string }): Observable<Seat[]> {
    let queryParams = new HttpParams();
    if (params?.since) {
      queryParams = queryParams.set('since', params.since);
    }
    if (params?.until) {
      queryParams = queryParams.set('until', params.until);
    }
    return this.http.get<Seat[]>(`${this.apiUrl}/${id}`, { params: queryParams });
  }

  /**
   * Get seat activity for a user by login with optional date filtering
   */
  getSeatByLogin(login: string, params?: { since?: string; until?: string }): Observable<Seat[]> {
    let queryParams = new HttpParams();
    if (params?.since) {
      queryParams = queryParams.set('since', params.since);
    }
    if (params?.until) {
      queryParams = queryParams.set('until', params.until);
    }
    return this.http.get<Seat[]>(`${this.apiUrl}/${login}`, { params: queryParams });
  }

  getActivity(org?: string) {
    return this.http.get<ActivityResponse2[]>(`${this.apiUrl}/activity`,
      {
        params: {
          ...org ? { org } : undefined
        }
      }
    ).pipe(
      map((activities: ActivityResponse2[]) => 
        activities.reduce((acc, activity) => {
          acc[activity.date.toString()] = {
            totalSeats: activity.totalSeats,
            totalActive: activity.totalActive,
            totalInactive: activity.totalInactive,
          };
          return acc;
        }, {} as Record<string, ActivityResponseData>)
      )
    );
  };

  getActivityTotals(queryParams?: {
    org?: string | undefined;
    since?: string;
    until?: string;
    limit?: number;
  }) {
    if (!queryParams?.org) delete queryParams?.org;
    return this.http.get<ActivityTotals[]>(`${this.apiUrl}/activity/totals`, {
      params: queryParams
    });
  }
}