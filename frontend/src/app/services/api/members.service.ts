import { Injectable } from '@angular/core';
import { serverUrl } from '../server.service';
import { HttpClient } from '@angular/common/http';
import { Endpoints } from '@octokit/types';
import { catchError, Observable } from 'rxjs';
import { throwError } from 'rxjs';

export interface Member {
  org: string;
  login: string;
  id: number;
  node_id?: string;
  avatar_url?: string;
  gravatar_id?: string;
  url?: string;
  html_url?: string;
  followers_url?: string;
  following_url?: string;
  gists_url?: string;
  starred_url?: string;
  subscriptions_url?: string;
  organizations_url?: string;
  repos_url?: string;
  events_url?: string;
  received_events_url?: string;
  type?: string;
  site_admin?: boolean;
  name?: string;
  email?: string;
  starred_at?: string;
  user_view_type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  private apiUrl = `${serverUrl}/api/members`;

  constructor(private http: HttpClient) { }

  getAllMembers(org?: string) {
    return this.http.get<Endpoints["GET /orgs/{org}/members"]["response"]["data"]>(`${this.apiUrl}`, {
      params: org ? { org } : undefined
    });
  }

  getMemberByLogin(login: string, exact = true) {
    return this.http.get<Endpoints["GET /users/{username}"]["response"]["data"]>(
      `${this.apiUrl}/${login}`,
      { params: { exact: String(exact) } } // make this boolean not string.
    ).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  searchMembersByLogin(query: string): Observable<Member[]> {
    return this.http.get<Member[]>(`${serverUrl}/api/members/search`, { params: { query } });
  }
}
