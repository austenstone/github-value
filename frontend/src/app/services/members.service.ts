import { Injectable } from '@angular/core';
import { serverUrl } from './server.service';
import { HttpClient } from '@angular/common/http';
import { Endpoints } from '@octokit/types';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = `${serverUrl}/api/members`;

  constructor(private http: HttpClient) { }

  getAllMembers() {
    return this.http.get<Endpoints["GET /orgs/{org}/members"]["response"]["data"]>(`${this.apiUrl}`);
  }
}
