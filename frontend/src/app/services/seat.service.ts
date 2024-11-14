import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { serverUrl } from './server.service';
import { Endpoints } from "@octokit/types";

type seatsResponse = Endpoints["GET /orgs/{org}/copilot/billing/seats"]["response"]["data"]["seats"];
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

  getAllSeats(): Observable<NonNullable<seatsResponse>> {
    return this.http.get<NonNullable<seatsResponse>>(`${this.apiUrl}`);
  }

  getSeatByLogin(login: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${login}`);
  }

  getSeatActivityByLogin(login: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${login}/activity`);
  }

  getActivity(daysInactive = 30): Observable<ActivityResponse> {
    return this.http.get<ActivityResponse>(`${this.apiUrl}/activity`,
      {
        params: {
          daysInactive: daysInactive.toString()
        }
      }
    );
  };
}