import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';

export interface Survey {
  id?: number;
  org: string;
  repo: string;
  prNumber: number;
  status?: 'pending' | 'completed';
  hits?: number;
  userId: string;
  usedCopilot: boolean;
  percentTimeSaved: number;
  timeUsedFor: string;
  reason: string;
  createdAt?: Date;
  updatedAt?: Date;
  kudos?: number; // Add kudos property
}

@Injectable({
  providedIn: 'root'
})
export class CopilotSurveyService {
  private apiUrl = `${serverUrl}/api/survey`;

  constructor(private http: HttpClient) { }

  createSurvey(survey: Survey) {
    return this.http.post<Survey>(this.apiUrl, survey);
  }

  createSurveyGitHub(survey: Survey) {
    return this.http.post(`${this.apiUrl}/${survey.id}/github`, survey);
  }

  getAllSurveys(params?: {
    org?: string;
    team?: string;
    reasonLength?: number;
    since?: string;
    until?: string;
    status?: 'pending' | 'completed';
    userId?: string;
  }) {
    if (!params?.org) delete params?.org;
    return this.http.get<Survey[]>(this.apiUrl, {
      params
    });
  }

  getSurveyById(id: number) {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  getSurveysByUserId(userId: string) {
    return this.getAllSurveys({ userId: userId.toString() });
  }

  deleteSurvey(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateSurvey(survey: Partial<Survey>) {
    return this.http.put<Survey>(`${this.apiUrl}/${survey.id}`, survey);
  }

}
