import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { serverUrl } from './server.service';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  private apiUrl = `${serverUrl}/api/seats`;

  constructor(private http: HttpClient) { }

  getAllSeats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`);
  }

  getSeatByLogin(login: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${login}`);
  }

  getSeatActivityByLogin(login: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${login}/activity`);
  }
}