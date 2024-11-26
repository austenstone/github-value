import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';
import { Endpoints } from "@octokit/types";

type _Seat = NonNullable<Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"]>[0];
export interface Seat extends _Seat {
  plan_type: string;
}
export interface ActivityResponseData {
  totalSeats: number,
  totalActive: number,
  totalInactive: number,
  active: Record<string, string>,
  inactive: Record<string, string>,
}
export type ActivityResponse = Record<string, ActivityResponseData>;
@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private apiUrl = `${serverUrl}/api/seats`;

  constructor(private http: HttpClient) { }

  getAllSeats(org?: string) {
    return this.http.get<Seat[]>(`${this.apiUrl}`, {
      params: org ? { org } : undefined
    });
  }

  getSeat(id: number | string) {
    return this.http.get<Seat[]>(`${this.apiUrl}/${id}`);
  }

  getActivity(org?: string, daysInactive = 30, precision: 'hour' | 'day' = 'day') {
    return this.http.get<ActivityResponse>(`${this.apiUrl}/activity`,
      {
        params: {
          precision,
          daysInactive: daysInactive.toString(),
          ...org ? { org } : undefined
        }
      }
    );
  };

  getActivityTotals(org?: string) {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/activity/totals`, {
      params: org ? { org } : undefined
    });
  }
}