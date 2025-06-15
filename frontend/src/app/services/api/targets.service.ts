import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { serverUrl } from '../server.service';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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

  // Default used when the API is empty or errors out
  static readonly DEFAULT_TARGETS: Targets = {
    org: {
      seats: { current: 910, target: 910, max: 1000 },
      adoptedDevs: { current: 569, target: 569, max: 1000 },
      monthlyDevsReportingTimeSavings: { current: 1, target: 2, max: 1000 },
      percentOfSeatsReportingTimeSavings: { current: 0.1, target: 0.2, max: 100 },
      percentOfSeatsAdopted: { current: 62.5, target: 62.5, max: 100 },
      percentOfMaxAdopted: { current: 56.9, target: 56.9, max: 100 }
    },
    user: {
      dailySuggestions: { current: 122.4, target: 244.8, max: 150 },
      dailyAcceptances: { current: 85.7, target: 102.8, max: 100 },
      dailyChatTurns: { current: 21.6, target: 32.5, max: 50 },
      dailyDotComChats: { current: 2.8, target: 4.2, max: 100 },
      weeklyPRSummaries: { current: 0.3, target: 0.5, max: 5 },
      weeklyTimeSavedHrs: { current: 0, target: 0, max: 10 }
    },
    impact: {
      monthlyTimeSavingsHrs: { current: 0, target: 0, max: 72800 },
      annualTimeSavingsAsDollars: { current: 0, target: 0, max: 27300000 },
      productivityOrThroughputBoostPercent: { current: 0, target: 0, max: 25 }
    }
  };

  constructor(private http: HttpClient) { }

  getTargets() {
    return this.http.get<Targets>(this.apiUrl).pipe(
      map(data => data ?? TargetsService.DEFAULT_TARGETS),
      catchError(() => of(TargetsService.DEFAULT_TARGETS))
    );
  }

  saveTargets(targets: Targets) {
    return this.http.post<Targets>(`${this.apiUrl}`, targets);
  }

  recalculateTargets() {
    // Calls the backend endpoint to recalculate targets
    return this.http.get<any>(`${this.apiUrl}/calculate`);
  }
}

