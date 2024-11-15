import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { serverUrl } from './server.service';

export interface Settings {
  devCostPerYear?: string | null;
  developerCount?: string | null;
  hoursPerYear?: string | null;
  percentCoding?: string | null;
  percentTimeSaved?: string | null;
  metricsCronExpression?: string | null;
  baseUrl?: string | null;
  webhookProxyUrl?: string | null;
  webhookSecret?: string | null;
  [key: string]: string | null | undefined;
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

  updateSettings(name: string, data: Settings) {
    return this.http.put<void>(`${this.apiUrl}/${name}`, data);
  }

  deleteSettings(name: string) {
    return this.http.delete<void>(`${this.apiUrl}/${name}`);
  }
}