import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';
import { Endpoints } from '@octokit/types';
import { BehaviorSubject } from 'rxjs';

export interface InstallationStatus {
  installation?: Endpoints["GET /app/installations"]["response"]["data"][number],
  usage: boolean;
  metrics: boolean;
  copilotSeats: boolean;
  teamsAndMembers: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SetupService {
  private apiUrl = `${serverUrl}/api/setup`;
  installations = new BehaviorSubject<Endpoints["GET /app/installations"]["response"]["data"]>([]);

  constructor(private http: HttpClient) { }

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

  setupDB(request: { // should be url or fields
    uri: string;
  }) {
    return this.http.post(`${this.apiUrl}/db`, request);
  }

}
