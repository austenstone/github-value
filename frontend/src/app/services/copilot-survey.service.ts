import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from './server.service';

export interface Survey {
  id?: number;
  dateTime: Date;
  userId: number;
  usedCopilot: boolean;
  percentTimeSaved: number;
  owner: string,
  repo: string,
  prNumber: number,
  reason: string;
  timeUsedFor: string;
}

@Injectable({
  providedIn: 'root'
})
export class CopilotSurveyService {
  private apiUrl = `${serverUrl}/api/survey`;

  constructor(private http: HttpClient) { }

  createSurvey(survey: Survey) {
    return this.http.post(this.apiUrl, survey);
  }

  getAllSurveys() {
    return this.http.get<Survey[]>(this.apiUrl);
  }

  getSurveyById(id: number) {
    return this.http.get<Survey>(`${this.apiUrl}/${id}`);
  }

  deleteSurvey(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}
