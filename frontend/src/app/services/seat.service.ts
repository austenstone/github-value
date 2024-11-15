import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from './server.service';
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

  getAllSeats() {
    return this.http.get<Seat[]>(`${this.apiUrl}`);
  }

  getActivity(daysInactive = 30) {
    return this.http.get<ActivityResponse>(`${this.apiUrl}/activity`,
      {
        params: {
          daysInactive: daysInactive.toString()
        }
      }
    );
  };
}