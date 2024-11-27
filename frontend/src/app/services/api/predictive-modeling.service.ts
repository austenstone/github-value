import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { serverUrl } from '../server.service';

export interface PredictiveModelingType {
  targetedRoomForImprovement: number;
  targetedNumberOfDevelopers: number;
  targetedPercentOfTimeSaved: number;
}

@Injectable({
  providedIn: 'root'
})
export class PredictiveModelingService {
  private apiUrl = `${serverUrl}/api/predictive-modeling`;

  constructor(private http: HttpClient) {}

  getTargets() {
    return this.http.get<PredictiveModelingType>(`${this.apiUrl}/targets`);
  }

  saveTargets(targets: PredictiveModelingType) {
    return this.http.post<PredictiveModelingType>(`${this.apiUrl}/targets`, targets);
  }

  getCalculatedFields() {
    return this.http.get<PredictiveModelingType>(`${this.apiUrl}/calculated-fields`);
  }
}
