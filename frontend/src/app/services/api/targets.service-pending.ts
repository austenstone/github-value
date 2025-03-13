import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { serverUrl } from '../server.service';

export interface Target {
  current: number;
  target: number;
  max: number;
}

export interface Targets {
  org: {
    seats: Target;
    adoptedDevs: Target;
    monthlyDevsReportingTimeSavings: Target;
    percentOfSeatsReportingTimeSavings: Target;
    percentOfSeatsAdopted: Target;
    percentOfMaxAdopted: Target;
  },
  user: {
    dailySuggestions: Target;
    dailyAcceptances: Target;
    dailyChatTurns: Target;
    dailyDotComChats: Target;
    weeklyPRSummaries: Target;
    weeklyTimeSavedHrs: Target;
  },
  impact: {
    monthlyTimeSavingsHrs: Target;
    annualTimeSavingsAsDollars: Target;
    productivityOrThroughputBoostPercent: Target;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TargetsService {
  private apiUrl = `${serverUrl}/api/targets`;

  constructor(
    private http: HttpClient
  ) { }

  getTargets() {
    return this.http.get<Targets>(`${this.apiUrl}`);
  }

  saveTargets(targets: Targets) {
    return this.http.post<Targets>(`${this.apiUrl}`, targets);
  }
}

