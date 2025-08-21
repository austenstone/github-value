import { Component, Inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SetupService } from '../../services/api/setup.service';
import { DiagnosticsResponse } from '../../types/diagnostics.types';

@Component({
  selector: 'app-main-diagnostics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>bug_report</mat-icon>
      <span style="margin-left: 8px;">Installation Diagnostics</span>
    </mat-toolbar>
    
    <div class="diagnostics-container">
      <mat-card class="welcome-card">
        <mat-card-header>
          <mat-card-title>GitHub App Installation Validator</mat-card-title>
          <mat-card-subtitle>Validate your GitHub App installations and Octokit connections</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>This tool helps you diagnose issues with your GitHub App installations by:</p>
          <ul>
            <li>Validating that all installation accounts have proper data</li>
            <li>Testing Octokit authentication for each installation</li>
            <li>Listing all organization names (account.login) available</li>
            <li>Verifying account types and permissions</li>
            <li>Providing detailed error information for troubleshooting</li>
          </ul>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button 
                  color="primary" 
                  (click)="runDiagnostics()"
                  [disabled]="isLoading">
            <mat-icon>play_arrow</mat-icon>
            Run Installation Diagnostics
          </button>
          <mat-spinner *ngIf="isLoading" diameter="20" style="margin-left: 16px;"></mat-spinner>
        </mat-card-actions>
      </mat-card>

      <mat-card *ngIf="lastResult" class="results-card">
        <mat-card-header>
          <mat-card-title>Quick Summary</mat-card-title>
          <mat-card-subtitle>Last run: {{ lastResult.timestamp | date:'medium' }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="summary-stats">
            <div class="stat">
              <div class="stat-value">{{ lastResult.totalInstallations }}</div>
              <div class="stat-label">Total Installations</div>
            </div>
            <div class="stat">
              <div class="stat-value" [class.success]="lastResult.summary.validInstallations > 0">
                {{ lastResult.summary.validInstallations }}
              </div>
              <div class="stat-label">Valid</div>
            </div>
            <div class="stat">
              <div class="stat-value" [class.error]="lastResult.summary.invalidInstallations > 0">
                {{ lastResult.summary.invalidInstallations }}
              </div>
              <div class="stat-label">Invalid</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ getSuccessRate() }}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>
          
          <div class="organizations" *ngIf="lastResult.summary.organizationNames.length > 0">
            <h4>Organizations Found:</h4>
            <div class="org-list">
              <span class="org-chip" *ngFor="let org of lastResult.summary.organizationNames">
                {{ org }}
              </span>
            </div>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button (click)="showFullDetails()">
            <mat-icon>visibility</mat-icon>
            View Full Details
          </button>
          <button mat-button (click)="downloadResults()">
            <mat-icon>download</mat-icon>
            Download JSON
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .diagnostics-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .welcome-card, .results-card {
      margin-bottom: 24px;
    }
    
    .welcome-card ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    
    .welcome-card li {
      margin: 8px 0;
    }
    
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }
    
    .stat {
      text-align: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #666;
    }
    
    .stat-value.success {
      color: #4caf50;
    }
    
    .stat-value.error {
      color: #f44336;
    }
    
    .stat-label {
      font-size: 0.875em;
      color: #888;
      margin-top: 4px;
    }
    
    .organizations {
      margin-top: 16px;
    }
    
    .org-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    
    .org-chip {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.875em;
      border: 1px solid #bbdefb;
    }
    
    mat-card-actions {
      padding: 16px;
    }
    
    mat-card-actions button {
      margin-right: 8px;
    }
  `]
})
export class MainDiagnosticsComponent {
  isLoading = false;
  lastResult: DiagnosticsResponse | null = null;

  constructor(
    private setupService: SetupService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  runDiagnostics(): void {
    this.isLoading = true;
    this.setupService.validateInstallations().subscribe({
      next: (result) => {
        this.isLoading = false;
        this.lastResult = result;
        
        if (result.summary.invalidInstallations > 0 || result.errors.length > 0) {
          this.snackBar.open('Diagnostics completed with some issues. Check the details.', 'Close', {
            duration: 5000
          });
        } else {
          this.snackBar.open('All installations validated successfully!', 'Close', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.snackBar.open('Failed to run diagnostics: ' + error.message, 'Close', {
          duration: 5000
        });
      }
    });
  }

  getSuccessRate(): number {
    if (!this.lastResult || this.lastResult.totalInstallations === 0) return 0;
    return Math.round((this.lastResult.summary.validInstallations / this.lastResult.totalInstallations) * 100);
  }

  showFullDetails(): void {
    this.dialog.open(InstallationDiagnosticsDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '80vh',
      data: this.lastResult
    });
  }

  downloadResults(): void {
    if (!this.lastResult) return;
    
    const dataStr = JSON.stringify(this.lastResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `installation-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

@Component({
  selector: 'app-installation-diagnostics-dialog',
  template: `
    <h2 mat-dialog-title>Installation Diagnostics Details</h2>
    <mat-dialog-content class="diagnostics-content">
      <div class="summary-section">
        <h3>Summary</h3>
        <div class="summary-grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>App Status</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p><strong>Connected:</strong> {{ data.appConnected ? 'Yes' : 'No' }}</p>
              <p><strong>Total Installations:</strong> {{ data.totalInstallations }}</p>
              <p><strong>Timestamp:</strong> {{ data.timestamp | date:'medium' }}</p>
            </mat-card-content>
          </mat-card>
          
          <mat-card>
            <mat-card-header>
              <mat-card-title>Validation Results</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p><strong>Valid:</strong> {{ data.summary.validInstallations }}</p>
              <p><strong>Invalid:</strong> {{ data.summary.invalidInstallations }}</p>
              <p><strong>Success Rate:</strong> {{ getSuccessRate() }}%</p>
            </mat-card-content>
          </mat-card>
        </div>
        
        <mat-card class="organizations-card" *ngIf="data.appInfo">
          <mat-card-header>
            <mat-card-title>App Information</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p><strong>Name:</strong> {{ data.appInfo.name }}</p>
            <p><strong>Description:</strong> {{ data.appInfo.description }}</p>
            <p><strong>Owner:</strong> {{ data.appInfo.owner }}</p>
            <p><strong>HTML URL:</strong> <a [href]="data.appInfo.htmlUrl" target="_blank">{{ data.appInfo.htmlUrl }}</a></p>
          </mat-card-content>
        </mat-card>
        
        <mat-card class="organizations-card">
          <mat-card-header>
            <mat-card-title>Organizations ({{ data.summary.organizationNames.length }})</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-chip-set>
              <mat-chip *ngFor="let org of data.summary.organizationNames">{{ org }}</mat-chip>
            </mat-chip-set>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="errors-section" *ngIf="data.errors.length > 0">
        <h3>Errors</h3>
        <mat-card>
          <mat-card-content>
            <ul>
              <li *ngFor="let error of data.errors" class="error-item">{{ error }}</li>
            </ul>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="installations-section">
        <h3>Installation Details</h3>
        <mat-accordion>
          <mat-expansion-panel *ngFor="let installation of data.installations" 
                               [class.invalid]="!installation.isValid">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon [color]="installation.isValid ? 'primary' : 'warn'">
                  {{ installation.isValid ? 'check_circle' : 'error' }}
                </mat-icon>
                {{ installation.accountLogin }} (ID: {{ installation.installationId }})
              </mat-panel-title>
              <mat-panel-description>
                {{ installation.accountType }} - {{ installation.isValid ? 'Valid' : 'Invalid' }}
              </mat-panel-description>
            </mat-expansion-panel-header>
            
            <div class="installation-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <strong>Installation ID:</strong> {{ installation.installationId }}
                </div>
                <div class="detail-item">
                  <strong>Account Login:</strong> {{ installation.accountLogin }}
                </div>
                <div class="detail-item">
                  <strong>Account ID:</strong> {{ installation.accountId }}
                </div>
                <div class="detail-item">
                  <strong>Account Type:</strong> {{ installation.accountType }}
                </div>
                <div class="detail-item">
                  <strong>App ID:</strong> {{ installation.appId }}
                </div>
                <div class="detail-item">
                  <strong>Target Type:</strong> {{ installation.targetType }}
                </div>
                <div class="detail-item">
                  <strong>Has Octokit:</strong> {{ installation.hasOctokit ? 'Yes' : 'No' }}
                </div>
                <div class="detail-item">
                  <strong>Created:</strong> {{ installation.createdAt | date:'medium' }}
                </div>
              </div>
              
              <div *ngIf="installation.octokitTest" class="octokit-test">
                <h4>Octokit Test</h4>
                <p><strong>Success:</strong> {{ installation.octokitTest.success ? 'Yes' : 'No' }}</p>
                <div *ngIf="installation.octokitTest.success">
                  <p><strong>App Name:</strong> {{ installation.octokitTest.appName }}</p>
                  <p><strong>App Owner:</strong> {{ installation.octokitTest.appOwner }}</p>
                </div>
                <div *ngIf="!installation.octokitTest.success" class="error">
                  <p><strong>Error:</strong> {{ installation.octokitTest.error }}</p>
                </div>
              </div>
              
              <div *ngIf="installation.validationErrors.length > 0" class="validation-errors">
                <h4>Validation Errors</h4>
                <ul>
                  <li *ngFor="let error of installation.validationErrors" class="error-item">{{ error }}</li>
                </ul>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="null">Close</button>
      <button mat-raised-button color="primary" (click)="downloadDiagnostics()">Download JSON</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .diagnostics-content {
      max-height: 70vh;
      overflow-y: auto;
    }
    .summary-section {
      margin-bottom: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    .organizations-card {
      margin-bottom: 16px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }
    .detail-item {
      padding: 4px 0;
    }
    .error-item {
      color: #f44336;
      margin: 4px 0;
    }
    .invalid {
      border-left: 4px solid #f44336;
    }
    .octokit-test, .validation-errors {
      margin-top: 16px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    .error {
      color: #f44336;
    }
    .installations-section {
      margin-top: 20px;
    }
    .errors-section {
      margin-bottom: 20px;
    }
    mat-chip-set {
      margin: 8px 0;
    }
  `],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    CommonModule,
    DatePipe
  ]
})
export class InstallationDiagnosticsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InstallationDiagnosticsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiagnosticsResponse
  ) {}

  getSuccessRate(): number {
    if (this.data.totalInstallations === 0) return 0;
    return Math.round((this.data.summary.validInstallations / this.data.totalInstallations) * 100);
  }

  downloadDiagnostics(): void {
    const dataStr = JSON.stringify(this.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `installation-diagnostics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
