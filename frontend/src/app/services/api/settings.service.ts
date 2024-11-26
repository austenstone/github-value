import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { serverUrl } from '../server.service';

export interface Settings {
  devCostPerYear?: number | null;
  developerCount?: number | null;
  hoursPerYear?: number | null;
  percentCoding?: number | null;
  percentTimeSaved?: number | null;
  metricsCronExpression?: string | null;
  baseUrl?: string | null;
  webhookProxyUrl?: string | null;
  webhookSecret?: string | null;
  developerTotal?: number | null;
  adopterCount?: number | null;
  perLicenseCost?: number | null;
  perDevCostPerYear?: number | null;
  perDevHoursPerYear?: number | null;
  percentofHoursCoding?: number | null;
  [key: string]: string | number | null | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsHttpService {
  private apiUrl = `${serverUrl}/api/settings`;

  constructor(private http: HttpClient) { }

  getAllSettings() {
    return this.http.get<Settings>(`${this.apiUrl}`);
  }

  getSettingsByName(name: string) {
    return this.http.get<Settings>(`${this.apiUrl}/${name}`);
  }

  createSettings(data: Settings) {
    return this.http.post<void>(`${this.apiUrl}`, data);
  }

  updateSettings(data: Settings) {
    return this.http.put<void>(`${this.apiUrl}`, data);
  }

  deleteSettings(name: string) {
    return this.http.delete<void>(`${this.apiUrl}/${name}`);
  }

}
