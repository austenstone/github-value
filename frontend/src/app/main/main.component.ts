import { Component, inject, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { filter, map, shareReplay, tap } from 'rxjs/operators';
import { AppModule } from '../app.module';
import { ThemeService } from '../services/theme.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SetupService } from '../services/api/setup.service';
import { MatCardModule } from '@angular/material/card';
import { ConfettiService } from '../database/confetti.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InstallationsService } from '../services/api/installations.service';
import { BASE_URL } from '../services/server.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    AsyncPipe,
    AppModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ]
})
export class MainComponent {
  private breakpointObserver = inject(BreakpointObserver);
  hideNavText = false;
  @ViewChild('drawer') drawer!: MatSidenav;
  isHandset = false;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe([
    '(max-width: 599px)'  // Standard mobile breakpoint
  ]).pipe(
    tap(result => this.isHandset = result.matches),
    map(result => result.matches),
    shareReplay()
  );

  constructor(
    public themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private confettiService: ConfettiService,
    public setupService: SetupService,
    public installationsService: InstallationsService
  ) {
    this.hideNavText = localStorage.getItem('hideNavText') === 'true';
    this.route.queryParams.subscribe(params => {
      if (params['celebrate'] === 'true') {
        this.confettiService.celebrate()
      }
    });
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeSidenav();
    });
  }

  toggleNavText(): void {
    this.hideNavText = !this.hideNavText;
    localStorage.setItem('hideNavText', this.hideNavText.toString());
  }

  closeSidenav(): void {
    if (this.isHandset && this.drawer) {
      this.drawer.close();
    }
  }

  installationChanged(installation: number): void {
    if (installation) {
      this.installationsService.setInstallation(installation);
    }
  }
}
