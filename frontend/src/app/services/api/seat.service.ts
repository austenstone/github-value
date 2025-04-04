import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';
import { Endpoints } from "@octokit/types";
import { map } from 'rxjs';

type _Seat = NonNullable<Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"]>[0];
export interface Seat extends _Seat {
  plan_type: string;
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

  getSeat(id: number | string) {
    return this.http.get<Seat[]>(`${this.apiUrl}/${id}`);
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
    return this.http.get<Record<string, number>>(`${this.apiUrl}/activity/totals`, {
      params: queryParams
    });
  }
}