import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-error',
  imports: [
    RouterModule,
    MatButtonModule
  ],
  templateUrl: './error.component.html',
  styleUrl: './error.component.scss'
})
export class ErrorComponent {
  error = {
    code: 'UNKNOWN',
    message: 'An unknown error occurred',
    status: 0
  };
  
  constructor(
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    if (state) {
      if (state['error']) {
        this.error = state['error'] || JSON.stringify(state['error']);
      } else {
        this.error.message = 'An unknown error occurred';
      }
    } else {
      this.router.navigate(['/']);
    }
  }
}
