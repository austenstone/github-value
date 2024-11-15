import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { serverUrl } from './server.service';
import { Endpoints } from '@octokit/types';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private apiUrl = `${serverUrl}/api/teams`;

  constructor(private http: HttpClient) { }

  getAllTeams() {
    return this.http.get<Endpoints['GET /orgs/{org}/teams']['response']['data']>(`${this.apiUrl}`);
  }
}
