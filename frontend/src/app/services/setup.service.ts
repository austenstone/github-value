import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from './server.service';
import { Endpoints } from '@octokit/types';

export interface SetupStatusResponse {
  isSetup?: boolean;
  dbInitialized?: boolean;
  dbsInitialized?: {
    usage: boolean;
    metrics: boolean;
    copilotSeats: boolean;
    teamsAndMembers: boolean;
  },
  installation?: Endpoints["GET /app/installations"]["response"]["data"][0];
}
@Injectable({
  providedIn: 'root'
})
export class SetupService {
  private apiUrl = `${serverUrl}/api/setup`;

  constructor(private http: HttpClient) { }

  getSetupStatus(fields?: string[]) {
    const params = fields ? new HttpParams().set('fields', fields.join(',')) : undefined;
    return this.http.get<SetupStatusResponse>(`${this.apiUrl}/status`, {
      params
    });
  }

  getInstall() {
    return this.http.get<Endpoints["GET /app"]["response"]['data']>(
      `${this.apiUrl}/install`
    );
  }

  getManifest() {
    return this.http.get<{
      name: string;
      description: string;
      url: string;
      hook_attributes: {
        url: string;
      };
      setup_url: string;
      redirect_url: string;
      public: boolean;
      default_permissions: {
        members: 'read';
        metadata: 'read';
        organization_copilot_seat_management: 'read';
        pull_requests: 'write';
      };
      default_events: ('pull_request')[];
    }>(
      `${this.apiUrl}/manifest`
    );
  }

  addExistingApp(request: {
    appId: string,
    privateKey: string,
    webhookSecret: string
  }) {
    return this.http.post<{
      installUrl: string
    }>(`${this.apiUrl}/existing-app`, request);
  }

}
