import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { serverUrl } from './server.service';
import { CopilotMetrics } from './metrics.service.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = `${serverUrl}/api/metrics`;

  constructor(private http: HttpClient) { }

  getMetrics(queryParams: {
    type?: 'copilot_ide_code_completions' | 'copilot_ide_chat' | 'copilot_dotcom_chat' | 'copilot_dotcom_pull_requests';
    since?: string;
    until?: string;
    editor?: 'vscode' | 'JetBrains' | 'Xcode' | 'Neovim' | string;
    language?: string;
    model?: 'default' | string;
  } = {}) {
    return this.http.get<CopilotMetrics>(this.apiUrl, {
      params: queryParams
    });
  }
}
