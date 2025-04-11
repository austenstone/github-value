import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  private apiUrl = 'http://localhost:8080/api'; // Replace with your actual API base URL

  constructor(private http: HttpClient) {}

  getOrgMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/members`);
  }
}
